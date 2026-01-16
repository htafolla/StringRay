#!/bin/bash

# Multi-Agent Orchestration Validator
echo "🔍 Multi-Agent Orchestration System Validator"
echo "=============================================="

# Test 1: Agent Configuration Validation
echo ""
echo "1️⃣ Testing Agent Configurations..."
# Check all agents with complete configurations
AGENTS=("enforcer" "architect" "test-architect" "bug-triage-specialist" "code-reviewer" "security-auditor" "refactorer" "librarian" "explore" "oracle" "multimodal-looker" "frontend-ui-ux-engineer" "document-writer")
MISSING_AGENTS=()
INVALID_AGENTS=()

for agent in "${AGENTS[@]}"; do
    # Detect if we're in .opencode directory or parent directory
    if [ -f "agents/${agent}.md" ]; then
        AGENT_MD_PATH="agents/${agent}.md"
    elif [ -f ".opencode/agents/${agent}.md" ]; then
        AGENT_MD_PATH=".opencode/agents/${agent}.md"
    else
        MISSING_AGENTS+=("$agent")
        continue
    fi

    if [ -f "agents/${agent}.yml" ]; then
        AGENT_YML_PATH="agents/${agent}.yml"
    elif [ -f ".opencode/agents/${agent}.yml" ]; then
        AGENT_YML_PATH=".opencode/agents/${agent}.yml"
    else
        MISSING_AGENTS+=("${agent}.yml")
        continue
    fi

    # Check if YAML has required fields
    if [ -f "$AGENT_YML_PATH" ]; then
        if ! grep -q "capabilities:" "$AGENT_YML_PATH"; then
            INVALID_AGENTS+=("$agent.yml (missing capabilities)")
        fi
        if ! grep -q "model:" "$AGENT_YML_PATH"; then
            INVALID_AGENTS+=("$agent.yml (missing model)")
        fi
    fi
done

if [ ${#MISSING_AGENTS[@]} -eq 0 ]; then
    echo "✅ All agent configuration files present"
else
    echo "❌ Missing agent configurations: ${MISSING_AGENTS[*]}"
fi

if [ ${#INVALID_AGENTS[@]} -eq 0 ]; then
    echo "✅ All agent configurations are valid"
else
    echo "❌ Invalid agent configurations: ${INVALID_AGENTS[*]}"
fi

# Test 2: Multi-Agent Configuration
echo ""
echo "2️⃣ Testing Multi-Agent Orchestration Configuration..."

# Detect if we're in .opencode directory or parent directory
if [ -f "oh-my-opencode.json" ]; then
    CONFIG_FILE="oh-my-opencode.json"
elif [ -f ".opencode/oh-my-opencode.json" ]; then
    CONFIG_FILE=".opencode/oh-my-opencode.json"
else
    echo "❌ oh-my-opencode.json not found"
    return 1
fi

if grep -q '"enabled": true' "$CONFIG_FILE" && grep -q '"multi_agent_orchestration"' "$CONFIG_FILE"; then
    echo "✅ Multi-agent orchestration is enabled"
else
    echo "❌ Multi-agent orchestration is not enabled"
fi

if grep -q '"max_concurrent_agents": 5' "$CONFIG_FILE"; then
    echo "✅ Max concurrent agents set correctly (5)"
else
    echo "❌ Max concurrent agents not set correctly"
fi

# Test 3: Agent Delegation System
echo ""
echo "3️⃣ Testing Agent Delegation System..."
node -e "
(async () => {
  try {
    const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
    const { StrRayStateManager } = await import('./dist/state/state-manager.js');

    const stateManager = new StrRayStateManager();
    const delegator = createAgentDelegator(stateManager);

    // Test delegation analysis
    const result = await delegator.analyzeDelegation({
      operation: 'test-strategy',
      description: 'Test delegation analysis',
      context: { test: true },
      priority: 'medium'
    });

    console.log('✅ Agent delegation system operational');
    console.log('   Strategy:', result.strategy);
    console.log('   Agents selected:', result.agents.length);

    // Test agent capabilities
    const capabilities = delegator.getDelegationMetrics();
    console.log('✅ Agent capabilities loaded');
    console.log('   Total delegations tracked:', capabilities.totalDelegations);

  } catch (error) {
    console.log('❌ Agent delegation system error:', error.message);
  }
})();
" 2>/dev/null

# Test 4: Agent Event Handling
echo ""
echo "4️⃣ Testing Agent Event Handling..."
node -e "
(async () => {
  try {
    const { createAgentDelegator } = await import('./dist/delegation/agent-delegator.js');
    const { StrRayStateManager } = await import('./dist/state/state-manager.js');

    const stateManager = new StrRayStateManager();
    const delegator = createAgentDelegator(stateManager);

    // Test file creation handling
    await delegator.handleFileCreation('test-file.ts', 'console.log(\"test\");');

    console.log('✅ File creation event handling operational');
    console.log('   Test architect should have been consulted for .ts file');

  } catch (error) {
    console.log('❌ File creation event handling error:', error.message);
  }
})();
" 2>/dev/null

# Test 5: Memory Integration
echo ""
echo "5️⃣ Testing Memory System Integration..."
node -e "
(async () => {
  try {
    const { memoryMonitor } = await import('./dist/monitoring/memory-monitor.js');

    const stats = memoryMonitor.getCurrentStats();
    const summary = memoryMonitor.getSummary();

    console.log('✅ Memory monitoring integrated');
    console.log('   Current heap usage:', stats.heapUsed.toFixed(2), 'MB');
    console.log('   Memory trend:', summary.trend);

  } catch (error) {
    console.log('❌ Memory system integration error:', error.message);
  }
})();
" 2>/dev/null

# Test 6: Framework Boot Integration
echo ""
echo "6️⃣ Testing Framework Boot Integration..."
if [ -f "logs/framework/activity.log" ]; then
    if grep -q "agent-delegator" logs/framework/activity.log; then
        echo "✅ Agent delegator integrated with framework boot"
    else
        echo "❌ Agent delegator not found in framework logs"
    fi

    if grep -q "multi-agent" logs/framework/activity.log; then
        echo "✅ Multi-agent orchestration active in framework"
    else
        echo "❌ Multi-agent orchestration not active"
    fi
else
    echo "❌ Framework activity log not found"
fi

echo ""
echo "🎯 Multi-Agent Orchestration Validation Complete"
echo "=================================================="
echo ""
echo "Summary:"
echo "- Agent configurations: $([ ${#MISSING_AGENTS[@]} -eq 0 ] && echo "✅ Valid" || echo "❌ Issues found")"
echo "- Multi-agent config: $(grep -q '"enabled": true' .opencode/oh-my-opencode.json && echo "✅ Enabled" || echo "❌ Disabled")"
echo "- Delegation system: $(node -e "(async()=>{try{const{d}=await import('./dist/delegation/agent-delegator.js');const s=new(await import('./dist/state/state-manager.js')).StrRayStateManager();const d2=d.createAgentDelegator(s);await d2.analyzeDelegation({operation:'test',description:'test',context:{}});console.log('✅ Working')}catch(e){console.log('❌ Error')}})();" 2>/dev/null)"
echo ""
echo "Next steps:"
echo "- Run 'npm run framework:init' to test full system integration"
echo "- Monitor .opencode/logs/ for agent delegation activity"
echo "- Use 'npm run memory:dashboard' to verify memory monitoring"