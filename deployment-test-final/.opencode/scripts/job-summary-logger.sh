#!/bin/bash
# StrRay Framework - Job Summary Logger
# Location: scripts/job-summary-logger.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read from stdin and pipe to summary-logger.md
if [ ! -t 0 ]; then
  cat | bash "${SCRIPT_DIR}/../.opencode/commands/job-summary-logger.md"
fi