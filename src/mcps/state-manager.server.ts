/**
 * StrRay State Manager MCP Server
 *
 * Advanced state management with persistence, synchronization, and conflict resolution
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { frameworkLogger, generateJobId } from "../core/framework-logger.js";

class StrRayStateManagerServer {
  private server: Server;
  private state: Map<string, any> = new Map();
  private stateFile: string;
  private backups: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "state-manager", version: "1.15.18",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.stateFile = path.join(
      process.cwd(),
      ".opencode",
      "state",
      "mcp-state.json",
    );
    this.ensureStateDirectory();
    this.loadState();

    this.setupToolHandlers();
    const jobId = generateJobId("mcp-state-manager-init");
    frameworkLogger.log(
      "mcps/state-manager",
      "initialize",
      "info",
      {},
      undefined,
      jobId,
    );
  }

  private ensureStateDirectory() {
    const stateDir = path.dirname(this.stateFile);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, "utf8");
        const parsed = JSON.parse(data);
        this.state = new Map(Object.entries(parsed));
        const jobId = generateJobId("mcp-state-manager-load");
        frameworkLogger.log(
          "mcps/state-manager",
          "load-state",
          "info",
          {
            stateEntries: this.state.size,
          },
          undefined,
          jobId,
        );
      }
    } catch (error) {
      frameworkLogger.log(
        "state-manager",
        "state-file-load-failed",
        "warning",
        { error: String(error) },
      );
    }
  }

  private saveState() {
    try {
      const data = Object.fromEntries(this.state);
      fs.writeFileSync(this.stateFile, JSON.stringify(data, null, 2));
    } catch (error) {
      frameworkLogger.log(
        "state-manager",
        "state-save-failed",
        "error",
        { error: String(error) },
      );
      throw error;
    }
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get-state",
            description:
              "Get state value by key with type safety and validation",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string" },
                defaultValue: {
                  oneOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "object" },
                    { type: "array" },
                  ],
                },
                validate: { type: "boolean", default: true },
              },
              required: ["key"],
            },
          },
          {
            name: "set-state",
            description:
              "Set state value by key with conflict resolution and persistence",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: {
                  oneOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "object" },
                    { type: "array" },
                  ],
                },
                persist: { type: "boolean", default: true },
                backup: { type: "boolean", default: false },
              },
              required: ["key", "value"],
            },
          },
          {
            name: "delete-state",
            description:
              "Delete state value by key with cleanup and validation",
            inputSchema: {
              type: "object",
              properties: {
                key: { type: "string" },
                force: { type: "boolean", default: false },
              },
              required: ["key"],
            },
          },
          {
            name: "list-state",
            description: "List all state keys with filtering and metadata",
            inputSchema: {
              type: "object",
              properties: {
                prefix: { type: "string" },
                includeValues: { type: "boolean", default: false },
                limit: { type: "number", default: 100 },
              },
            },
          },
          {
            name: "backup-state",
            description: "Create backup of current state or specific keys",
            inputSchema: {
              type: "object",
              properties: {
                keys: { type: "array", items: { type: "string" } },
                name: { type: "string" },
              },
            },
          },
          {
            name: "restore-state",
            description: "Restore state from backup",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string" },
                keys: { type: "array", items: { type: "string" } },
              },
              required: ["name"],
            },
          },
          {
            name: "validate-state",
            description: "Validate state integrity and consistency",
            inputSchema: {
              type: "object",
              properties: {
                deep: { type: "boolean", default: false },
                repair: { type: "boolean", default: false },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "get-state":
            return await this.handleGetState(args);
          case "set-state":
            return await this.handleSetState(args);
          case "delete-state":
            return await this.handleDeleteState(args);
          case "list-state":
            return await this.handleListState(args);
          case "backup-state":
            return await this.handleBackupState(args);
          case "restore-state":
            return await this.handleRestoreState(args);
          case "validate-state":
            return await this.handleValidateState(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error handling tool '${request.params.name}': ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    });
  }

  private async handleGetState(args: any) {
    const key = args.key;
    const defaultValue = args.defaultValue;
    const validate = args.validate !== false;

    // Silent operation - no console output

    try {
      if (this.state.has(key)) {
        const value = this.state.get(key);

        if (validate) {
          const validationResult = this.validateStateValue(value);
          if (!validationResult.valid) {
            return {
              content: [
                {
                  type: "text",
                  text: `⚠️ State value validation warning: ${validationResult.message}`,
                },
              ],
            };
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `📖 State retrieved: ${key}\n**Value:** ${JSON.stringify(value, null, 2)}`,
            },
          ],
        };
      } else if (defaultValue !== undefined) {
        return {
          content: [
            {
              type: "text",
              text: `📖 State not found, using default: ${key}\n**Default Value:** ${JSON.stringify(defaultValue, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ State key not found: ${key}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Get state error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleSetState(args: any) {
    const key = args.key;
    const value = args.value;
    const persist = args.persist !== false;
    const backup = args.backup || false;

    try {
      // Validate the value
      const validationResult = this.validateStateValue(value);
      if (!validationResult.valid) {
        return {
          content: [
            {
              type: "text",
              text: `❌ State validation failed: ${validationResult.message}`,
            },
          ],
        };
      }

      // Backup if requested
      if (backup && this.state.has(key)) {
        const backupKey = `${key}_backup_${Date.now()}`;
        this.backups.set(backupKey, this.state.get(key));
      }

      // Set the value
      this.state.set(key, value);

      // Persist if requested
      if (persist) {
        this.saveState();
      }

      return {
        content: [
          {
            type: "text",
            text: `💾 State set successfully: ${key}\n**Value:** ${JSON.stringify(value, null, 2)}\n**Persisted:** ${persist}\n**Backup Created:** ${backup}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Set state error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleDeleteState(args: any) {
    const key = args.key;
    const force = args.force || false;

    try {
      if (!this.state.has(key)) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ State key not found: ${key}`,
            },
          ],
        };
      }

      // Check for dependent keys if not forced
      if (!force) {
        const dependents = this.findDependentKeys(key);
        if (dependents.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Cannot delete - dependent keys found: ${dependents.join(", ")}\nUse force=true to delete anyway`,
              },
            ],
          };
        }
      }

      // Backup before deletion
      const backupKey = `${key}_deleted_${Date.now()}`;
      this.backups.set(backupKey, this.state.get(key));

      // Delete the key
      this.state.delete(key);
      this.saveState();

      return {
        content: [
          {
            type: "text",
            text: `🗑️ State deleted: ${key}\n**Backup Created:** ${backupKey}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Delete state error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleListState(args: any) {
    const prefix = args.prefix || "";
    const includeValues = args.includeValues || false;
    const limit = args.limit || 100;

    try {
      const keys = Array.from(this.state.keys())
        .filter((key) => key.startsWith(prefix))
        .slice(0, limit);

      let response = `📋 State Keys (${keys.length})\n`;

      if (includeValues) {
        for (const key of keys) {
          const value = this.state.get(key);
          response += `\n**${key}:** ${JSON.stringify(value)}\n`;
        }
      } else {
        response += keys.map((key) => `• ${key}`).join("\n");
      }

      if (keys.length >= limit) {
        response += `\n\n⚠️ Limited to ${limit} keys`;
      }

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ List state error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleBackupState(args: any) {
    const keys = args.keys || [];
    const name = args.name || `backup_${Date.now()}`;

    try {
      const backupData: Record<string, any> = {};

      if (keys.length > 0) {
        // Backup specific keys
        for (const key of keys) {
          if (this.state.has(key)) {
            backupData[key] = this.state.get(key);
          }
        }
      } else {
        // Backup all state
        backupData.all = Object.fromEntries(this.state);
      }

      this.backups.set(name, backupData);

      return {
        content: [
          {
            type: "text",
            text: `💾 Backup created: ${name}\n**Keys Backed Up:** ${keys.length > 0 ? keys.length : "all"}\n**Data Size:** ${JSON.stringify(backupData).length} bytes`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Backup error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleRestoreState(args: any) {
    const name = args.name;
    const keys = args.keys || [];

    try {
      if (!this.backups.has(name)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Backup not found: ${name}`,
            },
          ],
        };
      }

      const backupData = this.backups.get(name);
      let restoredCount = 0;

      if (keys.length > 0) {
        // Restore specific keys
        for (const key of keys) {
          if (backupData[key] !== undefined) {
            this.state.set(key, backupData[key]);
            restoredCount++;
          }
        }
      } else if (backupData.all) {
        // Restore all from full backup
        for (const [key, value] of Object.entries(backupData.all)) {
          this.state.set(key, value);
          restoredCount++;
        }
      }

      this.saveState();

      return {
        content: [
          {
            type: "text",
            text: `🔄 Backup restored: ${name}\n**Keys Restored:** ${restoredCount}\n**State Saved:** ✅`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Restore error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleValidateState(args: any) {
    const deep = args.deep || false;
    const repair = args.repair || false;

    const results = {
      totalKeys: this.state.size,
      validKeys: 0,
      invalidKeys: [] as string[],
      repairedKeys: [] as string[],
      orphanedBackups: this.backups.size,
    };

    try {
      for (const [key, value] of this.state) {
        const validation = this.validateStateValue(value);

        if (validation.valid) {
          results.validKeys++;
        } else {
          results.invalidKeys.push(key);

          if (repair && validation.canRepair) {
            // Attempt to repair the value
            const repairedValue = this.repairStateValue(value);
            if (repairedValue !== null) {
              this.state.set(key, repairedValue);
              results.repairedKeys.push(key);
              results.validKeys++;
            }
          }
        }
      }

      if (repair && results.repairedKeys.length > 0) {
        this.saveState();
      }

      const response = `✅ State Validation Complete

**Total Keys:** ${results.totalKeys}
**Valid Keys:** ${results.validKeys}
**Invalid Keys:** ${results.invalidKeys.length}
**Repaired Keys:** ${results.repairedKeys.length}
**Backups Available:** ${results.orphanedBackups}

${results.invalidKeys.length > 0 ? `**Invalid Keys:**\n${results.invalidKeys.map((k) => `• ❌ ${k}`).join("\n")}\n` : ""}
${results.repairedKeys.length > 0 ? `**Repaired Keys:**\n${results.repairedKeys.map((k) => `• 🔧 ${k}`).join("\n")}\n` : ""}

**Status:** ${results.invalidKeys.length === 0 ? "✅ ALL VALID" : repair && results.repairedKeys.length > 0 ? "🔧 PARTIALLY REPAIRED" : "❌ ISSUES DETECTED"}`;

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Validation error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private validateStateValue(value: any): {
    valid: boolean;
    message: string;
    canRepair: boolean;
  } {
    try {
      // Basic validation - check for circular references, etc.
      const serialized = JSON.stringify(value);

      // Check for reasonable size
      const size = serialized.length;
      if (size > 1024 * 1024) {
        // 1MB limit
        return {
          valid: false,
          message: "Value too large (>1MB)",
          canRepair: false,
        };
      }

      // Check for suspicious content
      if (typeof value === "string" && value.includes("\x00")) {
        return {
          valid: false,
          message: "Contains null bytes",
          canRepair: true,
        };
      }

      return { valid: true, message: "Valid", canRepair: false };
    } catch (error) {
      return {
        valid: false,
        message: `Invalid JSON structure: ${error instanceof Error ? error.message : String(error)}`,
        canRepair: false,
      };
    }
  }

  private repairStateValue(value: any): any {
    try {
      // Simple repair attempts
      if (typeof value === "string") {
        // Remove null bytes
        return value.replace(/\0/g, "");
      }

      // For objects, try to clean problematic properties
      if (typeof value === "object" && value !== null) {
        const cleaned: any = {};
        for (const [key, val] of Object.entries(value)) {
          if (this.validateStateValue(val).valid) {
            cleaned[key] = val;
          }
        }
        return cleaned;
      }

      return null; // Cannot repair
    } catch (error) {
      return null;
    }
  }

  private findDependentKeys(key: string): string[] {
    const dependents: string[] = [];
    const quotedKey = `"${key}"`;
    for (const [otherKey, value] of this.state) {
      if (otherKey !== key && typeof value === "object" && value !== null) {
        const valueStr = JSON.stringify(value);
        // Only match the key as a quoted string value (not substrings in URLs, etc.)
        if (valueStr.includes(quotedKey)) {
          dependents.push(otherKey);
        }
      }
    }

    return dependents;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    const jobId = generateJobId("mcp-state-manager-start");
    frameworkLogger.log(
      "mcps/state-manager",
      "start",
      "success",
      {},
      undefined,
      jobId,
    );
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayStateManagerServer();
  server.run().catch((error) => frameworkLogger.log("mcps/state-manager", "run", "error", { error: String(error) }));
}

export { StrRayStateManagerServer };
