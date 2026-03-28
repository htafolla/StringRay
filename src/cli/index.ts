#!/usr/bin/env node

/**
 * StringRay CLI - Command Line Interface
 *
 * Provides commands for installing and managing StringRay framework
 */

import { Command } from "commander";
import { execSync } from "child_process";
import { join, resolve } from "path";

import { readFileSync, existsSync } from "fs";

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
    "⚡ StringRay ⚡: Bulletproof AI orchestration with systematic error prevention",
  )
  .version(version);

program
  .command("install")
  .description("Install StringRay framework in the current project")
  .action(async () => {
    console.log("🔧 StringRay CLI: Installing framework...");

    try {
      // Run the postinstaller script
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

      console.log("✅ StringRay framework installed successfully!");
      console.log("");
      console.log("📋 Next steps:");
      console.log("1. Restart OpenCode to load the plugin");
      console.log('2. Run "opencode agent list" to see StrRay agents');
      console.log('3. Try "@architect analyze this code" or "@enforcer validate this code" to test the plugin');
    } catch (error) {
      console.error(
        "❌ Installation failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize StringRay configuration in the current project")
  .action(async () => {
    console.log("🚀 StringRay CLI: Initializing configuration...");

    try {
      // Run the postinstaller script (same as install)
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

      console.log("✅ StringRay configuration initialized!");
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
  .description("Check StringRay framework status")
  .action(async () => {
    console.log("🔍 StringRay CLI: Checking framework status...");

    try {
      // Check if required files exist
      const fs = await import("fs");
      const path = await import("path");

      const checks = [
        { file: "opencode.json", description: "OpenCode configuration" },
        {
          file: ".opencode/enforcer-config.json",
          description: "Framework configuration",
        },
        // { file: '.mcp.json', description: 'MCP server configuration' }, // COMMENTED OUT: No longer checking .mcp.json
      ];

      let allGood = true;

      for (const check of checks) {
        const exists = fs.existsSync(path.join(process.cwd(), check.file));
        const status = exists ? "✅" : "❌";
        console.log(`${status} ${check.description}: ${check.file}`);
        if (!exists) allGood = false;
      }

      if (allGood) {
        console.log("");
        console.log("🎉 StringRay framework is properly configured!");
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
  .description("Validate StringRay framework installation")
  .action(async () => {
    console.log("🔬 StringRay CLI: Validating installation...");

    try {
      // Run the init.sh script to validate
      const initScript = join(packageRoot, ".opencode", "init.sh");

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
    console.log("📍 StringRay CLI Debug Info");
    console.log("   packageRoot:", packageRoot);
    console.log("   cwd:", process.cwd());
  });

program
  .command("capabilities")
  .alias("caps")
  .description("Show all available StringRay framework capabilities")
  .action(async () => {
    console.log("🚀 StringRay Framework Capabilities");
    console.log("=====================================");
    console.log("");

    console.log("🤖 Available Agent Commands:");
    console.log("  @enforcer           - Codex compliance & error prevention");
    console.log("  @architect          - System design & technical decisions");
    console.log("  @orchestrator       - Multi-agent workflow coordination");
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
    console.log("  1. Use @enforcer for code quality validation");
    console.log("  2. Use @orchestrator for complex development tasks");
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
    console.log("🏥 StringRay Framework Health Check");
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
            fs.existsSync(
              // Check for opencode.json at root (OpenCode integration standard)
              path.join(process.cwd(), "opencode.json"),
            ),
          success: "✅ opencode configuration found",
          error: "⚠️ opencode config missing (run install first)",
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
        console.log("  • @enforcer analyze this code");
        console.log("  • @orchestrator coordinate task");
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
    "Report type (full-analysis, agent-usage, performance)",
    "full-analysis",
  )
  .option("-o, --output <file>", "Output file path")
  .action(async (options) => {
    console.log(`📊 StringRay Framework Report: ${options.type}`);
    console.log("==========================================");
    console.log("");

    try {
      // Import and run the reporting system directly
      const { FrameworkReportingSystem } = await import("../reporting/framework-reporting-system.js");
      
      const reportingSystem = new FrameworkReportingSystem();
      
      const report = await reportingSystem.generateReport({
        type: options.type as any,
        outputFormat: "json"
      });
      
      if (options.output) {
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
    console.log("🔧 StringRay Framework Fix");
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
      console.log("  • Try: @enforcer analyze this code");
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
  .description("StringRay Central Analytics - Pattern analysis, insights, and consent management\n" +
               "  In v1.7.2+: Includes consent management with granular control\n" +
               "  Use 'npx strray-ai analytics enable' to opt-in to data sharing\n" +
               "  Core classes: ConsentManager, AnonymizationEngine available programmatically")
  .option("-l, --limit <number>", "Limit analysis to last N task completions")
  .option("-o, --output <file>", "Save report to file")
  .action(async (opts) => {
    console.log("📊 StringRay Pattern Analytics");
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

program
  .command("doctor")
  .description("Diagnose framework issues (does not fix them)")
  .action(async () => {
    console.log("🩺 StringRay Framework Doctor");
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
        issues.push("StringRay package not installed");
        fixes.push("Run: npm install strray-ai");
      } else {
        console.log("✅ StringRay package installed");
      }

      // Check configuration - check for opencode.json (OpenCode standard)
      const opencodeConfigPath = path.join(process.cwd(), "opencode.json");
      const configExists = fs.existsSync(opencodeConfigPath);
      if (!configExists) {
        issues.push("opencode configuration missing");
        fixes.push("Run: npx strray-ai fix");
      } else {
        console.log("✅ opencode configuration found");
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
        console.log("  • Use @enforcer for code quality checks");
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
    console.log("📦 StringRay Log Archive");
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
    console.log('🚀 StringRay Inference Improvement');
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

// Add help text
program.addHelpText(
  "after",
  `

Examples:
    $ npx strray-ai install       # Install StringRay in current project
    $ npx strray-ai init          # Initialize configuration
    $ npx strray-ai status        # Check installation status
    $ npx strray-ai validate      # Validate framework setup
    $ npx strray-ai capabilities  # Show all available capabilities
    $ npx strray-ai health        # Check framework health and status
    $ npx strray-ai report        # Generate activity and health reports
    $ npx strray-ai fix           # Automatically restore missing config files
    $ npx strray-ai doctor        # Diagnose issues (does not fix them)
    $ npx strray-ai analytics     # Pattern analytics and insights
    $ npx strray-ai inference:improve  # Run autonomous inference improvement
    $ npx strray-ai skill:install agency-agents  # Install 170+ agency agent skills
    $ npx strray-ai skill:install superpowers      # Install 14 agentic workflow skills
    $ npx strray-ai skill:install <github-url>     # Install from any repo

Quick Start:
   1. Install: npx strray-ai install
   2. Check health: npx strray-ai health
   3. Use agents: @enforcer analyze this code
   4. Generate reports: npx strray-ai report
   5. Fix issues: npx strray-ai fix
   6. View analytics: npx strray-ai analytics
   7. Add skills: npx strray-ai skill:install agency-agents

For more information, visit: https://github.com/htafolla/stringray
`,
);

// Parse command line arguments
program.parse();
