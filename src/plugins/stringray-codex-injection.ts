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
import { TokenManager } from "../utils/token-manager.js";

const tokenManager = new TokenManager();

const pluginHooks = {
  config: (input: { client?: string; directory?: string; worktree?: string }) => {
    frameworkLogger.log("codex-injector", "plugin initialized", "info");
  },

  "experimental.chat.system.transform": (messages: any[], context: any) => {
    frameworkLogger.log("codex-injector", "chat.system.transform hook called", "info", { messageCount: messages?.length });

    // Inject codex context into system messages for agent guidance
    try {
      const fullContent = `## StringRay Framework Codex v1.2.25

Welcome to StringRay AI! This session includes systematic error prevention and production-ready development guidelines.

### 🚀 Available Framework Capabilities

**Agent Commands (use @agent-name):**
- **@enforcer** - Codex compliance & error prevention
- **@architect** - System design & technical decisions
- **@orchestrator** - Multi-agent workflow coordination
- **@bug-triage-specialist** - Error investigation & surgical fixes
- **@code-reviewer** - Quality assessment & standards validation
- **@security-auditor** - Vulnerability detection & compliance
- **@refactorer** - Technical debt elimination & code consolidation
- **@test-architect** - Testing strategy & coverage optimization

**Skills System (23 lazy-loaded capabilities):**
- project-analysis, testing-strategy, code-review, security-audit, performance-optimization
- refactoring-strategies, ui-ux-design, documentation-generation, and more

**Framework Tools:**
- **framework-reporting-system** - Generate comprehensive activity reports
- **complexity-analyzer** - Analyze code complexity and delegation decisions
- **codex-injector** - Apply development standards automatically

**Help & Discovery:**
To discover all available capabilities, use the framework-help system:
- Get capabilities overview and command examples
- Access detailed explanations of any framework feature
- Available through MCP server: framework-help

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

For complete codex documentation, see: .strray/codex.json`;

      const limitCheck = tokenManager.checkLimits(fullContent);
      let finalContent = fullContent;

      if (!limitCheck.withinLimit) {
        frameworkLogger.log("codex-injector", "Codex content exceeds token limits, pruning context", "error", {
          currentTokens: limitCheck.currentTokens,
          maxTokens: limitCheck.maxTokens
        });
        finalContent = tokenManager.pruneContext(fullContent);
      } else if (limitCheck.warning) {
        frameworkLogger.log("codex-injector", "Codex content approaching token limits", "info", {
          currentTokens: limitCheck.currentTokens,
          maxTokens: limitCheck.maxTokens
        });
      }

      const codexMessage = {
        role: "system",
        content: finalContent
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
