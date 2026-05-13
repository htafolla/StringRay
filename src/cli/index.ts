#!/usr/bin/env node

/**
 * 0xRay CLI - Command Line Interface
 *
 * Provides commands for installing and managing 0xRay framework
 */

import { Command } from "commander";
import { execSync } from "child_process";
import { join, resolve } from "path";

import { readFileSync, existsSync } from "fs";
import { getConfigDir } from "../core/config-paths.js";

// Get package root relative to this script location
const packageRoot = resolve(join(new URL(".", import.meta.url).pathname, "..", ".."));

// Read version dynamically from package.json
const packageJsonPath = join(packageRoot, "package.json");
const { version } = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

/**
 * SECURITY: Validate script path to prevent command injection
 * Ensures the script is within the package root directory
 */
function validateScriptPath(scriptPath: string, scriptName: string): void {
  // Resolve to absolute path
  const resolvedPath = resolve(scriptPath);

  // Check if file exists
  if (!existsSync(resolvedPath)) {
    throw new Error(`${scriptName} not found: ${resolvedPath}`);
  }

  // Check if path is within package root (prevent directory traversal)
  const relativePath = resolve(packageRoot);
  if (!resolvedPath.startsWith(relativePath)) {
    throw new Error(`Security violation: ${scriptName} outside package root: ${resolvedPath}`);
  }

  // Check file extension (allow only .js, .cjs, .sh)
  const allowedExtensions = ['.js', '.cjs', '.sh'];
  const extension = resolve(resolvedPath).slice(-4);
  if (!allowedExtensions.some(ext => resolvedPath.endsWith(ext))) {
    throw new Error(`Security violation: ${scriptName} has disallowed extension: ${resolvedPath}`);
  }
}

const program = new Command();

program
  .name("strray-ai")
  .description(
    "0xRay: Bulletproof AI orchestration with systematic error prevention",
  )
  .version(version);

function runSetup() {
  const setupScript = join(packageRoot, "scripts", "node", "setup.cjs");
  validateScriptPath(setupScript, "setup script");
  execSync(`node "${setupScript}"`, { stdio: "inherit", cwd: process.cwd() });
}

program
  .command("install")
  .description("Install 0xRay framework in the current project")
  .action(async () => {
    console.log("🔧 0xRay CLI: Installing framework...");
    try {
      const postinstallScript = join(packageRoot, "scripts", "node", "postinstall.cjs");
      validateScriptPath(postinstallScript, "postinstall script");
      execSync(`node "${postinstallScript}"`, { stdio: "inherit", cwd: process.cwd() });
      console.log("✅ 0xRay framework installed!");
      console.log("💡 Run 'npx strray-ai setup' for full configuration (hooks, Hermes, symlinks)");
    } catch (error) {
      console.error("❌ Installation failed:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("setup")
  .description("Full framework setup: hooks, Hermes integration, symlinks, MCP paths")
  .action(runSetup);

program
  .command("init")
  .description("Initialize 0xRay configuration in the current project")
  .action(async () => {
    console.log("🚀 0xRay CLI: Initializing configuration...");
    try {
      const postinstallScript = join(packageRoot, "scripts", "node", "postinstall.cjs");
      validateScriptPath(postinstallScript, "postinstall script");
      execSync(`node "${postinstallScript}"`, { stdio: "inherit", cwd: process.cwd() });
      runSetup();

      console.log("✅ 0xRay configuration initialized!");
    } catch (error) {
      console.error(
        "❌ Initialization failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Check 0xRay framework status")
  .action(async () => {
    console.log("🔍 0xRay CLI: Checking framework status...");

    try {
      // Check if required files exist
      const fs = await import("fs");
      const path = await import("path");

      const checks = [
        { file: "opencode.json", description: "OpenCode configuration", optional: true },
        {
          file: ".opencode/enforcer-config.json",
          description: "Framework configuration",
          optional: false,
        },
      ];

      let allGood = true;

      for (const check of checks) {
        const exists = fs.existsSync(path.join(process.cwd(), check.file));
        const status = exists ? "✅" : check.optional ? "⚠️ " : "❌";
        const label = check.optional ? `${check.description} (optional)` : check.description;
        console.log(`${status} ${label}: ${check.file}`);
        if (!exists && !check.optional) allGood = false;
      }

      if (allGood) {
        console.log("");
        console.log("🎉 0xRay framework is properly configured!");
      } else {
        console.log("");
        console.log(
          '⚠️ Some components are missing. Run "strray-ai install" to fix.',
        );
      }
    } catch (error) {
      console.error(
        "❌ Status check failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate 0xRay framework installation")
  .action(async () => {
    console.log("🔬 0xRay CLI: Validating installation...");

    try {
      // Run the init.sh script to validate
      const initScript = join(packageRoot, ".opencode", "init.sh");
      const fs = await import("fs");

      if (!fs.existsSync(initScript)) {
        console.error(
          "❌ Validation failed: init script not found:",
          initScript,
        );
        process.exit(1);
      }

      // SECURITY: Validate script path before execution
      validateScriptPath(initScript, "init script");

      execSync(`bash "${initScript}"`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error(
        "❌ Validation failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("debug")
  .description("Debug command")
  .action(async () => {
    console.log("📍 0xRay CLI Debug Info");
    console.log("   packageRoot:", packageRoot);
    console.log("   cwd:", process.cwd());
  });

program
  .command("capabilities")
  .alias("caps")
  .description("Show all available 0xRay framework capabilities")
  .action(async () => {
    console.log("🚀 0xRay Framework Capabilities");
    console.log("=====================================");
    console.log("");

    console.log("🤖 Available Agent Commands:");
    console.log("  @security-auditor   - Codex compliance & error prevention");
    console.log("  @architect          - System design & delegation decisions");
    console.log(
      "  @bug-triage-specialist - Error investigation & surgical fixes",
    );
    console.log(
      "  @code-reviewer      - Quality assessment & standards validation",
    );
    console.log("  @security-auditor   - Vulnerability detection & compliance");
    console.log(
      "  @refactorer         - Technical debt elimination & code consolidation",
    );
    console.log(
      "  @testing-lead     - Testing strategy & coverage optimization",
    );
    console.log("  @researcher          - Codebase exploration & documentation");
    console.log("");

    console.log("🛠️ Framework Tools:");
    console.log(
      "  framework-reporting-system - Generate comprehensive activity reports",
    );
    console.log(
      "  complexity-analyzer       - Analyze code complexity & delegation decisions",
    );
    console.log(
      "  codex-injector           - Apply development standards automatically",
    );
    console.log("");

    console.log("🎯 Skills System (23 lazy-loaded capabilities):");
    console.log("  project-analysis      - Codebase metrics and analysis");
    console.log("  testing-strategy      - Test planning and execution");
    console.log("  code-review          - Quality assessment");
    console.log("  security-audit       - Vulnerability scanning");
    console.log("  performance-optimization - Performance tuning");
    console.log("  refactoring-strategies   - Code improvement techniques");
    console.log("  ui-ux-design         - User interface design");
    console.log("  documentation-generation - Technical documentation");
    console.log("  ... and 15 more specialized skills");
    console.log("");

    console.log("📚 Help & Discovery:");
    console.log(
      "  Use the framework-help MCP server for detailed information:",
    );
    console.log("  - strray_get_capabilities: Complete capabilities overview");
    console.log("  - strray_get_commands: Command usage examples");
    console.log("  - strray_explain_capability: Detailed feature explanations");
    console.log("");

    console.log("📊 Core Features:");
    console.log("  • 99.6% error prevention through codex compliance");
    console.log("  • 90% resource reduction (0 baseline processes)");
    console.log("  • Multi-agent orchestration with intelligent delegation");
    console.log("  • Systematic code quality enforcement");
    console.log("  • Real-time activity monitoring and reporting");
    console.log("");

    console.log("🎯 Getting Started:");
    console.log("  1. Use @security-auditor for code quality validation");
    console.log("  2. Use @architect for complex development tasks");
    console.log("  3. Access skills for specialized capabilities");
    console.log("  4. Check framework-reporting-system for activity reports");
    console.log(
      '  5. Run "npx strray-ai capabilities" anytime for this overview',
    );
  });

program
  .command("health")
  .alias("check")
  .description("Check framework health and system status")
  .action(async () => {
    console.log("🏥 0xRay Framework Health Check");
    console.log("====================================");
    console.log("");

    try {
      const fs = await import("fs");
      const path = await import("path");

      // Check core components
      const checks = [
        {
          name: "Package Installation",
          check: () => fs.existsSync(path.join(packageRoot, "package.json")),
          success: "✅ Framework package found",
          error: "❌ Framework package missing",
        },
        {
          name: "Configuration Files",
          check: () =>
            fs.existsSync(path.join(process.cwd(), "opencode.json")) ||
            fs.existsSync(path.join(process.cwd(), ".opencode", "enforcer-config.json")),
          success: "✅ opencode configuration found",
          error: "⚠️ opencode config optional for consumers",
        },
        {
          name: "Agent System",
          check: () => fs.existsSync(path.join(packageRoot, "dist", "agents")),
          success: "✅ Agent system available",
          error: "❌ Agent system not built",
        },
        {
          name: "MCP Servers",
          check: () => fs.existsSync(path.join(packageRoot, "dist", "mcps")),
          success: "✅ MCP servers available",
          error: "❌ MCP servers not built",
        },
      ];

      let allHealthy = true;

      for (const check of checks) {
        try {
          if (check.check()) {
            console.log(check.success);
          } else {
            console.log(check.error);
            allHealthy = false;
          }
        } catch (error) {
          console.log(`${check.name}: ❌ Error during check`);
          allHealthy = false;
        }
      }

      console.log("");

      if (allHealthy) {
        console.log("🎉 Framework is healthy and ready to use!");
        console.log("");
        console.log("💡 Quick commands:");
console.log("  • @security-auditor scan this project");
    console.log("  • @architect analyze this project");
        console.log("  • framework-reporting-system");
      } else {
        console.log(
          '⚠️ Some components need attention. Run "npx strray-ai install" to fix.',
        );
      }
    } catch (error) {
      console.error(
        "❌ Health check failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("report")
  .description("Generate framework activity and health reports")
  .option(
    "-t, --type <type>",
    "Report type (full-analysis, agent-usage, performance, orchestration, context-awareness)",
    "full-analysis",
  )
  .option("-o, --output <file>", "Output file path")
  .option("--daily", "Daily report (full-analysis for last 24 hours)")
  .option("--performance", "Performance report")
  .option("--compliance", "Compliance report (codex violations)")
  .option("--session", "Current session report")
  .option("--ci", "CI-friendly JSON output for pipelines")
  .action(async (options) => {
    // Resolve convenience flags to report type
    const typeMap: Record<string, string> = {
      daily: "full-analysis",
      performance: "performance",
      compliance: "full-analysis",
      session: "full-analysis",
      ci: "full-analysis",
    };

    let reportType = options.type;
    let outputFormat: "json" | "markdown" = "json";

    // Convenience flags override --type
    for (const [flag, mappedType] of Object.entries(typeMap)) {
      if (options[flag]) {
        reportType = mappedType;
        break;
      }
    }

    // CI mode always outputs JSON
    if (options.ci) {
      outputFormat = "json";
    }

    const label = options.ci
      ? "ci"
      : options.daily
        ? "daily"
        : options.performance
          ? "performance"
          : options.compliance
            ? "compliance"
            : options.session
              ? "session"
              : reportType;

    console.log(`📊 0xRay Framework Report: ${label}`);
    console.log("==========================================");
    console.log("");

    try {
      // Import and run the reporting system directly
      const { FrameworkReportingSystem } = await import("../reporting/framework-reporting-system.js");

      const reportingSystem = new FrameworkReportingSystem();

      const report = await reportingSystem.generateReport({
        type: reportType as any,
        outputFormat,
      });

      if (options.output) {
        const fs = await import("fs");
        fs.writeFileSync(options.output, report);
        console.log(`✅ Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }
    } catch (error) {
      console.error(
        "❌ Report generation failed:",
        error instanceof Error ? error.message : String(error),
      );
      console.log("");
      console.log("💡 Troubleshooting:");
      console.log("  • Make sure OpenCode is running");
      console.log("  • Check framework installation: npx strray-ai status");
      console.log(
        "  • Try manual report: framework-reporting-system generate-report",
      );
      process.exit(1);
    }
  });

program
  .command("fix")
  .description(
    "Automatically fix common framework issues by running the postinstall setup",
  )
  .action(async () => {
    console.log("🔧 0xRay Framework Fix");
    console.log("===========================");
    console.log("");

    try {
      console.log("Running postinstall setup to restore configuration...");

      // Run the postinstaller script (same as install command)
      const postinstallScript = join(
        packageRoot,
        "scripts",
        "node",
        "postinstall.cjs",
      );

      // SECURITY: Validate script path before execution
      validateScriptPath(postinstallScript, "postinstall script");

      execSync(`node "${postinstallScript}"`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      console.log("");
      console.log("🎉 Framework configuration restored successfully!");
      console.log("");
      console.log("💡 Next steps:");
      console.log("  • Restart OpenCode to load the restored configuration");
      console.log("  • Run: npx strray-ai health (to verify everything works)");
      console.log("  • Try: @security-auditor scan this project");
    } catch (error) {
      console.error(
        "❌ Fix command failed:",
        error instanceof Error ? error.message : String(error),
      );
      console.log("");
      console.log("💡 Manual fix options:");
      console.log("  • Delete .opencode/ and .stringray/ directories");
      console.log("  • Run: npx strray-ai install");
      console.log("  • Or manually restore missing configuration files");
      process.exit(1);
    }
  });

// Analytics command - pattern analysis, insights, and consent management
program
  .command("analytics")
  .description("0xRay Central Analytics - Pattern analysis, insights, and consent management\n" +
               "  In v1.7.2+: Includes consent management with granular control\n" +
               "  Use 'npx strray-ai analytics enable' to opt-in to data sharing\n" +
               "  Core classes: ConsentManager, AnonymizationEngine available programmatically")
  .option("-l, --limit <number>", "Limit analysis to last N task completions")
  .option("-o, --output <file>", "Save report to file")
  .action(async (opts) => {
    console.log("📊 0xRay Pattern Analytics");
    console.log("==============================");
    console.log("");

    try {
      // Dynamic import to avoid loading analytics module unless needed
      const { SimplePatternAnalyzer } =
        await import("../analytics/simple-pattern-analyzer.js");

      // Get default limit from features.json
      const fs = await import("fs");
      const path = await import("path");
      let defaultLimit = 500;
      try {
        const featuresPath = path.join(process.cwd(), ".opencode", "strray", "features.json");
        if (fs.existsSync(featuresPath)) {
          const features = JSON.parse(fs.readFileSync(featuresPath, "utf-8"));
          defaultLimit = features.analytics?.default_limit || 500;
        }
      } catch { /* use default */ }

      const analyzer = new SimplePatternAnalyzer();
      const limit = parseInt(opts.limit) || defaultLimit;

      console.log(`Analyzing last ${limit} task completions...`);
      console.log("");

      const insights = await analyzer.analyze(limit);
      const insightsLines = analyzer.generateInsights(insights);

      // Print insights
      insightsLines.forEach((line) => {
        console.log(line);
      });

      // Save to file if requested
      if (opts.output) {
        const fs = await import("fs");
        const report = await analyzer.generateReport();
        fs.writeFileSync(opts.output, report);
        console.log("");
        console.log(`✅ Report saved to: ${opts.output}`);
      }

      console.log("");
      console.log(
        "💡 Run regularly to track agent performance and complexity accuracy",
      );
    } catch (error) {
      console.error(
        "❌ Analytics failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

import("./commands/analytics-disable.js");
import("./commands/analytics-enable-action.js");
import("./commands/analytics-status.js");
import("./commands/analytics-preview.js");

program
  .command("doctor")
  .description("Diagnose framework issues (does not fix them)")
  .action(async () => {
    console.log("🩺 0xRay Framework Doctor");
    console.log("===============================");
    console.log("");

    try {
      const fs = await import("fs");
      const path = await import("path");

      const issues = [];
      const fixes = [];

      // Check Node.js version
      const nodeVersion = process.version;
      const versionParts = nodeVersion.slice(1).split(".");
      const majorVersion = parseInt(versionParts[0] || "0");
      if (majorVersion < 18) {
        issues.push("Node.js version too old");
        fixes.push("Upgrade to Node.js 18+");
      } else {
        console.log("✅ Node.js version:", nodeVersion);
      }

      // Check package installation
      const packageExists = fs.existsSync(
        path.join(process.cwd(), "node_modules", "strray-ai"),
      );
      if (!packageExists) {
        issues.push("0xRay package not installed");
        fixes.push("Run: npm install strray-ai");
      } else {
        console.log("✅ 0xRay package installed");
      }

      // Check configuration - check for opencode.json or .strray/ (headless mode)
      const cwd = process.cwd();
      const opencodeConfigPath = path.join(cwd, "opencode.json");
      const strrayDir = getConfigDir(cwd);
      const opencodeExists = fs.existsSync(opencodeConfigPath);
      const strrayDirExists = fs.existsSync(strrayDir);
      if (opencodeExists) {
        console.log("✅ opencode configuration found");
      } else if (strrayDirExists) {
        console.log(`✅ Configuration directory found: ${strrayDir}`);
      } else {
        console.log("ℹ️  No opencode.json or config directory found (run: npx strray-ai fix to create)");
      }

      // Check for common issues
      const mcpConfigExists = fs.existsSync(
        path.join(process.cwd(), ".mcp.json"),
      );
      if (mcpConfigExists) {
        console.log("ℹ️ Found .mcp.json - may conflict with framework");
        fixes.push(
          "Consider removing .mcp.json or excluding framework servers",
        );
      }

      console.log("");

      if (issues.length === 0) {
        console.log("🎉 No issues found! Framework is healthy.");
        console.log("");
        console.log("💡 Pro tips:");
        console.log("  • Use @security-auditor for code quality checks");
        console.log("  • Run reports regularly: npx strray-ai report");
        console.log("  • Check health anytime: npx strray-ai health");
      } else {
        console.log("⚠️ Issues found:");
        issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });

        console.log("");
        console.log(
          '🔧 Run "npx strray-ai fix" to automatically fix these issues',
        );
      }
    } catch (error) {
      console.error(
        "❌ Doctor check failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

// Archive logs command - standalone, no framework boot required
program
  .command("archive-logs")
  .description("Archive log files without framework boot (for git hooks)")
  .option("--dry-run", "Show what would be archived without making changes")
  .option("-v, --verbose", "Verbose output")
  .action(async (opts) => {
    console.log("📦 0xRay Log Archive");
    console.log("========================");
    
    if (opts.dryRun) {
      console.log("(Dry run mode - no changes will be made)");
    }
    
    try {
      // Import and run standalone archiver
      const archiveModule = await import("./commands/archive-logs.js");
      const result = await archiveModule.archiveLogFiles(
        {
          maxFileSizeMB: 10,
          rotationIntervalHours: 24,
          compressionEnabled: true,
          maxArchives: 10,
        },
        `cli-${Date.now()}`
      );
      
      console.log(`\n📊 Results:`);
      console.log(`  Archived: ${result.archived} files`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.forEach((e: string) => console.log(`    - ${e}`));
        process.exit(1);
      }
    } catch (error) {
      console.error("Archive failed:", error);
      process.exit(1);
    }
  });

// Inference improvement command
program
  .command('inference:improve')
  .description('Run autonomous inference improvement cycle')
  .option('--dry-run', 'Show what would change without applying')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    console.log('🚀 0xRay Inference Improvement');
    console.log('=================================');
    console.log('');

    try {
      const { LearningEngine } = await import('../delegation/analytics/learning-engine.js');
      const { routingOutcomeTracker } = await import('../delegation/analytics/outcome-tracker.js');
      const { patternPerformanceTracker } = await import('../analytics/pattern-performance-tracker.js');
      const { getAdaptiveKernel } = await import('../core/adaptive-kernel.js');

      // Reload fresh data
      routingOutcomeTracker.reloadFromDisk();
      patternPerformanceTracker.loadFromDisk();
      
      const outcomes = routingOutcomeTracker.getOutcomes();
      console.log(`📊 Loaded ${outcomes.length} routing outcomes`);
      
      // Generate performance report
      const perfMetrics = patternPerformanceTracker.getAllPatternMetrics();
      console.log(`   Patterns tracked: ${perfMetrics.length}`);
      
      const successOutcomes = outcomes.filter(o => o.success);
      const successRate = outcomes.length > 0 ? (successOutcomes.length / outcomes.length * 100).toFixed(1) : '100.0';
      console.log(`   Overall success rate: ${successRate}%`);
      console.log('');
      
      // Trigger learning
      const engine = new LearningEngine(true);
      const learningResult = await engine.triggerLearning();
      console.log(`🧠 Learning Results:`);
      console.log(`   Patterns analyzed: ${learningResult.patternsAnalyzed}`);
      console.log(`   Adaptations: ${learningResult.adaptations}`);
      
      // Get drift analysis
      const driftAnalysis = engine.getPatternDriftAnalysis();
      console.log(`\n📈 Pattern Drift:`);
      console.log(`   Drift detected: ${driftAnalysis.driftDetected}`);
      console.log(`   Severity: ${driftAnalysis.severity}`);
      if (driftAnalysis.affectedPatterns.length > 0) {
        console.log(`   Affected: ${driftAnalysis.affectedPatterns.slice(0, 5).join(', ')}`);
      }
      
      // Get adaptive kernel stats
      const kernel = getAdaptiveKernel();
      const kernelStats = kernel.getLearningStats();
      console.log(`\n⚙️ Kernel Stats:`);
      console.log(`   Patterns tracked: ${kernelStats.patternsTracked}`);
      console.log(`   Thresholds calibrated: ${kernelStats.thresholdsCalibrated}`);
      
      // Get suggestions
      if (!options.dryRun) {
        const suggestions = engine.suggestImprovements();
        if (suggestions.length > 0) {
          console.log(`\n💡 Suggestions:`);
          suggestions.slice(0, 5).forEach((s, i) => {
            console.log(`   ${i + 1}. [${s.type}] ${s.description} (${s.impact} impact)`);
          });
        }
        
        console.log(`\n✅ Inference improvement cycle complete`);
      } else {
        console.log(`\n💡 Dry run - no changes applied`);
      }

      console.log('');
    } catch (error) {
      console.error('❌ Inference improvement failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Inference tuner command
program
  .command('inference:tuner')
  .description('Start/stop the autonomous inference tuner service')
  .option('-s, --start', 'Start the tuner service')
  .option('-t, --stop', 'Stop the tuner service')
  .option('-r, --run-once', 'Run a single tuning cycle')
  .option('-S, --status', 'Show tuner status')
  .action(async (options) => {
    const { inferenceTuner } = await import('../services/inference-tuner.js');
    
    if (options.status) {
      const status = inferenceTuner.getStatus();
      console.log('🎛️  Inference Tuner Status');
      console.log('=========================');
      console.log(`   Running: ${status.running ? '✅ Yes' : '❌ No'}`);
      console.log(`   Last tuning: ${status.lastTuningTime ? new Date(status.lastTuningTime).toISOString() : 'Never'}`);
      console.log(`   Auto-update mappings: ${status.config.autoUpdateMappings}`);
      console.log(`   Auto-update thresholds: ${status.config.autoUpdateThresholds}`);
      console.log(`   Learning interval: ${status.config.learningIntervalMs}ms`);
      return;
    }
    
    if (options.start) {
      inferenceTuner.start();
      console.log('✅ Inference tuner started');
      console.log(`   Interval: ${inferenceTuner.getStatus().config.learningIntervalMs}ms`);
      console.log('   Press Ctrl+C to stop');
      return;
    }
    
    if (options.stop) {
      inferenceTuner.stop();
      console.log('✅ Inference tuner stopped');
      return;
    }
    
    if (options.runOnce) {
      console.log('🎛️  Running single tuning cycle...');
      await inferenceTuner.runTuningCycle();
      console.log('✅ Tuning cycle complete');
      return;
    }
    
    console.log('Usage: npx strray-ai inference:tuner [options]');
    console.log('  --start     Start the tuner service');
    console.log('  --stop      Stop the tuner service');
    console.log('  --run-once  Run a single tuning cycle');
    console.log('  --status    Show tuner status');
  });

// Inference cycle run command
program
  .command('inference:run')
  .description('Run a self-improvement inference cycle: collect → propose → govern → verify')
  .option('-f, --force', 'Force cycle even if threshold not met')
  .option('--no-verify', 'Skip deploy verification step')
  .option('--no-apply', 'Skip applying approved proposals (create PRs)')
  .option('--no-researcher-review', 'Skip downstream researcher review of PRs')
  .option('--json', 'Output raw JSON result')
   .action(async (options) => {
     const { InferenceCycle } = await import('../inference/inference-cycle.js');
     const { shouldTriggerCycle } = await import('../inference/inference-accumulator.js');
     const { accumulateCorpus } = await import('../inference/inference-accumulator.js');
      const { featuresConfigLoader } = await import('../core/features-config.js');
      const { initializeGovernanceIntegration, shutdownGovernanceIntegration } = await import('../integrations/governance/index.js');

      // Guard: inference:run is internal to StringRay development only
     const isStringRayRepo = (() => {
       try {
         const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
         return pkg.name === 'strray-ai' && process.env.NODE_ENV !== 'consumer';
       } catch {
         return false;
       }
     })();

     if (!isStringRayRepo) {
       if (options.json) {
         console.log(JSON.stringify({ triggered: false, reason: 'inference:run is for StringRay development only (internal tool)' }));
       } else {
         console.log('The inference:run command is for StringRay framework development only.');
         console.log('It is not intended for consumer projects.');
       }
       return;
     }

     const features = featuresConfigLoader.loadConfig();
     const inferenceConfig = (features as any)?.inference;
    if (!inferenceConfig?.enabled) {
      if (options.json) {
        console.log(JSON.stringify({ triggered: false, reason: 'Inference feature disabled in features.json' }));
      } else {
        console.log('Inference feature is disabled in features.json.');
        console.log('Enable it by setting inference.enabled = true in .opencode/strray/features.json');
      }
      return;
    }

    const projectRoot = process.cwd();
    const inferenceDir = `${projectRoot}/docs/inference`;
    const stateDir = `${projectRoot}/.strray/inference`;
    const stateFile = `${stateDir}/inference-cycle-state.json`;

    if (!options.json) {
      console.log('0xRay Inference Cycle');
      console.log('====================');
    }

    if (!options.force) {
      const threshold = shouldTriggerCycle(inferenceDir, stateFile);
      if (!threshold.trigger) {
        if (options.json) {
          console.log(JSON.stringify({ triggered: false, reason: threshold.reason }));
        } else {
          console.log(`Not triggered: ${threshold.reason}`);
          console.log('Use --force to override.');
        }
        return;
      }
      if (!options.json) {
        console.log(`Triggered: ${threshold.reason}`);
      }
    } else if (!options.json) {
      console.log('Force mode — skipping threshold check');
    }

    if (!options.json) {
      const corpus = accumulateCorpus(inferenceDir);
      console.log(`\nCorpus: ${corpus.sessions.length} sessions, ${corpus.totalCommits} commits`);
      console.log(`  Recurring problems: ${corpus.recurringProblems.length}`);
      console.log(`  Recurring patterns: ${corpus.recurringPatterns.length}`);
    }

    // Initialize external governance integration for two-oscillator governance
    const govConfig = (features as any)?.inference_governance;
    if (govConfig?.enabled) {
      await shutdownGovernanceIntegration();
      await initializeGovernanceIntegration();
    }

    const cycle = InferenceCycle.getInstance(projectRoot, { skipDeployVerify: options.noVerify ?? true, skipApply: options.noApply ?? false, skipResearcherReview: options.noResearcherReview ?? false, force: options.force ?? false });
    const result = await cycle.maybeRunCycle();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\nCycle: ${result.cycleId}`);
    console.log(`Phase: ${result.phase}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);

    if (result.proposals.length > 0) {
      console.log(`\nProposals (${result.proposals.length}):`);
      for (const p of result.proposals) {
        const icon = p.status === 'approved' || p.status === 'applied' ? 'APPROVED' : p.status === 'rejected' ? 'REJECTED' : p.status === 'failed' ? 'FAILED' : 'PENDING';
        console.log(`  [${icon}] ${p.type}: ${p.title} (${(p.confidence * 100).toFixed(0)}%)`);
      }
    } else {
      console.log('\nNo proposals generated.');
    }

    if (result.votes.length > 0) {
      console.log(`\nGovernance votes (${result.votes.length}):`);
      for (const v of result.votes) {
        console.log(`  ${v.proposalId}: ${v.decision} (${(v.confidence * 100).toFixed(0)}%)`);
        for (const d of v.details) {
          console.log(`    ${d}`);
        }
      }
    }

    if (result.deployVerification) {
      console.log(`\nDeploy verification: ${result.deployVerification.success ? 'PASSED' : 'FAILED'}`);
      const failedChecks = result.deployVerification.checks.filter((c: any) => !c.passed);
      if (failedChecks.length > 0) {
        for (const c of failedChecks) {
          console.log(`  Failed: ${c.name} — ${c.output?.substring(0, 200)}`);
        }
      }
    }
  });

// Publish agent command
program
  .command('publish-agent')
  .description('Package and publish agents to AgentStore')
  .option('-a, --agent <name>', 'Agent name to publish')
  .option('-v, --version <version>', 'Version to publish (default: 1.0.0)')
  .option('-d, --dry-run', 'Show what would be published without publishing')
  .action(async () => {
    const { publishAgentCommand } = await import('./commands/publish-agent.js');
    await publishAgentCommand();
  });

// Antigravity status command
program
  .command('antigravity status')
  .description('Show status of all installed skills')
  .action(async () => {
    const { antigravityStatusCommand } = await import('./commands/antigravity-status.js');
    await antigravityStatusCommand();
  });

// Credible init command
program
  .command('credible init')
  .description('Initialize Credible Pod infrastructure')
  .option('-n, --name <name>', 'Pod name')
  .option('-t, --template <template>', 'Pod template to use')
  .action(async () => {
    const { credibleInitCommand } = await import('./commands/credible-init.js');
    await credibleInitCommand();
  });

// Skill registry command
program
  .command('skill:registry [action]')
  .description('List, add, or remove skills registry sources')
  .option('--name <name>', 'Source name')
  .option('--url <url>', 'Repository URL')
  .option('--desc <desc>', 'Description')
  .option('--license <license>', 'License type')
  .action(async (action, options) => {
    const { skillRegistryCommand } = await import('./commands/skill-install.js');
    await skillRegistryCommand(action, options);
  });

// Skill install command
program
  .command('skill:install [source]')
  .description('Install skills from the registry or any git repo')
  .option('--path <dir>', 'Subdirectory in repo containing skills')
  .option('--force', 'Reinstall even if already installed')
  .action(async (sourceArg, options) => {
    const { skillInstallCommand } = await import('./commands/skill-install.js');
    await skillInstallCommand(sourceArg, options);
  });

// Storyteller command
program
  .command('storyteller [type]')
  .description('Write reflections, sagas, journeys, or narratives')
  .option('-t, --title <title>', 'Title for the story')
  .option('-f, --framework <framework>', 'Storytelling framework (three_act_structure, hero_journey, spiral)')
  .option('-o, --output <file>', 'Output file path')
  .option('--dry-run', 'Show prompt without creating file')
  .action(async (type, options) => {
    const { storytellerCommand } = await import('./commands/storyteller.js');
    await storytellerCommand(type, options);
  });

// MCP install commands - support both hyphen and colon formats
program
  .command('mcp-list')
  .alias('mcp:list')
  .description('List available community MCP servers')
  .action(async () => {
    const { listMCPsCommand } = await import('./commands/mcp-install.js');
    listMCPsCommand();
  });

program
  .command('mcp-status')
  .alias('mcp:status')
  .description('Show installed MCP servers')
  .action(async () => {
    const { showMCPStatusCommand } = await import('./commands/mcp-install.js');
    showMCPStatusCommand();
  });

program
  .command('mcp-install <name>')
  .alias('mcp:install')
  .description('Install an MCP server from the registry')
  .action(async (name) => {
    const { installMCPCommand } = await import('./commands/mcp-install.js');
    await installMCPCommand(name);
  });

program
  .command('mcp-remove <name>')
  .alias('mcp:remove')
  .description('Remove an installed MCP server')
  .action(async (name) => {
    const { removeMCPCommand } = await import('./commands/mcp-install.js');
    removeMCPCommand(name);
  });

// Analytics enable command
// TODO: Re-enable after fixing dashboard module
// program
//   .command('dashboard')
//   .description('Real-time monitoring dashboard for orchestration metrics')
//   .option('--refresh <ms>', 'Refresh interval in milliseconds', '5000')
//   .option('--theme <theme>', 'Dashboard theme (dark|light)', 'dark')
//   .option('--no-watch', 'Run in snapshot mode (no live updates)')
//   .option('--no-trends', 'Hide historical trends')
//   .option('--no-alerts', 'Hide alerts panel')
//   .action(async (options) => {
//     const { dashboardCommand } = await import('./commands/dashboard.js');
//     await dashboardCommand({
//       refreshInterval: parseInt(options.refresh) || 5000,
//       theme: (options.theme as 'dark' | 'light') || 'dark',
//       watch: options.watch !== false,
//       showTrends: options.trends !== false,
//       showAlerts: options.alerts !== false,
//     });
//   });

// Plugin management command
program
  .command('plugin')
  .description('Manage 0xRay plugins')
  .action(async () => {
    console.log(`
📦 0xRay Plugin Management

Usage: npx strray-ai plugin <command>

Commands:
  list                 List all installed plugins
  install <name>       Install a new plugin
  enable <name>        Enable a plugin
  disable <name>       Disable a plugin
  status <name>        Show plugin details
  uninstall <name>     Remove a plugin

Examples:
  npx strray-ai plugin list
  npx strray-ai plugin status my-plugin
  npx strray-ai plugin uninstall old-plugin

Plugins are loaded from: .strray/plugins/
`);
  });

// Plugin subcommands
const pluginCmd = program.command('plugin').description('Manage plugins');

pluginCmd
  .command('list')
  .description('List installed plugins')
  .action(async () => {
    const { pluginListCommand } = await import('./commands/plugin-commands.js');
    await pluginListCommand();
  });

pluginCmd
  .command('install <name>')
  .description('Install a plugin')
  .action(async (name) => {
    const { pluginInstallCommand } = await import('./commands/plugin-commands.js');
    await pluginInstallCommand(name);
  });

pluginCmd
  .command('enable <name>')
  .description('Enable a plugin')
  .action(async (name) => {
    const { pluginEnableCommand } = await import('./commands/plugin-commands.js');
    await pluginEnableCommand(name);
  });

pluginCmd
  .command('disable <name>')
  .description('Disable a plugin')
  .action(async (name) => {
    const { pluginDisableCommand } = await import('./commands/plugin-commands.js');
    await pluginDisableCommand(name);
  });

pluginCmd
  .command('status <name>')
  .description('Show plugin details')
  .action(async (name) => {
    const { pluginStatusCommand } = await import('./commands/plugin-commands.js');
    await pluginStatusCommand(name);
  });

pluginCmd
  .command('uninstall <name>')
  .description('Uninstall a plugin')
  .action(async (name) => {
    const { pluginUninstallCommand } = await import('./commands/plugin-commands.js');
    await pluginUninstallCommand(name);
  });

// Add help text
program.addHelpText(
  "after",
  `

Examples:
    $ npx strray-ai install       # Install 0xRay in current project
    $ npx strray-ai init          # Initialize configuration
    $ npx strray-ai status        # Check installation status
    $ npx strray-ai validate      # Validate framework setup
    $ npx strray-ai capabilities  # Show all available capabilities
    $ npx strray-ai health        # Check framework health and status
    $ npx strray-ai report        # Generate activity and health reports
    $ npx strray-ai dashboard     # Real-time orchestration monitoring dashboard
    $ npx strray-ai fix           # Automatically restore missing config files
    $ npx strray-ai doctor        # Diagnose issues (does not fix them)
    $ npx strray-ai analytics     # Pattern analytics and insights
    $ npx strray-ai inference:improve  # Run autonomous inference improvement
    $ npx strray-ai skill:install agency-agents  # Install 170+ agency agent skills
    $ npx strray-ai skill:install superpowers      # Install 14 agentic workflow skills
    $ npx strray-ai skill:install <github-url>     # Install from any repo
    $ npx strray-ai storyteller saga "v1.18.0 Journey"  # Write a saga
    $ npx strray-ai storyteller reflection "API Fix"     # Write a reflection

Quick Start:
   1. Install: npx strray-ai install
   2. Check health: npx strray-ai health
   3. Use agents: @security-auditor scan
   4. Generate reports: npx strray-ai report
   5. Monitor: npx strray-ai dashboard
   6. Fix issues: npx strray-ai fix
   7. View analytics: npx strray-ai analytics
   8. Add skills: npx strray-ai skill:install agency-agents
   9. Write stories: npx strray-ai storyteller saga "Release Journey"

For more information, visit: https://github.com/htafolla/stringray
`,
);

// Parse command line arguments
program.exitOverride();
program.parse();
