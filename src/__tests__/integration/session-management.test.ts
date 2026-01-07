/**
 * StrRay Framework v1.0.0 - Session Management Integration Test
 *
 * Tests the complete session management system including cleanup,
 * monitoring, and cross-session coordination.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayStateManager } from '../../state/state-manager';
import { createSessionCoordinator } from '../../delegation/session-coordinator';
import { createSessionCleanupManager } from '../../session/session-cleanup-manager';
import { createSessionMonitor } from '../../session/session-monitor';
import { createSessionStateManager } from '../../session/session-state-manager';

describe('Session Management Integration', () => {
  let stateManager: StrRayStateManager;
  let sessionCoordinator: any;
  let cleanupManager: any;
  let sessionMonitor: any;
  let stateManagerInstance: any;

  beforeEach(() => {
    stateManager = new StrRayStateManager();
    sessionCoordinator = createSessionCoordinator(stateManager);
    cleanupManager = createSessionCleanupManager(stateManager);
    sessionMonitor = createSessionMonitor(stateManager, sessionCoordinator, cleanupManager);
    stateManagerInstance = createSessionStateManager(stateManager, sessionCoordinator);
  });

  afterEach(() => {
    cleanupManager?.shutdown();
    sessionMonitor?.shutdown();
    stateManagerInstance?.shutdown();
  });

  test('should initialize session management components', () => {
    expect(cleanupManager).toBeDefined();
    expect(sessionMonitor).toBeDefined();
    expect(stateManagerInstance).toBeDefined();
  });

  test('should register and cleanup sessions', async () => {
    const sessionId = 'test-session-1';

    // Register session
    cleanupManager.registerSession(sessionId);
    sessionMonitor.registerSession(sessionId);

    // Verify registration
    expect(cleanupManager.getSessionMetadata(sessionId)).toBeDefined();
    expect(sessionMonitor.getHealthStatus(sessionId)).toBeDefined();

    // Perform cleanup
    const cleanupResult = await cleanupManager.manualCleanup(sessionId);
    expect(cleanupResult).toBe(true);

    // Verify cleanup
    expect(cleanupManager.getSessionMetadata(sessionId)).toBeUndefined();
  });

  test('should perform health checks', async () => {
    const sessionId = 'test-session-2';
    const session = sessionCoordinator.initializeSession(sessionId);

    cleanupManager.registerSession(sessionId);
    sessionMonitor.registerSession(sessionId);

    const health = await sessionMonitor.performHealthCheck(sessionId);
    expect(health).toBeDefined();
    expect(health.sessionId).toBe(sessionId);
    expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(health.status);
  });

  test('should share state between sessions', () => {
    const sessionId1 = 'test-session-3';
    const sessionId2 = 'test-session-4';

    sessionCoordinator.initializeSession(sessionId1);
    sessionCoordinator.initializeSession(sessionId2);

    const success = stateManagerInstance.shareState(sessionId1, sessionId2, 'test-key', 'test-value');
    expect(success).toBe(true);
  });

  test('should manage session dependencies', () => {
    const sessionId1 = 'test-session-5';
    const sessionId2 = 'test-session-6';

    sessionCoordinator.initializeSession(sessionId1);
    sessionCoordinator.initializeSession(sessionId2);

    stateManagerInstance.registerDependency(sessionId2, [sessionId1]);

    const chain = stateManagerInstance.getDependencyChain(sessionId2);
    expect(chain.dependencies).toContain(sessionId1);
    expect(chain.canStart).toBe(false);

    stateManagerInstance.updateDependencyState(sessionId1, 'completed');

    const updatedChain = stateManagerInstance.getDependencyChain(sessionId2);
    expect(updatedChain.canStart).toBe(true);
  });

  test('should create and manage session groups', () => {
    const groupId = 'test-group';
    const sessionIds = ['test-session-7', 'test-session-8', 'test-session-9'];

    sessionIds.forEach(id => sessionCoordinator.initializeSession(id));

    const group = stateManagerInstance.createSessionGroup(groupId, sessionIds, sessionIds[0]);
    expect(group).toBeDefined();
    expect(group.groupId).toBe(groupId);
    expect(group.sessionIds).toEqual(sessionIds);

    stateManagerInstance.shareGroupState(groupId, 'group-key', 'group-value', sessionIds[0]);
    const value = stateManagerInstance.getGroupState(groupId, 'group-key');
    expect(value).toBe('group-value');
  });

  test('should provide monitoring statistics', () => {
    const stats = sessionMonitor.getMonitoringStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalSessions).toBe('number');
    expect(typeof stats.healthySessions).toBe('number');
    expect(typeof stats.activeAlerts).toBe('number');
  });

  test('should provide cleanup statistics', () => {
    const stats = cleanupManager.getCleanupStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalSessions).toBe('number');
    expect(typeof stats.activeSessions).toBe('number');
    expect(typeof stats.expiredSessions).toBe('number');
  });

  test('should provide coordination statistics', () => {
    const stats = stateManagerInstance.getCoordinationStats();
    expect(stats).toBeDefined();
    expect(typeof stats.totalDependencies).toBe('number');
    expect(typeof stats.totalGroups).toBe('number');
    expect(typeof stats.failoverConfigs).toBe('number');
  });
});