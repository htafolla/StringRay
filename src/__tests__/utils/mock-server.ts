import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock API responses for testing
export const handlers = [
  // Session API mocks
  rest.post('/api/sessions', (req, res, ctx) => {
    return res(ctx.json({
      id: 'session_123',
      status: 'active',
      createdAt: new Date().toISOString(),
    }));
  }),

  rest.get('/api/sessions/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json({
      id,
      status: 'completed',
      tasks: [],
      createdAt: new Date().toISOString(),
    }));
  }),

  // Orchestrator API mocks
  rest.post('/api/orchestrate', (req, res, ctx) => {
    return res(ctx.json({
      sessionId: 'session_123',
      status: 'processing',
      estimatedDuration: 1500,
    }));
  }),

  // Performance API mocks
  rest.get('/api/performance/metrics', (req, res, ctx) => {
    return res(ctx.json({
      responseTime: 245,
      memoryUsage: 85,
      cpuUsage: 0.32,
      throughput: 45,
      errorRate: 0.02,
    }));
  }),

  // Codex validation API mocks
  rest.post('/api/codex/validate', (req, res, ctx) => {
    return res(ctx.json({
      compliant: true,
      violations: [],
      score: 98.5,
    }));
  }),
];

export const server = setupServer(...handlers);

// Test utilities for MSW
export const testUtils = {
  startMSW: () => server.listen({ onUnhandledRequest: 'error' }),
  stopMSW: () => server.close(),
  resetMSW: () => server.resetHandlers(),
};