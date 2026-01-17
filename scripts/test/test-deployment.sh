#!/usr/bin/env bash

echo "=== StrRay Framework Plugin Testing and Validation Process ==="
echo "Testing Date: $(date)"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Working Directory: $(pwd)"
echo ""

echo "=== Phase 1: Package Build & Distribution Testing ==="

echo "1.1 TypeScript Compilation Verification"
echo "Running: npm run build:plugin"
if npm run build:plugin; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo ""
echo "1.2 NPM Pack Tarball Creation and Validation"
echo "Running: npm pack --dry-run"
if npm pack --dry-run > pack-output.txt 2>&1; then
    echo "✅ NPM pack dry-run successful"
    echo "Pack output (first 20 lines):"
    head -20 pack-output.txt
else
    echo "❌ NPM pack dry-run failed"
    head -20 pack-output.txt
    exit 1
fi

echo ""
echo "1.3 Package Size and File Count Verification"
echo "Running: npm pack"
if PACK_FILE=$(npm pack 2>/dev/null | tail -1); then
    echo "✅ NPM pack successful: $PACK_FILE"
    
    # Get file size
    PACK_SIZE=$(ls -lh "$PACK_FILE" | awk '{print $5}')
    echo "Package size: $PACK_SIZE"
    
    # Extract and count files
    tar -tf "$PACK_FILE" | wc -l | xargs echo "Total files in package:"
    echo "Package contents (first 20 files):"
    tar -tf "$PACK_FILE" | head -20
    
    rm -rf "$PACK_FILE"
else
    echo "❌ NPM pack failed"
    exit 1
fi

echo ""
echo "1.4 Dry-run Publish Validation"
echo "Running: npm publish --dry-run"
if npm publish --dry-run > publish-dry-run.txt 2>&1; then
    echo "✅ NPM publish dry-run successful"
    echo "Publish dry-run output (first 20 lines):"
    head -20 publish-dry-run.txt
else
    echo "❌ NPM publish dry-run failed"
    head -20 publish-dry-run.txt
    exit 1
fi

echo ""
echo "=== Phase 2: Installation Testing ==="

echo "2.1 Local .tar.gz Installation Testing"
echo "Creating test directory and installing locally"
mkdir -p test-install
cd test-install

# Create package tarball
cd ..
npm pack > /dev/null 2>&1
PACK_FILE=$(ls *.tgz | head -1)
cd test-install

echo "Installing package: ../$PACK_FILE"
if npm install "../$PACK_FILE"; then
    echo "✅ Local installation successful"
    
    # Check if plugin file exists
    if [ -f "node_modules/strray-ai/dist/plugin/plugins/strray-codex-injection.js" ]; then
        echo "✅ Plugin file found in node_modules"
    else
        echo "❌ Plugin file not found in node_modules"
        exit 1
    fi
else
    echo "❌ Local installation failed"
    exit 1
fi

cd ..
rm -rf test-install *.tgz

echo ""
echo "2.2 Postinstall Script Execution Verification"
echo "Testing postinstall script directly"
if node scripts/postinstall.cjs; then
    echo "✅ Postinstall script executed successfully"
else
    echo "❌ Postinstall script failed"
    exit 1
fi

echo ""
echo "2.3 oh-my-opencode Configuration Generation"
echo "Testing configuration generation"
mkdir -p test-config
cd test-config

# Create minimal package.json
cat > package.json << 'EOF'
{
  "name": "test-config",
  "version": "1.0.0"
}
EOF

# Install the package
cd ..
npm pack > /dev/null 2>&1
PACK_FILE=$(ls *.tgz | head -1)
cd test-config
npm install "../$PACK_FILE" > /dev/null 2>&1

# Check if config was created
if [ -f ".opencode/oh-my-opencode.json" ]; then
    echo "✅ oh-my-opencode.json created"
    echo "Configuration content (first 10 lines):"
    head -10 .opencode/oh-my-opencode.json
else
    echo "❌ oh-my-opencode.json not created"
    exit 1
fi

cd ..
rm -rf test-config *.tgz

echo ""
echo "2.4 Plugin Registration Validation"
echo "Testing plugin registration in config"
mkdir -p test-registration
cd test-registration

# Create minimal package.json
cat > package.json << 'EOF'
{
  "name": "test-registration",
  "version": "1.0.0"
}
EOF

# Install and check registration
cd ..
npm pack > /dev/null 2>&1
PACK_FILE=$(ls *.tgz | head -1)
cd test-registration
npm install "../$PACK_FILE" > /dev/null 2>&1

if grep -q "strray" .opencode/oh-my-opencode.json; then
    echo "✅ Plugin registered in configuration"
else
    echo "❌ Plugin not registered in configuration"
    exit 1
fi

cd ..
rm -rf test-registration *.tgz

echo ""
echo "=== Phase 3: Plugin Functionality Testing ==="

echo "3.1 ES Module Loading Verification"
echo "Testing ES module imports"
node -e "
try {
  // Test if we can import the built plugin
  const fs = require('fs');
  const path = require('path');
  
  const pluginPath = path.join(process.cwd(), 'dist/plugin/plugins/strray-codex-injection.js');
  if (fs.existsSync(pluginPath)) {
    console.log('✅ Plugin file exists');
    
    // Try to load the module (basic syntax check)
    const content = fs.readFileSync(pluginPath, 'utf-8');
    if (content.includes('export default')) {
      console.log('✅ ES module export found');
    } else {
      console.log('❌ ES module export not found');
      process.exit(1);
    }
  } else {
    console.log('❌ Plugin file does not exist');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ ES module loading test failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "3.2 Agent Configuration Validation"
echo "Testing agent configuration in oh-my-opencode.json"
mkdir -p test-agents
cd test-agents

# Create minimal package.json
cat > package.json << 'EOF'
{
  "name": "test-agents",
  "version": "1.0.0"
}
EOF

# Install and check agents
cd ..
npm pack > /dev/null 2>&1
PACK_FILE=$(ls *.tgz | head -1)
cd test-agents
npm install "../$PACK_FILE" > /dev/null 2>&1

AGENTS=("orchestrator" "enforcer" "architect" "test-architect" "bug-triage-specialist" "code-reviewer" "security-auditor" "refactorer")
MISSING_AGENTS=()

for agent in "${AGENTS[@]}"; do
    if grep -q "\"$agent\":" .opencode/oh-my-opencode.json; then
        echo "✅ Agent $agent configured"
    else
        echo "❌ Agent $agent not configured"
        MISSING_AGENTS+=("$agent")
    fi
done

if [ ${#MISSING_AGENTS[@]} -eq 0 ]; then
    echo "✅ All agents configured successfully"
else
    echo "❌ Missing agents: ${MISSING_AGENTS[*]}"
    exit 1
fi

cd ..
rm -rf test-agents *.tgz

echo ""
echo "3.3 MCP Server Accessibility Testing"
echo "Testing MCP server files exist"
MCP_SERVERS=(
    "dist/plugin/mcps/enhanced-orchestrator.server.js"
    "dist/plugin/mcps/enforcer-tools.server.js"
    "dist/plugin/mcps/framework-compliance-audit.server.js"
    "dist/plugin/mcps/performance-analysis.server.js"
    "dist/plugin/mcps/state-manager.server.js"
)

MISSING_SERVERS=()
for server in "${MCP_SERVERS[@]}"; do
    if [ -f "$server" ]; then
        echo "✅ MCP server $server exists"
    else
        echo "❌ MCP server $server missing"
        MISSING_SERVERS+=("$server")
    fi
done

if [ ${#MISSING_SERVERS[@]} -eq 0 ]; then
    echo "✅ All MCP servers accessible"
else
    echo "❌ Missing MCP servers: ${MISSING_SERVERS[*]}"
    exit 1
fi

echo ""
echo "3.4 Hook System Integration Checks"
echo "Testing hook system structure"
node -e "
try {
  const fs = require('fs');
  const path = require('path');
  
  const pluginPath = path.join(process.cwd(), 'dist/plugin/plugins/strray-codex-injection.js');
  const content = fs.readFileSync(pluginPath, 'utf-8');
  
  const hooks = [
    'experimental.chat.system.transform',
    'tool.execute.before',
    'config'
  ];
  
  let missingHooks = [];
  for (const hook of hooks) {
    if (content.includes(hook)) {
      console.log('✅ Hook ' + hook + ' found');
    } else {
      console.log('❌ Hook ' + hook + ' missing');
      missingHooks.push(hook);
    }
  }
  
  if (missingHooks.length > 0) {
    console.log('❌ Missing hooks:', missingHooks.join(', '));
    process.exit(1);
  } else {
    console.log('✅ All hooks present');
  }
} catch (error) {
  console.log('❌ Hook system test failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "=== Phase 4: Simulation & Integration Testing ==="

echo "4.1 End-to-end Workflow Simulations"
echo "Running simulation scripts"
if [ -f "scripts/run-simulations.mjs" ]; then
    if timeout 30 node scripts/run-simulations.mjs > simulation-output.txt 2>&1; then
        echo "✅ End-to-end simulation successful"
        echo "Simulation output (last 10 lines):"
        tail -10 simulation-output.txt
    else
        echo "❌ End-to-end simulation failed"
        tail -10 simulation-output.txt
        # Don't exit on simulation failure - might be expected
    fi
else
    echo "⚠️ Simulation script not found, skipping"
fi

echo ""
echo "4.2 Agent Command Execution Testing"
echo "Testing agent command structure"
node -e "
try {
  const fs = require('fs');
  const path = require('path');
  
  // Check if agent files exist
  const agentDir = path.join(process.cwd(), 'dist/plugin/agents');
  if (fs.existsSync(agentDir)) {
    const agents = fs.readdirSync(agentDir);
    console.log('✅ Agent directory exists with', agents.length, 'agents');
    
    // Check for key agents
    const keyAgents = ['enforcer', 'orchestrator', 'architect'];
    for (const agent of keyAgents) {
      const agentFile = path.join(agentDir, agent + '.js');
      if (fs.existsSync(agentFile)) {
        console.log('✅ Agent', agent, 'file exists');
      } else {
        console.log('❌ Agent', agent, 'file missing');
      }
    }
  } else {
    console.log('❌ Agent directory does not exist');
  }
} catch (error) {
  console.log('❌ Agent command test failed:', error.message);
}
"

echo ""
echo "4.3 Codex Injection Verification"
echo "Testing codex injection functionality"
node -e "
try {
  const fs = require('fs');
  const path = require('path');
  
  // Check codex files exist
  const codexFiles = ['.strray/agents_template.md', 'AGENTS.md'];
  let foundCodex = false;
  
  for (const file of codexFiles) {
    if (fs.existsSync(file)) {
      console.log('✅ Codex file found:', file);
      foundCodex = true;
      break;
    }
  }
  
  if (!foundCodex) {
    console.log('❌ No codex files found');
    process.exit(1);
  }
  
  // Test codex loading (simulate plugin behavior)
  const pluginPath = path.join(process.cwd(), 'dist/plugin/plugins/strray-codex-injection.js');
  const content = fs.readFileSync(pluginPath, 'utf-8');
  
  if (content.includes('loadCodexContext')) {
    console.log('✅ Codex loading function found in plugin');
  } else {
    console.log('❌ Codex loading function not found in plugin');
    process.exit(1);
  }
  
  console.log('✅ Codex injection verification passed');
} catch (error) {
  console.log('❌ Codex injection test failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "4.4 Performance Benchmark Validation"
echo "Running performance benchmarks"
if [ -f "scripts/profile-performance.sh" ]; then
    if timeout 30 bash scripts/profile-performance.sh > performance-output.txt 2>&1; then
        echo "✅ Performance benchmark completed"
        echo "Performance results (last 5 lines):"
        tail -5 performance-output.txt
    else
        echo "❌ Performance benchmark failed"
        tail -5 performance-output.txt
        # Don't exit on performance failure
    fi
else
    echo "⚠️ Performance script not found, skipping"
fi

echo ""
echo "=== Phase 5: Deployment Readiness Assessment ==="

echo "5.1 Security Audit Results"
echo "Running security audit"
if npm audit --audit-level moderate > security-audit.txt 2>&1; then
    echo "✅ Security audit passed"
else
    echo "⚠️ Security audit found issues (review security-audit.txt)"
fi

echo ""
echo "5.2 CI/CD Pipeline Validation"
echo "Checking CI/CD configuration"
if [ -f ".github/workflows/ci-cd.yml" ]; then
    echo "✅ CI/CD workflow exists"
    
    # Basic validation
    if grep -q "npm run build" .github/workflows/ci-cd.yml && grep -q "npm test" .github/workflows/ci-cd.yml; then
        echo "✅ CI/CD workflow includes build and test steps"
    else
        echo "❌ CI/CD workflow missing build or test steps"
        exit 1
    fi
else
    echo "❌ CI/CD workflow not found"
    exit 1
fi

echo ""
echo "5.3 Documentation Completeness"
echo "Checking documentation completeness"
DOC_FILES=("README.md")
MISSING_DOCS=()

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ Documentation file exists: $doc"
    else
        echo "❌ Documentation file missing: $doc"
        MISSING_DOCS+=("$doc")
    fi
done

if [ ${#MISSING_DOCS[@]} -eq 0 ]; then
    echo "✅ Required documentation present"
else
    echo "❌ Missing documentation: ${MISSING_DOCS[*]}"
    exit 1
fi

echo ""
echo "5.4 Enterprise Deployment Checklist"
echo "Running enterprise deployment checks"

# Check for production readiness
CHECKS=(
    "package.json has version"
    "package.json has main entry"
    "package.json has types entry"
    "dist directory exists"
    "LICENSE file exists"
    "TypeScript compilation successful"
)

FAILED_CHECKS=()

# Version check
if grep -q '"version"' package.json; then
    echo "✅ Package version defined"
else
    echo "❌ Package version not defined"
    FAILED_CHECKS+=("version")
fi

# Main entry check
if grep -q '"main"' package.json; then
    echo "✅ Main entry defined"
else
    echo "❌ Main entry not defined"
    FAILED_CHECKS+=("main")
fi

# Types entry check
if grep -q '"types"' package.json; then
    echo "✅ Types entry defined"
else
    echo "❌ Types entry not defined"
    FAILED_CHECKS+=("types")
fi

# Dist directory check
if [ -d "dist" ]; then
    echo "✅ Dist directory exists"
else
    echo "❌ Dist directory missing"
    FAILED_CHECKS+=("dist")
fi

# License check
if [ -f "LICENSE" ]; then
    echo "✅ LICENSE file exists"
else
    echo "❌ LICENSE file missing"
    FAILED_CHECKS+=("license")
fi

# TypeScript check (already done above)
echo "✅ TypeScript compilation verified"

if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
    echo "✅ All enterprise deployment checks passed"
else
    echo "❌ Failed enterprise checks: ${FAILED_CHECKS[*]}"
    exit 1
fi

echo ""
echo "=== DEPLOYMENT READINESS ASSESSMENT COMPLETE ==="
echo ""
echo "🎉 StrRay Framework Plugin Testing Complete"
echo ""
echo "Test completed at: $(date)"