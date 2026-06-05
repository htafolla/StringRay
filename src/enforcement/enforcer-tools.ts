/**
 * Enforcer Tools - Integration layer between enforcer agent and rule enforcement system
 * Provides tools for codex compliance, rule validation, and contextual analysis enforcement
 */

import {
  ruleEnforcer,
  RuleValidationContext,
  ValidationReport,
} from "./rule-enforcer.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { frameworkReportingSystem } from "../reporting/framework-reporting-system.js";
import { AgentDelegator } from "../delegation/agent-delegator.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { strRayConfigLoader } from "../core/config-loader.js";
import * as fs from "fs";
import * as path from "path";

// Minimum confidence to auto-delegate to another agent
const DELEGATION_CONFIDENCE_THRESHOLD = 0.50;

// Agents that enforcer should NOT delegate to (enforcer handles these itself)
const ENFORCER_HANDLES = new Set(["code-reviewer"]);

// Community skills are OPTIONAL - they may not be installed
// These mappings have lower confidence (0.55-0.7) since skills may not be available
// The system will fall back gracefully if the skill isn't installed

const ROUTING_MAPPINGS = [
  // Core built-in skills (high confidence)
  { keywords: ["write", "file", "create"], skill: "code-review", agent: "code-reviewer", confidence: 0.9 },
  { keywords: ["review", "audit", "assess", "evaluate", "check", "inspect", "quality", "validate", "code-review"], skill: "code-review", agent: "code-reviewer", confidence: 0.9 },
  { keywords: ["test", "testing", "jest", "coverage", "unit", "e2e", "cypress", "spec", "verify"], skill: "testing-best-practices", agent: "testing-lead", confidence: 0.95 },
  { keywords: ["fix", "debug", "triage", "broken", "error", "crash", "bug", "issue", "resolve"], skill: "bug-triage", agent: "bug-triage-specialist", confidence: 0.92 },
  { keywords: ["security", "vulnerability", "threat", "scan", "risk", "exploit", "secure", "pentest"], skill: "security-audit", agent: "security-auditor", confidence: 0.95 },
  { keywords: ["refactor", "cleanup", "improve", "restructure", "modernize", "debt"], skill: "refactoring-strategies", agent: "refactorer", confidence: 0.92 },
  { keywords: ["performance", "optimize", "bottleneck", "benchmark", "profile", "speed"], skill: "performance-optimization", agent: "performance-engineer", confidence: 0.93 },
  { keywords: ["frontend", "react", "vue", "angular", "ui", "ux", "interface", "component"], skill: "frontend-development", agent: "frontend-engineer", confidence: 0.95 },
  { keywords: ["backend", "api", "server", "microservice", "endpoint"], skill: "backend-development", agent: "backend-engineer", confidence: 0.95 },
  { keywords: ["docs", "documentation", "readme", "wiki", "guide", "manual"], skill: "documentation-generation", agent: "tech-writer", confidence: 0.9 },
  { keywords: ["database", "db", "sql", "schema", "migration", "query"], skill: "database-design", agent: "database-engineer", confidence: 0.95 },
  { keywords: ["deploy", "ci/cd", "pipeline", "docker", "kubernetes", "infrastructure"], skill: "devops-deployment", agent: "devops-engineer", confidence: 0.94 },
  { keywords: ["mobile", "ios", "android", "react-native", "flutter"], skill: "mobile-development", agent: "mobile-developer", confidence: 0.95 },
  { keywords: ["enforce", "compliance", "rule", "standard", "codex", "block", "prevent"], skill: "code-review", agent: "code-reviewer", confidence: 0.95 },
  { keywords: ["design", "architect", "plan", "system", "model", "pattern", "architecture"], skill: "architecture-patterns", agent: "architect", confidence: 0.95 },
  { keywords: ["codebase", "explore", "research", "discover", "implementation"], skill: "git-workflow", agent: "researcher", confidence: 0.88 },
  // Additional built-in skill mappings
  { keywords: ["api", "rest", "graphql", "openapi", "endpoint", "swagger"], skill: "api-design", agent: "backend-engineer", confidence: 0.9 },
  { keywords: ["strategy", "roadmap", "planning", "technical", "decision", "architecture"], skill: "architecture-patterns", agent: "strategist", confidence: 0.88 },
  { keywords: ["reflection", "story", "narrative", "saga", "journey", "document"], skill: "storyteller", agent: "tech-writer", confidence: 0.85 },
  { keywords: ["analyze", "metrics", "complexity", "maintainability", "quality"], skill: "code-analyzer", agent: "code-analyzer", confidence: 0.9 },
  { keywords: ["growth", "marketing", "conversion", "acquisition", "user-acquisition"], skill: "growth-strategist", agent: "growth-strategist", confidence: 0.9 },
  { keywords: ["seo", "search", "organic", "traffic", "keywords", "ranking"], skill: "seo-consultant", agent: "seo-consultant", confidence: 0.92 },
  { keywords: ["content", "copy", "blog", "marketing", "social"], skill: "content-creator", agent: "content-creator", confidence: 0.88 },
  { keywords: ["format", "lint", "prettier", "eslint", "style", "formatting"], skill: "auto-format", agent: "code-reviewer", confidence: 0.85 },
  { keywords: ["project", "structure", "health", "dependencies", "architecture"], skill: "project-analysis", agent: "architect", confidence: 0.88 },
  { keywords: ["compliance", "audit", "standards", "framework", "validation"], skill: "framework-compliance-audit", agent: "code-reviewer", confidence: 0.9 },
  { keywords: ["session", "state", "persistence", "storage", "cache"], skill: "session-management", agent: "backend-engineer", confidence: 0.85 },
  { keywords: ["image", "visual", "pdf", "diagram", "multimedia", "media"], skill: "multimodal-looker", agent: "multimodal-looker", confidence: 0.92 },
  { keywords: ["testing", "strategy", "coverage", "test-plan"], skill: "testing-strategy", agent: "testing-lead", confidence: 0.92 },
  { keywords: ["inference", "model", "llm", "tuning", "optimization"], skill: "inference-improve", agent: "performance-engineer", confidence: 0.88 },
  { keywords: ["orchestrate", "boot", "initialize", "startup", "bootstrap"], skill: "boot-orchestrator", agent: "architect", confidence: 0.9 },
  // Additional unmapped skills
  { keywords: ["tool", "utility", "helper", "instrument"], skill: "architect-tools", agent: "architect", confidence: 0.85 },
  { keywords: ["design", "visual", "style", "theme", "css", "accessibility"], skill: "ui-ux-design", agent: "frontend-ui-ux-engineer", confidence: 0.9 },
  { keywords: ["agent", "multi-agent", "coordination", "hermes", "communication"], skill: "hermes-agent", agent: "architect", confidence: 0.88 },
  { keywords: ["log", "diagnostic", "trace", "monitor", "watch"], skill: "log-monitor", agent: "log-monitor", confidence: 0.9 },
  { keywords: ["health", "diagnostic", "model-health", "validate-llm"], skill: "model-health-check", agent: "performance-engineer", confidence: 0.88 },
  { keywords: ["analyze", "profiling", "memory", "cpu", "latency"], skill: "performance-analysis", agent: "performance-engineer", confidence: 0.9 },
  { keywords: ["pipeline", "stream", "etl", "batch", "process"], skill: "processor-pipeline", agent: "backend-engineer", confidence: 0.88 },
  { keywords: ["vulnerability", "cve", "sast", "dast", "dependency-check"], skill: "security-scan", agent: "security-auditor", confidence: 0.92 },
  { keywords: ["state", "store", "redux", "context", "persistence"], skill: "state-manager", agent: "backend-engineer", confidence: 0.88 },

  // ============================================================
  // Community Skills (optional, lower confidence)
  // These skills are from antigravity and may not be installed
  // ============================================================

  // UI/UX Design & Themes (antigravity)
  { keywords: ["theme", "design-system", "color", "font", "typography", "palette"], skill: "antigravity--theme-factory", agent: "frontend-ui-ux-engineer", confidence: 0.6 },
  { keywords: ["hig", "salesforce design", "lightning design", "slds"], skill: "antigravity--hig-components-system", agent: "frontend-ui-ux-engineer", confidence: 0.65 },
  { keywords: ["slide", "deck", "presentation", "powerpoint"], skill: "antigravity--theme-factory", agent: "content-creator", confidence: 0.55 },

  // SEO (antigravity)
  { keywords: ["seo technical", "crawl", "indexability", "core web vitals", "sitemap"], skill: "antigravity--seo-technical", agent: "seo-consultant", confidence: 0.7 },
  { keywords: ["seo structure", "content hierarchy", "schema", "internal linking"], skill: "antigravity--seo-structure-architect", agent: "seo-consultant", confidence: 0.7 },
  { keywords: ["seo snippet", "meta description", "title tag"], skill: "antigravity--seo-snippet-hunter", agent: "seo-consultant", confidence: 0.7 },
  { keywords: ["seo hreflang", "international seo", "multilingual"], skill: "antigravity--seo-hreflang", agent: "seo-consultant", confidence: 0.65 },

  // Security (antigravity)
  { keywords: ["backend security", "secure coding", "input validation", "authentication"], skill: "antigravity--backend-security-coder", agent: "security-auditor", confidence: 0.7 },
  { keywords: ["mobile security", "ios security", "android security"], skill: "antigravity--mobile-security-coder", agent: "security-auditor", confidence: 0.65 },
  { keywords: ["security audit", "vulnerability assessment", "penetration test"], skill: "security-audit", agent: "security-auditor", confidence: 0.75 },

  // Vector/AI Databases (antigravity)
  { keywords: ["vector", "embeddings", "similarity search", "pinecone", "qdrant", "chroma"], skill: "antigravity--vector-database-engineer", agent: "database-engineer", confidence: 0.65 },
  { keywords: ["similarity search", "approximate nearest neighbor"], skill: "antigravity--similarity-search-patterns", agent: "database-engineer", confidence: 0.65 },

  // Frameworks & Libraries (antigravity)
  { keywords: ["svelte", "sveltekit", "svelte.js"], skill: "antigravity--sveltekit", agent: "frontend-engineer", confidence: 0.65 },
  { keywords: ["trpc", "typescript rpc", "tRPC"], skill: "antigravity--trpc-fullstack", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["vercel ai", "ai sdk", "vapi"], skill: "antigravity--vercel-ai-sdk-expert", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["threejs", "3d web", "webgl", "3d graphics"], skill: "antigravity--threejs-loaders", agent: "frontend-engineer", confidence: 0.6 },
  { keywords: ["comfyui", "ai image generation", "stable diffusion"], skill: "antigravity--comfyui-gateway", agent: "multimodal-looker", confidence: 0.6 },

  // Mobile (antigravity)
  { keywords: ["swiftui", "ios development"], skill: "antigravity--swiftui-liquid-glass", agent: "mobile-developer", confidence: 0.7 },
  { keywords: ["ios performance", "swift optimization"], skill: "antigravity--swiftui-performance-audit", agent: "mobile-developer", confidence: 0.65 },
  { keywords: ["react native", "rn"], skill: "mobile-development", agent: "mobile-developer", confidence: 0.7 },

  // Backend/Golang (antigravity)
  { keywords: ["golang", "go", "gopher"], skill: "antigravity--golang-pro", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["temporal", "workflow", " durable execution"], skill: "antigravity--temporal-golang-pro", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["python async", "asyncio", "uvloop"], skill: "antigravity--async-python-patterns", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["pydantic", "data validation", "python models"], skill: "antigravity--pydantic-models-py", agent: "backend-engineer", confidence: 0.65 },
  { keywords: ["scala", "spark", "big data"], skill: "antigravity--scala-pro", agent: "backend-engineer", confidence: 0.6 },
  { keywords: ["dotnet", "c#", ".net"], skill: "antigravity--dotnet-backend-patterns", agent: "backend-engineer", confidence: 0.6 },

  // Cloud/Azure (antigravity)
  { keywords: ["azure", "azd", "azure deploy"], skill: "antigravity--azd-deployment", agent: "devops-engineer", confidence: 0.65 },
  { keywords: ["azure storage", "file share"], skill: "antigravity--azure-storage-file-share-ts", agent: "devops-engineer", confidence: 0.6 },
  { keywords: ["azure service bus", "messaging"], skill: "antigravity--azure-servicebus-py", agent: "devops-engineer", confidence: 0.6 },

  // Automation/Bots (antigravity)
  { keywords: ["discord bot", "discord automation"], skill: "antigravity--discord-bot-architect", agent: "backend-engineer", confidence: 0.6 },
  { keywords: ["n8n", "workflow automation"], skill: "antigravity--n8n-expression-syntax", agent: "devops-engineer", confidence: 0.6 },
  { keywords: ["linkedin automation", "social posting"], skill: "antigravity--linkedin-automation", agent: "growth-strategist", confidence: 0.55 },
  { keywords: ["reddit automation"], skill: "antigravity--reddit-automation", agent: "growth-strategist", confidence: 0.55 },
  { keywords: ["freshdesk", "customer support automation"], skill: "antigravity--freshdesk-automation", agent: "devops-engineer", confidence: 0.55 },
  { keywords: ["pagerduty", "incident management"], skill: "antigravity--pagerduty-automation", agent: "devops-engineer", confidence: 0.55 },

  // AI/ML (antigravity)
  { keywords: ["local llm", "ollama", "llama", "local model"], skill: "antigravity--local-llm-expert", agent: "performance-engineer", confidence: 0.65 },
  { keywords: ["agent", "mcp", "model context protocol"], skill: "antigravity--agent-memory-mcp", agent: "architect", confidence: 0.65 },
  { keywords: ["agent evaluation", "agent testing"], skill: "antigravity--agent-evaluation", agent: "testing-lead", confidence: 0.65 },
  { keywords: ["ai agent", "autonomous agent"], skill: "antigravity--ai-agent-development", agent: "backend-engineer", confidence: 0.65 },

  // Content/Marketing (antigravity)
  { keywords: ["marketing content", "ad creative", "campaign"], skill: "antigravity--marketing-ideas", agent: "content-creator", confidence: 0.6 },
  { keywords: ["conversion", "cro", "optimization"], skill: "antigravity--onboarding-cro", agent: "growth-strategist", confidence: 0.6 },

  // Documentation & Code Quality (antigravity)
  { keywords: ["code documentation", "code explain", "explain code"], skill: "antigravity--code-documentation-code-explain", agent: "tech-writer", confidence: 0.65 },
  { keywords: ["code refactoring", "clean code"], skill: "antigravity--code-refactoring-refactor-clean", agent: "refactorer", confidence: 0.65 },
  { keywords: ["code review checklist"], skill: "antigravity--code-review-checklist", agent: "code-reviewer", confidence: 0.7 },

  // Microservices & Architecture (antigravity)
  { keywords: ["microservices", "service mesh", "distributed systems"], skill: "antigravity--microservices-patterns", agent: "architect", confidence: 0.65 },
  { keywords: ["architecture decision", "adr", "decision records"], skill: "antigravity--architecture-decision-records", agent: "architect", confidence: 0.65 },

  // Context/Memory Management (antigravity)
  { keywords: ["context management", "context compression", "token optimization"], skill: "antigravity--context-compression", agent: "performance-engineer", confidence: 0.65 },
  { keywords: ["context guardian", "memory safety"], skill: "antigravity--context-guardian", agent: "performance-engineer", confidence: 0.6 },
  { keywords: ["context fundamentals"], skill: "antigravity--context-fundamentals", agent: "performance-engineer", confidence: 0.6 },

  // Specialized Skills
  { keywords: ["interview", "technical interview", "coding interview"], skill: "antigravity--interview-coach", agent: "growth-strategist", confidence: 0.6 },
  { keywords: ["i18n", "localization", "translation"], skill: "antigravity--i18n-localization", agent: "frontend-engineer", confidence: 0.6 },
  { keywords: ["accessibility", "a11y", "wcag"], skill: "antigravity--accessibility-compliance-accessibility-audit", agent: "frontend-ui-ux-engineer", confidence: 0.7 },
  { keywords: ["pwa", "progressive web app"], skill: "antigravity--progressive-web-app", agent: "frontend-engineer", confidence: 0.6 },
  { keywords: ["data migration", "sql migration"], skill: "antigravity--database-migrations-sql-migrations", agent: "database-engineer", confidence: 0.65 },

  // Requesting Code Review (superpowers)
  { keywords: ["request code review", "pr review", "pull request"], skill: "superpowers--requesting-code-review", agent: "code-reviewer", confidence: 0.7 },
];

export interface RoutingRecommendation {
  suggestedAgent: string;
  suggestedSkill: string;
  confidence: number;
  matchedKeyword?: string;
}

export function getTaskRoutingRecommendation(
  taskDescription: string,
): RoutingRecommendation {
  const desc = taskDescription.toLowerCase();
  
  for (const mapping of ROUTING_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return {
          suggestedAgent: mapping.agent,
          suggestedSkill: mapping.skill,
          confidence: mapping.confidence,
          matchedKeyword: keyword,
        };
      }
    }
  }
  
  return {
    suggestedAgent: "code-reviewer",
    suggestedSkill: "code-review",
    confidence: 0.5,
    matchedKeyword: "none",
  };
}

/**
 * Pre-process and validate that the routing is appropriate for the operation
 * This is the integration point between TaskSkillRouter and RuleEnforcer
 */
export async function preProcessAndRoute(
  operation: string,
  context: RuleValidationContext,
): Promise<{
  enhancedContext: RuleValidationContext;
  routing: RoutingRecommendation;
}> {
  // Build task description from operation and context
  const taskDescription = buildTaskDescription(operation, context);

  // Get routing recommendation
  const routing = getTaskRoutingRecommendation(taskDescription);

  // Log the routing decision
  await frameworkLogger.log(
    "enforcer-tools",
    "task-routed",
    "debug",
    {
      operation,
      taskDescription: taskDescription.substring(0, 100),
      suggestedAgent: routing.suggestedAgent,
      suggestedSkill: routing.suggestedSkill,
      confidence: routing.confidence,
    },
  );

  // Enhance context with routing information
  const enhancedContext: RuleValidationContext = {
    ...context,
    operation,
    // Add routing info to context for rule validators to use
    ...(context as any).routing,
  };

  return {
    enhancedContext,
    routing,
  };
}

/**
 * Build a task description from operation and context for routing
 */
function buildTaskDescription(
  operation: string,
  context: RuleValidationContext,
): string {
  const parts: string[] = [operation];

  if (context.component) {
    parts.push(context.component);
  }

  if (context.files && context.files.length > 0) {
    parts.push(`files: ${context.files.join(", ")}`);
  }

  return parts.join(" ");
}

/**
 * Execute the full release workflow
 * Triggered when user says: release, npm publish, publish to npm, bump and publish, ship it
 */
async function executeReleaseWorkflow(
  operation: string,
  context: RuleValidationContext,
  jobId: string,
  routing: RoutingRecommendation,
): Promise<EnforcementResult> {
  const { execSync } = await import('child_process');
  
  // Extract release options from routing context
  const releaseContext = (routing as any).context || {};
  const bumpType = releaseContext.bumpType || 'patch';
  const createTag = releaseContext.createTag || false;
  
  await frameworkLogger.log(
    "enforcer-tools",
    "release-workflow-starting",
    "info",
    { jobId, bumpType, createTag },
  );
  
  const steps: string[] = [];
  const errors: string[] = [];
  
  // HARD STOP: Build must pass before release
  await frameworkLogger.log("enforcer-tools", "release-build-check", "info", { step: "Verifying build passes..." });
  try {
    execSync(`npm run build`, {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    steps.push("✅ Build verified");
  } catch (e) {
    const errorMsg = `🛑 RELEASE STOPPED: Build failed before publishing. Fix build errors first.`;
    frameworkLogger.log("enforcer-tools", "release-blocked", "error", {
      message: errorMsg,
    });
    frameworkLogger.log("enforcer-tools", "release-build-error", "error", {
      message: `Error: ${e}`,
      error: e,
    });
    return {
      operation: "release",
      passed: false,
      blocked: true,
      errors: [errorMsg, `Build error: ${e}`],
      warnings: [],
      fixes: [],
      report: {
        passed: false,
        operation: "release",
        errors: [errorMsg, `Build error: ${e}`],
        warnings: [],
        results: [],
        timestamp: new Date(),
      },
    };
  }
  
  try {
    // Step 1: Run version-manager to bump version and generate changelog
    await frameworkLogger.log("enforcer-tools", "release-step-1-version", "info", { step: "Bumping version..." });
    try {
      const versionArg = createTag ? '--tag' : '';
      execSync(`node scripts/node/version-manager.mjs ${bumpType} ${versionArg}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Version bumped + changelog generated");
    } catch (e) {
      errors.push(`Version bump failed: ${e}`);
    }
    
    // Step 2: Git commit and push
    await frameworkLogger.log("enforcer-tools", "release-step-2-git", "info", { step: "Committing and pushing..." });
    try {
      execSync(`git add -A && git commit -m "release: v${bumpType} - Changelog updated" && git push`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Git commit + push");
    } catch (e) {
      errors.push(`Git commit/push failed: ${e}`);
    }
    
    // Step 3: npm publish
    await frameworkLogger.log("enforcer-tools", "release-step-3-npm", "info", { step: "Publishing to npm..." });
    try {
      execSync(`npm publish`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ npm published");
    } catch (e) {
      errors.push(`npm publish failed: ${e}`);
    }
    
    // Step 4: Generate tweet context
    await frameworkLogger.log("enforcer-tools", "release-step-4-tweet", "info", { step: "Generating tweet..." });
    try {
      execSync(`node scripts/node/release-tweet.mjs`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Tweet context generated - ready for @growth-strategist");
    } catch (e) {
      errors.push(`Tweet generation failed: ${e}`);
    }
    
  } catch (e) {
    errors.push(`Release workflow failed: ${e}`);
  }
  
  return {
    operation: "release",
    passed: errors.length === 0,
    blocked: false,
    errors,
    warnings: [],
    fixes: [],
    report: {
      passed: errors.length === 0,
      operation: "release",
      errors,
      warnings: steps,
      results: steps.map(s => ({ rule: 'release', passed: true, message: s })),
      timestamp: new Date(),
    },
  };
}

/**
 * Delegate a task to another agent via AgentDelegator
 * This is the key integration that ensures enforcer routes to best agent
 */
async function delegateToAgent(
  agentName: string,
  operation: string,
  context: RuleValidationContext,
  jobId: string,
): Promise<EnforcementResult> {
  try {
    // Create a minimal state manager and config loader for the delegator
    const stateManager = new StringRayStateManager();
    
    // Create the delegator
    const delegator = new AgentDelegator(stateManager, strRayConfigLoader);
    
    // Build task description for the delegated agent
    const taskDescription = buildTaskDescription(operation, context);
    
    // Build the delegation request
    const request = {
      operation,
      description: taskDescription,
      context: {
        ...context,
        originalJobId: jobId,
      },
      sessionId: stateManager.get("current_session_id") as string || `delegated-${jobId}`,
    };

    // Analyze and get delegation strategy
    const analysis = await (delegator as any).analyzeDelegation(request);
    
    // Execute the delegation
    const result = await delegator.executeDelegation(analysis, request);

    await frameworkLogger.log(
      "enforcer-tools",
      "delegation-complete",
      "info",
      {
        jobId,
        delegatedTo: agentName,
        success: result.success,
        agentsUsed: result.agents,
      },
    );

    // Convert delegation result to EnforcementResult format
    return {
      operation,
      passed: result.success,
      blocked: !result.success,
      errors: result.errors || [],
      warnings: [],
      fixes: [],
      report: {
        passed: result.success,
        operation,
        timestamp: new Date(),
        errors: result.errors || [],
        warnings: [],
        results: [],
      } as ValidationReport,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await frameworkLogger.log(
      "enforcer-tools",
      "delegation-failed",
      "error",
      {
        jobId,
        delegatedTo: agentName,
        error: errorMessage,
      },
    );

    // Fall back to self-execution if delegation fails
    return await ruleValidationSelf(operation, context, jobId);
  }
}

/**
 * Fallback: Execute validation ourselves if delegation fails
 */
async function ruleValidationSelf(
  operation: string,
  context: RuleValidationContext,
  jobId: string,
): Promise<EnforcementResult> {
  const report = await ruleEnforcer.validateOperation(operation, context);
  
  return {
    operation,
    passed: report.passed,
    blocked: report.errors.length > 0,
    errors: report.errors,
    warnings: report.warnings,
    fixes: [],
    report,
  };
}

/**
 * Run pre-commit validation with auto-fix enabled
 * This is the integration point that automatically creates test files when needed
 */
async function runPreCommitValidationWithAutoFix(
  files: string[],
  operation: string = "commit"
): Promise<{ success: boolean; fixesApplied: number; error?: string }> {
  try {
    // Dynamically import to avoid circular dependencies
    const { testAutoCreationProcessor } = await import(
      "../processors/implementations/test-auto-creation-processor.js"
    );

    let fixesApplied = 0;

    // Process each file
    for (const filePath of files) {
      // Only process TypeScript source files
      if (filePath.endsWith(".ts") && !filePath.endsWith(".test.ts")) {
        const result = await testAutoCreationProcessor.execute({
          tool: "write",
          args: { filePath },
          directory: process.cwd(),
          filePath,
          operation,
        });

        if (result.success) {
          fixesApplied++;
        }
      }
    }

    return { success: true, fixesApplied };
  } catch (error) {
    return {
      success: false,
      fixesApplied: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface EnforcementResult {
  operation: string;
  passed: boolean;
  blocked: boolean;
  errors: string[];
  warnings: string[];
  fixes: Array<{
    type: "auto" | "manual";
    description: string;
    action?: () => Promise<void>;
  }>;
  report: ValidationReport;
}

/**
 * Rule Validation Tool - Validates operations against rule hierarchy
 * Now with intelligent task routing via TaskSkillRouter
 * Automatically delegates to best agent when confidence is high
 */
export async function ruleValidation(
  operation: string,
  context: RuleValidationContext,
): Promise<EnforcementResult> {
  const jobId = `rule-validation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // PRE-PROCESS: Get intelligent routing recommendation
  const { enhancedContext, routing } = await preProcessAndRoute(operation, context);

  await frameworkLogger.log("enforcer-tools", "rule-validation-start", "info", {
    jobId,
    operation,
    files: context.files?.length || 0,
    hasExistingCode: !!context.existingCode,
    // Add routing info to logs
    routedTo: routing.suggestedAgent,
    routingSkill: routing.suggestedSkill,
    routingConfidence: routing.confidence,
  });

  // DELEGATION LOGIC: If high confidence and recommended agent is not self-handled, delegate!
  const shouldDelegate = 
    routing.confidence >= DELEGATION_CONFIDENCE_THRESHOLD &&
    !ENFORCER_HANDLES.has(routing.suggestedAgent) &&
    routing.suggestedAgent !== "code-reviewer";

  // SPECIAL CASE: Release workflow - execute full release process
  if (routing.matchedKeyword === "release-workflow") {
    await frameworkLogger.log(
      "enforcer-tools",
      "release-workflow-triggered",
      "info",
      {
        jobId,
        operation,
        bumpType: (routing as any).context?.bumpType || 'patch',
        createTag: (routing as any).context?.createTag || false,
      },
    );
    
    // Execute the release workflow
    return await executeReleaseWorkflow(operation, context, jobId, routing);
  }

  if (shouldDelegate) {
    await frameworkLogger.log(
      "enforcer-tools",
      "delegating-to-agent",
      "info",
      {
        jobId,
        operation,
        delegatedTo: routing.suggestedAgent,
        confidence: routing.confidence,
        reason: `High confidence (${routing.confidence}) routing to specialized agent`,
      },
    );

    // Delegate to the recommended agent instead of doing work itself
    return await delegateToAgent(routing.suggestedAgent, operation, context, jobId);
  }

  // Use enhanced context with routing for validation
  const report = await ruleEnforcer.validateOperation(operation, enhancedContext);

  const result: EnforcementResult = {
    operation,
    passed: report.passed,
    blocked: report.errors.length > 0,
    errors: report.errors,
    warnings: report.warnings,
    fixes: [],
    report,
  };

  // Generate fixes for common issues
  if (!report.passed) {
    result.fixes = generateFixes(report, context);
  }

  // AUTO-FIX: Run pre-commit validation with auto-fix for missing tests
  // This integrates the auto-fix path into the standard validation flow
  if (!report.passed && context.files && context.files.length > 0) {
    const autoFixResult = await runPreCommitValidationWithAutoFix(
      context.files,
      operation
    );
    if (autoFixResult.success && autoFixResult.fixesApplied > 0) {
      await frameworkLogger.log(
        "enforcer-tools",
        "auto-fix-applied",
        "info",
        {
          jobId,
          fixesApplied: autoFixResult.fixesApplied,
          files: context.files,
        }
      );
    }
  }

  // INTEGRATION POINT: Check for reporting rules and trigger report generation
  // This integrates reporting triggers into the existing rule validation pipeline
  if (!report.passed) {
    // Trigger report generation for rule violations
    await frameworkLogger.log("enforcer-tools", "reporting-triggered", "info", {
      jobId,
      operation,
      hasViolations: report.errors.length > 0,
      hasWarnings: report.warnings.length > 0,
      context: {
        files: context.files?.length,
        operation,
        timestamp: new Date().toISOString(),
      },
    });
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "rule-validation-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      passed: result.passed,
      blocked: result.blocked,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      fixCount: result.fixes.length,
    },
  );

  return result;
}

/**
 * Context Analysis Validation Tool - Validates contextual analysis integration
 */
export async function contextAnalysisValidation(
  files: string[],
  operation: string,
): Promise<EnforcementResult> {
  const jobId = `context-validation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-start",
    "info",
    {
      jobId,
      operation,
      fileCount: files.length,
    },
  );

  // Check if files exist and are readable
  const existingFiles = new Map<string, string>();
  const missingFiles: string[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingFiles.set(file, content);
    } catch (error) {
      missingFiles.push(file);
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode: existingFiles,
  };

  // Run comprehensive validation
  const validationResult = await ruleValidation(operation, context);

  // Additional context-specific checks
  const contextIssues = await validateContextIntegration(files, existingFiles);

  const result: EnforcementResult = {
    ...validationResult,
    errors: [...validationResult.errors, ...contextIssues.errors],
    warnings: [...validationResult.warnings, ...contextIssues.warnings],
    blocked: validationResult.blocked,
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      fileCount: files.length,
      contextErrors: contextIssues.errors.length,
      contextWarnings: contextIssues.warnings.length,
    },
  );

  return result;
}

/**
 * Codex Enforcement Tool - Comprehensive codex compliance validation
 */
export async function codexEnforcement(
  operation: string,
  files: string[],
  newCode?: string,
): Promise<EnforcementResult> {
  const jobId = `codex-enforcement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-start",
    "info",
    {
      jobId,
      operation,
      fileCount: files.length,
      hasNewCode: !!newCode,
    },
  );

  // Load existing code for comparison
  const existingCode = new Map<string, string>();
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingCode.set(file, content);
    } catch (error) {
      // File doesn't exist yet (new file)
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode,
    ...(newCode && { newCode }),
    dependencies: extractDependencies(newCode || "", files),
  };

  const validationResult = await ruleValidation(operation, context);

  // Generate codex compliance report
  const codexReport = await generateCodexComplianceReport(files, newCode);

  const combinedErrors = [...validationResult.errors, ...codexReport.violations];
  const combinedWarnings = [...validationResult.warnings, ...codexReport.warnings];

  const result: EnforcementResult = {
    ...validationResult,
    errors: combinedErrors,
    warnings: combinedWarnings,
    blocked: combinedErrors.length > 0,
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      codexViolations: codexReport.violations.length,
      codexWarnings: codexReport.warnings.length,
      complianceScore: codexReport.complianceScore,
    },
  );

  return result;
}

/**
 * Quality Gate Check Tool - Final validation before commit/execution
 */
export async function qualityGateCheck(
  operation: string,
  context: {
    files: string[];
    newCode?: string;
    tests?: string[];
    dependencies?: string[];
  },
): Promise<EnforcementResult> {
  const jobId = `quality-gate-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  await frameworkLogger.log("enforcer-tools", "quality-gate-start", "info", {
    jobId,
    operation,
    files: context.files.length,
    hasTests: !!(context.tests && context.tests.length > 0),
  });

  // Run all validations
  const validations = await Promise.all([
    ruleValidation(operation, {
      operation,
      files: context.files,
      ...(context.newCode && { newCode: context.newCode }),
      ...(context.tests && { tests: context.tests }),
      ...(context.dependencies && { dependencies: context.dependencies }),
    }),
    contextAnalysisValidation(context.files, operation),
    codexEnforcement(operation, context.files, context.newCode),
  ]);

  // Combine results
  const combinedErrors = validations.flatMap((v) => v.errors);
  const combinedWarnings = validations.flatMap((v) => v.warnings);
  const combinedFixes = validations.flatMap((v) => v.fixes);

  const passed = combinedErrors.length === 0;
  const blocked = !passed; // Quality gates block on any error

  const result: EnforcementResult = {
    operation,
    passed,
    blocked,
    errors: combinedErrors,
    warnings: combinedWarnings,
    fixes: combinedFixes,
    report: validations[0].report, // Use first report as primary
  };

  // Execute automatic fixes if operation would pass after fixes
  if (blocked && combinedFixes.some((f) => f.type === "auto")) {
    await executeAutomaticFixes(combinedFixes.filter((f) => f.type === "auto"));
    result.blocked = false; // Allow after auto-fixes
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "quality-gate-complete",
    passed ? "success" : "error",
    {
      jobId,
      operation,
      passed,
      blocked: result.blocked,
      totalErrors: combinedErrors.length,
      totalWarnings: combinedWarnings.length,
      autoFixes: combinedFixes.filter((f) => f.type === "auto").length,
    },
  );

  return result;
}

// Helper functions

function generateFixes(
  report: ValidationReport,
  context: RuleValidationContext,
): EnforcementResult["fixes"] {
  const fixes: EnforcementResult["fixes"] = [];

  for (const result of report.results) {
    if (result.fixes) {
      for (const fix of result.fixes) {
        if (fix.type === "create-file") {
          fixes.push({
            type: "auto",
            description: fix.description,
            action: async () => {
              if (fix.filePath && fix.content) {
                const dir = path.dirname(fix.filePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(fix.filePath, fix.content);
              }
            },
          });
        } else {
          fixes.push({
            type: "manual",
            description: fix.description,
          });
        }
      }
    }
  }

  return fixes;
}

async function validateContextIntegration(
  files: string[],
  existingCode: Map<string, string>,
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [filePath, content] of existingCode) {
    // Check for proper context provider usage
    if (
      content.includes("CodebaseContextAnalyzer") &&
      !content.includes("memoryConfig")
    ) {
      warnings.push(
        `${filePath}: CodebaseContextAnalyzer should use memory configuration`,
      );
    }

    if (
      content.includes("ASTCodeParser") &&
      !content.includes("try") &&
      !content.includes("catch")
    ) {
      errors.push(
        `${filePath}: ASTCodeParser initialization should handle missing ast-grep gracefully`,
      );
    }

    if (
      content.includes("DependencyGraphBuilder") &&
      !content.includes("contextAnalyzer")
    ) {
      errors.push(
        `${filePath}: DependencyGraphBuilder requires context analyzer parameter`,
      );
    }
  }

  return { errors, warnings };
}

async function generateCodexComplianceReport(
  files: string[],
  newCode?: string,
): Promise<{
  violations: string[];
  warnings: string[];
  complianceScore: number;
}> {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Basic codex checks (simplified - would integrate with full codex validation)
  if (newCode) {
    if (newCode.includes("any") || newCode.includes("@ts-ignore")) {
      violations.push(
        'Codex violation: Type safety first - no "any" types or ts-ignore allowed',
      );
    }

    // Check for actual console.log() calls - only flag if NOT in a comment
    const consoleLogCallMatches = newCode.match(/console\.log\(/g);
    if (consoleLogCallMatches && consoleLogCallMatches.length > 0) {
      const lines = newCode.split('\n');
      let hasConsoleLogInCode = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('console.log(')) {
          const beforeConsole = trimmed.substring(0, trimmed.indexOf('console.log('));
          if (!beforeConsole.includes('//') && !beforeConsole.includes('/*')) {
            hasConsoleLogInCode = true;
            break;
          }
        }
      }
      if (hasConsoleLogInCode) {
        violations.push(
          'Codex violation: console.log() statements detected in production code - use frameworkLogger instead',
        );
      }
    }

    if (
      !newCode.includes("try") &&
      (newCode.includes("await") || newCode.includes("Promise"))
    ) {
      warnings.push(
        "Codex warning: Async operations should have error handling",
      );
    }
  }

  const complianceScore =
    violations.length === 0
      ? 100
      : Math.max(0, 100 - violations.length * 20 - warnings.length * 5);

  return { violations, warnings, complianceScore };
}

function extractDependencies(code: string, files: string[]): string[] {
  const dependencies: string[] = [];

  // Simple regex-based dependency extraction (would be enhanced with proper AST parsing)
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const dep = match[1];
    if (dep && !dep.startsWith(".") && !dep.startsWith("/")) {
      dependencies.push(dep);
    }
  }

  return dependencies;
}

async function executeAutomaticFixes(
  fixes: EnforcementResult["fixes"],
): Promise<void> {
  for (const fix of fixes) {
    if (fix.action) {
      try {
        await fix.action();
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-executed",
          "success",
          {
            description: fix.description,
          },
        );
      } catch (error) {
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-failed",
          "error",
          {
            description: fix.description,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }
  }
}

// Additional utility functions for enforcer operations

/**
 * Get comprehensive enforcement status
 */
export async function getEnforcementStatus(): Promise<{
  rules: number;
  validations: number;
  violations: number;
  fixes: number;
  success: boolean;
}> {
  try {
    const stats = ruleEnforcer.getRuleStats();

    return {
      rules: stats.totalRules,
      validations: 0, // Would be tracked in real implementation
      violations: 0, // Would be tracked in real implementation
      fixes: 0, // Would be tracked in real implementation
      success: true,
    };
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "status-check-failed",
      "error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      rules: 0,
      validations: 0,
      violations: 0,
      fixes: 0,
      success: false,
    };
  }
}

/**
 * Run comprehensive pre-commit validation
 */
export async function runPreCommitValidation(
  files: string[],
  operation: string = "commit",
): Promise<EnforcementResult> {
  const jobId = `pre-commit-validation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "pre-commit-validation-start",
    "info",
    {
      jobId,
      files: files.length,
      operation,
    },
  );

  try {
    // Run all validation types
    const validations = await Promise.allSettled([
      ruleValidation(operation, { operation, files }),
      contextAnalysisValidation(files, operation),
      codexEnforcement(operation, files),
    ]);

    // Aggregate results
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: EnforcementResult["fixes"] = [];

    for (const result of validations) {
      if (result.status === "fulfilled") {
        errors.push(...result.value.errors);
        warnings.push(...result.value.warnings);
        fixes.push(...result.value.fixes);
      } else {
        errors.push(`Validation failed: ${result.reason}`);
      }
    }

    const finalResult: EnforcementResult = {
      operation,
      passed: errors.length === 0,
      blocked: errors.length > 0,
      errors,
      warnings,
      fixes,
      report:
        validations[0]?.status === "fulfilled"
          ? validations[0].value.report
          : ({} as any),
    };

    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-complete",
      finalResult.passed ? "success" : "error",
      {
        jobId,
        operation,
        passed: finalResult.passed,
        blocked: finalResult.blocked,
        errors: errors.length,
        warnings: warnings.length,
        fixes: fixes.length,
      },
    );

    return finalResult;
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-failed",
      "error",
      {
        jobId,
        operation,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      operation,
      passed: false,
      blocked: true,
      errors: [
        `Pre-commit validation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      warnings: [],
      fixes: [],
      report: {} as any,
    };
  }
}

// Export tools for MCP integration
export const enforcerTools = {
  ruleValidation,
  contextAnalysisValidation,
  codexEnforcement,
  qualityGateCheck,
  getEnforcementStatus,
  runPreCommitValidation,
};
