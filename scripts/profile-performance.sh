# StrRay Framework - Performance Profiling Script

#!/bin/bash

# Performance profiling and monitoring script
# Usage: ./profile-performance.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running comprehensive performance tests..."

    if ! command_exists "npm"; then
        print_error "npm is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Run performance tests
    npm run test:performance

    # Generate performance report
    npm run performance:report

    print_success "Performance tests completed"
}

# Function to start monitoring dashboard
start_monitoring() {
    print_status "Starting performance monitoring dashboard..."

    if ! command_exists "npm"; then
        print_error "npm is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Start monitoring in background
    npm run performance:monitor &

    MONITOR_PID=$!
    echo $MONITOR_PID > .performance_monitor.pid

    print_success "Performance monitoring started (PID: $MONITOR_PID)"
    print_status "Dashboard available at: http://localhost:3001"
    print_status "Stop with: kill $MONITOR_PID or ./profile-performance.sh stop"
}

# Function to stop monitoring
stop_monitoring() {
    if [ -f ".performance_monitor.pid" ]; then
        MONITOR_PID=$(cat .performance_monitor.pid)
        if kill -0 $MONITOR_PID 2>/dev/null; then
            kill $MONITOR_PID
            print_success "Performance monitoring stopped (PID: $MONITOR_PID)"
        else
            print_warning "Monitor process not running"
        fi
        rm -f .performance_monitor.pid
    else
        print_warning "No monitor PID file found"
    fi
}

# Function to analyze bundle size
analyze_bundle() {
    print_status "Analyzing bundle size..."

    if ! command_exists "npm"; then
        print_error "npm is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Build the project
    npm run build

    # Analyze bundle size
    npx webpack-bundle-analyzer dist/stats.json --port 8888 &

    BUNDLE_PID=$!
    print_success "Bundle analyzer started on http://localhost:8888"
    print_status "Press Ctrl+C to stop"
    wait $BUNDLE_PID
}

# Function to generate performance report
generate_report() {
    print_status "Generating performance report..."

    if ! command_exists "npm"; then
        print_error "npm is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Generate comprehensive report
    npm run performance:report

    # Show report location
    if [ -f "performance-report.json" ]; then
        print_success "Performance report generated: performance-report.json"
    else
        print_warning "Report file not found"
    fi
}

# Function to run memory profiling
profile_memory() {
    print_status "Starting memory profiling..."

    if ! command_exists "node"; then
        print_error "node is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Run with memory profiling
    node --inspect --expose-gc --max-old-space-size=4096 dist/server.js &
    SERVER_PID=$!

    print_success "Memory profiling started (PID: $SERVER_PID)"
    print_status "Chrome DevTools: chrome://inspect"
    print_status "Stop with: kill $SERVER_PID"
}

# Function to check system resources
check_resources() {
    print_status "Checking system resources..."

    # Check available memory
    if command_exists "free"; then
        echo "Memory usage:"
        free -h
    fi

    # Check CPU usage
    if command_exists "top"; then
        echo "Top processes:"
        top -b -n 1 | head -20
    fi

    # Check disk usage
    if command_exists "df"; then
        echo "Disk usage:"
        df -h
    fi
}

# Function to run CI performance gates
run_ci_gates() {
    print_status "Running CI performance gates..."

    if ! command_exists "npm"; then
        print_error "npm is not installed"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # Run performance gates
    npm run performance:gates

    if [ $? -eq 0 ]; then
        print_success "All performance gates passed"
    else
        print_error "Performance gates failed"
        exit 1
    fi
}

# Main script logic
case "${1:-help}" in
    "test")
        run_performance_tests
        ;;
    "monitor")
        start_monitoring
        ;;
    "stop")
        stop_monitoring
        ;;
    "bundle")
        analyze_bundle
        ;;
    "report")
        generate_report
        ;;
    "memory")
        profile_memory
        ;;
    "resources")
        check_resources
        ;;
    "gates")
        run_ci_gates
        ;;
    "all")
        run_performance_tests
        generate_report
        run_ci_gates
        ;;
    "help"|*)
        echo "StrRay Framework - Performance Profiling Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  test      - Run comprehensive performance tests"
        echo "  monitor   - Start performance monitoring dashboard"
        echo "  stop      - Stop performance monitoring"
        echo "  bundle    - Analyze bundle size with visualizer"
        echo "  report    - Generate performance report"
        echo "  memory    - Start memory profiling with DevTools"
        echo "  resources - Check system resource usage"
        echo "  gates     - Run CI performance gates"
        echo "  all       - Run all performance checks"
        echo "  help      - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 monitor    # Start monitoring"
        echo "  $0 test       # Run tests"
        echo "  $0 bundle     # Analyze bundle"
        ;;
esac