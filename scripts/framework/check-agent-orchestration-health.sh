#!/bin/bash

# Agent Orchestration Health Check
echo "🏥 Agent Orchestration Health Check"
echo "===================================="

# Check if agents are properly loaded
echo ""
echo "🤖 Agent Status Check:"
AGENTS=("enforcer" "architect" "test-architect" "bug-triage-specialist" "code-reviewer" "security-auditor" "refactorer")

for agent in "${AGENTS[@]}"; do
    if [ -f ".opencode/agents/${agent}.yml" ]; then
        STATUS="✅"
        MODEL=$(grep "model:" ".opencode/agents/${agent}.yml" | cut -d'"' -f2)
        echo "  $STATUS $agent ($MODEL)"
    else
        echo "  ❌ $agent (missing config)"
    fi
done

# Check delegation system
echo ""
echo "🎯 Delegation System Check:"
node -e "
(async () => {
  try {
    const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
    const { StrRayStateManager } = await import('./dist/state/state-manager.js');

    const stateManager = new StrRayStateManager();
    const delegator = createAgentDelegator(stateManager);

    const metrics = delegator.getDelegationMetrics();
    console.log('✅ Delegation system active');
    console.log('  Total delegations:', metrics.totalDelegations);
    console.log('  Successful rate:', metrics.totalDelegations > 0 ?
      ((metrics.successfulDelegations / metrics.totalDelegations) * 100).toFixed(1) + '%' : 'N/A');

  } catch (error) {
    console.log('❌ Delegation system error:', error.message);
  }
})();
" 2>/dev/null

# Check recent agent activity
echo ""
echo "📊 Recent Agent Activity:"
if [ -f "logs/framework/activity.log" ]; then
    # Look for recent delegation activity in last 100 lines
    RECENT_ACTIVITY=$(tail -100 logs/framework/activity.log | grep -c "agent-delegator\|delegation")

    if [ "$RECENT_ACTIVITY" -gt 0 ]; then
        echo "✅ Recent delegation activity detected ($RECENT_ACTIVITY events)"
        # Show last delegation event
        LAST_EVENT=$(tail -100 logs/framework/activity.log | grep -E "agent-delegator|delegation" | tail -1)
        if [ ! -z "$LAST_EVENT" ]; then
            TIMESTAMP=$(echo "$LAST_EVENT" | cut -d' ' -f1)
            MESSAGE=$(echo "$LAST_EVENT" | cut -d' ' -f3-)
            echo "  Last event: $TIMESTAMP - $MESSAGE"
        fi
    else
        echo "⚠️  No recent delegation activity (system may be idle)"
    fi
else
    echo "❌ Framework activity log not found"
fi

# Test file creation delegation
echo ""
echo "🆕 File Creation Delegation Test:"
# Create a test file to trigger delegation
TEST_FILE="test-agent-delegation-$(date +%s).ts"
echo "// Test file for agent delegation
export function testFunction() {
  return 'test';
}" > "$TEST_FILE"

echo "Created test file: $TEST_FILE"

# Give system time to detect and delegate
sleep 2

# Check if delegation occurred
if [ -f "logs/framework/activity.log" ]; then
    DELEGATION_EVENTS=$(tail -50 logs/framework/activity.log | grep -c "test-architect\|delegation\|handleFileCreation")

    if [ "$DELEGATION_EVENTS" -gt 0 ]; then
        echo "✅ File creation delegation triggered ($DELEGATION_EVENTS events)"
        echo "  Test Architect should have been consulted"
    else
        echo "❌ No delegation events detected for file creation"
        echo "  Agent orchestration may not be active"
    fi
else
    echo "❌ Cannot verify delegation (log file missing)"
fi

# Clean up test file
rm -f "$TEST_FILE"
echo "Cleaned up test file"

echo ""
echo "🏆 Orchestration Health Summary:"
echo "- Agents configured: $(ls .opencode/agents/*.yml 2>/dev/null | wc -l)/8"
echo "- Delegation system: $(node -e "(async()=>{try{const{d}=await import('./dist/delegation/agent-delegator.js');const s=new(await import('./dist/state/state-manager.js')).StrRayStateManager();d.createAgentDelegator(s);console.log('✅ Active')}catch(e){console.log('❌ Error')}})();" 2>/dev/null)"
echo "- File operations: $([ -f "logs/framework/activity.log" ] && echo "Monitored" || echo "Not monitored")"

echo ""
echo "💡 Recommendations:"
echo "- Run 'npm run framework:init' to ensure full system activation"
echo "- Monitor logs/framework/activity.log for delegation events"
echo "- Use 'npm run memory:dashboard' for comprehensive system health"