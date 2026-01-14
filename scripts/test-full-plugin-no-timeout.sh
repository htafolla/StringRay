#!/usr/bin/env bash

# StringRay Full Plugin Test (No Timeout)
# Runs the complete StringRay plugin initialization without any timeouts

echo "🚀 STRINGRAY FULL PLUGIN TEST (NO TIMEOUT)"
echo "=========================================="
echo "Running complete StringRay framework initialization..."
echo "This may take several minutes due to enterprise component loading."
echo ""

# Run the test and capture output
node scripts/test-stringray-plugin.mjs

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 STRINGRAY PLUGIN TEST COMPLETED SUCCESSFULLY!"
    echo "=============================================="
    echo "✅ Framework fully initialized"
    echo "✅ All components loaded"
    echo "✅ Codex terms injected"
    echo "✅ oh-my-opencode integration ready"
    exit 0
else
    echo ""
    echo "❌ STRINGRAY PLUGIN TEST FAILED"
    echo "=============================="
    exit 1
fi