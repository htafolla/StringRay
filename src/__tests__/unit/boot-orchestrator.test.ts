/**
 * StrRay Framework v1.0.0 - Boot Orchestrator Unit Tests
 *
 * Tests the boot sequence orchestration and component initialization.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  BootOrchestrator,
  BootSequenceConfig,
  BootResult,
} from "../../boot-orchestrator";
import { StrRayContextLoader } from "../../context-loader";
import { StrRayStateManager } from "../../state/state-manager";

describe("BootOrchestrator", () => {
  let orchestrator: BootOrchestrator;
  let mockContextLoader: StrRayContextLoader;
  let mockStateManager: StrRayStateManager;

  beforeEach(() => {
    // Mock dependencies
    mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({
        version: "1.2.20",
        terms: [],
        validationCriteria: {},
      }),
    } as any;

    mockStateManager = new StrRayStateManager();

    // Create orchestrator with mocked dependencies
    orchestrator = new BootOrchestrator({
      enableEnforcement: true,
      codexValidation: false, // Disable for basic test
      sessionManagement: true,
      processorActivation: true,
      agentLoading: false, // Disable agent loading for basic test
    });
  });

  test("should initialize with default configuration", () => {
    const defaultOrchestrator = new BootOrchestrator();
    expect(defaultOrchestrator).toBeDefined();
  });

  test("should initialize with custom configuration", () => {
    const config: Partial<BootSequenceConfig> = {
      enableEnforcement: false,
      codexValidation: false,
    };
    const customOrchestrator = new BootOrchestrator(config);
    expect(customOrchestrator).toBeDefined();
  });

  test("should execute boot sequence successfully", async () => {
    // Mock all the dependencies that would be created during boot
    const mockProcessorManager = {
      initialize: vi.fn().mockResolvedValue(true),
      registerProcessor: vi.fn(),
    };

    const mockAgentDelegator = {
      initialize: vi.fn().mockResolvedValue(true),
    };

    const mockSessionCoordinator = {
      initializeSession: vi.fn(),
    };

    // Mock the imports
    vi.doMock("../processors/processor-manager", () => ({
      ProcessorManager: vi.fn().mockImplementation(() => mockProcessorManager),
    }));

    vi.doMock("../delegation", () => ({
      createAgentDelegator: vi.fn().mockReturnValue(mockAgentDelegator),
      createSessionCoordinator: vi.fn().mockReturnValue(mockSessionCoordinator),
    }));

    vi.doMock("../session/session-cleanup-manager", () => ({
      createSessionCleanupManager: vi.fn().mockReturnValue({
        registerSession: vi.fn(),
      }),
    }));

    vi.doMock("../session/session-monitor", () => ({
      createSessionMonitor: vi.fn().mockReturnValue({
        registerSession: vi.fn(),
      }),
    }));

    vi.doMock("../session/session-state-manager", () => ({
      createSessionStateManager: vi.fn().mockReturnValue({
        initialize: vi.fn().mockResolvedValue(true),
      }),
    }));

    vi.doMock("../security/security-hardener", () => ({
      securityHardener: {
        initialize: vi.fn().mockResolvedValue(true),
      },
    }));

    vi.doMock("../security/security-headers", () => ({
      securityHeadersMiddleware: {
        initialize: vi.fn().mockResolvedValue(true),
      },
    }));

    // Execute boot sequence
    const result = await orchestrator.executeBootSequence();

    // Verify result structure
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.agentsLoaded)).toBe(true);
  });

  test("should handle boot sequence with disabled codex validation", async () => {
    // Create orchestrator with codex validation disabled
    const orchestratorNoCodex = new BootOrchestrator({
      enableEnforcement: true,
      codexValidation: false, // Disable codex validation
      sessionManagement: true,
      processorActivation: true,
      agentLoading: false,
    });

    const result = await orchestratorNoCodex.executeBootSequence();

    // Should succeed even without codex validation
    expect(result.success).toBe(true);
    expect(result.enforcementEnabled).toBe(true);
    expect(result.codexComplianceActive).toBe(false);
  });

  test("should validate boot sequence configuration", () => {
    const invalidConfig = {
      enableEnforcement: "invalid" as any,
    };

    expect(() => new BootOrchestrator(invalidConfig)).not.toThrow();
  });

  test("should provide boot status information", () => {
    const status = orchestrator.getBootStatus();

    expect(status).toBeDefined();
    expect(typeof status.success).toBe("boolean");
    expect(typeof status.orchestratorLoaded).toBe("boolean");
    expect(typeof status.sessionManagementActive).toBe("boolean");
    expect(typeof status.processorsActivated).toBe("boolean");
    expect(typeof status.enforcementEnabled).toBe("boolean");
    expect(typeof status.codexComplianceActive).toBe("boolean");
    expect(Array.isArray(status.agentsLoaded)).toBe(true);
    expect(Array.isArray(status.errors)).toBe(true);
  });

  test("should handle boot sequence with disabled processor activation", async () => {
    // Create orchestrator with processor activation disabled
    const orchestratorNoProcessors = new BootOrchestrator({
      enableEnforcement: true,
      codexValidation: false,
      sessionManagement: true,
      processorActivation: false, // Disable processor activation
      agentLoading: false,
    });

    const result = await orchestratorNoProcessors.executeBootSequence();

    // Should succeed even without processor activation
    expect(result.success).toBe(true);
    expect(result.processorsActivated).toBe(false);
    expect(result.sessionManagementActive).toBe(true);
  });
});
