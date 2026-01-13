/**
 * Tests for SuccessHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuccessHandler } from '../../../postprocessor/success/SuccessHandler';
import { PostProcessorContext, PostProcessorResult } from '../../../postprocessor/types';

describe('SuccessHandler', () => {
  let handler: SuccessHandler;
  let mockContext: PostProcessorContext;
  let mockResult: PostProcessorResult;

  beforeEach(() => {
    handler = new SuccessHandler();
    mockContext = {
      commitSha: 'abc123',
      repository: 'test/repo',
      branch: 'main',
      author: 'test-user',
      files: ['test.js'],
      trigger: 'git-hook'
    };
    mockResult = {
      success: true,
      commitSha: 'abc123',
      sessionId: 'session-123',
      attempts: 1,
      monitoringResults: []
    };

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('handleSuccess', () => {
    it('should handle successful completion', async () => {
      const monitoringResults = [
        {
          commitSha: 'abc123',
          overallStatus: 'success',
          timestamp: new Date(),
          duration: 5000
        }
      ];

      const metrics = await handler.handleSuccess(mockContext, mockResult, monitoringResults);

      expect(metrics.totalDuration).toBeDefined();
      expect(metrics.attempts).toBe(1);
      expect(metrics.fixesApplied).toBe(0);
      expect(metrics.monitoringChecks).toBe(1);
      expect(metrics.redeployments).toBe(0);
    });

    it('should collect metrics with multiple attempts and fixes', async () => {
      const resultWithFixes = {
        ...mockResult,
        attempts: 3,
        fixesApplied: [{ type: 'dependency-update', files: ['package.json'] }]
      };

      const monitoringResults = [
        { commitSha: 'abc123', overallStatus: 'failure', timestamp: new Date(), duration: 3000 },
        { commitSha: 'abc123', overallStatus: 'failure', timestamp: new Date(), duration: 4000 },
        { commitSha: 'abc123', overallStatus: 'success', timestamp: new Date(), duration: 5000 }
      ];

      const metrics = await handler.handleSuccess(mockContext, resultWithFixes, monitoringResults);

      expect(metrics.attempts).toBe(3);
      expect(metrics.fixesApplied).toBe(1);
      expect(metrics.monitoringChecks).toBe(3);
      expect(metrics.redeployments).toBe(2); // attempts - 1
    });
  });

  describe('Success Confirmation', () => {
    it('should perform success confirmation when enabled', async () => {
      const customHandler = new SuccessHandler({ successConfirmation: true });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).toHaveBeenCalledWith('🔍 Confirming deployment success...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Deployment success confirmed');
    });

    it('should skip success confirmation when disabled', async () => {
      const customHandler = new SuccessHandler({ successConfirmation: false });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).not.toHaveBeenCalledWith('🔍 Confirming deployment success...');
    });
  });

  describe('Success Notifications', () => {
    it('should send notifications when enabled', async () => {
      const customHandler = new SuccessHandler({ notificationEnabled: true });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).toHaveBeenCalledWith('📢 Success Notification:', expect.any(String));
    });

    it('should skip notifications when disabled', async () => {
      const customHandler = new SuccessHandler({ notificationEnabled: false });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).not.toHaveBeenCalledWith('📢 Success Notification:', expect.any(String));
    });
  });

  describe('Cleanup Operations', () => {
    it('should perform cleanup when enabled', async () => {
      const customHandler = new SuccessHandler({ cleanupEnabled: true });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).toHaveBeenCalledWith('🧹 Performing post-success cleanup...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Cleanup completed');
    });

    it('should skip cleanup when disabled', async () => {
      const customHandler = new SuccessHandler({ cleanupEnabled: false });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).not.toHaveBeenCalledWith('🧹 Performing post-success cleanup...');
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and log metrics when enabled', async () => {
      const customHandler = new SuccessHandler({ metricsCollection: true });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).toHaveBeenCalledWith('📊 Success Metrics:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Duration:'));
    });

    it('should skip metrics collection when disabled', async () => {
      const customHandler = new SuccessHandler({ metricsCollection: false });
      const consoleSpy = vi.spyOn(console, 'log');

      await customHandler.handleSuccess(mockContext, mockResult, []);

      expect(consoleSpy).not.toHaveBeenCalledWith('📊 Success Metrics:');
    });
  });

  describe('Success Report Generation', () => {
    it('should generate comprehensive success report', async () => {
      const metrics = {
        totalDuration: 10000,
        attempts: 2,
        fixesApplied: 1,
        monitoringChecks: 3,
        redeployments: 1,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const report = handler.generateSuccessReport(mockContext, mockResult, metrics);

      expect(report).toContain('Post-Processor Success Report');
      expect(report).toContain('abc123');
      expect(report).toContain('test/repo');
      expect(report).toContain('2');
      expect(report).toContain('1');
      expect(report).toContain('3');
      expect(report).toContain('1');
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customHandler = new SuccessHandler({
        successConfirmation: false,
        cleanupEnabled: false,
        notificationEnabled: false,
        metricsCollection: false
      });

      const stats = customHandler.getStats();

      expect(stats.successConfirmation).toBe(false);
      expect(stats.cleanupEnabled).toBe(false);
      expect(stats.notificationEnabled).toBe(false);
      expect(stats.metricsCollection).toBe(false);
    });

    it('should use default configuration', () => {
      const stats = handler.getStats();

      expect(stats.successConfirmation).toBe(true);
      expect(stats.cleanupEnabled).toBe(true);
      expect(stats.notificationEnabled).toBe(true);
      expect(stats.metricsCollection).toBe(true);
    });
  });
});