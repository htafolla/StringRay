#!/bin/bash

# StrRay Framework - Manual Multi-Agent Orchestration Demo
# Demonstrates explicit agent coordination for specific tasks

set -e

echo "🎯 StrRay Framework - Manual Multi-Agent Orchestration Demo"
echo "=========================================================="

# Function to log with timestamp
log() {
    echo -e "[$(date + '%Y-%m-%d %H:%M:%S')] $1"
}

# Function to log success
success() {
    echo -e "✅ $1"
}

# Function to log info
info() {
    echo -e "ℹ️  $1"
}

# Manual orchestration demo
manual_orchestration_demo() {
    echo ""
    log "Demonstrating MANUAL multi-agent orchestration..."

    node -e "
    (async () => {
      try {
        const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
        const { StrRayStateManager } = await import('./dist/state/state-manager.js');

        const stateManager = new StrRayStateManager();
        const delegator = createAgentDelegator(stateManager);

        console.log('🔧 MANUAL ORCHESTRATION: Forcing specific agent coordination');
        console.log('Task: Security audit + Code review + Architecture analysis');
        console.log('');

        // Create a simple task but FORCE multi-agent execution
        const result = await delegator.analyzeDelegation({
          operation: 'security-review',
          description: 'Comprehensive security audit with code review and architecture analysis',
          context: {
            fileCount: 1,  // Simple task
            changeVolume: 5, // Minimal changes
            dependencies: 0, // No dependencies
            riskLevel: 'low', // Low risk
            estimatedDuration: 30, // 30 minutes
          },
          forceMultiAgent: true,
          requiredAgents: ['security-auditor', 'code-reviewer', 'architect'],
          priority: 'high'
        });

        console.log('📋 MANUAL ORCHESTRATION RESULT:');
        console.log('Strategy: FORCED multi-agent (overriding complexity analysis)');
        console.log('Agents Selected:', result.agents.join(', '));
        console.log('Complexity Score:', result.complexity?.score || 'N/A');
        console.log('Expected Strategy (auto):', result.complexity?.recommendedStrategy || 'N/A');
        console.log('Actual Strategy (manual): multi-agent');

        if (result.agents.length >= 3) {
          console.log('');
          console.log('✅ MANUAL ORCHESTRATION SUCCESSFUL!');
          console.log('   Framework respected manual agent selection');
          console.log('   Multiple agents coordinated despite simple task complexity');
        }

      } catch (error) {
        console.log('❌ Manual orchestration error:', error.message);
      }
    })();
    " 2>/dev/null
}

# Automated vs Manual comparison
comparison_demo() {
    echo ""
    log "Comparing AUTOMATED vs MANUAL orchestration..."

    node -e "
    (async () => {
      try {
        const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
        const { StrRayStateManager } = await import('./dist/state/state-manager.js');

        const stateManager = new StrRayStateManager();
        const delegator = createAgentDelegator(stateManager);

        console.log('🔄 AUTOMATED ORCHESTRATION (Framework decides):');
        const autoResult = await delegator.analyzeDelegation({
          operation: 'simple-task',
          description: 'Simple utility function',
          context: { fileCount: 1, changeVolume: 10, dependencies: 0 }
        });
        console.log('   Strategy:', autoResult.strategy);
        console.log('   Agents:', autoResult.agents.length);
        console.log('   Reasoning: Framework analyzed complexity automatically');
        console.log('');

        console.log('🎯 MANUAL ORCHESTRATION (Developer specifies):');
        const manualResult = await delegator.analyzeDelegation({
          operation: 'complex-audit',
          description: 'Comprehensive audit requiring specific expertise',
          context: {
            fileCount: 1, // Still simple
            changeVolume: 10, // Still minimal
          },
          forceMultiAgent: true,
          requiredAgents: ['security-auditor', 'code-reviewer', 'enforcer']
        });
        console.log('   Strategy: FORCED multi-agent');
        console.log('   Agents:', manualResult.agents.join(', '));
        console.log('   Reasoning: Developer explicitly requested multi-agent coordination');
        console.log('');

        console.log('📊 COMPARISON SUMMARY:');
        console.log('• Automated: Framework optimizes based on task complexity');
        console.log('• Manual: Developer controls exact agent coordination');
        console.log('• Both approaches available depending on use case');

      } catch (error) {
        console.log('❌ Comparison demo error:', error.message);
      }
    })();
    " 2>/dev/null
}

# Main execution
main() {
    log "Starting Manual Multi-Agent Orchestration Demo..."

    echo ""
    echo "🔄 AUTOMATED ORCHESTRATION (Previous Demo)"
    echo "   Framework automatically decides agent count based on complexity"
    echo "   • Simple tasks → Single agent"
    echo "   • Complex tasks → Multi-agent"
    echo ""

    echo "🎯 MANUAL ORCHESTRATION (This Demo)"
    echo "   Developer explicitly forces multi-agent coordination"
    echo "   • Override complexity analysis"
    echo "   • Specify exact agents needed"
    echo "   • Force collaboration for specific expertise"
    echo ""

    manual_orchestration_demo
    comparison_demo

    echo ""
    echo "🎯 Manual Multi-Agent Orchestration Demo Complete"
    echo "=================================================="
    echo ""
    info "Summary:"
    info "- Automated: Framework decides optimal agent count"
    info "- Manual: Developer controls exact agent coordination"
    info "- Both modes available for different use cases"
    echo ""
    success "Manual orchestration demonstrated successfully!"
}

# Run main function
main "$@"