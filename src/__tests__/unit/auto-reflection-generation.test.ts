import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Storytelling Trigger Processor — Two Cadences", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "strray-storytelling-test-"));
    const origCwd = process.cwd;
    process.cwd = () => tmpDir;
    fs.mkdirSync(path.join(tmpDir, "docs", "reflections", "deep"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, ".git"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should return disabled message when config disabled", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    const p = new StorytellingTriggerProcessor();
    (p as any).config = { enabled: false };

    const result = await p.run({ operation: "commit" } as any);

    expect((result as any).message).toBe("Storytelling triggers disabled");
    expect((result as any).triggers).toEqual([]);
  });

  it("should detect patterns from commit subjects", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    const p = new StorytellingTriggerProcessor();
    const patterns = (p as any).detectPatterns(
      [
        { message: "refactor: extract methods", fileNames: ["src/processors/foo.ts"], hash: "abc1234" },
        { message: "fix: null pointer crash", fileNames: ["src/bar.ts"], hash: "def5678" },
      ],
      {
        totalCommits: 2,
        totalFilesChanged: 2,
        totalInsertions: 100,
        totalDeletions: 50,
        filesAdded: ["src/__tests__/new.test.ts"],
        filesModified: ["src/processors/foo.ts"],
        filesDeleted: [],
        uniqueDirs: ["src/processors"],
        commitSubjects: ["refactor: extract methods", "fix: null pointer crash"],
      },
    );

    expect(patterns.some((pat: string) => pat.includes("Refactoring"))).toBe(true);
    expect(patterns.some((pat: string) => pat.includes("Bug fixes"))).toBe(true);
    expect(patterns.some((pat: string) => pat.includes("test coverage"))).toBe(true);
  });

  it("should extract decisions from commit messages", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    const p = new StorytellingTriggerProcessor();
    const decisions = (p as any).extractDecisions([
      { message: "extract 24 inline methods into standalone files (1836→823 lines)" },
      { message: "refactor: replace switch with Map registry" },
      { message: "fix: report formatter hardcoded metrics" },
    ]);

    expect(decisions.length).toBeGreaterThanOrEqual(3);
    expect(decisions.some((d: string) => d.includes("Extraction"))).toBe(true);
    expect(decisions.some((d: string) => d.includes("Structural change"))).toBe(true);
    expect(decisions.some((d: string) => d.includes("Fix"))).toBe(true);
  });

  it("should produce non-empty reflection content", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    const p = new StorytellingTriggerProcessor();
    const content = (p as any).synthesizeReflection({
      cadence: "release",
      commits: [
        {
          hash: "abc1234",
          message: "feat: add auto-discovery",
          author: "test",
          date: "2026-04-29",
          filesChanged: 5,
          insertions: 200,
          deletions: 50,
          fileNames: ["src/processors/implementations/disco.ts", "src/__tests__/disco.test.ts"],
        },
      ],
      diff: {
        totalCommits: 1,
        totalFilesChanged: 2,
        totalInsertions: 200,
        totalDeletions: 50,
        filesAdded: ["src/processors/implementations/disco.ts"],
        filesModified: [],
        filesDeleted: [],
        uniqueDirs: ["src/processors/implementations"],
        commitSubjects: ["feat: add auto-discovery"],
      },
      sinceRef: "v1.22.29",
      untilRef: "HEAD",
      version: "1.22.61",
    });

    expect(content).toContain("Release Reflection");
    expect(content).toContain("1.22.29");
    expect(content).toContain("feat: add auto-discovery");
    expect(content).toContain("src/processors/implementations/disco.ts");
    expect(content).toContain("Areas Touched");
    expect(content).toContain("Patterns Observed");
    expect(content).toContain("Key Decisions");
    expect(content).toContain("Inference Notes");
    expect(content).not.toContain("*(Fill in");
    expect(content).not.toContain("No strong inference signals");
  }, 60000);

  it("should suggest correct story types", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    expect(StorytellingTriggerProcessor.suggestStoryType({ isPublishing: true })).toBe("saga");
    expect(StorytellingTriggerProcessor.suggestStoryType({ fileCount: 20 })).toBe("journey");
    expect(StorytellingTriggerProcessor.suggestStoryType({ commitCount: 15 })).toBe("reflection");
    expect(StorytellingTriggerProcessor.suggestStoryType({})).toBe("reflection");
  });

  it("commit cadence reflection should not contain fill-in placeholders", async () => {
    const { StorytellingTriggerProcessor } = await import(
      "../../processors/implementations/storytelling-trigger-processor.js"
    );

    const p = new StorytellingTriggerProcessor();
    const content = (p as any).synthesizeReflection({
      cadence: "commit",
      commits: [
        {
          hash: "deadbeef",
          message: "fix: version compliance loop",
          author: "agent",
          date: "2026-04-29",
          filesChanged: 3,
          insertions: 100,
          deletions: 200,
          fileNames: ["scripts/node/release.js", "scripts/node/pre-publish-guard.js"],
        },
      ],
      diff: {
        totalCommits: 1,
        totalFilesChanged: 2,
        totalInsertions: 100,
        totalDeletions: 200,
        filesAdded: [],
        filesModified: ["scripts/node/release.js"],
        filesDeleted: [],
        uniqueDirs: ["scripts/node"],
        commitSubjects: ["fix: version compliance loop"],
      },
      sinceRef: "last-reflection-hash",
      untilRef: "HEAD",
    });

    expect(content).toContain("Commit Cadence Reflection");
    expect(content).toContain("fix: version compliance loop");
    expect(content).toContain("scripts/node/release.js");
    expect(content).not.toContain("*(Fill in");
  });
});
