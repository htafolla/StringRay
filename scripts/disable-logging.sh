#!/bin/bash

# Disable StrRay Framework Logging
# Sets environment variable to disable all framework logging

echo "🔇 Disabling StrRay Framework Logging"
echo "====================================="

# Set environment variable to disable logging
export STRRAY_LOGGING_ENABLED=false

echo "✅ Framework logging has been DISABLED"
echo ""
echo "To re-enable logging, run:"
echo "  export STRRAY_LOGGING_ENABLED=true"
echo ""
echo "Or restart your environment with:"
echo "  STRRAY_LOGGING_ENABLED=false npm run <command>"
echo ""
echo "Current status: Logging is DISABLED"