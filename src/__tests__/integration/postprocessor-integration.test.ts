/**
 * Integration tests for complete Post-Processor system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PostProcessor } from '../../postprocessor/PostProcessor';
import { StrRayStateManager } from '../../state/state-manager';
import { SessionMonitor } from '../../session/session-monitor';
import { PostProcessorContext } from '../../postprocessor/types';

describe('PostProcessor Integration', () => {
  let postProcessor: PostProcessor;
  let mockStateManager: StrRayStateManager;
  let mockSessionMonitor: SessionMonitor;

  beforeEach(() => {
    // Mock dependencies
    mockStateManager = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(undefined),
    } as any;
    mockSessionMonitor = {} as SessionMonitor;

    postProcessor = new PostProcessor(mockStateManager, mockSessionMonitor);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete CI/CD Loop Integration', () => {
    it('should handle successful first attempt', async () => {
      const context: PostProcessorContext = {
        commitSha: 'success-commit-123',
        repository: 'test/repo',
        branch: 'main',
        author: 'test-user',
        files: ['src/app.js'],
        trigger: 'git-hook'
      };

      // Mock successful monitoring
      const mockMonitorDeployment = vi.fn().mockResolvedValue({
        commitSha: 'success-commit-123',
        overallStatus: 'success',
        timestamp: new Date(),
        duration: 5000,
        ciStatus: { status: 'success', failedJobs: [], totalJobs: 5, duration: 3000 },
        performanceStatus: { status: 'passed', score: 95, regressions: [], duration: 1000 },
        securityStatus: { status: 'passed', vulnerabilities: 0, criticalVulnerabilities: 0, scanDuration: 1000 }
      });

      // Mock the monitoring engine
      postProcessor['monitoringEngine'] = {
        monitorDeployment: mockMonitorDeployment,
        initialize: vi.fn().mockResolvedValue(undefined)
      } as any;

      const result = await postProcessor.executePostProcessorLoop(context);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.commitSha).toBe('success-commit-123');
      expect(result.monitoringResults).toHaveLength(1);
      expect(mockMonitorDeployment).toHaveBeenCalledTimes(1);
    });

    it('should handle failure with auto-fix and redeploy', async () => {
      const context: PostProcessorContext = {
        commitSha: 'fixable-commit-456',
        repository: 'test/repo',
        branch: 'main',
        author: 'test-user',
        files: ['src/buggy.js'],
        trigger: 'git-hook'
      };

      // Mock failure then success
      const mockMonitorDeployment = vi.fn()
        .mockResolvedValueOnce({
          commitSha: 'fixable-commit-456',
          overallStatus: 'failure',
          timestamp: new Date(),
          duration: 5000,
          ciStatus: { status: 'failure', failedJobs: ['test-job'], totalJobs: 5, duration: 3000 },
          performanceStatus: { status: 'passed', score: 90, regressions: [], duration: 1000 },
          securityStatus: { status: 'passed', vulnerabilities: 1, criticalVulnerabilities: 0, scanDuration: 1000 },
          failedJobs: ['test-job']
        })
        .mockResolvedValueOnce({
          commitSha: 'fixable-commit-456',
          overallStatus: 'success',
          timestamp: new Date(),
          duration: 8000,
          ciStatus: { status: 'success', failedJobs: [], totalJobs: 5, duration: 5000 },
          performanceStatus: { status: 'passed', score: 92, regressions: [], duration: 1500 },
          securityStatus: { status: 'passed', vulnerabilities: 0, criticalVulnerabilities: 0, scanDuration: 1200 }
        });

      // Mock successful fix application
      const mockApplyFixes = vi.fn().mockResolvedValue({
        success: true,
        appliedFixes: [{ type: 'code-fix', files: ['src/buggy.js'], description: 'Fixed syntax error' }],
        requiresManualIntervention: false,
        confidence: 0.85,
        rollbackAvailable: true
      });

      // Mock successful fix validation
      const mockValidateFixes = vi.fn().mockResolvedValue(true);

      // Mock successful redeployment
      const mockExecuteRedeploy = vi.fn().mockResolvedValue({
        success: true,
        deploymentId: 'deploy-fixable-commit-456-123456',
        commitSha: 'fixable-commit-456',
        environment: 'production',
        duration: 3000
      });

      // Set up mocks
      postProcessor['monitoringEngine'] = {
        monitorDeployment: mockMonitorDeployment,
        initialize: vi.fn().mockResolvedValue(undefined)
      } as any;

      postProcessor['autoFixEngine'] = {
        applyFixes: mockApplyFixes
      } as any;

      postProcessor['fixValidator'] = {
        validateFixes: mockValidateFixes
      } as any;

      postProcessor['redeployCoordinator'] = {
        executeRedeploy: mockExecuteRedeploy
      } as any;

      const result = await postProcessor.executePostProcessorLoop(context);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(result.monitoringResults).toHaveLength(2);
      expect(mockApplyFixes).toHaveBeenCalledTimes(1);
      expect(mockValidateFixes).toHaveBeenCalledTimes(1);
      expect(mockExecuteRedeploy).toHaveBeenCalledTimes(1);
    });

    it('should escalate on persistent failures', async () => {
      const context: PostProcessorContext = {
        commitSha: 'persistent-failure-789',
        repository: 'test/repo',
        branch: 'main',
        author: 'test-user',
        files: ['src/critical.js'],
        trigger: 'git-hook'
      };

      // Mock persistent failures
      const mockMonitorDeployment = vi.fn().mockResolvedValue({
        commitSha: 'persistent-failure-789',
        overallStatus: 'failure',
        timestamp: new Date(),
        duration: 5000,
        ciStatus: { status: 'failure', failedJobs: ['critical-test'], totalJobs: 3, duration: 3000 },
        failedJobs: ['critical-test']
      });

      // Mock failed fix attempts
      const mockApplyFixes = vi.fn().mockResolvedValue({
        success: false,
        appliedFixes: [],
        requiresManualIntervention: true,
        confidence: 0.0,
        rollbackAvailable: false
      });

      // Set up mocks
      postProcessor['monitoringEngine'] = {
        monitorDeployment: mockMonitorDeployment,
        initialize: vi.fn().mockResolvedValue(undefined)
      } as any;

      postProcessor['autoFixEngine'] = {
        applyFixes: mockApplyFixes
      } as any;

      const result = await postProcessor.executePostProcessorLoop(context);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Max attempts
      expect(result.error).toBe('Max attempts exceeded');
      expect(mockMonitorDeployment).toHaveBeenCalledTimes(3);
    });
  });

  describe('Escalation Integration', () => {
    it('should trigger manual intervention escalation', async () => {
      const context: PostProcessorContext = {
        commitSha: 'manual-intervention-needed',
        repository: 'test/repo',
        branch: 'main',
        author: 'test-user',
        files: ['src/complex.js'],
        trigger: 'git-hook'
      };

      // Mock failures that trigger escalation
      const mockMonitorDeployment = vi.fn().mockResolvedValue({
        commitSha: 'manual-intervention-needed',
        overallStatus: 'failure',
        timestamp: new Date(),
        duration: 5000,
        failedJobs: ['integration-test']
      });

      // Mock failed fixes
      const mockApplyFixes = vi.fn().mockResolvedValue({
        success: false,
        appliedFixes: [],
        requiresManualIntervention: true,
        confidence: 0.0,
        rollbackAvailable: false
      });

      // Set up mocks
      postProcessor['monitoringEngine'] = {
        monitorDeployment: mockMonitorDeployment,
        initialize: vi.fn().mockResolvedValue(undefined)
      } as any;

      postProcessor['autoFixEngine'] = {
        applyFixes: mockApplyFixes
      } as any;

      const result = await postProcessor.executePostProcessorLoop(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Escalation triggered');
    });
  });

  describe('Success Handling Integration', () => {
    it('should execute success workflow on successful completion', async () => {
      const context: PostProcessorContext = {
        commitSha: 'successful-completion',
        repository: 'test/repo',
        branch: 'main',
        author: 'test-user',
        files: ['src/feature.js'],
        trigger: 'git-hook'
      };

      // Mock successful monitoring
      const mockMonitorDeployment = vi.fn().mockResolvedValue({
        commitSha: 'successful-completion',
        overallStatus: 'success',
        timestamp: new Date(),
        duration: 3000
      });

      // Mock success handler
      const mockHandleSuccess = vi.fn().mockResolvedValue({
        totalDuration: 3000,
        attempts: 1,
        fixesApplied: 0,
        monitoringChecks: 1,
        redeployments: 0,
        timestamp: new Date()
      });

      // Set up mocks
      postProcessor['monitoringEngine'] = {
        monitorDeployment: mockMonitorDeployment,
        initialize: vi.fn().mockResolvedValue(undefined)
      } as any;

      postProcessor['successHandler'] = {
        handleSuccess: mockHandleSuccess
      } as any;

      const result = await postProcessor.executePostProcessorLoop(context);

      expect(result.success).toBe(true);
      expect(mockHandleSuccess).toHaveBeenCalledTimes(1);
      expect(mockHandleSuccess).toHaveBeenCalledWith(
        context,
        result,
        expect.any(Array)
      );
    });
  });
});