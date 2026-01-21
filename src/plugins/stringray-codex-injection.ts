/**
 * StringRay Plugin for oh-my-opencode
 *
 * Enterprise AI orchestration with systematic error prevention.
 * This plugin provides intelligent agent coordination and codex-based code quality enforcement.
 *
 * @version 1.0.0
 * @author StringRay Framework Team
 */

import { frameworkLogger } from "../framework-logger.js";

const pluginHooks = {
  config: (input: { client?: string; directory?: string; worktree?: string }) => {
    frameworkLogger.log("codex-injector", "plugin initialized", "info");
  },

  "experimental.chat.system.transform": (messages: any[], context: any) => {
    frameworkLogger.log("codex-injector", "chat.system.transform hook called", "info", { messageCount: messages?.length });

    // Inject codex context into system messages for agent guidance
    try {
      // Add welcome message and codex content to system messages
      const codexMessage = {
        role: "system",
        content: `## StringRay Framework Codex v1.2.25

Welcome to StringRay AI! This session includes systematic error prevention and production-ready development guidelines.

### Core Principles:
- **Progressive Prod-Ready Code**: All code must be production-ready from the first commit
- **No Patches/Boiler/Stubs**: Prohibit temporary patches and incomplete implementations
- **Surgical Fixes**: Apply precise, targeted fixes with root cause resolution
- **Type Safety First**: Leverage TypeScript's type system fully
- **Single Source of Truth**: Maintain authoritative sources for all information

### Development Guidelines:
- **YAGNI**: Don't implement features not currently needed
- **DRY**: Don't repeat yourself - extract reusable logic
- **Separation of Concerns**: Keep UI, business logic, and data layers distinct
- **Test Coverage >85%**: Maintain comprehensive behavioral test coverage
- **Performance Budget**: Bundle size <2MB (gzipped <700KB)

For complete codex documentation, see: .strray/codex.json`
      };

      // Modify context.system array to include codex message
      if (context && context.system && Array.isArray(context.system)) {
        context.system.unshift(codexMessage);
      }

      // Return the original messages (the hook modifies context in place)
      return messages;
    } catch (error) {
      console.error("❌ StringRay: Error injecting codex context:", error);
      // Return original messages if injection fails
      return messages;
    }
  },

  "tool.execute.before": (tool: string, args: any) => {
      frameworkLogger.log("codex-injector", "tool.execute.before hook called", "info", { tool });
  },

  "tool.execute.after": (tool: string, args: any, result: any) => {
      frameworkLogger.log("codex-injector", "tool.execute.after hook called", "success", { tool });
  },


};



// Export a function that returns the plugin hooks object
export function stringrayPlugin(input: any) {
    return pluginHooks;
}

// Default export for compatibility
export default stringrayPlugin;
