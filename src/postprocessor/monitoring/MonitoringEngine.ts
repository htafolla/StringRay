/**
 * Post-Processor Monitoring Engine
 */

import { StringRayStateManager } from "../../state/state-manager.js";
import { frameworkLogger } from "../../core/framework-logger.js";
import { SessionMonitor } from "../../session/session-monitor.js";
import { MonitoringResult } from "../types.js";

export interface CIStatus {
  status: "success" | "failure" | "running";
  failedJobs: string[];
  totalJobs: number;
  duration: number;
}

export interface PerformanceStatus {
  status: "passed" | "failed" | "warning";
  score: number;
  regressions: string[];
  duration: number;
}

export interface SecurityStatus {
  status: "passed" | "failed" | "warning";
  vulnerabilities: number;
  criticalVulnerabilities: number;
  scanDuration: number;
}

export class PostProcessorMonitoringEngine {
  constructor(
    private stateManager: StringRayStateManager,
    private sessionMonitor?: SessionMonitor,
  ) {}

  async initialize(): Promise<void> {
    // Initialize monitoring components
    await frameworkLogger.log("monitoring-engine", "initialized", "info");
  }

  async monitorDeployment(commitSha: string): Promise<MonitoringResult> {
    const jobId = `monitoring-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const startTime = Date.now();

    // Check CI/CD status using existing github-actions-monitor
    const ciStatus = await this.checkCIStatus(commitSha);

    // Check performance metrics
    const performanceStatus = await this.checkPerformanceStatus(commitSha);

    // Check security status
    const securityStatus = await this.checkSecurityStatus(commitSha);

    const overallStatus = this.determineOverallStatus(
      ciStatus,
      performanceStatus,
      securityStatus,
    );

    return {
      commitSha,
      overallStatus,
      timestamp: new Date(),
      ciStatus,
      performanceStatus,
      securityStatus,
      failedJobs: ciStatus.failedJobs,
      duration: Date.now() - startTime,
    };
  }

  private async checkCIStatus(commitSha: string): Promise<CIStatus> {
    // Use existing GitHub Actions monitor
    try {
      const { execSync } = await import("child_process");
      const output = execSync(
        `node scripts/node/github-actions-monitor.cjs --commit ${commitSha}`,
        {
          encoding: "utf8",
          timeout: 30000,
        },
      );

      // Parse the output to determine status
      if (
        output.includes("SUCCESS") ||
        output.includes("All workflows passed")
      ) {
        return { status: "success", failedJobs: [], totalJobs: 1, duration: 0 };
      } else if (output.includes("FAILURE") || output.includes("failed")) {
        return { status: "failure", failedJobs: ["ci-pipeline"], totalJobs: 1, duration: 0 };
      } else {
        return { status: "running", failedJobs: [], totalJobs: 1, duration: 0 };
      }
    } catch (error) {
      return {
        status: "failure",
        failedJobs: ["ci-pipeline"],
        totalJobs: 1,
        duration: 0,
      };
    }
  }

  private async checkPerformanceStatus(_commitSha: string): Promise<PerformanceStatus> {
    // Check if performance tests passed
    try {
      const { execSync } = await import("child_process");
      execSync("npm run test:performance", {
        encoding: "utf8",
        timeout: 120000,
      });
      return { status: "passed", score: 1.0, regressions: [], duration: 0 };
    } catch (error) {
      return {
        status: "failed",
        score: 0.0,
        regressions: ["performance-tests"],
        duration: 0,
      };
    }
  }

  private async checkSecurityStatus(_commitSha: string): Promise<SecurityStatus> {
    // Check for security issues
    try {
      const { execSync } = await import("child_process");
      execSync("npm run security-audit", {
        encoding: "utf8",
        timeout: 60000,
      });
      return {
        status: "passed",
        vulnerabilities: 0,
        criticalVulnerabilities: 0,
        scanDuration: 0,
      };
    } catch (error) {
      return {
        status: "failed",
        vulnerabilities: 1,
        criticalVulnerabilities: 1,
        scanDuration: 0,
      };
    }
  }

  private determineOverallStatus(
    ci: CIStatus,
    performance: PerformanceStatus,
    security: SecurityStatus,
  ): "success" | "failure" | "running" {
    if (ci.status === "failure" || performance.status === "failed") {
      return "failure";
    }
    if (ci.status === "running") {
      return "running";
    }
    return "success";
  }

  async getStatus(): Promise<{ monitoringEnabled: boolean; activeSessions: number; lastCheck: Date }> {
    return {
      monitoringEnabled: true,
      activeSessions: 0, // Placeholder
      lastCheck: new Date(),
    };
  }
}
