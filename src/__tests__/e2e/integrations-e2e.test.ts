import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { execFile, spawn } from "child_process";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";

// These Hermes Bridge E2E tests require a full Hermes runtime + LLM access
// and can take a very long time. They should NOT run in standard PR CI.
// Run them locally with: RUN_HERMES_BRIDGE_TESTS=true npm test -- src/__tests__/e2e/integrations-e2e.test.ts
const RUN_HERMES_BRIDGE = process.env.RUN_HERMES_BRIDGE_TESTS === "true";

const PROJECT_ROOT = path.resolve(process.cwd());
const BRIDGE_PATH = path.join(PROJECT_ROOT, "dist", "integrations", "hermes-agent", "bridge.mjs");
const API_SERVER_PATH = path.join(PROJECT_ROOT, "dist", "integrations", "openclaw", "api-server.js");
const PLUGIN_PATH = path.join(PROJECT_ROOT, "dist", "plugin", "strray-codex-injection.js");

function bridgeExec(args: string[], input?: string, timeout = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", args, {
      cwd: PROJECT_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Bridge timeout after ${timeout}ms: ${stderr}`));
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout) {
        reject(new Error(`Bridge exited ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    if (input) {
      child.stdin?.write(input);
      child.stdin?.end();
    } else {
      child.stdin?.end();
    }
  });
}

function httpReq(
  method: string,
  port: number,
  urlPath: string,
  body?: unknown,
  timeout = 10000,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const opts: http.RequestOptions = {
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      method,
      headers: { "Content-Type": "application/json" },
      timeout,
    };

    const req = http.request(opts, (res) => {
      let buf = "";
      res.on("data", (chunk: Buffer) => { buf += chunk.toString(); });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 0, body: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode ?? 0, body: buf });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("HTTP timeout")); });
    if (data) req.write(data);
    req.end();
  });
}

const TEST_PROPOSALS = [
  { id: "e2e-1", title: "E2E test fix", description: "Test fix proposal", type: "fix", confidence: 0.8, evidence: ["e2e evidence"] },
  { id: "e2e-2", title: "E2E test codify", description: "Test codify proposal", type: "codify", confidence: 0.9, evidence: ["e2e evidence"] },
];

describe.skipIf(!RUN_HERMES_BRIDGE)("Hermes Bridge E2E", { timeout: 180000 }, () => {
  test("bridge health command via positional arg", async () => {
    const raw = await bridgeExec([BRIDGE_PATH, "health", "--cwd", PROJECT_ROOT]);
    const result = JSON.parse(raw);
    expect(result.status).toBe("ok");
    expect(result.framework).toBe("loaded");
    expect(result.components).toBeDefined();
  });

  test("bridge health command via stdin", async () => {
    const raw = await bridgeExec([BRIDGE_PATH, "--cwd", PROJECT_ROOT], '{"command":"health"}');
    const result = JSON.parse(raw);
    expect(result.status).toBe("ok");
  });

  test("bridge stats command", async () => {
    const raw = await bridgeExec([BRIDGE_PATH, "stats", "--cwd", PROJECT_ROOT]);
    const result = JSON.parse(raw);
    expect(result.frameworkReady).toBeDefined();
    expect(result.nodeVersion).toBeDefined();
  });

  test("bridge govern command via stdin", async () => {
    const input = JSON.stringify({ command: "govern", proposals: TEST_PROPOSALS });
    const raw = await bridgeExec([BRIDGE_PATH, "--cwd", PROJECT_ROOT], input, 120000);
    const result = JSON.parse(raw);
    expect(result.cycleId).toBeDefined();
    expect(result.approved).toBeTypeOf("number");
    expect(result.rejected).toBeTypeOf("number");
    expect(result.votes).toBeInstanceOf(Array);
    expect(result.proposals).toBeInstanceOf(Array);
    expect(result.proposals.length).toBe(2);
  }, 120000);

  test("bridge apply command via stdin", async () => {
    const input = JSON.stringify({ command: "apply", proposals: TEST_PROPOSALS });
    const raw = await bridgeExec([BRIDGE_PATH, "--cwd", PROJECT_ROOT], input, 120000);
    const result = JSON.parse(raw);
    expect(result.cycleId).toBeDefined();
    expect(result.approved).toBeTypeOf("number");
    expect(result.proposals).toBeInstanceOf(Array);
  }, 120000);

  test("bridge govern via positional + --json", async () => {
    const payload = JSON.stringify({ proposals: TEST_PROPOSALS });
    const raw = await bridgeExec([BRIDGE_PATH, "govern", "--cwd", PROJECT_ROOT, "--json", payload], undefined, 120000);
    const result = JSON.parse(raw);
    expect(result.cycleId).toBeDefined();
    expect(result.votes).toBeInstanceOf(Array);
  }, 120000);

  test("bridge unknown command returns error", async () => {
    const raw = await bridgeExec([BRIDGE_PATH, "--cwd", PROJECT_ROOT], '{"command":"nonexistent"}');
    const result = JSON.parse(raw);
    expect(result.error).toContain("Unknown command");
  });

  test("bridge pre-process command", async () => {
    const input = JSON.stringify({ tool: "write", args: { content: "const x = 1;", filePath: "test.ts" } });
    const raw = await bridgeExec([BRIDGE_PATH, "pre-process", "--cwd", PROJECT_ROOT], input, 15000);
    const result = JSON.parse(raw);
    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  test("bridge codex-check command", async () => {
    const input = JSON.stringify({ code: "console.log('hello')", operation: "write" });
    const raw = await bridgeExec([BRIDGE_PATH, "codex-check", "--cwd", PROJECT_ROOT], input, 15000);
    const result = JSON.parse(raw);
    expect(result).toBeDefined();
  });
});

describe("OpenClaw API Server E2E", { timeout: 30000 }, () => {
  let serverProcess: ReturnType<typeof spawn>;
  const PORT = 18432;
  let serverReady = false;

  beforeAll(async () => {
    serverProcess = spawn("node", ["-e", `
      const { StringRayAPIServer } = require("${API_SERVER_PATH}");
      const server = new StringRayAPIServer({ port: ${PORT}, host: "127.0.0.1" });
      server.start().then(() => {
        process.stdout.write("READY\\n");
      }).catch((e) => {
        process.stderr.write("FAIL: " + e.message + "\\n");
        process.exit(1);
      });
      process.on("SIGTERM", () => { server.stop().then(() => process.exit(0)); });
    `], { stdio: ["pipe", "pipe", "pipe"] });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Server startup timeout")), 8000);
      serverProcess.stdout?.on("data", (d: Buffer) => {
        if (d.toString().includes("READY")) {
          clearTimeout(timeout);
          serverReady = true;
          resolve();
        }
      });
      serverProcess.stderr?.on("data", (d: Buffer) => {
        if (d.toString().includes("FAIL")) {
          clearTimeout(timeout);
          reject(new Error(d.toString()));
        }
      });
      serverProcess.on("error", reject);
    });
  }, 10000);

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
    }
  });

  test("GET /health returns 200", async () => {
    const res = await httpReq("GET", PORT, "/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("version");
  });

  test("GET /stats returns 200", async () => {
    const res = await httpReq("GET", PORT, "/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("startedAt");
  });

  test("GET /api/agent/status returns 200", async () => {
    const res = await httpReq("GET", PORT, "/api/agent/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("healthy");
  });

  test("POST /api/govern with proposals", async () => {
    const res = await httpReq("POST", PORT, "/api/govern", { proposals: TEST_PROPOSALS });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.cycleId).toBeDefined();
    expect(body.votes).toBeInstanceOf(Array);
    expect(body.proposals).toBeInstanceOf(Array);
  });

  test("POST /api/apply with proposals", async () => {
    const res = await httpReq("POST", PORT, "/api/apply", { proposals: TEST_PROPOSALS });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.cycleId).toBeDefined();
    expect(body.proposals).toBeInstanceOf(Array);
  });

  test("POST /api/govern with empty proposals", async () => {
    const res = await httpReq("POST", PORT, "/api/govern", { proposals: [] });
    expect(res.status).toBe(200);
  });

  test("GET /nonexistent returns 404", async () => {
    const res = await httpReq("GET", PORT, "/nonexistent");
    expect(res.status).toBe(404);
  });

  test("POST /api/agent/invoke without invoker returns 200", async () => {
    const res = await httpReq("POST", PORT, "/api/agent/invoke", {
      agentName: "test-agent",
      prompt: "test",
    });
    expect(res.status).toBe(200);
  });
});

describe("Plugin E2E", { timeout: 15000 }, () => {
  test("plugin loads and exports expected hooks", async () => {
    const plugin = await import(PLUGIN_PATH);
    expect(typeof plugin.default).toBe("function");

    const result = await plugin.default({ directory: PROJECT_ROOT });
    expect(result).toHaveProperty("experimental.chat.system.transform");
    expect(result).toHaveProperty("tool.execute.before");
    expect(result).toHaveProperty("tool.execute.after");
    expect(result).toHaveProperty("chat.message");
    expect(result).toHaveProperty("config");
  });

  test("plugin system prompt transform hook produces output", async () => {
    const plugin = await import(PLUGIN_PATH);
    const result = await plugin.default({ directory: PROJECT_ROOT });
    const output: { system?: string[] } = { system: ["original"] };
    await result["experimental.chat.system.transform"]({}, output);
    expect(output.system).toBeDefined();
    expect(output.system!.length).toBeGreaterThan(0);
    expect(output.system![0]).toContain("0xRay");
  });

  test("plugin config hook runs without error", async () => {
    const plugin = await import(PLUGIN_PATH);
    const result = await plugin.default({ directory: PROJECT_ROOT });
    expect(typeof result.config).toBe("function");
  });

  test("plugin tool.execute.before hook handles read tool", async () => {
    const plugin = await import(PLUGIN_PATH);
    const result = await plugin.default({ directory: PROJECT_ROOT });

    const input = { tool: "read", args: { filePath: "package.json" } };
    const output = {};
    await result["tool.execute.before"](input, output);
  });

  test("plugin tool.execute.after hook handles tool result", async () => {
    const plugin = await import(PLUGIN_PATH);
    const result = await plugin.default({ directory: PROJECT_ROOT });

    const input = { tool: "read", args: { filePath: "package.json" }, result: { success: true } };
    const output = {};
    await result["tool.execute.after"](input, output);
  });

  test("plugin chat.message hook handles @agent mention", async () => {
    const plugin = await import(PLUGIN_PATH);
    const result = await plugin.default({ directory: PROJECT_ROOT });

    const input = { parts: [{ type: "text", text: "@architect design this API" }] };
    const output: { parts?: Array<{ type?: string; text?: string }> } = {};
    await result["chat.message"](input, output);
  });
});
