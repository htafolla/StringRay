import { Factory } from "fishery";
import { faker } from "@faker-js/faker";

// Session Factory
export const sessionFactory = Factory.define(({ sequence }) => ({
  id: `session_${sequence}`,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  status: faker.helpers.arrayElement(["active", "completed", "failed"]),
  agent: faker.helpers.arrayElement([
    "enforcer",
    "architect",
    "orchestrator",
    "test-architect",
  ]),
  complexity: faker.helpers.arrayElement(["low", "medium", "high"]),
  priority: faker.helpers.arrayElement(["low", "normal", "high", "critical"]),
  tasks: faker.helpers.arrayElements(
    ["analyze", "validate", "orchestrate", "delegate"],
    { min: 1, max: 3 },
  ),
}));

// Task Factory
export const taskFactory = Factory.define(({ sequence }) => ({
  id: `task_${sequence}`,
  sessionId: `session_${faker.number.int({ min: 1, max: 100 })}`,
  type: faker.helpers.arrayElement([
    "analysis",
    "validation",
    "orchestration",
    "delegation",
  ]),
  status: faker.helpers.arrayElement([
    "pending",
    "running",
    "completed",
    "failed",
  ]),
  priority: faker.helpers.arrayElement(["low", "normal", "high"]),
  createdAt: faker.date.recent(),
  startedAt: faker.date.recent(),
  completedAt: faker.date.recent(),
  duration: faker.number.int({ min: 100, max: 5000 }),
  result: {
    success: faker.datatype.boolean(),
    data: faker.lorem.sentences(2),
    errors: faker.helpers.arrayElements([faker.lorem.sentence()], {
      min: 0,
      max: 2,
    }),
  },
}));

// Codex Term Factory
export const codexTermFactory = Factory.define(({ sequence }) => ({
  number: sequence,
  title: faker.lorem.words(3),
  description: faker.lorem.sentences(2),
  category: faker.helpers.arrayElement([
    "core",
    "extended",
    "architecture",
    "advanced",
  ]),
  zeroTolerance: faker.datatype.boolean(),
  enforcementLevel: faker.helpers.arrayElement(["high", "blocking"]),
}));

// Performance Metrics Factory
export const performanceMetricsFactory = Factory.define(() => ({
  timestamp: faker.date.recent(),
  responseTime: faker.number.int({ min: 50, max: 2000 }),
  memoryUsage: faker.number.int({ min: 10, max: 200 }),
  cpuUsage: faker.number.float({ min: 0.1, max: 1.0 }),
  throughput: faker.number.int({ min: 10, max: 100 }),
  errorRate: faker.number.float({ min: 0, max: 0.1 }),
}));

// Test Data Generators
export class TestDataGenerator {
  static generateUserJourney(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
      step: i + 1,
      action: faker.helpers.arrayElement([
        "create_session",
        "execute_task",
        "validate_codex",
        "delegate_agent",
        "monitor_performance",
      ]),
      timestamp: faker.date.recent(),
      duration: faker.number.int({ min: 100, max: 2000 }),
      success: faker.datatype.boolean(),
    }));
  }

  static generateLoadScenario(users = 100) {
    return Array.from({ length: users }, (_, i) => ({
      userId: i + 1,
      sessionId: `session_${faker.number.int({ min: 1, max: 10 })}`,
      startTime: faker.date.recent(),
      actions: faker.helpers.arrayElements(
        ["orchestrate_task", "validate_codex", "check_performance"],
        { min: 1, max: 3 },
      ),
      totalDuration: faker.number.int({ min: 5000, max: 30000 }),
    }));
  }

  static generateSecurityScenarios() {
    return [
      {
        name: "SQL Injection Attempt",
        payload: "'; DROP TABLE users; --",
        expectedBlocked: true,
      },
      {
        name: "XSS Attempt",
        payload: '<script>alert("xss")</script>',
        expectedBlocked: true,
      },
      {
        name: "Valid Input",
        payload: "normal user input",
        expectedBlocked: false,
      },
    ];
  }
}
