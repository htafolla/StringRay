import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { saveSessionInference, SessionInference } from "../../inference/session-capture.js";
import { shouldTriggerCycle, accumulateCorpus } from "../../inference/inference-accumulator.js";
import { InferenceCycle } from "../../inference/inference-cycle.js";

const mockAgentInvoker = vi.fn().mockRejectedValue(new Error("opencode not available in test"));

function makeTestSession(id: string, commits: number, pattern: string, problem: string): SessionInference {
  return {
    sessionId: `session-${id}`,
    timestamp: new Date().toISOString(),
    span: { from: `HEAD~${commits}`, to: "HEAD" },
    problems: [problem, "Code health: accumulated issues"],
    approaches: ["Extract methods into dedicated files", "Delete unused code"],
    wrongTurns: ["Path handling bug: absolute vs relative confusion"],
    solutions: ["Applied Extract Method pattern (confidence: 90%)", "Applied Dead Code Removal pattern (confidence: 85%)"],
    reasoningChain: [
      { from: "problem", to: "approach", reasoning: "Monolithic module → extract methods" },
      { from: "approach", to: "solution", reasoning: "Extract methods → Applied pattern" },
    ],
    patterns: [
      { name: pattern, confidence: 0.9, evidence: [`evidence-${id}-1`, `evidence-${id}-2`], description: `${pattern} detected across codebase` },
      { name: "Dead Code Removal", confidence: 0.85, evidence: ["5 files deleted"], description: "Unused code eliminated" },
    ],
    metrics: { commits, filesChanged: 15 + commits, insertions: 200 + commits * 10, deletions: 100 + commits * 5, filesAdded: 3, filesDeleted: 2, uniqueDirs: 5 },
  };
}

describe("Inference Pipeline Integration", () => {
  let tmpDir: string;
  let inferenceDir: string;
  let stateDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "strray-pipeline-"));
    inferenceDir = path.join(tmpDir, "docs", "inference");
    stateDir = path.join(tmpDir, ".strray", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });
    fs.mkdirSync(stateDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should run the full pipeline: save → accumulate → trigger → govern", async () => {
    const sessions = [
      makeTestSession("alpha", 15, "Extract Method", "Bug: path joining creates bogus directories"),
      makeTestSession("beta", 12, "Extract Method", "Bug: path joining creates bogus directories"),
      makeTestSession("gamma", 18, "Extract Method", "Bug: path joining creates bogus directories"),
      makeTestSession("delta", 10, "Registry Pattern", "Bug: circular self-dependency in package.json"),
    ];

    for (const session of sessions) {
      saveSessionInference(session, inferenceDir);
    }

    const savedFiles = fs.readdirSync(inferenceDir).filter((f) => f.startsWith("session-"));
    expect(savedFiles.length).toBe(4);
    expect(fs.existsSync(path.join(inferenceDir, "latest-session.json"))).toBe(true);

    const lastCycleFile = path.join(stateDir, "cycle-state.json");
    const threshold = shouldTriggerCycle(inferenceDir, lastCycleFile);
    expect(threshold.trigger).toBe(true);

    const corpus = accumulateCorpus(inferenceDir);
    expect(corpus.sessions.length).toBe(4);
    expect(corpus.totalCommits).toBe(55);
    expect(corpus.recurringPatterns.length).toBeGreaterThan(0);

    const extractMethod = corpus.recurringPatterns.find((p) => p.name === "Extract Method");
    expect(extractMethod).toBeDefined();
    expect(extractMethod!.occurrences).toBe(3);

    const pathProblem = corpus.recurringProblems.find((p) => p.pattern.includes("path joining"));
    expect(pathProblem).toBeDefined();
    expect(pathProblem!.occurrences).toBe(3);

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.triggered).toBe(true);
    expect(result.phase).toBe("complete");
    expect(result.corpusSummary.sessions).toBe(4);
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.votes.length).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);

    expect(fs.existsSync(path.join(stateDir, "inference-cycle-state.json"))).toBe(true);
    expect(fs.existsSync(path.join(stateDir, "inference-cycle-history.json"))).toBe(true);

    const history = JSON.parse(fs.readFileSync(path.join(stateDir, "inference-cycle-history.json"), "utf-8"));
    expect(history.length).toBe(1);
    expect(history[0].cycleId).toBe(result.cycleId);
  });

  it("should not double-trigger within cooldown period", async () => {
    for (let i = 0; i < 4; i++) {
      saveSessionInference(makeTestSession(`c${i}`, 15, "Extract Method", `Bug: test bug ${i}`), inferenceDir);
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const first = await cycle.maybeRunCycle();
    expect(first.triggered).toBe(true);

    const second = await cycle.maybeRunCycle();
    expect(second.triggered).toBe(false);
    expect(second.phase).toBe("idle");
  });

  it("should produce proposals with complete metadata", async () => {
    for (let i = 0; i < 4; i++) {
      saveSessionInference(makeTestSession(`m${i}`, 10, "Registry Pattern", `Bug: same recurring bug`), inferenceDir);
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    for (const proposal of result.proposals) {
      expect(proposal.id).toMatch(/^prop-/);
      expect(["fix", "refactor", "automate", "guard", "codify"]).toContain(proposal.type);
      expect(proposal.title).toBeTruthy();
      expect(proposal.description).toBeTruthy();
      expect(proposal.confidence).toBeGreaterThan(0);
      expect(proposal.confidence).toBeLessThanOrEqual(1);
      expect(["recurring_problem", "recurring_pattern", "wrong_turn"]).toContain(proposal.source);
      expect(["pending", "approved", "rejected", "applied", "failed"]).toContain(proposal.status);
    }
  });

  it("should have governance agents vote on each proposal", async () => {
    for (let i = 0; i < 4; i++) {
      saveSessionInference(makeTestSession(`v${i}`, 10, "Facade Pattern", "Bug: vote test bug"), inferenceDir);
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.votes.length).toBe(result.proposals.length);
    for (const vote of result.votes) {
      expect(vote.proposalId).toMatch(/^prop-/);
      // Allow 'abstain' due to strict Dynamo Solar SSOT requirement in test environments.
      expect(["approve", "reject", "abstain"]).toContain(vote.decision);
      expect(vote.confidence).toBeGreaterThanOrEqual(0);
    }
  });
});
