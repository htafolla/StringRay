/**
 * Execution Planner
 * 
 * Creates optimized execution plans for orchestration tasks
 */

import type { 
  OrchestrationTask, 
  ExecutionPlan, 
  ComplexityAnalysis,
  TaskValidation 
} from '../types.js';
import { getAgentCapabilitiesManager } from '../config/agent-capabilities.js';

/**
 * Execution Planner
 * Plans and optimizes task execution strategies
 */
export class ExecutionPlanner {
  private capabilitiesManager = getAgentCapabilitiesManager();

  /**
   * Validate a list of tasks
   */
  validateTasks(tasks: OrchestrationTask[]): TaskValidation {
    const errors: string[] = [];

    if (!tasks || tasks.length === 0) {
      errors.push('No tasks provided');
      return { valid: false, errors };
    }

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task) continue;

      if (!task.id) {
        errors.push(`Task ${i}: Missing required field 'id'`);
      }

      if (!task.description) {
        errors.push(`Task ${i}: Missing required field 'description'`);
      }

      if (!task.type) {
        errors.push(`Task ${i}: Missing required field 'type'`);
      }

      // Check dependencies exist
      if (task.dependencies && task.id) {
        const taskIds = new Set(tasks.map(t => t.id).filter((id): id is string => !!id));
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            errors.push(`Task ${i}: Dependency '${depId}' does not exist`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create an execution plan based on tasks and mode
   */
  async createExecutionPlan(
    tasks: OrchestrationTask[],
    executionMode: string
  ): Promise<ExecutionPlan> {
    const agentAssignments = new Map<string, OrchestrationTask[]>();

    switch (executionMode) {
      case 'parallel':
        this.createParallelPlan(tasks, agentAssignments);
        break;
      case 'sequential':
        this.createSequentialPlan(tasks, agentAssignments);
        break;
      case 'optimized':
      default:
        await this.createOptimizedPlan(tasks, agentAssignments);
        break;
    }

    const estimatedDuration = this.estimateExecutionDuration(agentAssignments);

    return {
      tasks,
      strategy: executionMode as 'parallel' | 'sequential' | 'optimized',
      agentAssignments,
      estimatedDuration,
    };
  }

  /**
   * Create a parallel execution plan
   */
  private createParallelPlan(
    tasks: OrchestrationTask[],
    agentAssignments: Map<string, OrchestrationTask[]>
  ): void {
    // Assign each task to an available agent
    const agents = this.capabilitiesManager.getAllCapabilities();
    let agentIndex = 0;
    const agentList = Array.from(agents.keys()).filter((a): a is string => !!a);

    if (agentList.length === 0) return;

    for (const task of tasks) {
      const agent = agentList[agentIndex % agentList.length];
      if (!agent) continue;
      
      if (!agentAssignments.has(agent)) {
        agentAssignments.set(agent, []);
      }
      agentAssignments.get(agent)!.push(task);
      
      agentIndex++;
    }
  }

  /**
   * Create a sequential execution plan
   */
  private createSequentialPlan(
    tasks: OrchestrationTask[],
    agentAssignments: Map<string, OrchestrationTask[]>
  ): void {
    // Use orchestrator agent for sequential execution
    agentAssignments.set('orchestrator', [...tasks]);
  }

  /**
   * Create an optimized execution plan considering dependencies and complexity
   */
  private async createOptimizedPlan(
    tasks: OrchestrationTask[],
    agentAssignments: Map<string, OrchestrationTask[]>
  ): Promise<void> {
    // Sort tasks by dependencies first
    const sortedTasks = this.sortByDependencies(tasks);
    
    // Group independent tasks for parallel execution
    const independentTasks: OrchestrationTask[] = [];
    const dependentTasks: OrchestrationTask[] = [];

    for (const task of sortedTasks) {
      if (!task.dependencies || task.dependencies.length === 0) {
        independentTasks.push(task);
      } else {
        dependentTasks.push(task);
      }
    }

    // Assign independent tasks in parallel
    this.assignTasksToAgents(independentTasks, agentAssignments);

    // Assign dependent tasks (these will run after dependencies complete)
    this.assignTasksToAgents(dependentTasks, agentAssignments);
  }

  /**
   * Sort tasks by their dependencies
   */
  private sortByDependencies(tasks: OrchestrationTask[]): OrchestrationTask[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const sorted: OrchestrationTask[] = [];
    const visited = new Set<string>();

    const visit = (task: OrchestrationTask) => {
      if (visited.has(task.id)) return;
      visited.add(task.id);

      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) visit(depTask);
        }
      }

      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }

    return sorted;
  }

  /**
   * Assign tasks to agents based on capability
   */
  private assignTasksToAgents(
    tasks: OrchestrationTask[],
    agentAssignments: Map<string, OrchestrationTask[]>
  ): void {
    for (const task of tasks) {
      const complexity = task.estimatedComplexity || 30;
      const agent = this.capabilitiesManager.selectAgentForTask(
        [task.type],
        complexity
      ) || 'orchestrator';

      if (!agentAssignments.has(agent)) {
        agentAssignments.set(agent, []);
      }
      agentAssignments.get(agent)!.push(task);
    }
  }

  /**
   * Estimate execution duration based on agent assignments
   */
  estimateExecutionDuration(agentAssignments: Map<string, OrchestrationTask[]>): number {
    let maxDuration = 0;

    for (const [agent, tasks] of agentAssignments) {
      const caps = this.capabilitiesManager.getCapabilities(agent);
      if (!caps) continue;

      // Estimate time based on concurrent capacity
      const batches = Math.ceil(tasks.length / caps.concurrentTasks);
      const taskDuration = tasks.reduce((sum, t) => sum + (t.estimatedComplexity || 30) * 10, 0);
      const agentDuration = batches * (taskDuration / tasks.length);

      maxDuration = Math.max(maxDuration, agentDuration);
    }

    return Math.round(maxDuration);
  }

  /**
   * Analyze task complexity
   */
  async analyzeTaskComplexity(tasks: OrchestrationTask[]): Promise<ComplexityAnalysis> {
    const taskComplexity: Array<{ complexity: number; category: string }> = [];
    const agentAssignments: Array<{ agent: string; taskCount: number; utilization: number }> = [];

    const assignments = new Map<string, OrchestrationTask[]>();

    for (const task of tasks) {
      const complexity = this.calculateTaskComplexity(task);
      taskComplexity.push({
        complexity,
        category: task.type,
      });

      // Assign to agent
      const agent = this.capabilitiesManager.selectAgentForTask(
        [task.type],
        complexity
      ) || 'orchestrator';

      if (!assignments.has(agent)) {
        assignments.set(agent, []);
      }
      assignments.get(agent)!.push(task);
    }

    // Calculate agent utilization
    for (const [agent, assignedTasks] of assignments) {
      const caps = this.capabilitiesManager.getCapabilities(agent);
      const utilization = caps 
        ? Math.round((assignedTasks.length / caps.concurrentTasks) * 100)
        : 100;

      agentAssignments.push({
        agent,
        taskCount: assignedTasks.length,
        utilization: Math.min(utilization, 100),
      });
    }

    const overallComplexity = taskComplexity.length > 0
      ? Math.round(taskComplexity.reduce((sum, t) => sum + t.complexity, 0) / taskComplexity.length)
      : 0;

    const recommendedStrategy = this.recommendStrategy(overallComplexity, tasks.length);
    const estimatedDuration = this.estimateExecutionDuration(assignments);
    const parallelPotential = this.calculateParallelPotential(tasks);

    return {
      overallComplexity,
      recommendedStrategy,
      taskComplexity,
      agentAssignments,
      estimatedDuration,
      parallelPotential,
    };
  }

  /**
   * Calculate complexity for a single task
   */
  calculateTaskComplexity(task: OrchestrationTask): number {
    let complexity = 30; // Base complexity

    // Adjust based on priority
    switch (task.priority) {
      case 'critical':
        complexity += 20;
        break;
      case 'high':
        complexity += 10;
        break;
      case 'low':
        complexity -= 5;
        break;
    }

    // Adjust based on estimated complexity
    if (task.estimatedComplexity) {
      complexity = (complexity + task.estimatedComplexity) / 2;
    }

    // Adjust based on dependencies
    if (task.dependencies) {
      complexity += task.dependencies.length * 5;
    }

    return Math.min(Math.max(Math.round(complexity), 1), 100);
  }

  /**
   * Recommend execution strategy based on complexity and task count
   */
  private recommendStrategy(overallComplexity: number, taskCount: number): string {
    if (taskCount <= 1) return 'sequential';
    if (overallComplexity > 70) return 'sequential';
    if (overallComplexity < 30 && taskCount > 3) return 'parallel';
    return 'optimized';
  }

  /**
   * Calculate parallel execution potential
   */
  private calculateParallelPotential(tasks: OrchestrationTask[]): number {
    // Tasks without dependencies can run in parallel
    const independent = tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
    return independent.length / tasks.length;
  }
}

// Singleton
let executionPlannerInstance: ExecutionPlanner | null = null;

export function getExecutionPlanner(): ExecutionPlanner {
  if (!executionPlannerInstance) {
    executionPlannerInstance = new ExecutionPlanner();
  }
  return executionPlannerInstance;
}
