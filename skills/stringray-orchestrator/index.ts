/**
 * StringRay Orchestrator Skill
 *
 * OpenClaw skill that provides StringRay orchestration commands.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

const API_BASE = process.env.STRINGRAY_API_URL || 'http://localhost:18431';
const API_KEY = process.env.STRINGRAY_API_KEY;

/**
 * Parse command arguments
 */
function parseArgs(input: string): { command: string; args: Record<string, unknown> } {
  const parts = input.trim().split(/\s+/);
  const command = parts[0] || '';
  const args: Record<string, unknown> = {};

  // Parse named arguments
  for (const part of parts.slice(1)) {
    if (part.startsWith('--')) {
      const key = part.slice(2);
      args[key] = true;
    } else if (part.includes(':')) {
      const [key, value] = part.split(':');
      args[key] = value;
    } else if (!args._) {
      args._ = [];
      (args._ as string[]).push(part);
    } else {
      (args._ as string[]).push(part);
    }
  }

  return { command, args };
}

/**
 * Call StringRay API
 */
async function callAPI(endpoint: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: data ? 'POST' : 'GET',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Main skill handler
 */
export async function handleSkill(input: string): Promise<string> {
  const { command, args } = parseArgs(input);

  try {
    switch (command.toLowerCase()) {
      case 'strray':
      case 'strray-status':
        return await handleStatus();

      case 'strray-analyze':
        return await handleAnalyze(args);

      case 'strray-code':
        return await handleCodeReview(args);

      case 'strray-file':
        return await handleFileRead(args);

      case 'strray-exec':
        return await handleExec(args);

      case 'strray-help':
        return handleHelp(args._ as string | undefined);

      default:
        return formatHelp();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `❌ Error: ${message}`;
  }
}

/**
 * Handle status command
 */
async function handleStatus(): Promise<string> {
  const health = await callAPI('/health') as { status: string; version: string; uptime: number };

  return `🤖 StringRay Status

• Status: ${health.status}
• Version: ${health.version}
• Uptime: ${formatUptime(health.uptime)}

Use /strray-help for available commands.`;
}

/**
 * Handle analyze command
 */
async function handleAnalyze(args: Record<string, unknown>): Promise<string> {
  const filePath = (args._ as string[])?.[0];

  if (!filePath) {
    return '❌ Usage: /strray-analyze <file-path>';
  }

  const result = await callAPI('/api/agent/invoke', {
    command: 'analyze',
    args: { filePath },
  }) as { success: boolean; result?: unknown; error?: string };

  if (!result.success) {
    return `❌ Analysis failed: ${result.error}`;
  }

  return `✅ Analysis complete for ${filePath}\n\n${JSON.stringify(result.result, null, 2)}`;
}

/**
 * Handle code review command
 */
async function handleCodeReview(args: Record<string, unknown>): Promise<string> {
  const filePath = (args._ as string[])?.[0];
  const fix = args.fix === true;

  if (!filePath) {
    return '❌ Usage: /strray-code <file-path> [--fix]';
  }

  const result = await callAPI('/api/agent/invoke', {
    command: 'code-review',
    args: { filePath, fix },
  }) as { success: boolean; result?: unknown; error?: string };

  if (!result.success) {
    return `❌ Code review failed: ${result.error}`;
  }

  return `✅ Code review complete for ${filePath}\n\n${JSON.stringify(result.result, null, 2)}`;
}

/**
 * Handle file read command
 */
async function handleFileRead(args: Record<string, unknown>): Promise<string> {
  const filePath = (args._ as string[])?.[0];
  const range = args._?.[1] as string | undefined;

  if (!filePath) {
    return '❌ Usage: /strray-file <file-path> [line-start:line-end]';
  }

  let lineRange: { start?: number; end?: number } | undefined;
  if (range?.includes(':')) {
    const [start, end] = range.split(':').map(Number);
    lineRange = { start, end };
  }

  const result = await callAPI('/api/agent/invoke', {
    command: 'read',
    args: { filePath, ...lineRange },
  }) as { success: boolean; result?: unknown; error?: string };

  if (!result.success) {
    return `❌ File read failed: ${result.error}`;
  }

  return `📄 ${filePath}\n\`\`\`\n${result.result}\n\`\`\``;
}

/**
 * Handle exec command
 */
async function handleExec(args: Record<string, unknown>): Promise<string> {
  const command = (args._ as string[])?.[0];

  if (!command) {
    return '❌ Usage: /strray-exec <command>';
  }

  const result = await callAPI('/api/agent/invoke', {
    command: 'exec',
    args: { command },
  }) as { success: boolean; result?: unknown; error?: string };

  if (!result.success) {
    return `❌ Execution failed: ${result.error}`;
  }

  return `✅ Command executed\n\n${JSON.stringify(result.result, null, 2)}`;
}

/**
 * Handle help command
 */
function handleHelp(command?: string): string {
  if (command) {
    switch (command) {
      case 'strray-analyze':
        return `📖 /strray-analyze <file-path>

Analyze code in a file.

Example: /strray-analyze src/index.ts`;

      case 'strray-code':
        return `📖 /strray-code <file-path> [--fix]

Perform code review on a file.
Use --fix to attempt automatic fixes.

Example: /strray-code src/utils/helper.ts
Example: /strray-code src/utils/helper.ts --fix`;

      case 'strray-file':
        return `📖 /strray-file <file-path> [line-start:line-end]

Read a file.
Optionally specify line range.

Example: /strray-file src/index.ts
Example: /strray-file src/index.ts 1:50`;

      case 'strray-exec':
        return `📖 /strray-exec <command>

Execute an arbitrary command.

Example: /strray-exec list files src/`;

      default:
        return `Unknown command: ${command}`;
    }
  }

  return formatHelp();
}

/**
 * Format help message
 */
function formatHelp(): string {
  return `🤖 StringRay Orchestrator

Available Commands:
• /strray - Show status
• /strray-analyze <file> - Analyze code
• /strray-code <file> [--fix] - Code review
• /strray-file <file> [lines] - Read file
• /strray-exec <command> - Execute command
• /strray-help [command] - Show help

Use /strray-help <command> for detailed usage.`;
}

/**
 * Format uptime
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// Export for OpenClaw
export default { handleSkill };
