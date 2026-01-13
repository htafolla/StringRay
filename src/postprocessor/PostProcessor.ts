/**
 * StrRay Post-Processor - Core Infrastructure
 *
 * Automated CI/CD loop orchestration: commit → push → monitor → fix → redeploy → monitor
 * Provides systematic error prevention and deployment automation.
 *
 * @version 1.0.0
 * @since 2026-01-13
 */

import { StrRayStateManager } from "../state/state-manager.js";
import { SessionMonitor } from "../session/session-monitor.js";
import { GitHookTrigger } from "./triggers/GitHookTrigger.js";
import { WebhookTrigger } from "./triggers/WebhookTrigger.js";
import { APITrigger } from "./triggers/APITrigger.js";
import { PostProcessorMonitoringEngine } from "./monitoring/MonitoringEngine.js";
import { FailureAnalysisEngine } from "./analysis/FailureAnalysisEngine.js";
import { AutoFixEngine } from "./autofix/AutoFixEngine.js";
import { FixValidator } from "./autofix/FixValidator.js";
import { RedeployCoordinator } from "./redeploy/RedeployCoordinator.js";
import { RetryHandler } from "./redeploy/RetryHandler.js";
import { EscalationEngine } from "./escalation/EscalationEngine.js";
import { SuccessHandler } from "./success/SuccessHandler.js";
import {
  PostProcessorConfig,
  PostProcessorResult,
  PostProcessorContext,
} from "./types.js";
import { defaultConfig } from "./config.js";

export class PostProcessor {
  private config: PostProcessorConfig;
  private monitoringEngine: PostProcessorMonitoringEngine;
  private failureAnalysisEngine: FailureAnalysisEngine;
  private autoFixEngine: AutoFixEngine;
  private fixValidator: FixValidator;
  private redeployCoordinator: RedeployCoordinator;
  private escalationEngine: EscalationEngine;
  private successHandler: SuccessHandler;
  private triggers: {
    gitHook: GitHookTrigger;
    webhook: WebhookTrigger;
    api: APITrigger;
  };

  constructor(
    private stateManager: StrRayStateManager,
    private sessionMonitor: SessionMonitor | null = null,
    config: Partial<PostProcessorConfig> = {},
  ) {
    this.config = { ...defaultConfig, ...config };

    // Initialize monitoring engine
    this.monitoringEngine = new PostProcessorMonitoringEngine(
      this.stateManager,
      this.sessionMonitor || undefined,
    );

    // Initialize failure analysis and auto-fix engines
    this.failureAnalysisEngine = new FailureAnalysisEngine();
    this.autoFixEngine = new AutoFixEngine(
      this.config.autoFix.confidenceThreshold,
    );
    this.fixValidator = new FixValidator();

    // Initialize redeploy coordinator
    this.redeployCoordinator = new RedeployCoordinator();

    // Initialize escalation and success handlers
    this.escalationEngine = new EscalationEngine();
    this.successHandler = new SuccessHandler();

    // Initialize trigger mechanisms
    this.triggers = {
      gitHook: new GitHookTrigger(this),
      webhook: new WebhookTrigger(this),
      api: new APITrigger(this),
    };
  }

  /**
   * Initialize the post-processor system
   */
  async initialize(): Promise<void> {
    console.log("🚀 Initializing StrRay Post-Processor...");

    // Initialize monitoring
    if (this.config.monitoring.enabled) {
      await this.monitoringEngine.initialize();
      console.log("✅ Monitoring engine initialized");
    }

    // Initialize triggers
    if (this.config.triggers.gitHooks) {
      await this.triggers.gitHook.initialize();
      console.log("✅ Git hook triggers initialized");
    }

    if (this.config.triggers.webhooks) {
      await this.triggers.webhook.initialize();
      console.log("✅ Webhook triggers initialized");
    }

    if (this.config.triggers.api) {
      await this.triggers.api.initialize();
      console.log("✅ API triggers initialized");
    }

    console.log("🎯 Post-Processor initialization complete");
  }

  /**
   * Execute the complete post-processor loop
   */
  async executePostProcessorLoop(
    context: PostProcessorContext,
  ): Promise<PostProcessorResult> {
    const startTime = Date.now();
    const sessionId = `postprocessor-${context.commitSha}-${Date.now()}`;

    console.log(
      `🔄 Starting post-processor loop for commit: ${context.commitSha}`,
    );

    try {
      // Initialize session tracking
      await this.stateManager.set(`postprocessor:${sessionId}`, {
        status: "running",
        startTime,
        context,
        attempts: 0,
      });

      // Execute the monitoring → analysis → fix → redeploy loop
      const result = await this.executeMonitoringLoop(context, sessionId);

      // Update final status
      await this.stateManager.set(`postprocessor:${sessionId}`, {
        ...result,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      });

      console.log(
        `✅ Post-processor loop completed: ${result.success ? "SUCCESS" : "FAILED"}`,
      );
      return result;
    } catch (error) {
      console.error("❌ Post-processor loop failed:", error);

      const failureResult: PostProcessorResult = {
        success: false,
        commitSha: context.commitSha,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
        attempts: 1,
        monitoringResults: [],
        fixesApplied: [],
      };

      await this.stateManager.set(`postprocessor:${sessionId}`, {
        ...failureResult,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      });

      return failureResult;
    }
  }

  /**
   * Execute the monitoring loop until success or max attempts
   */
   private async executeMonitoringLoop(
     context: PostProcessorContext,
     sessionId: string,
   ): Promise<PostProcessorResult> {
     let attempts = 0;
     const maxAttempts = this.config.maxAttempts || 3;
     const monitoringResults: any[] = [];

     while (attempts < maxAttempts) {
      attempts++;

      console.log(
        `🔍 Monitoring attempt ${attempts}/${maxAttempts} for ${context.commitSha}`,
      );

       // Monitor CI/CD status
       const monitoringResult = await this.monitoringEngine.monitorDeployment(
         context.commitSha,
       );

       monitoringResults.push(monitoringResult);

       if (monitoringResult.overallStatus === "success") {
         console.log("✅ CI/CD pipeline successful - post-processor complete");

         const result = {
           success: true,
           commitSha: context.commitSha,
           sessionId,
           attempts,
           monitoringResults,
         };

         // Handle successful completion
         await this.successHandler.handleSuccess(context, result, monitoringResults);

         return result;
       }

      // Pipeline failed - analyze and attempt fixes
      console.log("❌ CI/CD pipeline failed - analyzing issues...");

      const analysis =
        await this.failureAnalysisEngine.analyzeFailure(monitoringResult);
      console.log(
        `🔍 Analysis complete: ${analysis.category} (${analysis.severity}) - ${analysis.rootCause}`,
      );

      const fixResult = await this.autoFixEngine.applyFixes(analysis, context);

      if (fixResult.success && fixResult.appliedFixes.length > 0) {
        console.log(
          `🔧 ${fixResult.appliedFixes.length} fix(es) applied successfully`,
        );

        // Validate that fixes resolve the issue
        const validationPassed = await this.fixValidator.validateFixes(
          fixResult.appliedFixes,
          analysis,
          context,
        );

        if (validationPassed) {
          console.log("✅ Fix validation passed - redeploying...");
          await this.redeployWithFixes(context, fixResult);
          // Continue monitoring with next attempt
          continue;
        } else {
          console.log("❌ Fix validation failed - rolling back...");
          await this.fixValidator.rollbackFixes(fixResult.appliedFixes);
        }
      }

      // Check if escalation is needed before retry
      const escalationResult = await this.escalationEngine.evaluateEscalation(
        context,
        attempts,
        "CI/CD pipeline failure",
        monitoringResults
      );

      if (escalationResult) {
        console.log(`🚨 Escalation triggered: ${escalationResult.level}`);
        console.log(`   Reason: ${escalationResult.reason}`);

        // For emergency/rollback levels, stop the loop
        if (escalationResult.level === 'emergency' || escalationResult.level === 'rollback') {
          return {
            success: false,
            commitSha: context.commitSha,
            sessionId,
            attempts,
            monitoringResults,
            fixesApplied: fixResult?.appliedFixes || [],
            error: `Escalation triggered: ${escalationResult.reason}`,
          };
        }
      }

      // Wait before retry (only if not escalated to emergency/rollback)
      await this.waitBeforeRetry(attempts);
    }

    // Max attempts exceeded - final escalation
    const finalEscalation = await this.escalationEngine.evaluateEscalation(
      context,
      attempts,
      "Max attempts exceeded - deployment failed",
      monitoringResults
    );

    return {
      success: false,
      commitSha: context.commitSha,
      sessionId,
      attempts,
      monitoringResults,
      fixesApplied: [],
      error: "Max attempts exceeded",
    };
  }

  /**
   * Redeploy after applying fixes using the RedeployCoordinator
   */
  private async redeployWithFixes(
    context: PostProcessorContext,
    fixResult: any,
  ): Promise<void> {
    console.log("🔄 Executing redeployment with fixes...");

    const redeployResult = await this.redeployCoordinator.executeRedeploy(
      context,
      fixResult
    );

    if (redeployResult.success) {
      console.log(`✅ Redeployment successful: ${redeployResult.deploymentId}`);
    } else {
      console.log(`❌ Redeployment failed: ${redeployResult.error}`);
      throw new Error(`Redeployment failed: ${redeployResult.error}`);
    }
  }

  /**
   * Attempt to apply automatic fixes
   */
  private async attemptAutoFix(
    analysis: any,
    context: PostProcessorContext,
  ): Promise<any> {
    // Placeholder for auto-fix - disabled for now
    return { success: false, requiresManualIntervention: true };
  }



  /**
   * Escalate to manual intervention
   */
  private async escalateToManualIntervention(
    context: PostProcessorContext,
    monitoringResult: any,
    attempts: number,
  ): Promise<void> {
    console.log("🚨 Escalating to manual intervention");

    // Create detailed incident report
    const report = {
      commitSha: context.commitSha,
      attempts,
      monitoringResult,
      timestamp: new Date().toISOString(),
      recommendations: [
        "Review CI/CD pipeline logs for detailed error information",
        "Check failed test outputs and error messages",
        "Verify recent code changes for potential issues",
        "Consider manual fixes or rollback if necessary",
      ],
    };

    // Store escalation details
    await this.stateManager.set(`escalation:${context.commitSha}`, report);

    // TODO: Send notifications to development team
    console.log("📋 Escalation report created:", report);
  }

  /**
   * Wait before retry with exponential backoff
   */
  private async waitBeforeRetry(attempt: number): Promise<void> {
    const baseDelay = this.config.retryDelay || 30000; // 30 seconds
    const delay = baseDelay * Math.pow(2, attempt - 1);

    console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Get post-processor status
   */
  async getStatus(): Promise<any> {
    return {
      activeSessions: 0, // Placeholder
      config: this.config,
      monitoringStatus: await this.monitoringEngine.getStatus(),
    };
  }
}
