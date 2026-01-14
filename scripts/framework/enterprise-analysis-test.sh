#!/bin/bash

# StrRay Framework - Enterprise System Analysis Operation
# Triggers maximum complexity score (>95) with comprehensive multi-agent analysis

set -e

echo "🚀 ENTERPRISE SYSTEM ANALYSIS - MAXIMUM COMPLEXITY TEST"
echo "======================================================"

# Function to log with timestamp
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to log success
success() {
    echo -e "✅ $1"
}

# Function to log analysis
analysis() {
    echo -e "🔍 $1"
}

# Create enterprise-level analysis request
create_enterprise_analysis() {
    echo ""
    log "Creating Enterprise System Analysis Request..."

    # This operation will trigger maximum complexity:
    # - 50+ files affected (distributed system)
    # - 2000+ lines changed (major refactoring)
    # - 20+ dependencies (highly interconnected)
    # - Critical risk level (system-wide impact)
    # - 1440 minutes (24 hours - major undertaking)
    # - Requires analyzer + multiple specialist agents

    node -e "
    (async () => {
      try {
        const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
        const { StrRayStateManager } = await import('./dist/state/state-manager.js');

        const stateManager = new StrRayStateManager();
        const delegator = createAgentDelegator(stateManager);

        console.log('🎯 INITIATING ENTERPRISE SYSTEM ANALYSIS');
        console.log('Operation: comprehensive-system-analysis');
        console.log('Scope: Complete framework evaluation and optimization');
        console.log('');

        const analysisRequest = {
          operation: 'comprehensive-system-analysis',
          description: 'Complete enterprise-level system analysis including performance optimization, security audit, code quality assessment, architectural review, and refactoring recommendations. Requires coordination of all specialized agents for comprehensive evaluation.',
          context: {
            fileCount: 50,        // Distributed across entire framework
            changeVolume: 2000,   // Major system-wide changes
            dependencies: 25,     // Highly interconnected components
            riskLevel: 'critical', // System-wide impact
            estimatedDuration: 1440, // 24 hours - enterprise undertaking
            analysisScope: 'full-framework',
            requiredCapabilities: [
              'performance-analysis',
              'security-audit',
              'code-quality-assessment',
              'architectural-review',
              'refactoring-analysis',
              'system-optimization'
            ]
          },
          priority: 'critical'
        };

        console.log('📊 ANALYSIS PARAMETERS:');
        console.log('   Files:', analysisRequest.context.fileCount);
        console.log('   Changes:', analysisRequest.context.changeVolume, 'lines');
        console.log('   Dependencies:', analysisRequest.context.dependencies);
        console.log('   Risk:', analysisRequest.context.riskLevel);
        console.log('   Duration:', analysisRequest.context.estimatedDuration, 'minutes');
        console.log('');

        const delegation = await delegator.analyzeDelegation(analysisRequest);

        console.log('🎯 DELEGATION ANALYSIS RESULT:');
        console.log('   Strategy:', delegation.strategy);
        console.log('   Agents:', delegation.agents.length, '-', delegation.agents.join(', '));
        console.log('   Complexity Score:', delegation.complexity.score);
        console.log('   Complexity Level:', delegation.complexity.level);
        console.log('   Reasoning:', delegation.complexity.reasoning.join('; '));
        console.log('');

        if (delegation.complexity.score > 95 && delegation.strategy === 'orchestrator-led') {
          console.log('✅ ENTERPRISE COMPLEXITY ACHIEVED!');
          console.log('   Score > 95: ✅');
          console.log('   Orchestrator-led strategy: ✅');
          console.log('   Multiple agents coordinated: ✅');
        } else {
          console.log('❌ Enterprise complexity not achieved');
          console.log('   Score needs to be > 95, got:', delegation.complexity.score);
        }

        // Execute the enterprise analysis
        console.log('');
        console.log('🚀 EXECUTING ENTERPRISE ANALYSIS...');

        const result = await delegator.executeDelegation(delegation, analysisRequest);

        console.log('📋 EXECUTION COMPLETE');
        console.log('   Duration:', result ? 'Completed' : 'Failed');

      } catch (error) {
        console.log('❌ Enterprise analysis failed:', error.message);
      }
    })();
    " 2>/dev/null
}

# Monitor the analysis logs
monitor_analysis_logs() {
    echo ""
    log "Monitoring Analysis Execution Logs..."

    # Wait a moment for logs to be written
    sleep 2

    echo "Recent Framework Activity:"
    tail -10 .opencode/logs/framework-activity.log 2>/dev/null | grep -E "(analyzer|orchestrator|delegation)" | tail -5 || echo "   No recent analysis logs"

    echo ""
    echo "Complexity Analysis Logs:"
    grep -E "(complexity|reasoning|strategy)" .opencode/logs/framework-activity.log 2>/dev/null | tail -3 || echo "   No complexity logs found"
}

# Check refactoring log updates
check_refactoring_log() {
    echo ""
    log "Checking REFACTORING_LOG.md Updates..."

    if [ -f "REFACTORING_LOG.md" ]; then
        echo "REFACTORING_LOG.md exists:"
        wc -l REFACTORING_LOG.md
        echo "Recent entries:"
        tail -10 REFACTORING_LOG.md 2>/dev/null || echo "   No entries found"
    else
        echo "❌ REFACTORING_LOG.md not found"
    fi
}

# Main execution
main() {
    log "Starting Enterprise System Analysis Test..."

    create_enterprise_analysis
    monitor_analysis_logs
    check_refactoring_log

    echo ""
    echo "🎯 Enterprise System Analysis Complete"
    echo "======================================"
    echo ""
    analysis "Test Results:"
    analysis "- Complexity Score Target: >95 (Enterprise level)"
    analysis "- Strategy Target: orchestrator-led (Multi-agent coordination)"
    analysis "- Agent Count Target: 3+ agents for comprehensive analysis"
    echo ""
    success "Enterprise complexity test completed!"
    echo ""
    info "This operation demonstrates the framework's ability to handle"
    info "maximum-complexity enterprise tasks requiring full agent orchestration."
}

# Run main function
main "$@"