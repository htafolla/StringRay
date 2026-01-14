/**
 * StringRay Framework Test Utilities
 * Standardized mocking and test setup utilities
 */

import { vi } from "vitest";

// Mock implementations for common dependencies
export const mockFs = {
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
};

export const mockPath = {
  dirname: vi.fn(),
  join: vi.fn(),
  resolve: vi.fn(),
  basename: vi.fn(),
};

export const mockFrameworkLogger = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Standardized mock setup for tests
export function setupStandardMocks() {
  // Reset all mocks
  vi.clearAllMocks();

  // Set up fs mocks
  vi.mock("fs", () => mockFs);
  vi.mock("path", () => mockPath);

  // Set up framework logger mock
  vi.mock("../framework-logger.js", () => ({
    frameworkLogger: mockFrameworkLogger,
  }));

  // Default mock behaviors
  mockFs.existsSync.mockReturnValue(false);
  mockFs.mkdirSync.mockImplementation(() => undefined);
  mockFs.readFileSync.mockReturnValue("{}");
  mockFs.writeFileSync.mockImplementation(() => undefined);
  mockFs.appendFileSync.mockImplementation(() => undefined);
  mockFs.statSync.mockReturnValue({ isDirectory: () => true });
  mockFs.readdirSync.mockReturnValue([]);

  mockPath.dirname.mockReturnValue("/test/dir");
  mockPath.join.mockImplementation((...args) => args.join("/"));
  mockPath.resolve.mockImplementation((...args) => args.join("/"));
  mockPath.basename.mockImplementation((path) => path.split("/").pop() || "");

  // Framework logger does nothing by default
  mockFrameworkLogger.log.mockImplementation(() => {});
  mockFrameworkLogger.error.mockImplementation(() => {});
  mockFrameworkLogger.warn.mockImplementation(() => {});
  mockFrameworkLogger.info.mockImplementation(() => {});
  mockFrameworkLogger.debug.mockImplementation(() => {});
}

// Utility to wait for debounced operations
export async function waitForDebounce(delay = 150) {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// Utility to create mock StateManager for testing
export function createMockStateManager() {
  const store = new Map<string, any>();

  return {
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: any) => {
      store.set(key, value);
      // Simulate debounced persistence
      setTimeout(() => {
        mockFs.writeFileSync.mockImplementation(() => {});
      }, 100);
    }),
    clear: vi.fn((key: string) => store.delete(key)),
    has: vi.fn((key: string) => store.has(key)),
    keys: vi.fn(() => Array.from(store.keys())),
    values: vi.fn(() => Array.from(store.values())),
    entries: vi.fn(() => Array.from(store.entries())),
    size: store.size,
    store, // For testing access
  };
}

// Utility to create mock session coordinator
export function createMockSessionCoordinator() {
  const sessions = new Map<string, any>();

  return {
    initializeSession: vi.fn((sessionId: string, agentCount = 3) => {
      sessions.set(sessionId, {
        sessionId,
        active: true,
        agentCount,
        createdAt: Date.now(),
      });
    }),
    getSessionStatus: vi.fn((sessionId: string) => sessions.get(sessionId)),
    cleanupSession: vi.fn((sessionId: string) => {
      const session = sessions.get(sessionId);
      if (session) {
        session.active = false;
        return true;
      }
      return false;
    }),
    getSharedContext: vi.fn(() => ({})),
    getCommunications: vi.fn(() => []),
    sessions, // For testing access
  };
}

// Utility to create mock cleanup manager
export function createMockCleanupManager(
  stateManager?: any,
  sessionCoordinator?: any,
) {
  const metadata = new Map<string, any>();

  return {
    registerSession: vi.fn((sessionId: string, ttlMs?: number) => {
      metadata.set(sessionId, {
        sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        ttlMs: ttlMs || 24 * 60 * 60 * 1000,
        isActive: true,
        agentCount: 3,
        memoryUsage: 0,
      });
    }),
    getSessionMetadata: vi.fn((sessionId: string) => metadata.get(sessionId)),
    updateActivity: vi.fn((sessionId: string) => {
      const meta = metadata.get(sessionId);
      if (meta) {
        meta.lastActivity = Date.now();
      }
    }),
    manualCleanup: vi.fn(async (sessionId: string) => {
      const meta = metadata.get(sessionId);
      if (meta) {
        meta.isActive = false;
        return true;
      }
      return false;
    }),
    shutdown: vi.fn(() => {}),
    metadata, // For testing access
  };
}

// Utility to create mock session monitor
export function createMockSessionMonitor(
  stateManager?: any,
  sessionCoordinator?: any,
  cleanupManager?: any,
) {
  const healthData = new Map<string, any>();
  const metricsData = new Map<string, any>();

  return {
    registerSession: vi.fn((sessionId: string) => {
      healthData.set(sessionId, {
        sessionId,
        status: "unknown",
        lastCheck: 0,
        responseTime: 0,
        errorCount: 0,
        activeAgents: 0,
        memoryUsage: 0,
        issues: [],
      });
      metricsData.set(sessionId, []);
    }),
    unregisterSession: vi.fn((sessionId: string) => {
      healthData.delete(sessionId);
      metricsData.delete(sessionId);
    }),
    performHealthCheck: vi.fn(async (sessionId: string) => {
      const health = healthData.get(sessionId);
      if (!health) {
        throw new Error(`Session ${sessionId} not registered for monitoring`);
      }
      health.status = "healthy";
      health.lastCheck = Date.now();
      health.responseTime = 1;
      return health;
    }),
    collectMetrics: vi.fn((sessionId: string) => {
      const metrics = {
        sessionId,
        totalInteractions: 50,
        successfulInteractions: 45,
        failedInteractions: 5,
        averageResponseTime: 100,
        conflictResolutionRate: 0.95,
        coordinationEfficiency: 0.9,
        memoryUsage: 1024 * 1024,
        agentCount: 3,
      };
      const history = metricsData.get(sessionId) || [];
      history.push(metrics);
      metricsData.set(sessionId, history);
      return metrics;
    }),
    getHealthStatus: vi.fn((sessionId: string) => healthData.get(sessionId)),
    getMetricsHistory: vi.fn((sessionId: string, limit = 50) => {
      const history = metricsData.get(sessionId) || [];
      return history.slice(-limit);
    }),
    shutdown: vi.fn(() => {}),
    healthData, // For testing access
    metricsData, // For testing access
  };
}

// Export everything for easy importing
export default {
  mockFs,
  mockPath,
  mockFrameworkLogger,
  setupStandardMocks,
  waitForDebounce,
  createMockStateManager,
  createMockSessionCoordinator,
  createMockCleanupManager,
  createMockSessionMonitor,
};
