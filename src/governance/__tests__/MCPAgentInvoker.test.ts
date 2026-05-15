import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPAgentInvoker } from '../MCPAgentInvoker';

vi.mock('../../mcps/mcp-client.js', () => ({
  mcpClientManager: {
    callServerTool: vi.fn(),
    hasServer: vi.fn().mockReturnValue(true),
  }
}));

import { mcpClientManager } from '../../mcps/mcp-client.js';

describe('MCPAgentInvoker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return reviews from knowledge skills via MCP', async () => {
    (mcpClientManager.callServerTool as any).mockResolvedValue({
      decision: 'approve',
      confidence: 0.9,
      reasoning: 'Looks good from MCP skill'
    });

    const invoker = new MCPAgentInvoker();
    const reviews = await invoker.deliberate({
      id: 'p1',
      type: 'fix',
      title: 'Test fix',
      description: 'Fix something',
      evidence: ['bug in foo.ts'],
      confidence: 0.8,
      source: 'recurring_problem',
      status: 'pending'
    } as any);

    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.some(r => r.agent === 'code-reviewer' || r.agent === 'researcher')).toBe(true);
  });
});
