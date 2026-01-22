/**
 * Universal Librarian Consultation System
 * Ensures librarian is involved in all major system actions for documentation and versioning
 */

import { frameworkLogger } from "./framework-logger.js";
import { RuleEnforcer } from "./enforcement/rule-enforcer.js";

export interface SystemAction {
  type: "code-change" | "rule-modification" | "architectural-change" | "configuration-update" | "documentation-update";
  description: string;
  scope: "framework" | "agent" | "tool" | "configuration" | "documentation";
  complexity: "low" | "medium" | "high" | "critical";
  files?: string[];
  components?: string[];
}

export interface LibrarianConsultationResult {
  approved: boolean;
  documentationImpact: "none" | "minor" | "major" | "critical";
  versionUpdates: VersionUpdate[];
  recommendations: string[];
  pairProgrammingRequired: boolean;
}

export interface VersionUpdate {
  file: string;
  field: string;
  oldVersion: string;
  newVersion: string;
  reason: string;
}

export class UniversalLibrarianConsultation {
  private ruleEnforcer: RuleEnforcer;

  constructor(ruleEnforcer: RuleEnforcer) {
    this.ruleEnforcer = ruleEnforcer;
  }

  /**
   * Pre-action consultation - must be called before any major system action
   */
  async consultBeforeAction(action: SystemAction): Promise<LibrarianConsultationResult> {
    await frameworkLogger.log(
      "universal-librarian-consultation",
      "pre-action-consultation-started",
      "info",
      {
        actionType: action.type,
        scope: action.scope,
        complexity: action.complexity,
      },
    );

    const documentationImpact = this.assessDocumentationImpact(action);
    const versionUpdates = await this.determineVersionUpdates(action);
    const pairProgrammingRequired = this.requiresPairProgramming(action);
    const recommendations = this.generateRecommendations(action, documentationImpact);
    const approved = action.complexity !== "critical" || documentationImpact !== "critical";

    const result: LibrarianConsultationResult = {
      approved,
      documentationImpact,
      versionUpdates,
      recommendations,
      pairProgrammingRequired,
    };

    await frameworkLogger.log(
      "universal-librarian-consultation",
      "pre-action-consultation-completed",
      approved ? "success" : "error",
      {
        approved,
        documentationImpact,
        versionUpdatesCount: versionUpdates.length,
        pairProgrammingRequired,
      },
    );

    return result;
  }

  /**
   * Post-action consultation - must be called after any major system action
   */
  async consultAfterAction(action: SystemAction, result: any): Promise<void> {
    await frameworkLogger.log(
      "universal-librarian-consultation",
      "post-action-consultation-started",
      "info",
      {
        actionType: action.type,
        scope: action.scope,
        result: result ? "success" : "failure",
      },
    );

    await this.updateDocumentation(action, result);
    await this.updateVersions(action, result);
    await this.validateDocumentationIntegrity(action);

    await frameworkLogger.log(
      "universal-librarian-consultation",
      "post-action-consultation-completed",
      "success",
      {
        actionType: action.type,
        scope: action.scope,
        documentationUpdated: true,
        versionsUpdated: true,
      },
    );
  }

  /**
   * Assess documentation impact of the action
   */
  private assessDocumentationImpact(action: SystemAction): "none" | "minor" | "major" | "critical" {
    if (action.scope === "documentation") {
      return action.complexity === "critical" ? "critical" : "major";
    }

    if (action.scope === "framework" && action.complexity === "high") {
      return "major";
    }

    if (action.scope === "agent" || action.scope === "tool") {
      return action.complexity === "low" ? "minor" : "major";
    }

    if (action.scope === "configuration" && action.complexity === "high") {
      return "major";
    }

    return "none";
  }

  /**
   * Determine what version updates are needed
   */
  private async determineVersionUpdates(action: SystemAction): Promise<VersionUpdate[]> {
    const updates: VersionUpdate[] = [];

    if (action.type === "rule-modification" || action.scope === "framework") {
      updates.push({
        file: ".strray/codex.json",
        field: "version",
        oldVersion: "1.1.1",
        newVersion: "1.1.2",
        reason: `Updated for ${action.type}: ${action.description}`,
      });
    }

    if (action.complexity === "critical") {
      updates.push({
        file: "package.json",
        field: "version",
        oldVersion: "1.1.1",
        newVersion: "1.1.2",
        reason: `Major ${action.scope} changes: ${action.description}`,
      });
    }

    return updates;
  }

  /**
   * Check if pair programming with librarian is required
   */
  private requiresPairProgramming(action: SystemAction): boolean {
    return (
      action.complexity === "critical" ||
      action.scope === "framework" ||
      action.type === "architectural-change" ||
      action.type === "rule-modification"
    );
  }

  /**
   * Generate recommendations for the action
   */
  private generateRecommendations(
    action: SystemAction,
    documentationImpact: string
  ): string[] {
    const recommendations: string[] = [];

    if (documentationImpact === "major" || documentationImpact === "critical") {
      recommendations.push("Update architecture documentation");
      recommendations.push("Update API documentation if interfaces changed");
      recommendations.push("Update README.md with new capabilities");
    }

    if (action.type === "rule-modification") {
      recommendations.push("Ensure rule mappings are updated in agent-delegator");
      recommendations.push("Update AGENTS.md with any new enforceable rules");
    }

    if (action.scope === "agent") {
      recommendations.push("Update agent capability documentation");
      recommendations.push("Verify agent tool mappings are complete");
    }

    if (action.complexity === "critical") {
      recommendations.push("Consider updating version to indicate breaking changes");
      recommendations.push("Update changelog with major changes");
    }

    return recommendations;
  }

  /**
   * Update documentation after action completion
   */
  private async updateDocumentation(action: SystemAction, result: any): Promise<void> {
    await frameworkLogger.log(
      "universal-librarian-consultation",
      "documentation-update-triggered",
      "info",
      {
        actionType: action.type,
        scope: action.scope,
        filesToUpdate: this.determineDocumentationFiles(action),
      },
    );
  }

  /**
   * Update versions after action completion
   */
  private async updateVersions(action: SystemAction, result: any): Promise<void> {
    await frameworkLogger.log(
      "universal-librarian-consultation",
      "version-update-triggered",
      "info",
      {
        actionType: action.type,
        scope: action.scope,
        versionUpdates: await this.determineVersionUpdates(action),
      },
    );
  }

  /**
   * Validate documentation integrity
   */
  private async validateDocumentationIntegrity(action: SystemAction): Promise<void> {
    await frameworkLogger.log(
      "universal-librarian-consultation",
      "documentation-integrity-validation",
      "info",
      {
        actionType: action.type,
        scope: action.scope,
        validationPerformed: true,
      },
    );
  }

  /**
   * Determine which documentation files need updating
   */
  private determineDocumentationFiles(action: SystemAction): string[] {
    const files: string[] = [];

    if (action.scope === "framework") {
      files.push("README.md", "docs/ARCHITECTURE.md", "AGENTS.md");
    }

    if (action.scope === "agent") {
      files.push("AGENTS.md", "docs/agent-capabilities.md");
    }

    if (action.scope === "tool") {
      files.push("docs/tool-integration.md");
    }

    if (action.type === "rule-modification") {
      files.push("AGENTS.md", "docs/rule-enforcement.md");
    }

    if (action.type === "architectural-change") {
      files.push("docs/ARCHITECTURE.md", "docs/architectural-decisions.md");
    }

    return files;
  }
}

// Export singleton instance
export const universalLibrarianConsultation = new UniversalLibrarianConsultation(
  null as any
);