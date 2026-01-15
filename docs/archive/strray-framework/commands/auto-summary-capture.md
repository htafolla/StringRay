#!/bin/bash

# StrRay Framework - Auto Summary Capture

# Monitors for 'job done print summary' signal and automatically logs summaries

echo "🤖 StrRay Auto-Summary Capture Active"
echo "======================================"
echo "Monitoring for 'job done print summary' signals..."
echo "All AI-generated summaries will be automatically logged to REFACTORING_LOG.md"
echo ""

# Create a temporary file to capture the summary

TEMP_FILE=$(mktemp)
CAPTURING=false

# Function to log captured summary

log_summary() {
if [ -s "$TEMP_FILE" ]; then
echo "📝 Captured AI summary - logging to REFACTORING_LOG.md..."

        # Log the captured content
        export STRRAY_SUMMARY_CONTENT="$(cat "$TEMP_FILE")"
        tail -n +6 strray/commands/summary-logger.md | bash

        # Clear temp file
        > "$TEMP_FILE"
        CAPTURING=false

        echo "✅ Summary automatically logged!"
        echo ""
    fi

}

# Monitor for the signal (this would be integrated into the AI workflow)

# For now, demonstrate the concept

echo "🔄 Auto-capture system ready. When AI outputs 'job done print summary',"
echo " the following summary content will be automatically captured and logged."
echo ""
echo "Example usage:"
echo "1. AI completes task"
echo "2. AI outputs: 'job done print summary'"
echo "3. AI outputs summary content"
echo "4. System automatically logs to REFACTORING_LOG.md"
echo ""

# Clean up

rm -f "$TEMP_FILE"
