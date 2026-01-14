#!/bin/bash

# StrRay Framework - Continuous Monitoring Daemon
# Runs persistent background monitoring services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
DAEMON_NAME="strray-monitoring-daemon"
PID_FILE="${PROJECT_ROOT}/.opencode/monitoring-daemon.pid"
LOG_FILE="${PROJECT_ROOT}/.opencode/logs/monitoring-daemon.log"
STRRAY_PLUGIN="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [${DAEMON_NAME}] $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}$(date '+%Y-%m-%d %H:%M:%S') [${DAEMON_NAME}] ERROR: $*${NC}" >&2 | tee -a "$LOG_FILE" >&2
}

success() {
    echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S') [${DAEMON_NAME}] SUCCESS: $*${NC}" | tee -a "$LOG_FILE"
}

# Check if daemon is already running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            # Stale PID file
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Start the monitoring daemon
start_daemon() {
    if is_running; then
        error "Monitoring daemon is already running (PID: $(cat "$PID_FILE"))"
        exit 1
    fi

    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"

    log "Starting StrRay monitoring daemon..."

    # Start the monitoring daemon directly
    log 'Starting monitoring daemon...'

    # Ensure log file exists and redirect output
    touch "$LOG_FILE"
    nohup node monitoring-daemon.mjs >> "$LOG_FILE" 2>&1 &

    # Save PID
    echo $! > "$PID_FILE"

    # Wait a moment for startup
    sleep 2

    if is_running; then
        success "Monitoring daemon started successfully (PID: $(cat "$PID_FILE"))"
        log "Monitoring daemon is now running in background"
        echo ""
        echo "📊 Continuous Monitoring Active:"
        echo "   • Session health monitoring (30s intervals)"
        echo "   • Metrics collection (60s intervals)"
        echo "   • Session cleanup (5min intervals)"
        echo "   • Framework state persistence"
        echo ""
        echo "📝 Logs: $LOG_FILE"
        echo "🛑 To stop: $0 stop"
    else
        error "Failed to start monitoring daemon"
        exit 1
    fi
}

# Stop the monitoring daemon
stop_daemon() {
    if ! is_running; then
        error "Monitoring daemon is not running"
        exit 1
    fi

    local pid=$(cat "$PID_FILE")
    log "Stopping monitoring daemon (PID: $pid)..."

    # Send SIGTERM first
    kill -TERM "$pid" 2>/dev/null || true

    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
    done

    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        log "Force killing monitoring daemon..."
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
    fi

    if ! ps -p "$pid" > /dev/null 2>&1; then
        rm -f "$PID_FILE"
        success "Monitoring daemon stopped successfully"
    else
        error "Failed to stop monitoring daemon"
        exit 1
    fi
}

# Show status
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        success "Monitoring daemon is running (PID: $pid)"
        echo ""
        echo "📊 Active Monitoring:"
        echo "   • Session Health Checks (30s intervals)"
        echo "   • Metrics Collection (60s intervals)"
        echo "   • Session Cleanup (5min intervals)"
        echo "   • State Persistence"
        echo ""
        echo "📝 Log file: $LOG_FILE"
        echo "🛑 To stop: $0 stop"
    else
        echo "❌ Monitoring daemon is not running"
        echo ""
        echo "🚀 To start: $0 start"
    fi
}

# Show usage
usage() {
    echo "StrRay Framework - Monitoring Daemon Control"
    echo ""
    echo "Usage: $0 {start|stop|status|restart}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the monitoring daemon"
    echo "  stop    - Stop the monitoring daemon"
    echo "  status  - Show daemon status"
    echo "  restart - Restart the monitoring daemon"
    echo ""
    echo "The monitoring daemon provides continuous background monitoring:"
    echo "  • Session health monitoring"
    echo "  • Metrics collection and alerting"
    echo "  • Session cleanup and TTL management"
    echo "  • Framework state persistence"
}

# Main command handling
case "${1:-status}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        show_status
        ;;
    restart)
        stop_daemon
        sleep 2
        start_daemon
        ;;
    *)
        usage
        exit 1
        ;;
esac