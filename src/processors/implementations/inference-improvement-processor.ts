/**
 * Inference Improvement Coordinator
 * 
 * Lightweight processor that coordinates the agent-based inference workflow.
 * The actual analysis is done by collaborating agents (researcher, code-analyzer,
 * architect, code-reviewer, enforcer) - this processor prepares context and triggers.
 * 
 * @module processors/implementations
 */

import * as fs from "fs";
import * as path from "path";
import { PostProcessor } from "../processor-interfaces.js";
import { frameworkLogger } from "../../core/framework-logger.js";

interface InferenceWorkflowContext {
  timestamp: string;
  dataLocations: {
    reflections: string[];
    logs: string[];
    reports: string[];
  };
  workflow: {
    phase: "pending" | "data_gathering" | "analysis" | "design" | "review" | "apply";
    triggered: boolean;
  };
  pendingAdjustments: PendingAdjustment[];
}

interface PendingAdjustment {
  type: "add_keyword" | "remove_keyword" | "adjust_confidence";
  agent: string;
  keyword?: string;
  confidence?: number;
  reason: string;
  approved: boolean;
}

export class InferenceImprovementProcessor extends PostProcessor {
  readonly name = "inferenceImprovement";
  readonly priority = 5;

  private readonly reflectionsDir = "docs/reflections";
  private readonly logsDir = "logs/framework";
  private readonly reportsDir = ".opencode/strray/reports";
  private readonly workflowDir = ".opencode/strray/inference";

  protected async run(context: unknown): Promise<unknown> {
    const ctx = context as Record<string, unknown>;
    const directory = ctx.directory as string || process.cwd();

    await frameworkLogger.log(
      "inference-improvement",
      "preparing_workflow_context",
      "info",
      { directory }
    );

    try {
      const workflowContext = await this.prepareWorkflowContext(directory);
      
      await this.saveWorkflowContext(directory, workflowContext);
      
      await this.triggerAgentWorkflow(workflowContext);

      await frameworkLogger.log(
        "inference-improvement",
        "workflow_triggered",
        "info",
        { 
          dataFiles: workflowContext.dataLocations.reflections.length + 
                     workflowContext.dataLocations.logs.length +
                     workflowContext.dataLocations.reports.length,
          workflowPhase: workflowContext.workflow.phase
        }
      );

      return {
        success: true,
        workflowTriggered: true,
        context: workflowContext.workflow,
        message: "Agent workflow triggered for inference improvement"
      };
    } catch (error) {
      await frameworkLogger.log(
        "inference-improvement",
        "error",
        "error",
        { error: error instanceof Error ? error.message : String(error) }
      );
      return { success: false, error: String(error) };
    }
  }

  private async prepareWorkflowContext(directory: string): Promise<InferenceWorkflowContext> {
    const reflections = this.findReflections(directory);
    const logs = this.findLogs(directory);
    const reports = this.findReports(directory);

    return {
      timestamp: new Date().toISOString(),
      dataLocations: {
        reflections,
        logs,
        reports
      },
      workflow: {
        phase: "pending",
        triggered: false
      },
      pendingAdjustments: []
    };
  }

  private findReflections(directory: string): string[] {
    const reflectionsPath = path.join(directory, this.reflectionsDir);
    if (!fs.existsSync(reflectionsPath)) return [];
    
    return fs.readdirSync(reflectionsPath)
      .filter(f => f.endsWith(".md"))
      .map(f => path.join(reflectionsPath, f));
  }

  private findLogs(directory: string): string[] {
    const logsPath = path.join(directory, this.logsDir);
    if (!fs.existsSync(logsPath)) return [];
    
    return fs.readdirSync(logsPath)
      .filter(f => f.includes("routing") || f.includes("activity") || f.includes("session"))
      .map(f => path.join(logsPath, f));
  }

  private findReports(directory: string): string[] {
    const reportsPath = path.join(directory, this.reportsDir);
    if (!fs.existsSync(reportsPath)) return [];
    
    return fs.readdirSync(reportsPath)
      .filter(f => f.endsWith(".json") || f.endsWith(".md"))
      .map(f => path.join(reportsPath, f));
  }

  private async saveWorkflowContext(directory: string, context: InferenceWorkflowContext): Promise<void> {
    const workflowPath = path.join(directory, this.workflowDir);
    if (!fs.existsSync(workflowPath)) {
      fs.mkdirSync(workflowPath, { recursive: true });
    }

    const filename = `workflow-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(workflowPath, filename),
      JSON.stringify(context, null, 2)
    );

    fs.writeFileSync(
      path.join(workflowPath, "latest-workflow.json"),
      JSON.stringify(context, null, 2)
    );

    await this.generateAgentPrompts(directory, context);
  }

  private async generateAgentPrompts(directory: string, context: InferenceWorkflowContext): Promise<void> {
    const promptsDir = path.join(directory, this.workflowDir, "prompts");
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }

    const prompts = {
      "01-researcher.md": this.generateResearcherPrompt(context),
      "02-code-analyzer.md": this.generateCodeAnalyzerPrompt(),
      "03-architect.md": this.generateArchitectPrompt(),
      "04-code-reviewer.md": this.generateCodeReviewerPrompt(),
      "05-enforcer.md": this.generateEnforcerPrompt()
    };

    for (const [filename, content] of Object.entries(prompts)) {
      fs.writeFileSync(path.join(promptsDir, filename), content);
    }

    await frameworkLogger.log(
      "inference-improvement",
      "agent_prompts_generated",
      "info",
      { count: Object.keys(prompts).length }
    );
  }

  private generateResearcherPrompt(context: InferenceWorkflowContext): string {
    return `# Researcher: Data Gathering Phase

## Task
Analyze the following data sources to gather insights for inference improvement:

### Data Locations
${context.dataLocations.reflections.map(f => `- ${f}`).join('\n')}
${context.dataLocations.logs.map(f => `- ${f}`).join('\n')}
${context.dataLocations.reports.map(f => `- ${f}`).join('\n')}

## Output Required
1. Summary of key findings from each data source
2. Identified routing patterns (success/failure)
3. Emerging keyword trends
4. Agent performance observations

## Format
Return your findings in a structured report.
`;
  }

  private generateCodeAnalyzerPrompt(): string {
    return `# Code-Analyzer: Pattern Analysis Phase

## Task
Analyze the gathered data for patterns and metrics:

1. Routing success/failure rates
2. Confidence distribution
3. Keyword effectiveness
4. Complexity scoring accuracy

## Output Required
1. Pattern analysis report
2. Metrics summary
3. Identified issues
4. Recommendations for improvement
`;
  }

  private generateArchitectPrompt(): string {
    return `# Architect: Design Improvements Phase

## Task
Based on the analysis, design routing improvements:

1. Propose new keyword mappings
2. Suggest confidence adjustments
3. Recommend complexity threshold changes
4. Design new routing patterns

## Output Required
1. Proposed changes (structured)
2. Implementation plan
3. Risk assessment
`;
  }

  private generateCodeReviewerPrompt(): string {
    return `# Code-Reviewer: Review & Refine Phase

## Task
Review proposed improvements for quality:

1. Validate change quality
2. Identify potential regressions
3. Refine suggestions
4. Prioritize changes

## Output Required
1. Approved changes
2. Modified changes
3. Rejected changes with reasons
4. Final priority list
`;
  }

  private generateEnforcerPrompt(): string {
    return `# Enforcer: Validate & Apply Phase

## Task
Final validation and application of approved changes:

1. Codex compliance check
2. Safety validation
3. Apply approved changes to configuration
4. Log all changes

## Output Required
1. Validation report
2. Applied changes
3. Compliance status
`;
  }

  private async triggerAgentWorkflow(context: InferenceWorkflowContext): Promise<void> {
    const workflow = {
      ...context.workflow,
      phase: "data_gathering" as const,
      triggered: true,
      triggeredAt: new Date().toISOString()
    };

    context.workflow = workflow;

    await frameworkLogger.log(
      "inference-improvement",
      "agent_workflow_initiated",
      "info",
      {
        message: "Inference improvement workflow initiated. Next: @researcher analyze data",
        phases: ["researcher", "code-analyzer", "architect", "code-reviewer", "enforcer"]
      }
    );

    const outputPath = path.join(process.cwd(), this.workflowDir, "workflow-status.json");
    fs.writeFileSync(outputPath, JSON.stringify({
      status: "in_progress",
      phase: "data_gathering",
      nextAgent: "researcher",
      message: "Invoke @researcher to begin data gathering phase",
      workflowId: `inference-${Date.now()}`
    }, null, 2));
  }
}
