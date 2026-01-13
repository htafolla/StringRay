/**
 * Git Hook Trigger for Post-Processor
 */

import { PostProcessor } from "../PostProcessor.js";
import { PostProcessorContext } from "../types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export class GitHookTrigger {
  private initialized = false;

  constructor(private postProcessor: PostProcessor) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const hooksDir = path.join(process.cwd(), ".opencode", "hooks");
    const gitHooksDir = path.join(process.cwd(), ".git", "hooks");
    const postCommitHook = path.join(hooksDir, "post-commit");
    const postPushHook = path.join(hooksDir, "post-push");

    // Ensure our hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Ensure .git/hooks directory exists (should exist in git repo)
    if (!fs.existsSync(gitHooksDir)) {
      console.warn("⚠️ .git/hooks directory not found - not a git repository or hooks disabled");
      return;
    }

    // Install hooks in our directory first
    this.installHook(postCommitHook, "post-commit");
    this.installHook(postPushHook, "post-push");

    // Create symlinks in .git/hooks to activate them
    this.activateGitHooks(gitHooksDir, postCommitHook, postPushHook);

    this.initialized = true;
  }

  private installHook(hookPath: string, hookType: string): void {
    const hookContent = this.generateHookScript(hookType);

    // Check if hook already exists and has our content
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, "utf8");
      if (existing.includes("postprocessor-trigger")) {
        return; // Already installed
      }
      // Backup existing hook
      fs.renameSync(hookPath, `${hookPath}.backup`);
    }

    fs.writeFileSync(hookPath, hookContent);
    fs.chmodSync(hookPath, "755");
  }

  private generateHookScript(hookType: string): string {
    return `#!/bin/bash
# StrRay Post-Processor ${hookType} Hook
# Automatically triggers post-processor after ${hookType}

# Get commit SHA
if [ "$hookType" = "post-commit" ]; then
  COMMIT_SHA=$(git rev-parse HEAD)
elif [ "$hookType" = "post-push" ]; then
  # For push hooks, we need to parse the pushed refs
  while read local_ref local_sha remote_ref remote_sha; do
    if [ "$local_sha" != "0000000000000000000000000000000000000000" ]; then
      COMMIT_SHA=$local_sha
      break
    fi
  done
else
  COMMIT_SHA=$(git rev-parse HEAD)
fi

if [ -z "$COMMIT_SHA" ]; then
  echo "Warning: Could not determine commit SHA for post-processor"
  exit 0
fi

# Get repository info
REPO="strray-framework/stringray"  # Placeholder for now
BRANCH=$(git rev-parse --abbrev-ref HEAD)
AUTHOR=$(git log -1 --pretty=format:'%an <%ae>')

# Get changed files
FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached)

# Trigger post-processor asynchronously (don't block git operations)
(
  cd "$(dirname "$0")/../.." # Navigate to project root

  # Find the StrRay plugin in node_modules
  STRRAY_PLUGIN=""
  if [ -d "node_modules/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/strray-framework"
  elif [ -d "node_modules/@strray/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/@strray/strray-framework"
  elif [ -d "node_modules/oh-my-opencode/plugins/strray-framework" ]; then
    STRRAY_PLUGIN="node_modules/oh-my-opencode/plugins/strray-framework"
  fi

  if command -v node >/dev/null 2>&1 && [ -n "$STRRAY_PLUGIN" ]; then
    node -e "
      // Dynamic import for ES modules
      async function runPostProcessor() {
        try {
          const { PostProcessor } = await import('./$STRRAY_PLUGIN/dist/postprocessor/PostProcessor.js');
          const context = {
            commitSha: '$COMMIT_SHA',
            repository: '$REPO',
            branch: '$BRANCH',
            author: '$AUTHOR',
            files: '$FILES'.split('\n').filter(f => f.trim()),
            trigger: 'git-hook'
          };
          console.log('🚀 Post-processor triggered for commit:', context.commitSha);

          // Initialize and run post-processor with minimal config
          const pp = new PostProcessor(
            undefined, // stateManager - will be created internally
            undefined, // sessionMonitor - will be created internally
            {
              triggers: { gitHooks: false, webhooks: false, api: false },
              monitoring: { enabled: true, interval: 30000, timeout: 3600000 },
              autoFix: { enabled: false, confidenceThreshold: 0.8, maxAttempts: 3 },
              escalation: { manualInterventionThreshold: 2, rollbackThreshold: 3, emergencyThreshold: 5 },
              redeploy: { maxRetries: 3, retryDelay: 30000, backoffStrategy: 'exponential', canaryEnabled: true, canaryPhases: 3, canaryTrafficIncrement: 25, healthCheckTimeout: 60000, rollbackOnFailure: true },
              success: { successConfirmation: true, cleanupEnabled: true, notificationEnabled: true, metricsCollection: true }
            }
          );

          await pp.initialize();
          await pp.executePostProcessorLoop(context);
        } catch (error) {
          console.error('❌ Post-processor failed:', error);
        }
      }

      runPostProcessor();
    " &
  else
    echo "Warning: StrRay plugin not found or Node.js not available, skipping post-processor"
  fi
) >/dev/null 2>&1 &

# Don't wait for background process
exit 0
`;
  }

  private activateGitHooks(
    gitHooksDir: string,
    postCommitHook: string,
    postPushHook: string
  ): void {
    try {
      // Define the target hook paths in .git/hooks
      const gitPostCommitHook = path.join(gitHooksDir, "post-commit");
      const gitPostPushHook = path.join(gitHooksDir, "post-push");

      // Create relative symlinks from .git/hooks to our hooks
      const relativePostCommit = path.relative(gitHooksDir, postCommitHook);
      const relativePostPush = path.relative(gitHooksDir, postPushHook);

      // Handle existing hooks by backing them up
      this.backupExistingHook(gitPostCommitHook);
      this.backupExistingHook(gitPostPushHook);

      // Create symlinks to activate our hooks
      fs.symlinkSync(relativePostCommit, gitPostCommitHook);
      fs.symlinkSync(relativePostPush, gitPostPushHook);

    } catch (error) {
      console.error("❌ Failed to activate git hooks:", error);
      console.log("💡 To activate manually, run:");
      console.log(`   ln -s "../../.opencode/hooks/post-commit" ".git/hooks/post-commit"`);
      console.log(`   ln -s "../../.opencode/hooks/post-push" ".git/hooks/post-push"`);
    }
  }

  private backupExistingHook(hookPath: string): void {
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, "utf8");
      if (!existing.includes("postprocessor-trigger")) {
        // Backup non-postprocessor hooks
        fs.renameSync(hookPath, `${hookPath}.backup`);
      } else {
        // Remove our existing symlink
        fs.unlinkSync(hookPath);
      }
    }
  }

  async triggerPostProcessor(context: PostProcessorContext): Promise<void> {
    await this.postProcessor.executePostProcessorLoop(context);
  }
}
