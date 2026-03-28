/**
 * Default Agent Configurations
 *
 * Centralized agent definitions for the StringRay delegation system.
 * This file externalizes all hardcoded agent configurations.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface DefaultAgentConfig {
  name: string;
  capabilities: string[];
  status: "active" | "inactive";
  expertise: string;
  capacity: number;
  performance: number;
  specialties: string[];
}

export const DEFAULT_AGENTS: DefaultAgentConfig[] = [
  {
    name: "enforcer",
    capabilities: ["code-quality", "validation"],
    status: "active",
    expertise: "code quality enforcement",
    capacity: 100,
    performance: 95,
    specialties: ["validation", "compliance"],
  },
  {
    name: "architect",
    capabilities: ["design", "planning"],
    status: "active",
    expertise: "system architecture",
    capacity: 90,
    performance: 85,
    specialties: ["design", "planning"],
  },
  {
    name: "orchestrator",
    capabilities: [
      "task-coordination",
      "multi-agent-management",
      "workflow-orchestration",
    ],
    status: "active",
    expertise: "orchestrating complex multi-agent workflows",
    capacity: 90,
    performance: 85,
    specialties: ["coordination", "delegation", "workflow"],
  },
  {
    name: "log-monitor",
    capabilities: ["log-analysis", "pattern-detection", "alerting"],
    status: "active",
    expertise: "log monitoring and analysis",
    capacity: 60,
    performance: 75,
    specialties: ["logs", "monitoring", "alerts"],
  },
  {
    name: "researcher",
    capabilities: [
      "code-search",
      "documentation-lookup",
      "implementation-search",
    ],
    status: "active",
    expertise: "codebase search and documentation",
    capacity: 80,
    performance: 85,
    specialties: ["search", "docs", "patterns"],
  },
  {
    name: "code-analyzer",
    capabilities: ["code-analysis", "pattern-detection", "metrics"],
    status: "active",
    expertise: "deep code analysis",
    capacity: 75,
    performance: 80,
    specialties: ["analysis", "metrics", "patterns"],
  },
  {
    name: "code-reviewer",
    capabilities: ["review", "quality"],
    status: "active",
    expertise: "code review",
    capacity: 80,
    performance: 80,
    specialties: ["review", "quality"],
  },
  {
    name: "security-auditor",
    capabilities: ["security", "audit"],
    status: "active",
    expertise: "security analysis",
    capacity: 70,
    performance: 75,
    specialties: ["security", "audit"],
  },
  {
    name: "testing-lead",
    capabilities: ["testing", "coverage"],
    status: "active",
    expertise: "test architecture",
    capacity: 85,
    performance: 80,
    specialties: ["testing", "coverage"],
  },
  {
    name: "refactorer",
    capabilities: ["refactoring", "optimization"],
    status: "active",
    expertise: "code refactoring",
    capacity: 75,
    performance: 85,
    specialties: ["refactoring", "optimization"],
  },
  {
    name: "bug-triage-specialist",
    capabilities: ["debugging", "analysis"],
    status: "active",
    expertise: "bug triage",
    capacity: 60,
    performance: 70,
    specialties: ["debugging", "analysis"],
  },
];

export function getDefaultAgents(): DefaultAgentConfig[] {
  return DEFAULT_AGENTS;
}

export function getDefaultAgentByName(name: string): DefaultAgentConfig | undefined {
  return DEFAULT_AGENTS.find(agent => agent.name === name);
}
