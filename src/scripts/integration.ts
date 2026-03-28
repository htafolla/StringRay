#!/usr/bin/env node
/**
 * StringRay Integration Script
 *
 * Main CLI bridge for external systems (like Jelly commercial modules) to call into StringRay.
 * Allows spawning OpenCode CLI with StringRay agents to execute real tasks.
 *
 * @version 1.1.0
 * @since 2026-02-14
 *
 * Usage:
 *   node dist/scripts/integration.js enforcer '{"taskDescription": "Check code quality"}'
 *   node dist/scripts/integration.js --version
 *   node dist/scripts/integration.js --help
 */

import { spawn } from "child_process";
import { resolveAgent } from "../mcps/agent-resolver.js";

export interface TaskContext {
  taskDescription: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AgentConfig {
  name: string;
  system?: string;
  tools?: {
    include?: string[];
    exclude?: string[];
  };
  [key: string]: unknown;
}

export interface IntegrationResult {
  success: boolean;
  agent: string;
  task?: string;
  result?: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Main entry point for the integration script
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle --version flag
  if (args.includes("--version")) {
    console.log("StringRay Integration v1.1.0");
    process.exit(0);
  }

  // Handle --help flag
  if (args.includes("--help")) {
    console.log(`
StringRay Integration - OpenCode Bridge

Usage:
  node integration.js <agent-name> <task-json>
  node integration.js --version
  node integration.js --help

Examples:
  node integration.js enforcer '{"taskDescription": "Check code quality"}'
  node integration.js architect '{"taskDescription": "Design API endpoints"}'

Flow:
  1. Loads agent configuration from StringRay
  2. Spawns OpenCode CLI with agent
  3. OpenCode loads StringRay MCP servers (tools/skills)
  4. Agent executes task using available tools
  5. Results returned as JSON
    `);
    process.exit(0);
  }

  // Validate arguments
  if (args.length < 2) {
    console.error("Error: Missing arguments");
    console.error("Usage: node integration.js <agent-name> <task-json>");
    process.exit(1);
  }

  const agentName = args[0] as string;
  let taskContext: TaskContext;

  // Parse task JSON
  try {
    taskContext = JSON.parse(args[1] as string) as TaskContext;
  } catch (error) {
    console.error("Error: Invalid JSON task context");
    process.exit(1);
  }

  // Execute the integration
  try {
    // Get agent configuration from StringRay registry
    const agent = await resolveAgent(agentName);

    console.log(`[StringRay] Spawning OpenCode with agent: ${agentName}`);
    console.log(
      `[StringRay] Task: ${taskContext.taskDescription || "No description"}`,
    );

    // Build the task prompt for OpenCode
    const taskPrompt = buildTaskPrompt(agent, taskContext);

    // Spawn OpenCode CLI
    const result = await spawnOpenCode(agentName, taskPrompt);

    // Output JSON result
    const output: IntegrationResult = {
      success: true,
      agent: agentName,
      task: taskContext.taskDescription,
      result,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    const errorOutput: IntegrationResult = {
      success: false,
      agent: agentName,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(errorOutput, null, 2));
    process.exit(1);
  }
}

/**
 * Build task prompt from agent configuration
 */
function buildTaskPrompt(agent: AgentConfig, taskContext: TaskContext): string {
  const availableTools =
    agent.tools?.include?.join(", ") || "read, grep, edit, bash commands";

  return `You are the ${agent.name} agent.

${agent.system || ""}

## Your Task
${taskContext.taskDescription}

## Context
${JSON.stringify(taskContext.context || {}, null, 2)}

## Available Tools
${availableTools}

Execute this task using the available tools. Be thorough and provide detailed results.`;
}

/**
 * Spawn OpenCode CLI process
 */
function spawnOpenCode(agentName: string, prompt: string): Promise<unknown> {
  let isFinished = false;

  return new Promise((resolve, reject) => {
    // Spawn opencode with stdin for prompt - more reliable
    const opencode = spawn(
      "opencode",
      ["run", "-", "--agent", agentName, "-m", "opencode/big-pickle"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "production",
          OPENCODE_MCP_CONFIG: "./node_modules/strray-ai/opencode.json",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    // Write prompt to stdin
    opencode.stdin?.write(prompt);
    opencode.stdin?.end();

    let stdout = "";
    let stderr = "";

    opencode.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    opencode.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Graceful cleanup function
    const cleanup = (force = false) => {
      if (isFinished) return;
      isFinished = true;

      if (force && opencode.pid !== undefined && !opencode.killed) {
        try {
          process.kill(opencode.pid, "SIGTERM");
          // Give it 2 seconds to terminate gracefully, then force kill
          setTimeout(() => {
            if (!opencode.killed && opencode.pid !== undefined) {
              try {
                process.kill(opencode.pid, "SIGKILL");
              } catch (e) {
                // Process already dead
              }
            }
          }, 2000);
        } catch (e) {
          // Process already dead
        }
      }
    };

    opencode.on("close", (code) => {
      cleanup(false);
      if (code !== 0) {
        reject(new Error(`OpenCode exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Try to parse JSON output
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        // Return raw output if not JSON
        resolve({ output: stdout, errors: stderr });
      }
    });

    opencode.on("error", (error: NodeJS.ErrnoException) => {
      cleanup(true);
      if (error.code === "ENOENT") {
        reject(
          new Error(
            "OpenCode CLI not found. Please install: npm install -g opencode-ai",
          ),
        );
      } else {
        reject(error);
      }
    });

    // Timeout after 5 minutes - graceful first, then force
    const timeout = setTimeout(() => {
      console.log("[StringRay] OpenCode timed out, terminating...");
      cleanup(true);
      reject(new Error("OpenCode execution timeout (5 minutes)"));
    }, 300000);

    // Clear timeout on successful close
    opencode.on("close", () => {
      clearTimeout(timeout);
    });
  });
}

// Execute main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
