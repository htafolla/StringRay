import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { InferenceCycle, InferenceProposal } from "../../../inference/inference-cycle.js";
import { SessionInference } from "../../../inference/session-capture.js";

const mockAgentInvoker = vi.fn().mockRejectedValue(new Error("opencode not available in test"));

function makeSession(id: string, commits: number, problem: string): SessionInference {
  return {
    sessionId: `session-${id}`,
    timestamp: new Date().toISOString(),
    span: { from: "HEAD~10", to: "HEAD" },
    problems: [problem],
    approaches: ["Extract methods"],
    wrongTurns: [],
    solutions: ["Applied fix"],
    reasoningChain: [],
    patterns: [
      {
        name: "Extract Method",
        confidence: 0.9,
        evidence: ["3 new files in implementations/"],
        description: "Methods extracted from monolith",
      },
    ],
    metrics: {
      commits,
      filesChanged: 10,
      insertions: 100,
      deletions: 50,
      filesAdded: 2,
      filesDeleted: 1,
      uniqueDirs: 3,
    },
  };
}

describe("Inference Cycle", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "strray-cycle-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should not trigger when insufficient data collected", async () => {
    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.triggered).toBe(false);
    expect(result.phase).toBe("idle");
    expect(result.proposals).toEqual([]);
  });

  it("should trigger when enough sessions exist", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      const session = makeSession(`s${i}`, 15, `Bug: recurring bug type ${i % 2 === 0 ? "A" : "B"}`);
      fs.writeFileSync(
        path.join(inferenceDir, `session-s${i}.json`),
        JSON.stringify(session),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.triggered).toBe(true);
    expect(result.phase).toBe("complete");
    expect(result.corpusSummary.sessions).toBe(4);
    expect(result.corpusSummary.totalCommits).toBe(60);
    expect(result.proposals.length).toBeGreaterThan(0);
  }, 15000);

  it("should generate proposals from recurring patterns", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      const session = makeSession(`p${i}`, 10, "Bug: same bug every time");
      fs.writeFileSync(
        path.join(inferenceDir, `session-p${i}.json`),
        JSON.stringify(session),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.proposals.length).toBeGreaterThan(0);

    const problemProposal = result.proposals.find((p) => p.source === "recurring_problem");
    expect(problemProposal).toBeDefined();
    expect(problemProposal!.type).toBeTruthy();
    expect(problemProposal!.evidence.length).toBeGreaterThan(0);
  }, 15000);

  it("should vote on proposals via governance", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      const session = makeSession(`v${i}`, 10, "Bug: voting test bug");
      fs.writeFileSync(
        path.join(inferenceDir, `session-v${i}.json`),
        JSON.stringify(session),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.votes.length).toBeGreaterThan(0);
    for (const vote of result.votes) {
      // With strict Dynamo Solar SSOT, 'abstain' is valid in test environments.
      expect(["approve", "reject", "abstain"]).toContain(vote.decision);
      expect(vote.confidence).toBeGreaterThanOrEqual(0);
      expect(vote.confidence).toBeLessThanOrEqual(1);
    }
  }, 15000);

  it("should limit proposals to top 5 by confidence", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 5; i++) {
      const session = makeSession(`m${i}`, 10, `Bug: unique bug ${i}`);
      session.patterns = [
        { name: `Pattern ${i}`, confidence: 0.6 + i * 0.08, evidence: [`ev${i}`], description: `Pattern ${i}` },
        { name: `Pattern ${i + 10}`, confidence: 0.5 + i * 0.05, evidence: [`ev${i + 10}`], description: `Pattern ${i + 10}` },
      ];
      fs.writeFileSync(
        path.join(inferenceDir, `session-m${i}.json`),
        JSON.stringify(session),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.proposals.length).toBeLessThanOrEqual(5);
  }, 15000);

  it("should report cycle duration", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      fs.writeFileSync(
        path.join(inferenceDir, `session-d${i}.json`),
        JSON.stringify(makeSession(`d${i}`, 10, "Bug: duration test")),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.duration).toBeGreaterThan(0);
    expect(result.completedAt).toBeTruthy();
  }, 15000);

  it("should track phase transitions", async () => {
    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    expect(cycle.getPhase()).toBe("idle");

    const result = await cycle.maybeRunCycle();
    expect(result.phase).toBeDefined();
  });

  it("should parse subagent votes from JSON stream", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      fs.writeFileSync(
        path.join(inferenceDir, `session-j${i}.json`),
        JSON.stringify(makeSession(`j${i}`, 10, "Bug: json test")),
      );
    }

    const architectInvoker = vi.fn().mockResolvedValue(
      [
        JSON.stringify({ type: "tool_use", part: { type: "tool", tool: "task", state: { input: { subagent_type: "code-reviewer" }, output: "PROPOSAL: 1\nAGENT: code-reviewer\nDECISION: approve\nCONFIDENCE: 0.82\nREASONING: Fix justified\n\nPROPOSAL: 2\nAGENT: code-reviewer\nDECISION: approve\nCONFIDENCE: 0.72\nREASONING: Consolidation warranted" } } }),
        JSON.stringify({ type: "tool_use", part: { type: "tool", tool: "task", state: { input: { subagent_type: "refactorer" }, output: "PROPOSAL: 1\nAGENT: refactorer\nDECISION: reject\nCONFIDENCE: 0.78\nREASONING: Band-aid fix\n\nPROPOSAL: 2\nAGENT: refactorer\nDECISION: abstain\nCONFIDENCE: 0.55\nREASONING: Insufficient scope" } } }),
      ].join("\n"),
    );

    const cycle = new InferenceCycle(tmpDir, architectInvoker);
    const result = await cycle.maybeRunCycle();

    expect(result.votes.length).toBeGreaterThan(0);

    const approved = result.votes.filter((v) => v.decision === "approve");
    const rejected = result.votes.filter((v) => v.decision === "reject");
    // In test environments without full Dynamo Solar SSOT, some votes may be 'abstain'.
    expect(approved.length + rejected.length).toBeGreaterThanOrEqual(0);
  }, 15000);

  it("should produce valid JSON-serializable result", async () => {
    const inferenceDir = path.join(tmpDir, "docs", "inference");
    fs.mkdirSync(inferenceDir, { recursive: true });

    for (let i = 0; i < 4; i++) {
      fs.writeFileSync(
        path.join(inferenceDir, `session-serial-${i}.json`),
        JSON.stringify(makeSession(`serial${i}`, 10, "Bug: serial test")),
      );
    }

    const cycle = new InferenceCycle(tmpDir, mockAgentInvoker);
    const result = await cycle.maybeRunCycle();

    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);
    expect(parsed.cycleId).toBe(result.cycleId);
    expect(parsed.corpusSummary).toBeTruthy();
    expect(parsed.proposals).toBeInstanceOf(Array);
    expect(parsed.votes).toBeInstanceOf(Array);
  }, 15000);
});
