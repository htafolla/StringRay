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
    const postCommitHook = path.join(hooksDir, "post-commit");
    const postPushHook = path.join(hooksDir, "post-push");

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Install post-commit hook
    this.installHook(postCommitHook, "post-commit");
    this.installHook(postPushHook, "post-push");

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
  if command -v node >/dev/null 2>&1; then
    node -e "
      const { PostProcessor } = require('./src/postprocessor/PostProcessor.js');
      const context = {
        commitSha: '$COMMIT_SHA',
        repository: '$REPO',
        branch: '$BRANCH',
        author: '$AUTHOR',
        files: '$FILES'.split('\n').filter(f => f.trim()),
        trigger: 'git-hook'
      };
      console.log('🚀 Post-processor triggered for commit:', context.commitSha);
      // Initialize and run post-processor
      const pp = new PostProcessor();
      pp.executePostProcessorLoop(context).catch(console.error);
    " &
  else
    echo "Warning: Node.js not found, skipping post-processor"
  fi
) >/dev/null 2>&1 &

# Don't wait for background process
exit 0
`;
  }

  async triggerPostProcessor(context: PostProcessorContext): Promise<void> {
    await this.postProcessor.executePostProcessorLoop(context);
  }
}
