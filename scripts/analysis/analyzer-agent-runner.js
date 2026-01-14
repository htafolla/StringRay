import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnalyzerAgent {
  constructor() {
    this.logDirectory = ".opencode/logs";
    this.refactoringLog = "REFACTORING_LOG.md";
    this.analysisWindow = 24 * 60 * 60 * 1000; // 24 hours
  }

  async analyzeSystem() {
    console.log("🔍 ANALYZER AGENT: Starting comprehensive system analysis...");

    try {
      // Read all log files
      const logs = this.readAllLogs();

      // Analyze performance patterns
      const performanceAnalysis = this.analyzePerformance(logs);

      // Analyze error patterns
      const errorAnalysis = this.analyzeErrors(logs);

      // Analyze agent efficiency
      const agentAnalysis = this.analyzeAgents(logs);

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        performance: performanceAnalysis,
        errors: errorAnalysis,
        agents: agentAnalysis,
      });

      // Write to REFACTORING_LOG.md
      this.writeAnalysisReport({
        timestamp: new Date().toISOString(),
        analysis: {
          performance: performanceAnalysis,
          errors: errorAnalysis,
          agents: agentAnalysis,
        },
        recommendations: recommendations,
      });

      console.log(
        "✅ ANALYZER AGENT: Analysis complete, report written to REFACTORING_LOG.md",
      );

      return {
        success: true,
        analysisTime: Date.now(),
        findings: recommendations.length,
        recommendations: recommendations,
      };
    } catch (error) {
      console.error("❌ ANALYZER AGENT: Analysis failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  readAllLogs() {
    const logs = [];
    const logFiles = fs
      .readdirSync(this.logDirectory)
      .filter((file) => file.endsWith(".log"))
      .map((file) => path.join(this.logDirectory, file));

    for (const logFile of logFiles) {
      try {
        const content = fs.readFileSync(logFile, "utf8");
        const lines = content.split("\n").filter((line) => line.trim());

        logs.push({
          file: path.basename(logFile),
          lines: lines,
          lastModified: fs.statSync(logFile).mtime,
        });
      } catch (error) {
        console.warn(`Warning: Could not read ${logFile}:`, error.message);
      }
    }

    return logs;
  }

  analyzePerformance(logs) {
    const analysis = {
      totalOperations: 0,
      averageExecutionTime: 0,
      memoryUsage: [],
      slowOperations: [],
      recommendations: [],
    };

    for (const log of logs) {
      for (const line of log.lines) {
        // Analyze execution times
        const timeMatch = line.match(/execution.*completed.*SUCCESS/);
        if (timeMatch) analysis.totalOperations++;

        // Analyze memory usage
        const memoryMatch = line.match(/Memory:\s*(\d+(?:\.\d+)?)MB/);
        if (memoryMatch) {
          analysis.memoryUsage.push(parseFloat(memoryMatch[1]));
        }

        // Find slow operations
        const slowMatch = line.match(/(\w+).*(\d+)ms/);
        if (slowMatch && parseInt(slowMatch[2]) > 5000) {
          analysis.slowOperations.push({
            operation: slowMatch[1],
            duration: parseInt(slowMatch[2]),
          });
        }
      }
    }

    if (analysis.memoryUsage.length > 0) {
      analysis.averageMemoryUsage =
        analysis.memoryUsage.reduce((a, b) => a + b, 0) /
        analysis.memoryUsage.length;
    }

    return analysis;
  }

  analyzeErrors(logs) {
    const analysis = {
      totalErrors: 0,
      errorPatterns: {},
      criticalErrors: [],
      recommendations: [],
    };

    for (const log of logs) {
      for (const line of log.lines) {
        if (line.includes("ERROR") || line.includes("❌")) {
          analysis.totalErrors++;

          // Categorize errors
          if (line.includes("timeout")) {
            analysis.errorPatterns.timeout =
              (analysis.errorPatterns.timeout || 0) + 1;
          } else if (line.includes("memory")) {
            analysis.errorPatterns.memory =
              (analysis.errorPatterns.memory || 0) + 1;
          } else {
            analysis.errorPatterns.other =
              (analysis.errorPatterns.other || 0) + 1;
          }

          // Track critical errors
          if (line.includes("critical") || line.includes("CRITICAL")) {
            analysis.criticalErrors.push(line);
          }
        }
      }
    }

    return analysis;
  }

  analyzeAgents(logs) {
    const analysis = {
      agentUsage: {},
      agentEfficiency: {},
      coordinationIssues: [],
      recommendations: [],
    };

    const agents = [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect",
    ];

    for (const log of logs) {
      for (const line of log.lines) {
        for (const agent of agents) {
          if (line.includes(agent)) {
            analysis.agentUsage[agent] = (analysis.agentUsage[agent] || 0) + 1;

            // Check for efficiency issues
            if (line.includes("failed") || line.includes("timeout")) {
              analysis.agentEfficiency[agent] =
                (analysis.agentEfficiency[agent] || 0) + 1;
            }
          }
        }
      }
    }

    return analysis;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Performance recommendations
    if (analysis.performance.averageMemoryUsage > 200) {
      recommendations.push({
        category: "performance",
        priority: "high",
        title: "High Memory Usage Detected",
        description: `Average memory usage is ${analysis.performance.averageMemoryUsage.toFixed(1)}MB. Consider implementing memory pooling and cleanup.`,
        complexity: "moderate",
        impact: "high",
      });
    }

    if (analysis.performance.slowOperations.length > 0) {
      recommendations.push({
        category: "performance",
        priority: "medium",
        title: "Slow Operations Identified",
        description: `${analysis.performance.slowOperations.length} operations exceeded 5 seconds. Review and optimize slow-performing components.`,
        complexity: "complex",
        impact: "medium",
      });
    }

    // Error recommendations
    if (analysis.errors.totalErrors > 10) {
      recommendations.push({
        category: "reliability",
        priority: "high",
        title: "High Error Rate Detected",
        description: `${analysis.errors.totalErrors} errors found. Implement better error handling and monitoring.`,
        complexity: "moderate",
        impact: "high",
      });
    }

    if (analysis.errors.criticalErrors.length > 0) {
      recommendations.push({
        category: "reliability",
        priority: "critical",
        title: "Critical Errors Require Immediate Attention",
        description: `${analysis.errors.criticalErrors.length} critical errors detected. Immediate investigation required.`,
        complexity: "simple",
        impact: "critical",
      });
    }

    // Agent recommendations
    const unusedAgents = Object.keys(analysis.agents.agentUsage).filter(
      (agent) => analysis.agents.agentUsage[agent] < 5,
    );

    if (unusedAgents.length > 0) {
      recommendations.push({
        category: "optimization",
        priority: "low",
        title: "Underutilized Agents",
        description: `Agents ${unusedAgents.join(", ")} have low usage. Consider optimizing agent selection logic.`,
        complexity: "simple",
        impact: "low",
      });
    }

    return recommendations;
  }

  writeAnalysisReport(report) {
    const timestamp = new Date().toISOString();
    const summary = `
## Analysis Report - ${timestamp}

### Performance Analysis
- Total Operations: ${report.analysis.performance.totalOperations}
- Average Memory Usage: ${report.analysis.performance.averageMemoryUsage?.toFixed(1) || "N/A"}MB
- Slow Operations: ${report.analysis.performance.slowOperations.length}

### Error Analysis
- Total Errors: ${report.analysis.errors.totalErrors}
- Critical Errors: ${report.analysis.errors.criticalErrors.length}
- Error Patterns: ${JSON.stringify(report.analysis.errors.errorPatterns, null, 2)}

### Agent Analysis
- Agent Usage: ${JSON.stringify(report.analysis.agents.agentUsage, null, 2)}
- Agent Efficiency Issues: ${JSON.stringify(report.analysis.agents.agentEfficiency, null, 2)}

### Recommendations (${report.recommendations.length})

${report.recommendations
  .map(
    (rec, i) => `${i + 1}. **${rec.title}** (${rec.priority} priority)
   - ${rec.description}
   - Complexity: ${rec.complexity}, Impact: ${rec.impact}
   - Category: ${rec.category}`,
  )
  .join("\n\n")}

---

*Analysis completed by Analyzer Agent*
`;

    // Read existing log
    let existingContent = "";
    if (fs.existsSync(this.refactoringLog)) {
      existingContent = fs.readFileSync(this.refactoringLog, "utf8");
    }

    // Write updated log
    fs.writeFileSync(this.refactoringLog, existingContent + summary);
  }
}

// Run the analyzer if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new AnalyzerAgent();
  analyzer.analyzeSystem().then((result) => {
    console.log("Analysis result:", result);
    process.exit(result.success ? 0 : 1);
  });
}

export default AnalyzerAgent;
