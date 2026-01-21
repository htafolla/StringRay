#!/bin/bash

# StringRay AI v1.1.1 - Advanced Profiling Integration Demo
# Demonstrates comprehensive agent performance profiling and monitoring

set -e

echo "🚀 StrRay Framework - Advanced Profiling Integration Demo"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to log success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to log warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to log error
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed or not in PATH"
        exit 1
    fi

    local node_version=$(node --version | sed 's/v//')
    log "Node.js version: $node_version"
}

# Create profiling demo script
create_demo_script() {
    cat > profiling-demo.ts << 'EOF'
import { advancedProfiler } from './src/monitoring/advanced-profiler';
import { enterpriseMonitoringSystem } from './src/monitoring/enterprise-monitoring-system';

// Simulate agent operations with profiling
async function simulateAgentOperations() {
    console.log('🎯 Starting Advanced Profiling Demo...\n');

    // Enable profiling
    advancedProfiler.enableProfiling();
    console.log('📊 Advanced profiler enabled\n');

    // Start monitoring system
    await enterpriseMonitoringSystem.start();
    console.log('📈 Enterprise monitoring system started\n');

    const operations = [
        { agent: 'enforcer', operation: 'codex-validation', duration: 150 },
        { agent: 'architect', operation: 'design-review', duration: 300 },
        { agent: 'orchestrator', operation: 'task-coordination', duration: 200 },
        { agent: 'bug-triage-specialist', operation: 'error-analysis', duration: 400 },
        { agent: 'code-reviewer', operation: 'quality-check', duration: 250 },
        { agent: 'security-auditor', operation: 'vulnerability-scan', duration: 350 },
        { agent: 'refactorer', operation: 'code-optimization', duration: 500 },
        { agent: 'test-architect', operation: 'test-strategy', duration: 180 },
    ];

    console.log('🔄 Simulating agent operations...\n');

    // Simulate agent operations
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const operationId = `demo-op-${i}`;

        // Start profiling
        advancedProfiler.startProfiling(operationId, op.agent, op.operation);

        // Simulate operation
        await new Promise(resolve => setTimeout(resolve, op.duration));

        // End profiling (simulate some failures)
        const success = Math.random() > 0.1; // 90% success rate
        advancedProfiler.endProfiling(operationId, success, success ? undefined : 'Simulated error');
    }

    console.log('\n📊 Generating performance metrics...\n');

    // Get metrics for each agent
    const agents = ['enforcer', 'architect', 'orchestrator', 'bug-triage-specialist', 'code-reviewer', 'security-auditor', 'refactorer', 'test-architect'];

    agents.forEach(agent => {
        const metrics = advancedProfiler.getMetrics(agent);
        console.log(`🤖 ${agent}:`);
        console.log(`   Operations: ${metrics.totalOperations}`);
        console.log(`   Success Rate: ${((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(1)}%`);
        console.log(`   Average Duration: ${metrics.averageDuration.toFixed(2)}ms`);
        console.log(`   Memory Delta: ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Slowest: ${metrics.slowestOperation}`);
        console.log(`   Fastest: ${metrics.fastestOperation}\n`);
    });

    // Get system-wide metrics
    const systemMetrics = advancedProfiler.getMetrics();
    console.log('🌐 System-wide Metrics:');
    console.log(`   Total Operations: ${systemMetrics.totalOperations}`);
    console.log(`   Overall Success Rate: ${((systemMetrics.successfulOperations / systemMetrics.totalOperations) * 100).toFixed(1)}%`);
    console.log(`   Average Duration: ${systemMetrics.averageDuration.toFixed(2)}ms`);
    console.log(`   Memory Delta: ${(systemMetrics.memoryDelta / 1024 / 1024).toFixed(2)}MB\n`);

    // Get monitoring status
    const status = enterpriseMonitoringSystem.getMonitoringStatus();
    console.log('📈 Monitoring System Status:');
    console.log(`   Running: ${status.running}`);
    console.log(`   Instance ID: ${status.instanceId}`);
    console.log(`   Metrics Collected: ${status.metricsCollected}`);
    console.log(`   Active Alerts: ${status.alertsActive}`);
    console.log(`   Health Checks: ${status.healthChecksPerformed}`);
    console.log(`   Cluster Nodes: ${status.clusterNodes}`);
    console.log(`   Uptime: ${Math.floor(status.uptime / 1000 / 60)} minutes\n`);

    // Wait for report generation
    console.log('⏳ Waiting for performance report generation...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait for report generation

    console.log('\n🎉 Profiling demo completed successfully!');
    console.log('📊 Check the .strray/profiles/ directory for performance reports');

    // Cleanup
    enterpriseMonitoringSystem.stop();
    advancedProfiler.disableProfiling();
}

// Run the demo
simulateAgentOperations().catch(console.error);
EOF

    success "Created profiling demo script"
}

# Run the profiling demo
run_demo() {
    log "Running advanced profiling integration demo..."

    if [ ! -f "profiling-demo.ts" ]; then
        error "Demo script not found"
        return 1
    fi

    # Compile and run
    if command -v npx &> /dev/null; then
        log "Compiling TypeScript demo..."
        npx tsc profiling-demo.ts --target es2020 --module commonjs --esModuleInterop --skipLibCheck

        if [ -f "profiling-demo.js" ]; then
            log "Running profiling demo..."
            node profiling-demo.js
            success "Profiling demo completed"
        else
            error "Failed to compile demo script"
            return 1
        fi
    else
        error "npx not found - cannot compile TypeScript"
        return 1
    fi
}

# Create profiling validation script
create_validation_script() {
    cat > validate-profiling.sh << 'EOF'
#!/bin/bash

echo "🔍 StrRay Framework - Profiling System Validation"
echo "==============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

validate_profiling() {
    echo -e "\n📊 Checking profiling system components..."

    # Check if profiling files exist
    if [ -f "src/monitoring/advanced-profiler.ts" ]; then
        echo -e "${GREEN}✅ Advanced profiler module exists${NC}"
    else
        echo -e "${RED}❌ Advanced profiler module missing${NC}"
        return 1
    fi

    if [ -f "src/monitoring/enterprise-monitoring-system.ts" ]; then
        echo -e "${GREEN}✅ Enterprise monitoring system exists${NC}"
    else
        echo -e "${RED}❌ Enterprise monitoring system missing${NC}"
        return 1
    fi

    # Check TypeScript compilation
    echo -e "\n🔧 Checking TypeScript compilation..."
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit --skipLibCheck src/monitoring/advanced-profiler.ts 2>/dev/null; then
            echo -e "${GREEN}✅ Profiler TypeScript compilation successful${NC}"
        else
            echo -e "${RED}❌ Profiler TypeScript compilation failed${NC}"
            return 1
        fi

        if npx tsc --noEmit --skipLibCheck src/monitoring/enterprise-monitoring-system.ts 2>/dev/null; then
            echo -e "${GREEN}✅ Monitoring system TypeScript compilation successful${NC}"
        else
            echo -e "${RED}❌ Monitoring system TypeScript compilation failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  npx not available - skipping TypeScript validation${NC}"
    fi

    # Check profiling directory
    if [ -d ".strray/profiles" ]; then
        echo -e "${GREEN}✅ Profiling storage directory exists${NC}"
        local report_count=$(find .strray/profiles -name "*.json" 2>/dev/null | wc -l)
        echo -e "${GREEN}📊 Found $report_count performance reports${NC}"
    else
        echo -e "${YELLOW}⚠️  Profiling storage directory not yet created (will be created on first run)${NC}"
    fi

    echo -e "\n🎉 Profiling system validation completed!"
    return 0
}

# Run validation
validate_profiling
EOF

    chmod +x validate-profiling.sh
    success "Created profiling validation script"
}

# Create performance dashboard script
create_dashboard_script() {
    cat > profiling-dashboard.sh << 'EOF'
#!/bin/bash

echo "📊 StrRay Framework - Profiling Performance Dashboard"
echo "=================================================="

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_dashboard() {
    echo -e "${BLUE}🚀 StrRay Advanced Profiling Dashboard${NC}"
    echo "========================================"

    # Check if profiling directory exists
    if [ ! -d ".strray/profiles" ]; then
        echo -e "${YELLOW}⚠️  No profiling data available yet${NC}"
        echo "   Run the profiling demo first to generate data"
        return
    fi

    # Find latest report
    local latest_report=$(find .strray/profiles -name "performance-report-*.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$latest_report" ]; then
        echo -e "${YELLOW}⚠️  No performance reports found${NC}"
        return
    fi

    echo -e "\n📈 Latest Performance Report: $(basename "$latest_report")"
    echo "---------------------------------------------------"

    # Parse and display key metrics
    if command -v jq &> /dev/null; then
        echo -e "\n🤖 Agent Performance Summary:"
        echo "-----------------------------"

        # Extract agent metrics
        jq -r '.agents | to_entries[] | "• \(.key): \(.value.totalOperations) ops, \((.value.successfulOperations / .value.totalOperations * 100) | floor)% success, \(.value.averageDuration | round)ms avg"' "$latest_report" 2>/dev/null || echo "   Unable to parse agent metrics"

        echo -e "\n🌐 System-wide Metrics:"
        echo "-----------------------"
        jq -r '"• Total Operations: \(.system.totalOperations)\n• Success Rate: \((.system.successfulOperations / .system.totalOperations * 100) | floor)%\n• Average Duration: \(.system.averageDuration | round)ms\n• Memory Delta: \((.system.memoryDelta / 1024 / 1024) | round)MB"' "$latest_report" 2>/dev/null || echo "   Unable to parse system metrics"

        echo -e "\n💡 Performance Recommendations:"
        echo "-------------------------------"
        local rec_count=$(jq '.recommendations | length' "$latest_report" 2>/dev/null || echo "0")
        if [ "$rec_count" -gt 0 ]; then
            jq -r '.recommendations[] | "• \(.)\n"' "$latest_report" 2>/dev/null || echo "   Unable to parse recommendations"
        else
            echo -e "${GREEN}• All systems operating optimally${NC}"
        fi

    else
        echo -e "${YELLOW}⚠️  jq not available - displaying raw report${NC}"
        head -20 "$latest_report"
    fi

    echo -e "\n📁 Profiling Data Location: .strray/profiles/"
    local report_count=$(find .strray/profiles -name "*.json" 2>/dev/null | wc -l)
    echo "📊 Total Reports Available: $report_count"

    echo -e "\n${GREEN}✅ Dashboard display completed${NC}"
}

# Show dashboard
show_dashboard
EOF

    chmod +x profiling-dashboard.sh
    success "Created profiling dashboard script"
}

# Update package.json with new scripts
update_package_json() {
    if [ -f "package.json" ]; then
        # Add profiling scripts to package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        if (!pkg.scripts) pkg.scripts = {};

        pkg.scripts['profiling:demo'] = 'bash advanced-profiling-integration.sh';
        pkg.scripts['profiling:validate'] = 'bash validate-profiling.sh';
        pkg.scripts['profiling:dashboard'] = 'bash profiling-dashboard.sh';

        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Updated package.json with profiling scripts');
        "
    else
        warning "package.json not found - profiling scripts not added"
    fi
}

# Main execution
main() {
    check_node

    log "Setting up Advanced Profiling Integration..."

    create_demo_script
    create_validation_script
    create_dashboard_script
    update_package_json

    success "Advanced Profiling Integration setup complete!"
    echo ""
    echo "🎯 Available Commands:"
    echo "  npm run profiling:demo       - Run comprehensive profiling demo"
    echo "  npm run profiling:validate   - Validate profiling system"
    echo "  npm run profiling:dashboard  - Show performance dashboard"
    echo ""
    echo "📊 Demo will simulate agent operations and generate performance reports"
    echo "🚀 Run 'npm run profiling:demo' to see it in action!"

    # Offer to run the demo
    echo ""
    read -p "🤔 Would you like to run the profiling demo now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_demo
    else
        log "Demo setup complete - run 'npm run profiling:demo' anytime to start"
    fi
}

# Run main function
main "$@"