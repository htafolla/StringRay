import type { AgentInvoker } from './AgentInvoker';
import { OpenCodeAgentInvoker } from './OpenCodeAgentInvoker';
import { MCPAgentInvoker } from './MCPAgentInvoker';
import { mcpClientManager } from '../mcps/mcp-client.js';

export class AgentInvokerFactory {
  static createForCurrentEnvironment(): AgentInvoker {
    if (this.isOrchestratorMCPAvailable()) {
      return new MCPAgentInvoker();
    }
    return new OpenCodeAgentInvoker(
      (prompt: string) => {
        // This is a placeholder; real usage should come from InferenceCycle
        throw new Error('OpenCodeAgentInvoker needs proper invoke function in factory context');
      },
      () => []
    );
  }

  static createForGrokCLI(): AgentInvoker {
    return new MCPAgentInvoker();
  }

  static createForOpenCode(
    invokeArchitect: (prompt: string) => Promise<string>,
    parseVotes: (output: string, proposals: any[]) => any[]
  ): AgentInvoker {
    return new OpenCodeAgentInvoker(invokeArchitect, parseVotes);
  }

  private static isOrchestratorMCPAvailable(): boolean {
    try {
      return mcpClientManager.hasServer('orchestrator');
    } catch {
      return false;
    }
  }
}
