/**
 * StrRay Codex Injection Plugin for OpenCode
 *
 * This plugin automatically injects the Universal Development Codex v1.1.1
 * into the system prompt for all AI agents, ensuring codex terms are
 * consistently enforced across the entire development session.
 *
 * @version 1.0.0
 * @author StrRay Framework
 */
/**
 * Main plugin function
 *
 * This plugin hooks into experimental.chat.system.transform event
 * to inject codex terms into system prompt before it's sent to LLM.
 */
export default function strrayCodexPlugin(input: {
    client?: string;
    directory?: string;
    worktree?: string;
}): Promise<{
    "experimental.chat.system.transform": (_input: Record<string, unknown>, output: {
        system?: string[];
    }) => Promise<void>;
    "tool.execute.before": (input: {
        tool: string;
        args?: {
            content?: string;
            filePath?: string;
        };
    }, _output: unknown) => Promise<void>;
    config: (_config: Record<string, unknown>) => Promise<void>;
}>;
//# sourceMappingURL=strray-codex-injection.d.ts.map