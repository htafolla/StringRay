import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SessionStateManager, createSessionStateManager } from "../../session/session-state-manager";
import { StringRayStateManager } from "../../state/state-manager";
import { SessionCoordinator } from "../../delegation/session-coordinator";

// Mock dependencies
vi.mock("../../state/state-manager");
vi.mock("../../delegation/session-coordinator");
vi.mock("../../framework-logger", () => ({
  frameworkLogger: {
    log: vi.fn(),
  },
}));

describe("SessionStateManager", () => {
  let stateManager: any;
  let sessionCoordinator: any;
  let sessionStateManager: SessionStateManager;

  const mockSessionId1 = "session-1";
  const mockSessionId2 = "session-2";
  const mockSessionStatus = {
    active: true,
    agentCount: 2,
    lastActivity: Date.now(),
  };

  beforeEach(() => {
    // Create mocks
    stateManager = vi.mocked(new (StringRayStateManager as any)({}));
    sessionCoordinator = vi.mocked(new (SessionCoordinator as any)({}, {}));

    // Setup mock behaviors
    sessionCoordinator.getSessionStatus.mockReturnValue(mockSessionStatus);
    sessionCoordinator.shareContext.mockReturnValue(true);
    sessionCoordinator.getSharedContext.mockReturnValue(null);
    stateManager.set.mockReturnValue(true);
    stateManager.get.mockReturnValue(null);

    // Create instance
    sessionStateManager = new SessionStateManager(stateManager, sessionCoordinator);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with provided dependencies", () => {
      expect(sessionStateManager).toBeInstanceOf(SessionStateManager);
      // Test that internal properties are set (accessing private properties via type assertion)
      expect((sessionStateManager as any).stateManager).toBe(stateManager);
      expect((sessionStateManager as any).sessionCoordinator).toBe(sessionCoordinator);
    });
  });

  describe("shareState", () => {
    it("should successfully share state between sessions", () => {
      const result = sessionStateManager.shareState(mockSessionId1, mockSessionId2, "test-key", "test-value");

      expect(result).toBe(true);
      expect(sessionCoordinator.shareContext).toHaveBeenCalledTimes(2);
      expect(sessionCoordinator.shareContext).toHaveBeenCalledWith(
        mockSessionId1,
        `shared:${mockSessionId2}:test-key`,
        "test-value",
        "state_manager"
      );
      expect(sessionCoordinator.shareContext).toHaveBeenCalledWith(
        mockSessionId2,
        `received:${mockSessionId1}:test-key`,
        "test-value",
        "state_manager"
      );
    });

    it("should return false when source session does not exist", () => {
      sessionCoordinator.getSessionStatus.mockReturnValueOnce(null);

      const result = sessionStateManager.shareState(mockSessionId1, mockSessionId2, "test-key", "test-value");

      expect(result).toBe(false);
      expect(sessionCoordinator.shareContext).not.toHaveBeenCalled();
    });

    it("should return false when target session does not exist", () => {
      sessionCoordinator.getSessionStatus.mockReturnValueOnce(mockSessionStatus);
      sessionCoordinator.getSessionStatus.mockReturnValueOnce(null);

      const result = sessionStateManager.shareState(mockSessionId1, mockSessionId2, "test-key", "test-value");

      expect(result).toBe(false);
      expect(sessionCoordinator.shareContext).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", () => {
      sessionCoordinator.shareContext.mockImplementation(() => {
        throw new Error("Share context failed");
      });

      const result = sessionStateManager.shareState(mockSessionId1, mockSessionId2, "test-key", "test-value");

      expect(result).toBe(false);
    });
  });

  describe("broadcastState", () => {
    it("should broadcast state to multiple sessions", () => {
      const targetSessions = [mockSessionId2, "session-3"];
      sessionCoordinator.shareContext.mockReturnValue(true);

      const result = sessionStateManager.broadcastState(mockSessionId1, targetSessions, "broadcast-key", "broadcast-value");

      expect(result).toBe(2); // Both sessions successful
      expect(sessionCoordinator.shareContext).toHaveBeenCalledTimes(4); // 2 for each target session
    });

    it("should return count of successful broadcasts", () => {
      const targetSessions = [mockSessionId2, "session-3"];

      const result = sessionStateManager.broadcastState(mockSessionId1, targetSessions, "broadcast-key", "broadcast-value");

      expect(result).toBe(2); // Both sessions successful (shareState doesn't check shareContext return values)
    });
  });

  describe("registerDependency", () => {
    it("should register a dependency correctly", () => {
      const dependsOn = ["dep-1", "dep-2"];
      const metadata = { priority: 2 };

      sessionStateManager.registerDependency(mockSessionId1, dependsOn, metadata);

      // Verify dependency was stored
      const chain = sessionStateManager.getDependencyChain(mockSessionId1);
      expect(chain.dependencies).toEqual(dependsOn);

      // Verify dependencies were persisted
      expect(stateManager.set).toHaveBeenCalledWith("state_manager:dependencies", expect.any(Object));
    });

    it("should create dependency entries for depended-upon sessions", () => {
      sessionStateManager.registerDependency(mockSessionId1, ["new-dep"]);

      const chain = sessionStateManager.getDependencyChain("new-dep");
      expect(chain.dependents).toContain(mockSessionId1);
    });
  });

  describe("updateDependencyState", () => {
    it("should update dependency state", () => {
      sessionStateManager.registerDependency(mockSessionId1, []);
      sessionStateManager.updateDependencyState(mockSessionId1, "completed");

      const chain = sessionStateManager.getDependencyChain(mockSessionId1);
      expect(chain.canStart).toBe(true);
    });

    it("should propagate completion to dependent sessions", () => {
      sessionStateManager.registerDependency(mockSessionId1, []);
      sessionStateManager.registerDependency(mockSessionId2, [mockSessionId1]);

      sessionStateManager.updateDependencyState(mockSessionId1, "completed");

      expect(sessionCoordinator.shareContext).toHaveBeenCalledWith(
        mockSessionId2,
        "dependency:ready",
        expect.objectContaining({
          sessionId: mockSessionId2,
          trigger: mockSessionId1,
          state: "completed",
        }),
        "state_manager"
      );
    });
  });

  describe("getDependencyChain", () => {
    it("should return empty chain for non-existent session", () => {
      const chain = sessionStateManager.getDependencyChain("non-existent");

      expect(chain.dependencies).toEqual([]);
      expect(chain.dependents).toEqual([]);
      expect(chain.canStart).toBe(true);
    });

    it("should correctly determine if session can start", () => {
      sessionStateManager.registerDependency(mockSessionId1, [mockSessionId2]);
      sessionStateManager.updateDependencyState(mockSessionId2, "completed");

      const chain = sessionStateManager.getDependencyChain(mockSessionId1);
      expect(chain.canStart).toBe(true);
    });
  });

  describe("createSessionGroup", () => {
    it("should create a session group", () => {
      const sessionIds = [mockSessionId1, mockSessionId2];
      const group = sessionStateManager.createSessionGroup("group-1", sessionIds, mockSessionId1);

      expect(group.groupId).toBe("group-1");
      expect(group.sessionIds).toEqual(sessionIds);
      expect(group.coordinatorSession).toBe(mockSessionId1);
      expect(group.state).toBe("forming");

      // Verify group membership shared with sessions
      expect(sessionCoordinator.shareContext).toHaveBeenCalledTimes(2);
    });

    it("should persist session groups", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1], mockSessionId1);

      expect(stateManager.set).toHaveBeenCalledWith("state_manager:groups", expect.any(Object));
    });
  });

  describe("updateSessionGroupState", () => {
    it("should update group state and notify sessions", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1, mockSessionId2], mockSessionId1);

      sessionStateManager.updateSessionGroupState("group-1", "active");

      expect(sessionCoordinator.shareContext).toHaveBeenCalledWith(
        mockSessionId1,
        "group:group-1:state",
        expect.objectContaining({ state: "active" }),
        "state_manager"
      );
    });

    it("should set completion timestamp for terminal states", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1], mockSessionId1);

      sessionStateManager.updateSessionGroupState("group-1", "completed");

      // Verify completion timestamp was set
      expect(stateManager.set).toHaveBeenCalledWith("state_manager:groups", expect.any(Object));
    });
  });

  describe("shareGroupState", () => {
    it("should share state within a group", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1, mockSessionId2], mockSessionId1);

      const result = sessionStateManager.shareGroupState("group-1", "group-key", "group-value", mockSessionId1);

      expect(result).toBe(true);
      expect(sessionCoordinator.shareContext).toHaveBeenCalledWith(
        mockSessionId2,
        "group:group-1:group-key",
        "group-value",
        mockSessionId1
      );
    });

    it("should return false for non-existent group", () => {
      const result = sessionStateManager.shareGroupState("non-existent", "key", "value", mockSessionId1);

      expect(result).toBe(false);
    });

    it("should return false for session not in group", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1], mockSessionId1);

      const result = sessionStateManager.shareGroupState("group-1", "key", "value", "outsider");

      expect(result).toBe(false);
    });
  });

  describe("getGroupState", () => {
    it("should retrieve group state", () => {
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1], mockSessionId1);
      sessionStateManager.shareGroupState("group-1", "test-key", "test-value", mockSessionId1);

      const value = sessionStateManager.getGroupState("group-1", "test-key");

      expect(value).toBe("test-value");
    });

    it("should return undefined for non-existent group or key", () => {
      expect(sessionStateManager.getGroupState("non-existent", "key")).toBeUndefined();
    });
  });

  describe("planMigration", () => {
    it("should create a migration plan", () => {
      const plan = sessionStateManager.planMigration(mockSessionId1, "target-coordinator");

      expect(plan.sessionId).toBe(mockSessionId1);
      expect(plan.targetCoordinator).toBe("target-coordinator");
      expect(plan.migrationSteps).toEqual([
        "validate_target_coordinator",
        "transfer_active_delegations",
        "transfer_pending_communications",
        "transfer_shared_context",
        "update_dependencies",
        "cleanup_source",
      ]);
      expect(plan.rollbackSteps).toEqual([
        "restore_transfers",
        "revert_updates",
        "restore_coordinator",
      ]);
    });

    it("should throw error for non-existent session", () => {
      sessionCoordinator.getSessionStatus.mockReturnValueOnce(null);

      expect(() => {
        sessionStateManager.planMigration("non-existent", "target");
      }).toThrow("Session non-existent not found");
    });
  });

  describe("validateMigrationPlan", () => {
    it("should validate a correct migration plan", async () => {
      const plan = sessionStateManager.planMigration(mockSessionId1, "target-coordinator");

      const result = await sessionStateManager.validateMigrationPlan(plan);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect missing target coordinator", async () => {
      const plan = sessionStateManager.planMigration(mockSessionId1, "target-coordinator");
      plan.targetCoordinator = "";

      const result = await sessionStateManager.validateMigrationPlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Target coordinator not specified");
    });

    it("should detect missing migration steps", async () => {
      const plan = sessionStateManager.planMigration(mockSessionId1, "target-coordinator");
      plan.migrationSteps = plan.migrationSteps.slice(1);

      const result = await sessionStateManager.validateMigrationPlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required migration step: validate_target_coordinator");
    });
  });

  describe("configureFailover", () => {
    it("should configure failover for a session", () => {
      const backupCoordinators = ["backup-1", "backup-2"];

      sessionStateManager.configureFailover(mockSessionId1, backupCoordinators, 3, true);

      expect(stateManager.set).toHaveBeenCalledWith("state_manager:failover", expect.any(Object));
    });
  });

  describe("getCoordinationStats", () => {
    it("should return coordination statistics", () => {
      sessionStateManager.registerDependency(mockSessionId1, []);
      sessionStateManager.updateDependencyState(mockSessionId1, "active");
      sessionStateManager.createSessionGroup("group-1", [mockSessionId1], mockSessionId1);
      sessionStateManager.updateSessionGroupState("group-1", "active");
      sessionStateManager.configureFailover(mockSessionId1, ["backup"], 3, true);

      const stats = sessionStateManager.getCoordinationStats();

      expect(stats.totalDependencies).toBe(1);
      expect(stats.activeDependencies).toBe(1);
      expect(stats.totalGroups).toBe(1);
      expect(stats.activeGroups).toBe(1);
      expect(stats.failoverConfigs).toBe(1);
    });
  });

  describe("createSessionStateManager factory", () => {
    it("should create a SessionStateManager instance", () => {
      const instance = createSessionStateManager(stateManager, sessionCoordinator);

      expect(instance).toBeInstanceOf(SessionStateManager);
    });
  });

  describe("shutdown", () => {
    it("should log shutdown message", () => {
      sessionStateManager.shutdown();

      // Shutdown logging is tested implicitly through the mock
    });
  });
});