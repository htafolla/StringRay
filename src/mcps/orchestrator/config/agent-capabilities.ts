/**
 * Agent Capabilities Configuration
 * 
 * Centralized agent capability definitions for orchestration decisions
 */

import type { AgentCapability } from '../types.js';

const DEFAULT_AGENT_CAPABILITIES: Record<string, AgentCapability> = {
  enforcer: {
    capabilities: ['validation', 'security', 'compliance'],
    complexityThreshold: 25,
    concurrentTasks: 3,
  },
  architect: {
    capabilities: ['design', 'planning', 'system-thinking'],
    complexityThreshold: 50,
    concurrentTasks: 2,
  },
  'code-reviewer': {
    capabilities: ['analysis', 'quality', 'validation'],
    complexityThreshold: 30,
    concurrentTasks: 4,
  },
  orchestrator: {
    capabilities: ['coordination', 'management', 'optimization'],
    complexityThreshold: 95,
    concurrentTasks: 1,
  },
  'bug-triage-specialist': {
    capabilities: ['debugging', 'investigation', 'fixing'],
    complexityThreshold: 40,
    concurrentTasks: 2,
  },
  'security-auditor': {
    capabilities: ['security', 'vulnerability', 'audit'],
    complexityThreshold: 35,
    concurrentTasks: 2,
  },
  refactorer: {
    capabilities: ['optimization', 'maintenance', 'improvement'],
    complexityThreshold: 45,
    concurrentTasks: 1,
  },
  'testing-lead': {
    capabilities: ['testing', 'coverage', 'validation'],
    complexityThreshold: 38,
    concurrentTasks: 3,
  },
  'log-monitor': {
    capabilities: ['monitoring', 'analysis', 'alerting'],
    complexityThreshold: 20,
    concurrentTasks: 5,
  },
  researcher: {
    capabilities: ['research', 'analysis', 'investigation'],
    complexityThreshold: 30,
    concurrentTasks: 3,
  },
  techwriter: {
    capabilities: ['documentation', 'writing', 'technical'],
    complexityThreshold: 28,
    concurrentTasks: 3,
  },
};

/**
 * Agent Capabilities Manager
 * Manages agent capabilities for orchestration decisions
 */
export class AgentCapabilitiesManager {
  private capabilities: Map<string, AgentCapability> = new Map();

  constructor() {
    // Initialize with default capabilities
    Object.entries(DEFAULT_AGENT_CAPABILITIES).forEach(([agent, config]) => {
      this.capabilities.set(agent, config);
    });
  }

  /**
   * Get capabilities for a specific agent
   */
  getCapabilities(agentType: string): AgentCapability | undefined {
    return this.capabilities.get(agentType);
  }

  /**
   * Get all registered agent capabilities
   */
  getAllCapabilities(): Map<string, AgentCapability> {
    return new Map(this.capabilities);
  }

  /**
   * Register or update agent capabilities
   */
  setCapabilities(agentType: string, capability: AgentCapability): void {
    this.capabilities.set(agentType, capability);
  }

  /**
   * Select the best agent for a task based on complexity and capabilities
   */
  selectAgentForTask(requiredCapabilities: string[], complexity: number): string | null {
    let bestAgent: string | null = null;
    let bestScore = -1;

    for (const [agent, caps] of this.capabilities) {
      // Check if agent can handle the complexity
      if (complexity > caps.complexityThreshold) {
        continue;
      }

      // Calculate capability match score
      const matchCount = requiredCapabilities.filter(cap =>
        caps.capabilities.includes(cap)
      ).length;

      // Prefer agents with more concurrent tasks available
      const score = matchCount * 10 + caps.concurrentTasks;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * Get all available agents for a given complexity level
   */
  getAvailableAgents(complexity: number): string[] {
    const available: string[] = [];
    for (const [agent, caps] of this.capabilities) {
      if (complexity <= caps.complexityThreshold) {
        available.push(agent);
      }
    }
    return available;
  }
}

// Singleton instance
let capabilitiesManagerInstance: AgentCapabilitiesManager | null = null;

export function getAgentCapabilitiesManager(): AgentCapabilitiesManager {
  if (!capabilitiesManagerInstance) {
    capabilitiesManagerInstance = new AgentCapabilitiesManager();
  }
  return capabilitiesManagerInstance;
}
