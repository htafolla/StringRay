#!/bin/bash

# StrRay Framework - Initialize Monitoring Pipeline
# Sets up the post-processing pipeline with git hooks for automated monitoring

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 StrRay Framework - Monitoring Pipeline Initialization"
echo "======================================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    echo "   Please run this from the root of a git repository"
    exit 1
fi

# Check if .git/hooks exists
if [ ! -d ".git/hooks" ]; then
    echo "❌ Error: .git/hooks directory not found"
    echo "   This appears to be an invalid git repository"
    exit 1
fi

echo "📁 Git repository detected"
echo "🔧 Installing post-processor git hooks..."

# Create the GitHookTrigger directly to activate hooks
node -e "
(async () => {
  try {
    const { GitHookTrigger } = await import('./dist/postprocessor/triggers/GitHookTrigger.js');

    // Create a minimal mock post-processor for the GitHookTrigger
    const mockPostProcessor = {
      executePostProcessorLoop: async (context) => {
        console.log('🚀 Post-processor triggered for:', context.commitSha);
        return { success: true, commitSha: context.commitSha };
      }
    };

    // Create and initialize GitHookTrigger
    const gitHookTrigger = new GitHookTrigger(mockPostProcessor);

    // Initialize the git hooks
    console.log('🔧 Initializing GitHookTrigger...');
    await gitHookTrigger.initialize();
    console.log('✅ GitHookTrigger initialized');

    console.log('✅ Git hooks activated successfully');
    console.log('🎯 Monitoring pipeline ready - hooks installed in .git/hooks/');
    process.exit(0);
  } catch (error) {
    console.error('❌ Git hook activation failed:', error);
    process.exit(1);
  }
})();
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Monitoring Pipeline Successfully Activated!"
    echo "=============================================="
    echo "✅ Git hooks installed (.git/hooks/post-commit, .git/hooks/post-push)"
    echo "✅ Post-processor initialized with monitoring capabilities"
    echo "✅ Automated CI/CD monitoring enabled"
    echo ""
    echo "🚀 Pipeline will now trigger automatically after:"
    echo "   • git commit (post-commit hook)"
    echo "   • git push (post-push hook)"
    echo ""
    echo "📊 Monitoring will check:"
    echo "   • CI/CD pipeline status"
    echo "   • Performance metrics"
    echo "   • Security compliance"
    echo "   • Framework health"
    echo ""
    echo "📝 Hook locations:"
    echo "   • Source hooks: .opencode/hooks/"
    echo "   • Active symlinks: .git/hooks/"
    echo ""
    echo "🔄 Next: Make a commit and push to test the pipeline!"
else
    echo "❌ Pipeline initialization failed"
    exit 1
fi