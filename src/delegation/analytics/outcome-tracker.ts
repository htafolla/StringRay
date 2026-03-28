/**
 * Routing Outcome Tracker
 *
 * Tracks routing outcomes and provides statistics for performance analysis.
 * Extracted from task-skill-router.ts as part of Phase 2 refactoring.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import {
  RoutingOutcome,
  AgentStats,
  PromptDataPoint,
  RoutingDecision,
} from '../config/types.js';

/**
 * RoutingOutcomeTracker class
 *
 * Tracks routing outcomes with circular buffer pattern for memory efficiency.
 * Provides methods for recording outcomes, calculating statistics, and
 * retrieving data for analytics.
 * 
 * Persists outcomes to logs/framework/routing-outcomes.json for analytics to read.
 */
export class RoutingOutcomeTracker {
  private outcomes: RoutingOutcome[] = [];
  private readonly maxOutcomes: number;
  private readonly persistencePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DEBOUNCE_MS = 5000; // Save max once per 5 seconds

  /**
   * Create a new outcome tracker
   * @param maxOutcomes Maximum number of outcomes to retain (default: 1000)
   */
  constructor(maxOutcomes = 1000) {
    this.maxOutcomes = maxOutcomes;
    // Persist to logs/framework/routing-outcomes.json
    const cwd = process.cwd() || '.';
    this.persistencePath = `${cwd}/logs/framework/routing-outcomes.json`;
    this.initializeFile();
    // Note: Don't auto-load here - use reloadFromDisk() to load existing data
  }

  /**
   * Ensure the log directory and file exist on initialization
   */
  private async initializeFile(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Ensure directory exists
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create empty file if it doesn't exist
      if (!fs.existsSync(this.persistencePath)) {
        fs.writeFileSync(this.persistencePath, '[]');
      }
    } catch (error) {
      // Silent fail - don't break tracking
    }
  }

  /**
   * Load outcomes from disk on initialization
   */
  private loadFromDisk(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Load outcomes, keeping within max limit
          this.outcomes = parsed.slice(-this.maxOutcomes);
        }
      }
    } catch (error) {
      // Silent fail - don't break tracking if persistence fails
    }
  }

  /**
   * Save outcomes to disk (debounced)
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToDisk();
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Immediately save to disk (synchronous for reliability)
   */
  private saveToDisk(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save outcomes as JSON
      fs.writeFileSync(this.persistencePath, JSON.stringify(this.outcomes, null, 2));
    } catch (error) {
      // Silent fail - don't break tracking
    }
  }

  /**
   * Record a new routing outcome
   * @param outcome The outcome to record (timestamp will be added)
   */
  recordOutcome(outcome: Omit<RoutingOutcome, 'timestamp'>): void {
    if (!this.maxOutcomes) return;

    this.outcomes.push({ ...outcome, timestamp: new Date() });

    // Keep only recent outcomes (circular buffer)
    if (this.outcomes.length > this.maxOutcomes) {
      this.outcomes = this.outcomes.slice(-this.maxOutcomes);
    }
    
    // Persist to disk immediately (not debounced for better tracking during tests/CI)
    this.saveToDisk();
  }

  /**
   * Update an existing outcome by taskId
   * @param taskId The task ID to update
   * @param updates The fields to update
   * @returns true if updated, false if not found
   */
  updateOutcome(taskId: string, updates: Partial<RoutingOutcome>): boolean {
    const index = this.outcomes.findIndex(o => o.taskId === taskId);
    if (index === -1) return false;
    
    this.outcomes[index] = { ...this.outcomes[index], ...updates } as RoutingOutcome;
    this.saveToDisk();
    return true;
  }

  /**
   * Force reload from disk - call this before analytics to get latest data
   */
  async reloadFromDisk(): Promise<void> {
    await this.loadFromDisk();
  }

  /**
   * Get all outcomes, optionally filtered by agent
   * @param agent Optional agent name to filter by
   * @returns Array of routing outcomes
   */
  getOutcomes(agent?: string): RoutingOutcome[] {
    if (agent) {
      return this.outcomes.filter((o) => o.routedAgent === agent);
    }
    return [...this.outcomes];
  }

  /**
   * Calculate success rate for a specific agent
   * @param agent The agent name
   * @returns Success rate between 0 and 1
   */
  getSuccessRate(agent: string): number {
    const agentOutcomes = this.outcomes.filter(
      (o) => o.routedAgent === agent && o.success !== undefined
    );
    if (agentOutcomes.length === 0) return 0;

    const successes = agentOutcomes.filter((o) => o.success).length;
    return successes / agentOutcomes.length;
  }

  /**
   * Get statistics for all agents
   * @returns Array of agent statistics
   */
  getStats(): AgentStats[] {
    const stats = new Map<string, { total: number; successes: number }>();

    for (const outcome of this.outcomes) {
      if (outcome.success === undefined) continue;

      const current = stats.get(outcome.routedAgent) || { total: 0, successes: 0 };
      current.total++;
      if (outcome.success) current.successes++;
      stats.set(outcome.routedAgent, current);
    }

    return Array.from(stats.entries()).map(([agent, data]) => ({
      agent,
      total: data.total,
      attempts: data.total,
      successes: data.successes,
      successRate: data.total > 0 ? data.successes / data.total : 0,
    }));
  }

  /**
   * Clear all recorded outcomes
   */
  clear(): void {
    this.outcomes = [];
    // Also clear the file to ensure clean state
    try {
      const fs = require('fs');
      fs.writeFileSync(this.persistencePath, '[]');
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Get the count of recorded outcomes
   * @returns Number of outcomes
   */
  getCount(): number {
    return this.outcomes.length;
  }

  /**
   * Export outcomes to JSON string
   * @returns JSON string of all outcomes
   */
  toJSON(): string {
    return JSON.stringify(this.outcomes);
  }

  /**
   * Convert outcomes to prompt data points for pattern analysis
   * @returns Array of prompt data points
   */
  getPromptData(): PromptDataPoint[] {
    return this.outcomes.map((outcome) => ({
      taskId: outcome.taskId,
      prompt: outcome.taskDescription,
      timestamp: outcome.timestamp,
      complexity: 0, // Would need to be calculated from prompt
      keywords: [], // Would need to be extracted from prompt
      context: {},
      routingDecision: {
        taskId: outcome.taskId,
        agent: outcome.routedAgent,
        skill: outcome.routedSkill,
        confidence: outcome.confidence,
        reason: outcome.feedback || 'Historical routing',
        timestamp: outcome.timestamp,
      },
      outcome: {
        success: outcome.success ?? false,
        agent: outcome.routedAgent,
        skill: outcome.routedSkill,
        feedback: outcome.feedback || '',
      },
    }));
  }

  /**
   * Convert outcomes to routing decisions
   * @returns Array of routing decisions
   */
  getRoutingDecisions(): RoutingDecision[] {
    return this.outcomes.map((outcome) => ({
      taskId: outcome.taskId,
      agent: outcome.routedAgent,
      skill: outcome.routedSkill,
      confidence: outcome.confidence,
      reason: outcome.feedback || 'Historical routing',
      timestamp: outcome.timestamp,
    }));
  }

  /**
   * Apply routing refinements to existing outcomes
   * @param changes Array of changes to apply
   */
  applyRoutingRefinements(changes: Array<{ taskId: string; agent?: string; skill?: string; confidence?: number }>): void {
    for (const change of changes) {
      const outcome = this.outcomes.find((o) => o.taskId === change.taskId);
      if (outcome) {
        if (change.agent) outcome.routedAgent = change.agent;
        if (change.skill) outcome.routedSkill = change.skill;
        if (change.confidence) outcome.confidence = change.confidence;
      }
    }
  }
}

/**
 * Global routing outcome tracker instance
 */
export const routingOutcomeTracker = new RoutingOutcomeTracker();
