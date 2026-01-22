import {
  PreValidateContext,
  PostValidateContext,
  ProcessorHook,
} from "../processors/processor-types";
import { frameworkLogger } from "../framework-logger.js";
import * as fs from "fs/promises";

export interface ValidationHooks {
  preValidate: (data: unknown) => boolean;
  postValidate: (result: boolean) => void;
}

export interface ProcessorValidationHooks {
  preValidate: (context: PreValidateContext) => Promise<boolean>;
  postValidate: (context: PostValidateContext) => Promise<void>;
  registerProcessor: (hook: ProcessorHook) => void;
  unregisterProcessor: (name: string) => void;
}

export const useCodexValidation = (): ValidationHooks => {
  return {
    preValidate: (data: unknown) => typeof data === "object" && data !== null,
    postValidate: (result: boolean) => {
      // Post-validation logic
    },
  };
};

export interface CompactionDetectionContext {
  filesChanged: string[];
  agentName: string;
  operation: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface VersionValidationContext {
  filesChanged: string[];
  operation: string;
}

export const useVersionValidation = () => {
  const validateVersionConsistency = async (context: VersionValidationContext): Promise<boolean> => {
    try {
      // Read package.json to get official version
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
      const officialVersion = packageJson.version;

      let hasInconsistencies = false;

      // Check critical files for version consistency
      const criticalFiles = [
        'README.md',
        'AGENTS.md',
        'src/agents/orchestrator.ts',
        'src/agents/enforcer.ts',
        'src/agents/architect.ts'
      ];

      for (const file of criticalFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          // Simple version pattern matching
          const versionMatches = content.match(/\b\d+\.\d+\.\d+\b/g) || [];
          const conflictingVersions = versionMatches.filter((v: string) => v !== officialVersion);

          if (conflictingVersions.length > 0) {
            await frameworkLogger.log("version-validation", "inconsistent-versions-detected", "error", {
              file,
              officialVersion,
              conflictingVersions,
              operation: context.operation
            });
            hasInconsistencies = true;
          }
        } catch (error) {
          // File might not exist, skip
        }
      }

      if (hasInconsistencies) {
        await frameworkLogger.log("version-validation", "validation-failed", "error", {
          operation: context.operation,
          message: "Version inconsistencies found - run universal version manager"
        });
      }

      return !hasInconsistencies;
    } catch (error) {
      await frameworkLogger.log("version-validation", "validation-error", "error", {
        operation: context.operation,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  };

  return { validateVersionConsistency };
};

export const useCompactionPrevention = () => {
  const detectCompactionResearch = async (context: CompactionDetectionContext): Promise<boolean> => {
    const { filesChanged, agentName, operation, riskLevel } = context;

    // Compaction Research Detection Rules
    const isMassiveChange = filesChanged.length > 5;
    const isArchitecturalChange = filesChanged.some(file =>
      file.includes('architecture') ||
      file.includes('config') ||
      file.includes('core') ||
      file.includes('framework')
    );
    const isHighRisk = riskLevel === "critical" || riskLevel === "high";

    if (isMassiveChange || (isArchitecturalChange && isHighRisk)) {
      await frameworkLogger.log("compaction-detection", "compaction-research-detected", "error", {
        agentName,
        operation,
        filesChangedCount: filesChanged.length,
        riskLevel,
        filesChanged,
        isMassiveChange,
        isArchitecturalChange,
        isHighRisk
      });

      // Log immediate action requirements
      await frameworkLogger.log("compaction-detection", "immediate-action-required", "error", {
        action1: "STOP ALL CHANGES - Do not proceed with modifications",
        action2: "NOTIFY USER - Alert user of compaction research detection",
        action3: "REQUEST APPROVAL - Ask user to explicitly approve changes",
        action4: "PROVIDE ALTERNATIVES - Suggest surgical fixes instead"
      });

      return true; // Compaction detected
    }

    return false; // No compaction detected
  };

  return { detectCompactionResearch };
};

export const useProcessorValidation = (): ProcessorValidationHooks => {
  const registeredProcessors = new Map<string, ProcessorHook>();
  const compactionPrevention = useCompactionPrevention();
  const versionValidation = useVersionValidation();

  return {
    preValidate: async (context: PreValidateContext): Promise<boolean> => {
      // Check version consistency first
      if (context.operation) {
        const versionContext: VersionValidationContext = {
          filesChanged: context.filesChanged || [],
          operation: context.operation
        };

        const versionValid = await versionValidation.validateVersionConsistency(versionContext);
        if (!versionValid) {
          // Version inconsistencies found - log but don't block (warning only during development)
          console.warn('⚠️ Version inconsistencies detected - consider running version manager');
        }
      }

      // Check for compaction research before running other processors
      if (context.agentName && context.operation) {
        const compactionContext: CompactionDetectionContext = {
          filesChanged: context.filesChanged || [],
          agentName: context.agentName,
          operation: context.operation,
          riskLevel: context.riskLevel || "low"
        };

        if (await compactionPrevention.detectCompactionResearch(compactionContext)) {
          // Compaction detected - block the operation
          return false;
        }
      }

      for (const [name, processor] of registeredProcessors) {
        if (processor.enabled && processor.priority < 100) {
          try {
            await processor.execute(context);
          } catch (error) {
            console.error(`Pre-processor ${name} failed:`, error);
            return false;
          }
        }
      }
      return true;
    },

    postValidate: async (context: PostValidateContext): Promise<void> => {
      for (const [name, processor] of registeredProcessors) {
        if (processor.enabled && processor.priority >= 100) {
          try {
            await processor.execute(context);
          } catch (error) {
            console.warn(`Post-processor ${name} failed:`, error);
          }
        }
      }
    },

    registerProcessor: (hook: ProcessorHook): void => {
      registeredProcessors.set(hook.name, hook);
    },

    unregisterProcessor: (name: string): void => {
      registeredProcessors.delete(name);
    },
  };
};
