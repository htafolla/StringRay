/**
 * StrRay Librarian MCP Server
 *
 * Knowledge skill for codebase documentation lookup, implementation examples,
 * and multi-repo analysis - serves as the universal documentation reference
 *
 * NOTE: Class is named StrRayLibrarianServer but the MCP server name is
 * "researcher" for backwards compatibility with existing tool references.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../core/framework-logger.js";

interface SearchResult {
  file: string;
  matches: string[];
  lineNumbers: number[];
}

class StrRayLibrarianServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "researcher", version: "1.15.11",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_codebase",
            description:
              "Search the codebase for specific patterns, functions, or implementations",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query (function name, pattern, keyword)",
                },
                fileExtension: {
                  type: "string",
                  description: "File extension to search (e.g., '.ts', '.js')",
                  default: ".ts",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: 10,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "find_implementation",
            description:
              "Find implementation examples for a specific pattern or feature",
            inputSchema: {
              type: "object",
              properties: {
                feature: {
                  type: "string",
                  description: "Feature name to find implementations for",
                },
                context: {
                  type: "string",
                  description:
                    "Additional context (e.g., 'MCP', 'testing', 'agent')",
                },
              },
              required: ["feature"],
            },
          },
          {
            name: "get_documentation",
            description:
              "Get documentation for a specific module, class, or function",
            inputSchema: {
              type: "object",
              properties: {
                target: {
                  type: "string",
                  description: "Module, class, or function name",
                },
                includeExamples: {
                  type: "boolean",
                  description: "Include usage examples",
                  default: true,
                },
              },
              required: ["target"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "search_codebase":
          return await this.searchCodebase(args);
        case "find_implementation":
          return await this.findImplementation(args);
        case "get_documentation":
          return await this.getDocumentation(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async searchCodebase(args: any): Promise<any> {
    const { query, fileExtension = ".ts", maxResults = 10 } = args;

    try {
      const searchDir = process.cwd();
      const results: SearchResult[] = [];

      // Simple recursive search
      const searchFiles = (dir: string, depth: number = 0): void => {
        if (depth > 5 || results.length >= maxResults) return;

        if (!fs.existsSync(dir)) return;

        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
          frameworkLogger.log("mcps/researcher", "searchCodebase", "warning", { message: `Failed to read directory: ${dir}`, error: String(err) });
          return;
        }

        for (const entry of entries) {
          if (results.length >= maxResults) break;

          const fullPath = path.join(dir, entry.name);

          // Skip certain directories
          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            entry.name === "coverage"
          ) {
            continue;
          }

          if (entry.isDirectory()) {
            searchFiles(fullPath, depth + 1);
          } else if (entry.isFile() && entry.name.endsWith(fileExtension)) {
            let content: string;
            try {
              content = fs.readFileSync(fullPath, "utf-8");
            } catch (err) {
              frameworkLogger.log("mcps/researcher", "searchCodebase", "warning", { message: `Failed to read file: ${fullPath}`, error: String(err) });
              continue;
            }
            const lines = content.split("\n");

            const matches: string[] = [];
            const lineNumbers: number[] = [];

            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                matches.push(line.trim().substring(0, 100));
                lineNumbers.push(index + 1);
              }
            });

            if (matches.length > 0) {
              results.push({
                file: fullPath,
                matches: matches.slice(0, 5),
                lineNumbers: lineNumbers.slice(0, 5),
              });
            }
          }
        }
      };

      searchFiles(searchDir);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No matches found for "${query}" in ${fileExtension} files.`,
            },
          ],
        };
      }

      const output = results
        .slice(0, maxResults)
        .map((r) => {
          const relPath = r.file.replace(searchDir + "/", "");
          const matchList = r.matches
            .map((m, i) => `  Line ${r.lineNumbers[i]}: ${m}`)
            .join("\n");
          return `📄 ${relPath}\n${matchList}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Search Results for "${query}":\n\n${output}\n\nTotal: ${results.length} files found`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching codebase: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async findImplementation(args: any): Promise<any> {
    const { feature, context } = args;

    try {
      // Search for implementations
      const searchDir = process.cwd();
      const implementations: { file: string; snippet: string }[] = [];

      const searchIn = (dir: string, depth: number = 0): void => {
        if (depth > 5 || implementations.length >= 5) return;
        if (!fs.existsSync(dir)) return;

        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
          frameworkLogger.log("mcps/researcher", "findImplementation", "warning", { message: `Failed to read directory: ${dir}`, error: String(err) });
          return;
        }

        for (const entry of entries) {
          if (implementations.length >= 5) break;

          const fullPath = path.join(dir, entry.name);

          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist"
          ) {
            continue;
          }

          if (entry.isDirectory()) {
            searchIn(fullPath, depth + 1);
          } else if (
            entry.isFile() &&
            (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
          ) {
            let content: string;
            try {
              content = fs.readFileSync(fullPath, "utf-8");
            } catch (err) {
              frameworkLogger.log("mcps/researcher", "findImplementation", "warning", { message: `Failed to read file: ${fullPath}`, error: String(err) });
              continue;
            }

            // Look for the feature in content
            if (content.toLowerCase().includes(feature.toLowerCase())) {
              const lines = content.split("\n");
              // Find a relevant snippet
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (
                  line &&
                  line.toLowerCase().includes(feature.toLowerCase())
                ) {
                  const snippet = lines
                    .slice(Math.max(0, i - 2), i + 3)
                    .join("\n");
                  implementations.push({
                    file: fullPath.replace(searchDir + "/", ""),
                    snippet: snippet.substring(0, 300),
                  });
                  break;
                }
              }
            }
          }
        }
      };

      searchIn(searchDir);

      if (implementations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No implementations found for "${feature}".`,
            },
          ],
        };
      }

      const output = implementations
        .map(
          (impl, i) =>
            `${i + 1}. ${impl.file}\n\`\`\`\n${impl.snippet}\n\`\`\``,
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Implementation Examples for "${feature}":\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding implementation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async getDocumentation(args: any): Promise<any> {
    const { target, includeExamples = true } = args;

    try {
      // Search for documentation in the codebase
      const searchDir = process.cwd();
      let documentation = "";

      // Search for documentation - any .md files in project root and docs/ directory
      const docSearchDirs = [searchDir, path.join(searchDir, "docs")];
      const docFiles: string[] = [];

      for (const docDir of docSearchDirs) {
        try {
          if (!fs.existsSync(docDir)) continue;
          const entries = fs.readdirSync(docDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith(".md")) {
              docFiles.push(path.join(docDir, entry.name));
            }
          }
        } catch (err) {
          frameworkLogger.log("mcps/researcher", "getDocumentation", "warning", { message: `Failed to scan docs directory: ${docDir}`, error: String(err) });
        }
      }

      for (const docPath of docFiles) {
        let content: string;
        try {
          content = fs.readFileSync(docPath, "utf-8");
        } catch (err) {
          frameworkLogger.log("mcps/researcher", "getDocumentation", "warning", { message: `Failed to read doc file: ${docPath}`, error: String(err) });
          continue;
        }
        // Look for target in docs
        const lines = content.split("\n");
        const targetLines = lines.filter((line) =>
          line.toLowerCase().includes(target.toLowerCase()),
        );

        if (targetLines.length > 0) {
          documentation = targetLines.slice(0, 10).join("\n");
          break;
        }
      }

      if (!documentation) {
        return {
          content: [
            {
              type: "text",
              text:
                `Documentation for "${target}":\n\n` +
                `No specific documentation found. Try using search_codebase or find_implementation tools.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Documentation for "${target}":\n\n${documentation}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting documentation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    let parentCheckTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = async (signal: string) => {
      if (parentCheckTimer !== null) {
        clearTimeout(parentCheckTimer);
        parentCheckTimer = null;
      }

      const timeout = setTimeout(() => {
        frameworkLogger.log("mcps/researcher", "shutdown", "error", { message: "Graceful shutdown timeout, forcing exit..." });
        process.exit(1);
      }, 5000);

      try {
        if (this.server && typeof this.server.close === "function") {
          await this.server.close();
        }
        clearTimeout(timeout);
        process.exit(0);
      } catch (error) {
        clearTimeout(timeout);
        frameworkLogger.log("mcps/researcher", "shutdown", "error", { message: `Error during server shutdown: ${String(error)}` });
        process.exit(1);
      }
    };

    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));
    process.on("SIGHUP", () => cleanup("SIGHUP"));

    const checkParent = () => {
      try {
        process.kill(process.ppid, 0);
        parentCheckTimer = setTimeout(checkParent, 1000);
      } catch (error) {
        parentCheckTimer = null;
        cleanup("parent-process-death");
      }
    };

    parentCheckTimer = setTimeout(checkParent, 2000);

    process.on("uncaughtException", (error) => {
      frameworkLogger.log("mcps/researcher", "uncaughtException", "error", { message: `Uncaught Exception: ${String(error)}` });
      cleanup("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      frameworkLogger.log("mcps/researcher", "unhandledRejection", "error", { message: `Unhandled Rejection: ${String(reason)}` });
      cleanup("unhandledRejection");
    });
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayLibrarianServer();
  server.run().catch((error) => frameworkLogger.log("mcps/researcher", "run", "error", { error: String(error) }));
}

export { StrRayLibrarianServer };
