import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";
import { shouldTriggerCycle, accumulateCorpus, InferenceCorpus, RecurringPattern, RecurringProblem } from "./inference-accumulator.js";
import { DeployVerifier, DeployVerificationResult } from "./deploy-verifier.js";
import { VotingCoordinator } from "../delegation/voting-coordinator.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";

export interface InferenceProposal {
  id: string;
  type: "fix" | "refactor" | "automate" | "guard" | "codify";
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  source: "recurring_problem" | "recurring_pattern" | "wrong_turn";
  status: "pending" | "approved" | "rejected" | "applied" | "failed";
}

export interface InferenceCycleResult {
  cycleId: string;
  triggered: boolean;
  triggerReason: string;
  corpusSummary: {
    sessions: number;
    totalCommits: number;
    recurringPatterns: number;
    recurringProblems: number;
  };
  proposals: InferenceProposal[];
  votes: {
    proposalId: string;
    decision: string;
    confidence: number;
    details: string[];
  }[];
  deployVerification?: DeployVerificationResult | undefined;
  phase: CyclePhase;
  completedAt: string;
  duration: number;
}

export type CyclePhase =
  | "idle"
  | "collecting"
  | "proposing"
  | "governing"
  | "applying"
  | "deploying"
  | "verifying"
  | "complete"
  | "failed";

const CYCLE_STATE_FILE = "inference-cycle-state.json";
const CYCLE_HISTORY_FILE = "inference-cycle-history.json";
const GOVERNANCE_AGENTS: Record<string, string[]> = {
  fix: ["code-reviewer", "refactorer", "researcher"],
  refactor: ["code-reviewer", "refactorer", "researcher"],
  guard: ["code-reviewer", "security-auditor", "researcher"],
  automate: ["architect", "strategist", "researcher"],
  codify: ["architect", "researcher"],
};

export type AgentInvoker = (agentName: string, prompt: string) => Promise<string>;

export interface InferenceCycleOptions {
  skipDeployVerify?: boolean;
  skipApply?: boolean;
  skipResearcherReview?: boolean;
  force?: boolean;
}

export class InferenceCycle {
  private inferenceDir: string;
  private stateDir: string;
  private projectRoot: string;
  private phase: CyclePhase = "idle";
  private opencodeAvailable: boolean | null = null;
  private agentInvoker: AgentInvoker | null;
  private options: InferenceCycleOptions;

  constructor(projectRoot?: string, agentInvoker?: AgentInvoker, options?: InferenceCycleOptions) {
    this.projectRoot = projectRoot || process.cwd();
    this.inferenceDir = path.join(this.projectRoot, "docs", "inference");
    this.stateDir = path.join(this.projectRoot, ".strray", "inference");
    this.agentInvoker = agentInvoker ?? null;
    this.options = options ?? {};
  }

  async maybeRunCycle(): Promise<InferenceCycleResult> {
    const startTime = Date.now();
    const cycleId = `cycle-${Date.now()}`;

    this.setPhase("collecting");

    const lastCycleFile = path.join(this.stateDir, CYCLE_STATE_FILE);
    const threshold = this.options.force ? { trigger: true, reason: "force flag set" } : shouldTriggerCycle(this.inferenceDir, lastCycleFile);

    if (!threshold.trigger) {
      this.setPhase("idle");
      return this.buildResult(cycleId, false, threshold.reason, startTime);
    }

    frameworkLogger.log("inference-cycle", "cycle-triggered", "info", {
      cycleId,
      reason: threshold.reason,
    });

    const corpus = accumulateCorpus(this.inferenceDir);

    this.setPhase("proposing");
    const proposals = this.generateProposals(corpus);
    this.adjustFromHistory(proposals);

    if (proposals.length === 0) {
      this.setPhase("complete");
      return this.buildResult(cycleId, true, threshold.reason, startTime, corpus, proposals);
    }

    this.setPhase("governing");
    const votes = await this.governProposals(proposals);

    const approved = proposals.filter(
      (p) => votes.find((v) => v.proposalId === p.id && v.decision === "approve"),
    );

    for (const p of approved) {
      p.status = "approved";
    }

    for (const p of proposals.filter((p) => p.status !== "approved")) {
      p.status = "rejected";
    }

    if (approved.length > 0) {
      if (!this.options.skipApply) {
        this.setPhase("applying");
        await this.applyProposals(approved);
      }

      let deployResult: DeployVerificationResult | undefined;

      if (!this.options.skipDeployVerify) {
        this.setPhase("deploying");
        const verifier = new DeployVerifier(this.projectRoot);
        deployResult = verifier.quickVerify();

        this.setPhase("verifying");

        if (deployResult.success) {
          for (const p of approved) {
            p.status = "applied";
          }
        } else {
          // Deploy failed — keep as approved (not applied), not "failed"
          const failureReasons = deployResult.checks
            .filter((c) => !c.passed)
            .map((c) => c.output)
            .join("; ");
          frameworkLogger.log("inference-cycle", "deploy-failed", "warning", {
            checks: deployResult.checks.map((c) => ({ name: c.name, passed: c.passed })),
            failureReasons,
          });
        }
      } else {
        for (const p of approved) {
          p.status = "approved";
        }
      }

      this.setPhase("complete");
      this.saveCycleState(cycleId);
      this.saveGovernanceState(this.getCoordinator());
      this.appendHistory(this.buildResult(cycleId, true, threshold.reason, startTime, corpus, proposals, votes, deployResult));

      return this.buildResult(cycleId, true, threshold.reason, startTime, corpus, proposals, votes, deployResult);
    }

    this.setPhase("complete");
    this.saveCycleState(cycleId);
    this.appendHistory(this.buildResult(cycleId, true, threshold.reason, startTime, corpus, proposals, votes));

    return this.buildResult(cycleId, true, threshold.reason, startTime, corpus, proposals, votes);
  }

  private generateProposals(corpus: InferenceCorpus): InferenceProposal[] {
    const proposals: InferenceProposal[] = [];

    for (const problem of corpus.recurringProblems) {
      proposals.push({
        id: `prop-${Date.now()}-${proposals.length}`,
        type: this.classifyProposalType(problem.pattern),
        title: this.generateTitle(problem),
        description: `Recurring across ${problem.occurrences} sessions: ${problem.pattern}`,
        evidence: problem.sessions.map((s) => `Seen in session ${s}`),
        confidence: Math.min(0.95, 0.5 + problem.occurrences * 0.15),
        source: "recurring_problem",
        status: "pending",
      });
    }

    const seenPatterns = new Set(corpus.recurringProblems.map((p) => p.pattern));
    const allProblems = corpus.sessions.flatMap((s) =>
      s.problems.map((p) => ({ problem: p, session: s.sessionId })),
    );
    for (const { problem, session } of allProblems) {
      const normalized = problem.replace(/\([a-f0-9]{7}\)/g, "").trim();
      if (seenPatterns.has(normalized)) continue;
      if (proposals.length >= 5) break;

      proposals.push({
        id: `prop-${Date.now()}-${proposals.length}`,
        type: this.classifyProposalType(problem),
        title: `Investigate: ${problem.substring(0, 80)}`,
        description: `Observed in session ${session}: ${problem}`,
        evidence: [problem],
        confidence: 0.4,
        source: "recurring_problem",
        status: "pending",
      });
      seenPatterns.add(normalized);
    }

    for (const pattern of corpus.recurringPatterns) {
      if (pattern.occurrences < 2) continue;

      const type = this.patternToProposalType(pattern);
      proposals.push({
        id: `prop-${Date.now()}-${proposals.length}`,
        type,
        title: `Codify ${pattern.name} pattern`,
        description: `${pattern.name} detected across ${pattern.occurrences} sessions (avg confidence: ${Math.round(pattern.avgConfidence * 100)}%). ${pattern.description}`,
        evidence: pattern.evidence,
        confidence: pattern.avgConfidence,
        source: "recurring_pattern",
        status: "pending",
      });
    }

    const wrongTurns = corpus.allWrongTurns.slice(0, 2);
    for (const wt of wrongTurns) {
      const summary = wt.length > 50 ? `${wt.substring(0, 47)}...` : wt;
      proposals.push({
        id: `prop-${Date.now()}-${proposals.length}`,
        type: "guard",
        title: `Guard against: ${summary}`,
        description: `Recurring wrong turn detected: ${wt}. Add a guard or validation to prevent this pattern.`,
        evidence: [wt],
        confidence: 0.7,
        source: "wrong_turn",
        status: "pending",
      });
    }

    return proposals.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private adjustFromHistory(proposals: InferenceProposal[]): void {
    this.adjustConfidenceFromHistory(proposals);
    proposals.sort((a, b) => b.confidence - a.confidence);
  }

  private getCoordinator(): VotingCoordinator {
    if (!this.votingCoordinator) {
      const stateManager = this.getGovernanceStateManager();
      this.votingCoordinator = new VotingCoordinator(stateManager);
    }
    return this.votingCoordinator;
  }


  private async applyProposals(proposals: InferenceProposal[]): Promise<void> {
    for (const p of proposals) {
      try {
        frameworkLogger.log("inference-cycle", "apply-start", "info", {
          proposalId: p.id,
          type: p.type,
          title: p.title,
        });

        const success = await this.applyProposal(p);
        p.status = success ? "applied" : "failed";

        frameworkLogger.log("inference-cycle", "apply-complete", success ? "success" : "error", {
          proposalId: p.id,
          status: p.status,
        });
      } catch (err) {
        p.status = "failed";
        frameworkLogger.log("inference-cycle", "apply-error", "error", {
          proposalId: p.id,
          error: String(err),
        });
      }
    }
  }

  private async applyProposal(p: InferenceProposal): Promise<boolean> {
    const branchName = `inference/${p.type}-${Date.now()}`;

    try {
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });

      let filesChanged = false;

      if (p.type === "fix" || p.type === "refactor") {
        filesChanged = this.applyCodeChange(p);
      } else if (p.type === "guard") {
        filesChanged = this.applyGuard(p);
      } else if (p.type === "codify") {
        filesChanged = this.applyCodification(p);
      } else if (p.type === "automate") {
        filesChanged = this.applyAutomation(p);
      }

      if (!filesChanged) {
        execSync(`git checkout master`, { cwd: this.projectRoot, stdio: "pipe" });
        execSync(`git branch -D ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });
        return false;
      }

      execSync(`git add -A`, { cwd: this.projectRoot, stdio: "pipe" });
      execSync(`git commit -m "${p.title}"`, { cwd: this.projectRoot, stdio: "pipe" });

      const prUrl = this.createPR(p, branchName);
      frameworkLogger.log("inference-cycle", "pr-created", "info", { prUrl });

      // Researcher downstream checkpoint — review PR against real codebase
      if (!this.options.skipResearcherReview) {
        const review = await this.researcherReview(p, prUrl);
        if (review === "no-go") {
          frameworkLogger.log("inference-cycle", "researcher-no-go", "warning", { prUrl });
          execSync(`git checkout master`, { cwd: this.projectRoot, stdio: "pipe" });
          execSync(`git branch -D ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });
          return false;
        } else if (review === "modify") {
          frameworkLogger.log("inference-cycle", "researcher-modify", "info", { prUrl });
        }
      }

      execSync(`git checkout master`, { cwd: this.projectRoot, stdio: "pipe" });

      return true;
    } catch (err) {
      try {
        execSync(`git checkout master`, { cwd: this.projectRoot, stdio: "pipe" });
        execSync(`git branch -D ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });
      } catch {
        // ignore cleanup errors
      }
      throw err;
    }
  }

  private applyCodeChange(p: InferenceProposal): boolean {
    const evidence = p.evidence.join("\n");
    const markerPath = path.join(this.projectRoot, ".strray", "inference", "applied-markers", `${p.id}.md`);
    fs.mkdirSync(path.dirname(markerPath), { recursive: true });
    fs.writeFileSync(markerPath, `# ${p.title}\n\n${p.description}\n\n## Evidence\n${evidence}`);
    return true;
  }

  private applyGuard(p: InferenceProposal): boolean {
    const guardPath = path.join(this.projectRoot, "docs", "guards", `${p.title.replace(/[^a-z0-9]/gi, "-")}.md`);
    fs.mkdirSync(path.dirname(guardPath), { recursive: true });
    fs.writeFileSync(guardPath, `# Guard: ${p.title}\n\n${p.description}\n\n## Evidence\n${p.evidence.join("\n")}`);
    return true;
  }

  private applyCodification(p: InferenceProposal): boolean {
    const catalogPath = path.join(this.projectRoot, "docs", "pattern-catalog.md");
    const entry = `\n## ${p.title}\n\n${p.description}\n\n**Evidence:** ${p.evidence.length} sessions\n`;
    fs.appendFileSync(catalogPath, entry);
    return true;
  }

  private applyAutomation(p: InferenceProposal): boolean {
    const automationPath = path.join(this.projectRoot, "docs", "automation-proposals.md");
    const entry = `\n## ${p.title}\n\n${p.description}\n\n**Evidence:** ${p.evidence.join(", ")}\n`;
    fs.mkdirSync(path.dirname(automationPath), { recursive: true });
    fs.appendFileSync(automationPath, entry);
    return true;
  }

  private createPR(p: InferenceProposal, branchName: string): string {
    try {
      execSync(`git push -u origin ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });
      const result = execSync(
        `gh pr create --head ${branchName} --title "${p.title}" --body "## Inference Proposal\n\n${p.description}\n\n**Type:** ${p.type}\n**Confidence:** ${(p.confidence * 100).toFixed(0)}%\n\n## Evidence\n${p.evidence.slice(0, 5).join("\n")}"`,
        { cwd: this.projectRoot, encoding: "utf-8", stdio: "pipe" },
      );
      return result.trim();
    } catch (err) {
      frameworkLogger.log("inference-cycle", "pr-create-failed", "warning", { error: String(err) });
      return "";
    }
  }

  private async researcherReview(p: InferenceProposal, prUrl: string): Promise<"go" | "no-go" | "modify"> {
    const prompt = `You are a researcher agent reviewing a PR for proposal: "${p.title}".

PR URL: ${prUrl}

Proposal Type: ${p.type}
Description: ${p.description}
Evidence: ${p.evidence.slice(0, 5).join("; ")}

Your job: Review the actual codebase to verify this proposal makes sense. Search the code to confirm:
1. Does the problem described actually exist in the codebase?
2. Is the proposed solution appropriate?
3. Are there any missed edge cases?

Respond with EXACTLY one of:
- GO (proposal is valid, approve)
- NO-GO (proposal is invalid, reject)
- MODIFY: <specific changes needed>`;

    try {
      const { execSync } = require("child_process");
      const result = execSync(
        `opencode run --agent researcher --message "${prompt.replace(/"/g, '\\"')}"`,
        { cwd: this.projectRoot, encoding: "utf-8", timeout: 15000, stdio: "pipe" },
      );

      const output = result.toLowerCase();
      if (output.includes("no-go")) return "no-go";
      if (output.includes("modify")) return "modify";
      return "go";
    } catch (err) {
      frameworkLogger.log("inference-cycle", "researcher-review-failed", "warning", { error: String(err) });
      return "go"; // default to go if researcher fails
    }
  }

  private async governProposals(proposals: InferenceProposal[]): Promise<InferenceCycleResult["votes"]> {
    const coordinator = this.getCoordinator();
    const sessionId = `inference-governance-${Date.now()}`;
    const results: InferenceCycleResult["votes"] = [];

    for (const proposal of proposals) {
      const agents = GOVERNANCE_AGENTS[proposal.type] ?? ["code-reviewer", "architect"];
      const complexity = Math.min(50, 10 + proposal.evidence.length * 5 + (proposal.confidence > 0.8 ? 10 : 0));
      const hasSecurity = proposal.type === "guard" || proposal.type === "fix";
      const hasArchitectural = proposal.type === "codify" || proposal.type === "automate";

      const voteId = await coordinator.initiateVoting(
        sessionId,
        proposal.title,
        proposal.description,
        agents,
        {
          complexity,
          riskLevel: proposal.type === "fix" ? "low" : proposal.type === "guard" ? "high" : "medium",
          hasSecurityConcerns: hasSecurity,
          hasArchitecturalImpact: hasArchitectural,
          participantCount: agents.length,
        },
      );

      for (const agentName of agents) {
        const agentVote = await this.getAgentVote(agentName, proposal);
        coordinator.submitVote(voteId, agentName, agentVote.decision, agentVote.confidence, agentVote.reasoning);
      }

      const resolved = coordinator.resolveVoting(voteId);
      if (resolved) {
        results.push({
          proposalId: proposal.id,
          decision: resolved.decision === "approve" ? "approve" : "reject",
          confidence: resolved.confidence,
          details: resolved.details?.map((d) => `${d.agentName}: vote=${d.vote}, weight=${d.weight.toFixed(2)}`) || [],
        });

        // Update agent performance for historical weighting
        if (resolved.details) {
          for (const detail of resolved.details) {
            const wasCorrect = detail.vote === resolved.decision;
            const confidence = proposal.evidence.length > 0 ? proposal.confidence : 0.5;
            this.getCoordinator().getAggregator().updateAgentPerformance(
              detail.agentName,
              resolved.decision,
              detail.vote,
              wasCorrect,
              confidence,
            );
          }
        }
      } else {
        results.push(this.heuristicFallbackVote(proposal));
      }
    }

    const metrics = coordinator.getMetrics();
    frameworkLogger.log("inference-cycle", "governance-metrics", "info", {
      totalVotes: metrics.totalVotes,
      avgConfidence: metrics.averageConfidence.toFixed(2),
      strategyUsage: metrics.strategyUsage,
    });

    return results;
  }

  private votingCoordinator: VotingCoordinator | null = null;
  private getGovernanceStateManager(): StringRayStateManager {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    const stateFile = path.join(this.stateDir, "governance-state.json");
    const stateManager = new StringRayStateManager();
    if (fs.existsSync(stateFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
        for (const [key, value] of Object.entries(data)) {
          stateManager.set(key, value);
        }
      } catch {
        frameworkLogger.log("inference-cycle", "governance-state-load-failed", "warning", {});
      }
    }
    return stateManager;
  }

  private saveGovernanceState(coordinator: VotingCoordinator): void {
    const stateFile = path.join(this.stateDir, "governance-state.json");
    try {
      // Export the coordinator's internal state (voting history, metrics, etc.)
      const history = coordinator.getVotingHistory();
      const metrics = coordinator.getMetrics();
      const exportData = {
        votingHistory: history,
        metrics,
        exportedAt: new Date().toISOString(),
      };
      if (!fs.existsSync(this.stateDir)) {
        fs.mkdirSync(this.stateDir, { recursive: true });
      }
      fs.writeFileSync(stateFile, JSON.stringify(exportData, null, 2));
    } catch (error) {
      frameworkLogger.log("inference-cycle", "governance-state-save-failed", "warning", { error: String(error) });
    }
  }

  private async getAgentVote(
    agentName: string,
    proposal: InferenceProposal,
  ): Promise<{ decision: string; confidence: number; reasoning: string }> {
    const prompt = [
      `Review this inference proposal from 0xRay's self-improvement cycle.`,
      ``,
      `Title: ${proposal.title}`,
      `Type: ${proposal.type}`,
      `Source: ${proposal.source}`,
      `Confidence: ${(proposal.confidence * 100).toFixed(0)}%`,
      `Evidence: ${proposal.evidence.join("; ")}`,
      `Description: ${proposal.description}`,
      ``,
      `Cast your vote. Respond with exactly this format:`,
      `DECISION: approve|reject`,
      `CONFIDENCE: 0.XX`,
      `REASONING: <one sentence>`,
    ].join("\n");

    try {
      const { response, toolCalls } = await this.invokeAgent(agentName, prompt);
      return this.parseAgentResponse(response, proposal, toolCalls);
    } catch (error) {
      frameworkLogger.log("inference-cycle", "agent-invocation-fallback", "info", {
        agent: agentName,
        error: String(error),
      });
      return {
        decision: proposal.confidence >= 0.7 ? "approve" : "reject",
        confidence: proposal.confidence * 0.8,
        reasoning: `fallback: opencode unavailable for ${agentName}`,
      };
    }
  }

  private async invokeAgent(agentName: string, prompt: string): Promise<{ response: string; toolCalls: string[] }> {
    if (this.agentInvoker) {
      const resp = await this.agentInvoker(agentName, prompt);
      return { response: resp, toolCalls: [] }; // AgentInvoker doesn't provide tool calls
    }

    if (this.opencodeAvailable === null) {
      try {
        execSync("which opencode", { stdio: "pipe", timeout: 3000 });
        this.opencodeAvailable = true;
      } catch {
        this.opencodeAvailable = false;
        frameworkLogger.log("inference-cycle", "opencode-not-found", "info", {
          message: "opencode CLI not found — governance will use heuristic fallback",
        });
      }
    }

    if (!this.opencodeAvailable) {
      throw new Error("opencode CLI not available");
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      const child = spawn(
        "opencode",
        ["run", "--agent", agentName, "--message", prompt,
         "--format", "json"],
        {
          cwd: this.projectRoot,
          env: {
            ...process.env,
            NODE_ENV: "production",
            OPENCODE_MCP_CONFIG: "./node_modules/strray-ai/opencode.json",
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          child.kill("SIGKILL");
          reject(new Error(`opencode --agent ${agentName} timed out`));
        }
      }, 15000);

      let stdout = "";
      let stderr = "";
      let toolCalls: string[] = [];

      child.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        // Parse JSON stream for tool usage
        try {
          const lines = chunk.split("\n").filter((l) => l.trim());
          for (const line of lines) {
            const evt = JSON.parse(line);
            if (evt.type === "tool_use") {
              toolCalls.push(evt.part?.tool || "unknown");
            }
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      });
      child.stderr?.on("data", (data: Buffer) => { stderr += data.toString(); });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        if (code === 0 && stdout.trim()) {
          resolve({ response: stdout.trim(), toolCalls });
        } else {
          reject(new Error(`opencode --agent ${agentName} exited ${code}: ${stderr.substring(0, 200)}`));
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }

  private parseAgentResponse(
    response: string,
    proposal: InferenceProposal,
    toolCalls: string[] = [],
  ): { decision: string; confidence: number; reasoning: string } {
    const lower = response.toLowerCase();

    const decision = lower.includes("approve") || lower.includes("accept")
      ? "approve"
      : lower.includes("reject") || lower.includes("deny")
        ? "reject"
        : proposal.confidence >= 0.7 ? "approve" : "reject";

    const confMatch = response.match(/confidence[:\s]*(0?\.\d+|1\.0|1|0)/i);
    let confidence = confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]!))) : proposal.confidence;

    const reasonMatch = response.match(/reasoning[:\s]*(.+)/i);
    const reasoning = reasonMatch ? reasonMatch[1]!.trim() : response.substring(0, 200);

    // Boost confidence if agent actually used MCP tools
    if (toolCalls.length > 0) {
      const toolBoost = Math.min(0.2, toolCalls.length * 0.05);
      confidence = Math.min(1, confidence + toolBoost);
      frameworkLogger.log("inference-cycle", "tool-boost", "info", {
        agent: proposal.id,
        toolCount: toolCalls.length,
        tools: toolCalls,
        boost: toolBoost,
      });
    }

    return { decision, confidence, reasoning };
  }

  private heuristicFallbackVote(proposal: InferenceProposal): InferenceCycleResult["votes"][0] {
    const evidenceCount = proposal.evidence.length;
    const conf = proposal.confidence * (0.8 + Math.min(evidenceCount * 0.05, 0.15));
    const decision = conf >= 0.5 ? "approve" : "reject";

    return {
      proposalId: proposal.id,
      decision,
      confidence: conf,
      details: ["fallback: heuristic (opencode unavailable)"],
    };
  }

  private classifyProposalType(problemPattern: string): InferenceProposal["type"] {
    const lower = problemPattern.toLowerCase();
    if (lower.includes("bug") || lower.includes("fix") || lower.includes("stability")) return "fix";
    if (lower.includes("dead code") || lower.includes("remove") || lower.includes("health")) return "refactor";
    if (lower.includes("manual") || lower.includes("automate")) return "automate";
    if (lower.includes("guard") || lower.includes("path") || lower.includes("timing") || lower.includes("edge case")) return "guard";
    return "codify";
  }

  private patternToProposalType(pattern: RecurringPattern): InferenceProposal["type"] {
    const name = pattern.name.toLowerCase();
    if (name.includes("dead code")) return "refactor";
    if (name.includes("extract")) return "refactor";
    if (name.includes("registry") || name.includes("facade")) return "codify";
    if (name.includes("test")) return "guard";
    if (name.includes("stability")) return "fix";
    return "codify";
  }

  private generateTitle(problem: RecurringProblem): string {
    const pattern = problem.pattern;

    const ACTION_MAP: [RegExp, string][] = [
      [/^Bug fix$/i, "Fix recurring bug pattern"],
      [/^Code health cleanup$/i, "Clean up code health issues"],
      [/^Accumulated dead code$/i, "Remove accumulated dead code"],
      [/^Incomplete implementation$/i, "Complete partial implementation"],
      [/^Technical debt/i, "Address technical debt"],
      [/^Missing guard/i, "Add missing guard"],
      [/^Manual step/i, "Automate manual step"],
    ];

    for (const [re, title] of ACTION_MAP) {
      if (re.test(pattern)) {
        return `${title} (${problem.occurrences}x across ${problem.sessions.length} sessions)`;
      }
    }

    if (pattern.length > 80) {
      return `Address: ${pattern.substring(0, 77)}... (${problem.occurrences}x)`;
    }

    return `Address: ${pattern} (${problem.occurrences}x)`;
  }

  private setPhase(phase: CyclePhase): void {
    this.phase = phase;
    frameworkLogger.log("inference-cycle", "phase-change", "info", { phase });
  }

  getPhase(): CyclePhase {
    return this.phase;
  }

  private saveCycleState(cycleId: string): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(this.stateDir, CYCLE_STATE_FILE),
      JSON.stringify({
        cycleId,
        completedAt: new Date().toISOString(),
        phase: this.phase,
      }),
    );
  }

  private appendHistory(result: InferenceCycleResult): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    const historyPath = path.join(this.stateDir, CYCLE_HISTORY_FILE);
    let history: InferenceCycleResult[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
      } catch {
        history = [];
      }
    }
    history.push(result);
    if (history.length > 50) history = history.slice(-50);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  private loadHistory(): InferenceCycleResult[] {
    const historyPath = path.join(this.stateDir, CYCLE_HISTORY_FILE);
    if (!fs.existsSync(historyPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    } catch {
      return [];
    }
  }

  private adjustConfidenceFromHistory(proposals: InferenceProposal[]): void {
    const history = this.loadHistory();
    if (history.length === 0) return;

    const recentVotes = history.slice(-10).flatMap((h) => h.votes);
    const approvedIds = new Set(
      recentVotes.filter((v) => v.decision === "approve").map((v) => v.proposalId),
    );

    const approvedTypes = new Map<string, number>();
    const rejectedTypes = new Map<string, number>();

    for (const h of history.slice(-10)) {
      for (const p of h.proposals) {
        if (p.status === "approved" || p.status === "applied") {
          approvedTypes.set(p.type, (approvedTypes.get(p.type) ?? 0) + 1);
        } else if (p.status === "rejected" || p.status === "failed") {
          rejectedTypes.set(p.type, (rejectedTypes.get(p.type) ?? 0) + 1);
        }
      }
    }

    for (const proposal of proposals) {
      const approved = approvedTypes.get(proposal.type) ?? 0;
      const rejected = rejectedTypes.get(proposal.type) ?? 0;
      const total = approved + rejected;
      if (total >= 3) {
        const successRate = approved / total;
        if (successRate < 0.3) {
          proposal.confidence *= 0.8;
        } else if (successRate > 0.7) {
          proposal.confidence = Math.min(0.95, proposal.confidence * 1.05);
        }
      }
    }
  }

  private buildResult(
    cycleId: string,
    triggered: boolean,
    reason: string,
    startTime: number,
    corpus?: InferenceCorpus,
    proposals?: InferenceProposal[],
    votes?: InferenceCycleResult["votes"],
    deployVerification?: DeployVerificationResult,
  ): InferenceCycleResult {
    return {
      cycleId,
      triggered,
      triggerReason: reason,
      corpusSummary: corpus
        ? {
            sessions: corpus.sessions.length,
            totalCommits: corpus.totalCommits,
            recurringPatterns: corpus.recurringPatterns.length,
            recurringProblems: corpus.recurringProblems.length,
          }
        : { sessions: 0, totalCommits: 0, recurringPatterns: 0, recurringProblems: 0 },
      proposals: proposals || [],
      votes: votes || [],
      deployVerification,
      phase: this.phase,
      completedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}
