import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";
import { shouldTriggerCycle, accumulateCorpus, InferenceCorpus, RecurringPattern, RecurringProblem } from "./inference-accumulator.js";
import { DeployVerifier, DeployVerificationResult } from "./deploy-verifier.js";
import { VotingCoordinator } from "../delegation/voting-coordinator.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { getGovernanceIntegration, type GovernanceVoteResult } from "../integrations/governance/index.js";
import { getAgentSpawn } from "../core/features-config.js";
import { agentSpawnGovernor } from "../orchestrator/agent-spawn-governor.js";
import { spawnGate } from "../core/opencode-spawn-gate.js";

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
  // Real individual knowledge-skill MCP servers (have analyze_proposal handlers)
  fix: ["code-review", "security-audit", "researcher"],
  refactor: ["code-review", "security-audit", "researcher"],
  guard: ["code-review", "security-audit", "researcher"],
  automate: ["code-review", "security-audit", "researcher"],
  codify: ["code-review", "security-audit", "researcher"],
};

export type AgentInvoker = (agentName: string, prompt: string) => Promise<string>;

export interface InferenceCycleOptions {
  skipDeployVerify?: boolean;
  skipApply?: boolean;
  skipResearcherReview?: boolean;
  force?: boolean;
}

export class InferenceCycle {
  // Singleton registry + state management to prevent recursive agent spawning
  private static instances = new Map<string, InferenceCycle>();
  private static reEntryLock = false;
  private static governedProposalIds = new Set<string>();
  private static votingCoordinator: VotingCoordinator | null = null;

  static getInstance(projectRoot?: string, options?: InferenceCycleOptions): InferenceCycle {
    const root = path.resolve(projectRoot || process.cwd());
    if (!InferenceCycle.instances.has(root)) {
      InferenceCycle.instances.set(root, new InferenceCycle(root, undefined, options));
    }
    return InferenceCycle.instances.get(root)!;
  }

  static resetInstance(): void {
    InferenceCycle.instances.clear();
    InferenceCycle.reEntryLock = false;
    InferenceCycle.governedProposalIds.clear();
    InferenceCycle.votingCoordinator = null;
  }

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

  async governExternalProposals(proposals: InferenceProposal[]): Promise<InferenceCycleResult> {
    // GATE: prevent re-entry — same as maybeRunCycle
    if (InferenceCycle.reEntryLock) {
      const blockedId = `blocked-${Date.now()}`;
      frameworkLogger.log("inference-cycle", "external-re-entry-blocked", "warning", {});
      return this.buildBlockedResult(blockedId, "Cycle in progress — external governance blocked");
    }
    InferenceCycle.reEntryLock = true;

    const startTime = Date.now();
    const cycleId = `external-${Date.now()}`;

    try {
      frameworkLogger.log("inference-cycle", "external-governance-start", "info", {
        cycleId,
        proposalCount: proposals.length,
      });

      this.setPhase("governing");
      let votes: InferenceCycleResult["votes"] = [];
      try {
        votes = await this.governProposals(proposals);
      } catch (e) {
        frameworkLogger.log("inference-cycle", "govern-proposals-error", "error", {
          error: (e as Error).message,
          stack: (e as Error).stack?.substring(0, 500),
        });
        for (const proposal of proposals) {
          votes.push({
            proposalId: proposal.id,
            decision: "reject",
            confidence: 0,
            details: [`rejected: external governance error: ${(e as Error).message}`],
          });
        }
      }

      const approved = proposals.filter(
        (p) => votes.find((v) => v.proposalId === p.id && v.decision === "approve"),
      );
      for (const p of approved) p.status = "approved";
      for (const p of proposals.filter((p) => p.status !== "approved")) p.status = "rejected";

      // Track governed proposals for dedup across cycles
      for (const p of proposals) InferenceCycle.governedProposalIds.add(p.id);

      this.setPhase("complete");
      this.saveCycleState(cycleId);
      this.saveGovernanceState(this.getCoordinator());

      const result = this.buildResult(cycleId, true, "external proposals", startTime, undefined, proposals, votes);
      this.appendHistory(result);

      frameworkLogger.log("inference-cycle", "external-governance-complete", "info", {
        cycleId,
        approved: approved.length,
        rejected: proposals.length - approved.length,
      });

      return result;
    } finally {
      InferenceCycle.reEntryLock = false;
    }
  }

  async maybeRunCycle(): Promise<InferenceCycleResult> {
    // GATE: prevent recursive re-entry while a cycle is in progress
    if (InferenceCycle.reEntryLock) {
      const blockedId = `blocked-${Date.now()}`;
      frameworkLogger.log("inference-cycle", "re-entry-blocked", "warning", {});
      return this.buildBlockedResult(blockedId, "Cycle already in progress — re-entry blocked");
    }
    InferenceCycle.reEntryLock = true;

    const startTime = Date.now();
    const cycleId = `cycle-${Date.now()}`;

    try {
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

      // Track governed proposals for dedup across cycles
      for (const p of proposals) InferenceCycle.governedProposalIds.add(p.id);

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
    } finally {
      InferenceCycle.reEntryLock = false;
    }
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
    if (!InferenceCycle.votingCoordinator) {
      const stateManager = this.getGovernanceStateManager();
      InferenceCycle.votingCoordinator = new VotingCoordinator(stateManager);
    }
    return InferenceCycle.votingCoordinator;
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
    if (p.type === "codify") {
      this.applyCodification(p);
      return true;
    }

    const branchName = `inference/${p.type}-${Date.now()}`;

    try {
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectRoot, stdio: "pipe" });

      let filesChanged = false;

      if (p.type === "fix" || p.type === "refactor") {
        filesChanged = await this.applyCodeChange(p);
      } else if (p.type === "guard") {
        filesChanged = await this.applyGuard(p);
      } else if (p.type === "automate") {
        filesChanged = await this.applyAutomation(p);
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

  private async applyCodeChange(p: InferenceProposal): Promise<boolean> {
    const targetFiles = this.extractTargetFiles(p.evidence);

    const prompt = [
      `Apply approved inference proposal`,
      ``,
      `Type: ${p.type}`,
      `Title: ${p.title}`,
      `Description: ${p.description}`,
      targetFiles.length > 0 ? `Target files: ${targetFiles.join(", ")}` : "No specific target files identified",
      `Evidence: ${p.evidence.slice(0, 5).join("; ")}`,
      `Confidence: ${(p.confidence * 100).toFixed(0)}%`,
      ``,
      `1. Read the relevant source files`,
      `2. Apply the ${p.type} described above`,
      `3. Make minimal, surgical changes`,
      `4. If the change is unsafe or unclear, skip and explain`,
    ].join("\n");

    frameworkLogger.log("inference-cycle", "apply-invoking-agent", "info", {
      proposalId: p.id,
      proposalType: p.type,
      targetFiles,
    });

    try {
      const agentName = p.type === "refactor" ? "refactorer" : "code-reviewer";
      await this.invokeAgentInternal(agentName, prompt);
      return true;
    } catch (err) {
      frameworkLogger.log("inference-cycle", "apply-agent-failed", "warning", {
        proposalId: p.id,
        error: String(err),
      });
      return false;
    }
  }

  private async applyGuard(p: InferenceProposal): Promise<boolean> {
    const prompt = [
      `Add guard/validation for the following issue:`,
      ``,
      `Title: ${p.title}`,
      `Description: ${p.description}`,
      `Evidence: ${p.evidence.join("; ")}`,
      `Confidence: ${(p.confidence * 100).toFixed(0)}%`,
      ``,
      `1. Read the relevant source files`,
      `2. Add the missing guard, validation, or edge case handling`,
      `3. If this is a codex rule, add the term to .opencode/strray/codex.json`,
      `4. Make minimal, surgical changes`,
    ].join("\n");

    try {
      await this.invokeAgentInternal("code-reviewer", prompt);
      return true;
    } catch (err) {
      frameworkLogger.log("inference-cycle", "apply-guard-failed", "warning", {
        proposalId: p.id,
        error: String(err),
      });
      const guardPath = path.join(this.projectRoot, "docs", "guards", `${p.title.replace(/[^a-z0-9]/gi, "-")}.md`);
      fs.mkdirSync(path.dirname(guardPath), { recursive: true });
      fs.writeFileSync(guardPath, `# Guard: ${p.title}\n\n${p.description}\n\n## Evidence\n${p.evidence.join("\n")}`);
      return true;
    }
  }

  private applyCodification(p: InferenceProposal): boolean {
    const catalogPath = path.join(this.projectRoot, "docs", "pattern-catalog.md");
    const entry = `\n## ${p.title}\n\n${p.description}\n\n**Evidence:** ${p.evidence.length} sessions\n`;
    fs.appendFileSync(catalogPath, entry);
    return true;
  }

  private async applyAutomation(p: InferenceProposal): Promise<boolean> {
    const prompt = [
      `Design automation for the following manual process:`,
      ``,
      `Title: ${p.title}`,
      `Description: ${p.description}`,
      `Evidence: ${p.evidence.join("; ")}`,
      `Confidence: ${(p.confidence * 100).toFixed(0)}%`,
      ``,
      `1. Read the relevant source files`,
      `2. Design the automation (script, processor, or config change)`,
      `3. Implement it if straightforward, otherwise describe the design`,
    ].join("\n");

    try {
      await this.invokeAgentInternal("architect", prompt);
      return true;
    } catch (err) {
      frameworkLogger.log("inference-cycle", "apply-automation-failed", "warning", {
        proposalId: p.id,
        error: String(err),
      });
      const automationPath = path.join(this.projectRoot, "docs", "automation-proposals.md");
      const entry = `\n## ${p.title}\n\n${p.description}\n\n**Evidence:** ${p.evidence.join(", ")}\n`;
      fs.mkdirSync(path.dirname(automationPath), { recursive: true });
      fs.appendFileSync(automationPath, entry);
      return true;
    }
  }

  private extractTargetFiles(evidence: string[]): string[] {
    const filePattern = /[a-zA-Z0-9/_-]+\.(ts|js|mjs|json|yml|yaml)/g;
    const files = new Set<string>();

    for (const item of evidence) {
      const matches = item.matchAll(filePattern);
      for (const match of matches) {
        const f = match[0];
        if (f.startsWith("src/") || f.startsWith("dist/") || f.startsWith(".opencode/")) {
          files.add(f);
        }
      }
    }

    return [...files];
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
      const result = await this.invokeAgentInternal("researcher", prompt);

      const output = result.toLowerCase();
      if (output.includes("no-go")) return "no-go";
      if (output.includes("modify")) return "modify";
      return "go";
    } catch (err) {
      frameworkLogger.log("inference-cycle", "researcher-review-failed", "warning", { error: String(err) });
      return "go";
    }
  }

  private async governProposals(proposals: InferenceProposal[]): Promise<InferenceCycleResult["votes"]> {
    // OSCILLATOR 1: Internal VotingCoordinator — always runs
    const internalVotes = await this.governProposalsInternal(proposals);

    // OSCILLATOR 2: External governance check — runs in addition if available
    const governanceIntegration = getGovernanceIntegration();
    if (governanceIntegration?.isAvailable()) {
      frameworkLogger.log("inference-cycle", "using-external-governance", "info", {
        proposalCount: proposals.length,
      });
      const externalVotes = await this.governProposalsExternal(proposals);
      return this.mergeGovernanceVotes(internalVotes, externalVotes, proposals);
    }

    return internalVotes;
  }

  /**
   * Oscillator 1: Internal VotingCoordinator-based governance
   */
  private async governProposalsInternal(
    proposals: InferenceProposal[],
  ): Promise<InferenceCycleResult["votes"]> {
    const coordinator = this.getCoordinator();
    const sessionId = `inference-governance-${Date.now()}`;
    const results: InferenceCycleResult["votes"] = [];

    const todoPrompt = [
      `Vote on ${proposals.length} inference proposals. Output EXACTLY one PROPOSAL block per proposal.`,
      ``,
      `FORMAT (exact, no extra text, no markdown):`,
      `PROPOSAL: <number>`,
      `  AGENT: architect`,
      `  DECISION: approve|reject|abstain`,
      `  CONFIDENCE: 0.XX`,
      `  REASONING: <brief reason>`,
      ``,
      `Example:`,
      `PROPOSAL: 1`,
      `  AGENT: architect`,
      `  DECISION: approve`,
      `  CONFIDENCE: 0.85`,
      `  REASONING: Cleanup reduces maintenance burden`,
      ``,
      `PROPOSALS:`,
    ];

    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i]!;
      todoPrompt.push(`${i + 1}. [${p.type}] "${p.title}"`);
    }

    try {
      const jsonOutput = await this.invokeAgentInternal("architect", todoPrompt.join("\n"));

      const allVotes = this.parseSubagentVotes(jsonOutput, proposals);

      for (const proposal of proposals) {
        const agents = GOVERNANCE_AGENTS[proposal.type] ?? ["code-reviewer"];
        const participants = ["architect", ...agents];
        const voteId = await coordinator.initiateVoting(
          sessionId,
          proposal.title,
          proposal.description,
          participants,
          {
            complexity: Math.min(50, 10 + proposal.evidence.length * 5 + (proposal.confidence > 0.8 ? 10 : 0)),
            riskLevel: proposal.type === "fix" ? "low" : proposal.type === "guard" ? "high" : "medium",
            hasSecurityConcerns: proposal.type === "guard" || proposal.type === "fix",
            hasArchitecturalImpact: proposal.type === "codify" || proposal.type === "automate",
            participantCount: participants.length,
          },
        );

        const proposalVotes = allVotes.filter((v: { proposalId: string; agentName: string; decision: string; confidence: number; reasoning: string }) => v.proposalId === proposal.id);
        for (const v of proposalVotes) {
          coordinator.submitVote(voteId, v.agentName, v.decision, v.confidence, v.reasoning);
        }

        const resolved = coordinator.resolveVoting(voteId);
        if (resolved) {
          results.push({
            proposalId: proposal.id,
            decision: resolved.decision === "approve" ? "approve" : "reject",
            confidence: resolved.confidence,
            details: resolved.details?.map((d) => `${d.agentName}: vote=${d.vote}, weight=${d.weight.toFixed(2)}`) || [],
          });

          if (resolved.details) {
            for (const detail of resolved.details) {
              this.getCoordinator().getAggregator().updateAgentPerformance(
                detail.agentName,
                resolved.decision,
                detail.vote,
                detail.vote === resolved.decision,
                proposal.confidence,
              );
            }
          }
        } else {
          results.push(this.rejectNoQuorum(proposal, "agents did not vote (no quorum)"));
        }
      }
    } catch (error) {
      frameworkLogger.log("inference-cycle", "architect-governance-failed", "error", { error: String(error) });
      for (const proposal of proposals) {
        results.push(this.rejectNoQuorum(proposal, `agent invocation failed: ${error instanceof Error ? error.message : String(error)}`));
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

  /**
   * Merge internal and external governance votes.
   * A proposal passes both oscillators — must be approved by internal AND external.
   */
  private mergeGovernanceVotes(
    internalVotes: InferenceCycleResult["votes"],
    externalVotes: InferenceCycleResult["votes"],
    proposals: InferenceProposal[],
  ): InferenceCycleResult["votes"] {
    const merged: InferenceCycleResult["votes"] = [];

    for (const proposal of proposals) {
      const internal = internalVotes.find((v) => v.proposalId === proposal.id);
      const external = externalVotes.find((v) => v.proposalId === proposal.id);

      if (!internal) {
        merged.push(this.rejectNoQuorum(proposal, "internal governance vote missing"));
        continue;
      }

      const internalApproved = internal.decision === "approve";
      const externalApproved = external?.decision === "approve";

      const bothApproved = internalApproved && (!external || externalApproved);

      merged.push({
        proposalId: proposal.id,
        decision: bothApproved ? "approve" : "reject",
        confidence: internal.confidence * (external ? external.confidence : 1.0),
        details: [
          ...internal.details,
          ...(external ? [`External governance: ${external.decision} (conf: ${external.confidence.toFixed(2)})`, ...external.details] : []),
        ],
      });
    }

    return merged;
  }

  // Removed: buildOrchestratorGovernancePrompt (replaced by inline TODO prompt in governProposals)

  /**
   * Govern proposals using external chrono-warp-drive Dynamo endpoint
   */
  private async governProposalsExternal(
    proposals: InferenceProposal[],
  ): Promise<InferenceCycleResult["votes"]> {
    const governanceIntegration = getGovernanceIntegration();
    if (!governanceIntegration) {
      throw new Error("Governance integration not available");
    }

    // Build agent reviews from proposal evidence
    const agentReviews = proposals.flatMap((p) =>
      p.evidence.slice(0, 2).map((e) => `[${p.type}] ${e}`),
    );

    try {
      const batchResult = await governanceIntegration.checkProposals(
        proposals,
        agentReviews,
        [],
      );

      const votes: InferenceCycleResult["votes"] = batchResult.results.map(
        (result: GovernanceVoteResult) => ({
          proposalId: result.governanceResponse.proposalId,
          decision: result.vote.toLowerCase() === "yes" ? "approve" : "reject",
          confidence: result.governanceResponse.confidence,
          details: [
            `Governance: ${result.governanceResponse.recommendation}`,
            `Isotope: ${result.governanceResponse.governanceIsotopeId}`,
            ...result.governanceResponse.reasons.slice(0, 2),
          ],
        }),
      );

      frameworkLogger.log("inference-cycle", "external-governance-complete", "info", {
        proposalCount: proposals.length,
        passedCount: batchResult.results.filter((r) => r.passed).length,
      });

      return votes;
    } catch (error) {
      frameworkLogger.log(
        "inference-cycle",
        "external-governance-failed",
        "error",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      return proposals.map((p) => this.rejectNoQuorum(p, "external governance endpoint failed"));
    }
  }

  private async invokeAgentInternal(agentName: string, prompt: string): Promise<string> {
    frameworkLogger.log("inference-cycle", "invoke-agent-internal", "info", {
      agentName,
      promptLength: prompt.length,
    });

    try {
      const { mcpClientManager } = await import("../mcps/mcp-client.js");
      const result = await mcpClientManager.callServerTool("orchestrator", "orchestrate-task", {
        description: prompt,
        tasks: [{
          id: `task-${Date.now()}`,
          description: prompt,
          type: agentName,
          priority: "high",
        }],
        executionMode: "sequential",
      });
      const content = (result as { content?: Array<{ text?: string }> }).content;
      let responseText = "";
      if (content && Array.isArray(content)) {
        responseText = content.map((c: { text?: string }) => c.text ?? "").join("");
      } else {
        responseText = JSON.stringify(result);
      }
      // Only return if the response contains actual vote data (PROPOSAL blocks).
      // Generic orchestration ACKs like "Tool orchestrate-task executed..." have no votes.
      if (/PROPOSAL:\s*\d+/i.test(responseText)) {
        return responseText;
      }
      frameworkLogger.log("inference-cycle", "mcp-no-votes", "info", {
        agentName,
        responsePreview: responseText.substring(0, 200),
      });
    } catch (mcpError) {
      frameworkLogger.log("inference-cycle", "mcp-invocation-failed", "info", {
        agentName,
        error: String(mcpError),
      });
    }

    if (this.agentInvoker) {
      frameworkLogger.log("inference-cycle", "invoke-via-callback", "info", { agentName });
      return this.agentInvoker(agentName, prompt);
    }

    return this.invokeViaOpencode(agentName, prompt);
  }

  private async invokeViaOpencode(agentName: string, prompt: string): Promise<string> {
    // GATE: Centralized spawn gate — blocks all opencode spawning by default
    spawnGate.assertAllowed("inference-cycle");

    // BLOCKED: Never spawn real opencode processes during tests — causes
    // runaway agent processes and non-deterministic test behavior.
    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      throw new Error(
        `Agent spawning is disabled in test environment. ` +
        `Agent "${agentName}" cannot be spawned during tests.`
      );
    }

    // GOVERNED: Auto-spawning of OpenCode agents is now protected by the
    // AgentSpawnGovernor singleton and the agent_spawn feature flag.
    const spawnConfig = getAgentSpawn();
    if (!spawnConfig?.enabled) {
      throw new Error(
        `Auto-spawning of OpenCode agents is disabled. ` +
        `Agent "${agentName}" cannot be spawned automatically. ` +
        `Set agent_spawn.enabled=true in features.json to re-enable.`
      );
    }

    // Authorize spawn via the singleton governor
    const auth = await agentSpawnGovernor.authorizeSpawn({
      agentType: agentName,
      operation: "inference-cycle-invoke",
    });
    if (!auth.authorized) {
      throw new Error(
        `Spawn denied by governance for "${agentName}": ${auth.reason}`
      );
    }
    const trackingId = auth.trackingId;

    if (this.opencodeAvailable === null) {
      try {
        execSync("which opencode", { stdio: "pipe", timeout: 3000 });
        this.opencodeAvailable = true;
      } catch {
        this.opencodeAvailable = false;
      }
    }

    if (!this.opencodeAvailable) {
      if (trackingId) await agentSpawnGovernor.failSpawn(trackingId, new Error("opencode CLI not available"));
      throw new Error("opencode CLI is not available in PATH");
    }

    // Resolve the actual opencode project root (where .opencode/ config lives)
    const opencodeRoot = this.resolveOpencodeRoot();

    frameworkLogger.log("inference-cycle", "opencode-spawn-start", "info", {
      agentName,
      trackingId,
      opencodeRoot,
    });

    return new Promise((resolve, reject) => {
      const timeout = agentName === "architect" ? 300000 : 120000;
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          child.kill("SIGKILL");
          if (trackingId) {
            agentSpawnGovernor.failSpawn(trackingId, new Error(`opencode ${agentName} timed out`)).catch(() => {});
          }
          reject(new Error(`opencode ${agentName} timed out`));
        }
      }, timeout);

      const child = spawn(
        "opencode",
        ["run", "--agent", agentName, "--message", prompt, "--format", "json"],
        {
          cwd: opencodeRoot,
          env: { ...process.env, NODE_ENV: "production", OPENCODE_MCP_CONFIG: "./node_modules/strray-ai/opencode.json" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let stdout = "";
      child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
      child.stderr?.on("data", () => { /* ignore */ });

      child.on("close", async (code) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        if (code === 0 && stdout.trim()) {
          if (trackingId) {
            await agentSpawnGovernor.completeSpawn(trackingId, true).catch(() => {});
          }
          frameworkLogger.log("inference-cycle", "opencode-spawn-success", "info", { agentName, trackingId });
          const textResponse = this.extractTextFromNdjson(stdout.trim());
          if (textResponse) {
            resolve(textResponse);
          } else {
            resolve(stdout.trim());
          }
        } else {
          const error = new Error(`${agentName} exited ${code}`);
          if (trackingId) {
            await agentSpawnGovernor.failSpawn(trackingId, error).catch(() => {});
          }
          frameworkLogger.log("inference-cycle", "opencode-spawn-failed", "error", { agentName, trackingId, code });
          reject(error);
        }
      });

      child.on("error", async (err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          if (trackingId) {
            await agentSpawnGovernor.failSpawn(trackingId, err).catch(() => {});
          }
          frameworkLogger.log("inference-cycle", "opencode-spawn-error", "error", { agentName, trackingId, error: err.message });
          reject(err);
        }
      });
    });
  }

  private parseSubagentVotes(
    jsonOutput: string,
    proposals: InferenceProposal[],
  ): Array<{ proposalId: string; agentName: string; decision: string; confidence: number; reasoning: string }> {
    const votes: Array<{ proposalId: string; agentName: string; decision: string; confidence: number; reasoning: string }> = [];

    const lines = jsonOutput.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === "tool_use" && obj.part?.type === "tool" && obj.part.tool === "task") {
          const agentName = obj.part.state?.input?.subagent_type || "";
          const output = obj.part.state?.output || "";

          // Each task output may contain multiple PROPOSAL blocks
          const blocks = output.split(/PROPOSAL:\s*/).filter((b: string) => b.trim().length > 0);

          for (const block of blocks) {
            const numMatch = block.match(/^(\d+)/);
            if (!numMatch) continue;
            const proposalIdx = parseInt(numMatch[1], 10) - 1;
            if (proposalIdx < 0 || proposalIdx >= proposals.length) continue;

            const decisionMatch = block.match(/DECISION:\s*(\w+)/i);
            const confMatch = block.match(/CONFIDENCE:\s*(0?\.\d+|1\.0|1|0)/i);
            const reasonMatch = block.match(/REASONING:\s*(.+)/i);

            if (decisionMatch) {
              const proposal = proposals[proposalIdx];
              if (proposal) {
                votes.push({
                  proposalId: proposal.id,
                  agentName,
                  decision: decisionMatch[1]!.toLowerCase(),
                  confidence: confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]!))) : 0.5,
                  reasoning: reasonMatch ? reasonMatch[1]!.trim() : "",
                });
              }
            }
          }
        }
      } catch {
        // Not JSON, skip
      }
    }

    // Fallback: if no votes found from JSON format, try parsing plain-text
    // PROPOSAL/DECISION blocks directly (e.g. from opencode CLI fallback path)
    if (votes.length === 0 && /PROPOSAL:\s*\d+/i.test(jsonOutput)) {
      const blocks = jsonOutput.split(/PROPOSAL:\s*/).filter((b: string) => b.trim().length > 0);
      for (const block of blocks) {
        const numMatch = block.match(/^(\d+)/);
        if (!numMatch) continue;
        const numStr = numMatch[1];
        if (!numStr) continue;
        const proposalIdx = parseInt(numStr, 10) - 1;
        if (proposalIdx < 0 || proposalIdx >= proposals.length) continue;

        const agentMatch = block.match(/AGENT:\s*(\w[\w-]*)/i);
        const decisionMatch = block.match(/DECISION:\s*(\w+)/i);
        const confMatch = block.match(/CONFIDENCE:\s*(0?\.\d+|1\.0|1|0)/i);
        const reasonMatch = block.match(/REASONING:\s*(.+)/i);

        if (decisionMatch) {
          const proposal = proposals[proposalIdx];
          if (proposal) {
            let decision = decisionMatch[1]!.toLowerCase();
            if (decision === "yes") decision = "approve";
            if (decision === "no") decision = "reject";
            votes.push({
              proposalId: proposal.id,
              agentName: agentMatch?.[1] ?? "architect",
              decision,
              confidence: confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]!))) : 0.5,
              reasoning: reasonMatch ? reasonMatch[1]!.trim() : "",
            });
          }
        }
      }
    }

    return votes;
  }

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

  private extractTextFromNdjson(output: string): string {
    const texts: string[] = [];
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (obj.type === "text" && obj.part?.text) {
          texts.push(obj.part.text);
        }
      } catch {
        // skip non-JSON lines
      }
    }
    return texts.join("\n").trim();
  }

  private resolveOpencodeRoot(): string {
    let dir = this.projectRoot;
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(dir, ".opencode"))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, ".opencode"))) return cwd;
    return this.projectRoot;
  }

  private rejectNoQuorum(proposal: InferenceProposal, reason: string): InferenceCycleResult["votes"][0] {
    return {
      proposalId: proposal.id,
      decision: "reject",
      confidence: 0,
      details: [`rejected: ${reason}`],
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

  private buildBlockedResult(cycleId: string, reason: string): InferenceCycleResult {
    return {
      cycleId,
      triggered: false,
      triggerReason: reason,
      corpusSummary: { sessions: 0, totalCommits: 0, recurringPatterns: 0, recurringProblems: 0 },
      proposals: [],
      votes: [],
      phase: "idle",
      completedAt: new Date().toISOString(),
      duration: 0,
    };
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
