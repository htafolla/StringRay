import { describe, it, expect } from 'vitest';
import { AgentInvokerFactory } from '../AgentInvokerFactory';
import { OpenCodeAgentInvoker } from '../OpenCodeAgentInvoker';
import { MCPAgentInvoker } from '../MCPAgentInvoker';

describe('AgentInvokerFactory', () => {
  it('should return OpenCodeAgentInvoker by default when no orchestrator MCP is available', () => {
    // In most test environments the orchestrator won't be registered
    const invoker = AgentInvokerFactory.createForCurrentEnvironment();
    expect(invoker).toBeInstanceOf(OpenCodeAgentInvoker);
  });

  it('createForGrokCLI should return MCPAgentInvoker', () => {
    const invoker = AgentInvokerFactory.createForGrokCLI();
    expect(invoker).toBeInstanceOf(MCPAgentInvoker);
  });

  it('createForOpenCode should return OpenCodeAgentInvoker', () => {
    const invoker = AgentInvokerFactory.createForOpenCode();
    expect(invoker).toBeInstanceOf(OpenCodeAgentInvoker);
  });
});
