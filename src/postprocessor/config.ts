/**
 * Post-Processor Configuration
 */

import { PostProcessorConfig } from './types.js';

export const defaultConfig: PostProcessorConfig = {
  triggers: {
    gitHooks: true,
    webhooks: true,
    api: false
  },

  monitoring: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 3600000 // 1 hour
  },

  autoFix: {
    enabled: true,
    confidenceThreshold: 0.8,
    maxAttempts: 3
  },

  maxAttempts: 3,
  retryDelay: 30000, // 30 seconds

  escalation: {
    manualInterventionThreshold: 2,
    rollbackThreshold: 3,
    emergencyThreshold: 5
  }
};

export function validateConfig(config: Partial<PostProcessorConfig>): PostProcessorConfig {
  const merged = { ...defaultConfig, ...config };

  // Validate ranges
  if (merged.autoFix.confidenceThreshold < 0 || merged.autoFix.confidenceThreshold > 1) {
    throw new Error('autoFix.confidenceThreshold must be between 0 and 1');
  }

  if (merged.monitoring.interval < 5000) {
    throw new Error('monitoring.interval must be at least 5000ms');
  }

  if (merged.maxAttempts < 1 || merged.maxAttempts > 10) {
    throw new Error('maxAttempts must be between 1 and 10');
  }

  return merged;
}