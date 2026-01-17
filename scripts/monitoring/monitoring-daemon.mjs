#!/usr/bin/env node

// StrRay Framework - Continuous Monitoring Daemon
// Runs persistent background monitoring services

import { StrRayStateManager } from '../../dist/state/state-manager.js';
import { createSessionCoordinator } from '../../dist/delegation/session-coordinator.js';
import { createSessionCleanupManager } from '../../dist/session/session-cleanup-manager.js';
import { createSessionMonitor } from '../../dist/session/session-monitor.js';

async function startMonitoring() {
  try {
    console.log('🚀 Starting continuous monitoring daemon...');

    // Initialize components
    const stateManager = new StrRayStateManager();
    const sessionCoordinator = createSessionCoordinator(stateManager);
    const cleanupManager = createSessionCleanupManager(
      stateManager,
      { defaultTtlMs: 86400000, cleanupIntervalMs: 300000 },
      null
    );
    const sessionMonitor = createSessionMonitor(
      stateManager,
      sessionCoordinator,
      cleanupManager,
      {
        healthCheckIntervalMs: 30000,
        metricsCollectionIntervalMs: 60000,
        alertThresholds: {
          maxResponseTime: 5000,
          maxErrorRate: 0.1,
          maxMemoryUsage: 100000000,
          minCoordinationEfficiency: 0.8,
          maxConflicts: 5
        },
        enableAlerts: true,
        enableMetrics: true
      }
    );

    console.log('✅ Monitoring daemon components initialized');
    console.log('🎯 Continuous monitoring daemon running...');

    // Keep alive signal every 5 minutes
    setInterval(() => {
      console.log('📊 Monitoring daemon active -', new Date().toISOString());
    }, 300000);

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down monitoring daemon...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down monitoring daemon...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Monitoring daemon failed:', error);
    process.exit(1);
  }
}

startMonitoring();