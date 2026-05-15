import { describe, it, expect, vi } from 'vitest';
import { OpenCodeAgentInvoker } from '../OpenCodeAgentInvoker';

describe('OpenCodeAgentInvoker', () => {
  it('should return reviews when the underlying opencode call succeeds', async () => {
    const mockInvoke = vi.fn().mockResolvedValue(JSON.stringify({
      type: 'tool_use',
      part: {
        type: 'tool',
        tool: 'task',
        state: {
          input: { subagent_type: 'code-reviewer' },
          output: 'PROPOSAL: 1\n  AGENT: code-reviewer\n  DECISION: approve\n  CONFIDENCE: 0.85\n  REASONING: Good change'
        }
      }
    }));

    const mockParse = vi.fn().mockReturnValue([{
      proposalId: 'p1',
      agentName: 'code-reviewer',
      decision: 'approve',
      confidence: 0.85,
      reasoning: 'Good change'
    }]);

    const invoker = new OpenCodeAgentInvoker(mockInvoke, mockParse);
    const reviews = await invoker.deliberate({
      id: 'p1',
      type: 'fix',
      title: 'Test',
      description: 'Test proposal',
      evidence: [],
      confidence: 0.8,
      source: 'recurring_problem',
      status: 'pending'
    } as any);

    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].agent).toBe('code-reviewer');
  });
});
