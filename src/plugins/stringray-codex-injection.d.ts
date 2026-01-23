/**
 * StringRay Plugin for oh-my-opencode
 *
 * Enterprise AI orchestration with systematic error prevention.
 * This plugin provides intelligent agent coordination and codex-based code quality enforcement.
 *
 * @version 1.1.2
 * @author StringRay Framework Team
 */
export declare function stringrayPlugin(input: any): {
    config: (input: {
        client?: string;
        directory?: string;
        worktree?: string;
    }) => void;
    "experimental.chat.system.transform": (messages: any[], context: any) => any[];
    "tool.execute.before": (tool: string, args: any) => void;
    "tool.execute.after": (tool: string, args: any, result: any) => void;
};
export default stringrayPlugin;
//# sourceMappingURL=stringray-codex-injection.d.ts.map