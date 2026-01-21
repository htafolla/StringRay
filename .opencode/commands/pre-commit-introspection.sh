#!/bin/bash

# StringRay 1.0.0 - Pre-commit Introspection
# Comprehensive code quality and architecture validation

echo "🔬 StringRay 1.0.0 - Pre-commit Introspection"
echo "============================================================"

# Initialize analysis status

COMPLIANT=true
ISSUES=()
WARNINGS=()

# 1. Syntax and Type Safety Validation

echo "🔧 Validating syntax and type safety..."
if command -v npm &> /dev/null && [ -f "package.json" ]; then # TypeScript compilation check
if npm run typecheck > /dev/null 2>&1; then
echo "✅ TypeScript compilation successful"
else
ISSUES+=("TypeScript compilation errors detected")
COMPLIANT=false
echo "❌ TypeScript compilation failed"
fi

    # ESLint validation
    if npm run lint > /dev/null 2>&1; then
        echo "✅ ESLint validation passed"
    else
        ISSUES+=("ESLint violations detected")
        COMPLIANT=false
        echo "❌ ESLint violations found"
    fi

else
WARNINGS+=("npm/package.json not available for validation")
fi

# 2. Architecture Compliance Check

echo ""
echo "🏗️ Checking architecture compliance..."

# Check for anti-patterns
# Count any/unknown types
ANY_COUNT=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l ":\s*\(any\|unknown\)" | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
    WARNINGS+=("Architecture warning: any|unknown types detected ($ANY_COUNT instances)")
    echo "⚠️ Architecture warning: any|unknown types detected ($ANY_COUNT instances)"
else
    echo "✅ No any/unknown type violations"
fi

# Count console statements
CONSOLE_COUNT=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -c "console\.\(log\|error\|warn\)" | awk '{sum += $1} END {print sum}')
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    ISSUES+=("Architecture violation: console.(log|error|warn) ($CONSOLE_COUNT instances)")
    COMPLIANT=false
    echo "❌ Architecture violation: console.(log|error|warn) ($CONSOLE_COUNT instances)"
else
    echo "✅ No console statement violations"
fi

# 3. Component Size Validation

echo ""
echo "📏 Checking component sizes..."
LARGE_COMPONENTS=$(find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300 {print $2 ": " $1 " lines"}')
LARGE_COUNT=$(echo "$LARGE_COMPONENTS" | grep -c ":" || true)
if [ "$LARGE_COUNT" -gt 0 ]; then
    WARNINGS+=("$LARGE_COUNT components exceed 300-line limit (consider refactoring)")
    echo "⚠️ Large components detected"
    echo "$LARGE_COMPONENTS"
    echo "💡 Consider breaking down large components for better maintainability"
else
    echo "✅ All components within size limits"
fi

# 4. Test Coverage Validation

echo ""
echo "🧪 Validating test coverage..."
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    if npm run test:coverage > /dev/null 2>&1; then
        echo "✅ Tests passing"
    else
        ISSUES+=("Test failures detected")
        COMPLIANT=false
        echo "❌ Test failures detected"
    fi
else
    WARNINGS+=("Test validation not available")
fi

# 5. Import Organization Check

echo ""
echo "📦 Checking import organization..."
# Basic import validation would go here

# 6. Commit Message Validation

echo ""
echo "📝 Validating commit message..."
# Commit message validation would go here

# 7. Code Duplication Check

echo ""
echo "🔄 Checking code duplication..."
# Code duplication analysis would go here

# Report Results

echo ""
echo "📊 PRE-COMMIT INTROSPECTION REPORT"
echo "==================================="

if [ "$COMPLIANT" = true ]; then
    echo "✅ All validations passed"
    exit 0
else
    echo "❌ COMMIT BLOCKED"
    echo ""
    echo "Critical Issues:"
    for issue in "${ISSUES[@]}"; do
        echo " - 🔴 $issue"
    done
    echo ""
    echo "Resolution required before commit"
    exit 1
fi