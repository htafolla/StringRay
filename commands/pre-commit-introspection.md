---
name: pre-commit-introspection
description: Batched code quality and architecture introspection before commits
---

#!/bin/bash

# StringRay AI v1.3.4 - Pre-commit Introspection

# Comprehensive code quality and architecture validation

echo "🔬 StringRay AI v1.3.4 - Pre-commit Introspection"
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

ANTI_PATTERNS=(
"any\|unknown" # Excessive use of any/unknown types
"console\.(log\|error\|warn)" # Console statements in production code
"import.\*\.\./\.\./\.\." # Deep relative imports
)

for pattern in "${ANTI_PATTERNS[@]}"; do
    VIOLATIONS=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ 2>/dev/null | grep -v "node_modules\|__tests__\|test" | wc -l)
    if [ "$VIOLATIONS" -gt 0 ]; then
ISSUES+=("Architecture violation: $pattern ($VIOLATIONS instances)")
COMPLIANT=false
fi
done

# Check component size limits

LARGE_COMPONENTS=$(find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300 {print $2}' | wc -l)
if [ "$LARGE_COMPONENTS" -gt 0 ]; then
ISSUES+=("$LARGE_COMPONENTS components exceed 300-line limit")
COMPLIANT=false
echo "⚠️ Large components detected"
else
echo "✅ Component sizes within limits"
fi

# 3. Test Coverage Validation

echo ""
echo "🧪 Validating test coverage..."
if command -v npm &> /dev/null; then # Run tests if available
if npm test > /dev/null 2>&1; then
echo "✅ Tests passing"
else
ISSUES+=("Test suite failures detected")
COMPLIANT=false
echo "❌ Test failures detected"
fi
else
WARNINGS+=("Test validation unavailable")
fi

# 4. Import Organization Check

echo ""
echo "📦 Checking import organization..."

# Check for unused imports (basic heuristic)

STAGED_TS_FILES=$(git diff --cached --name-only | grep -E "\.(ts|tsx)$")
if [ -n "$STAGED_TS_FILES" ]; then
UNUSED_IMPORTS=false
for file in $STAGED_TS_FILES; do
        if [ -f "$file" ]; then # Simple check for import statements without usage
IMPORTS=$(grep "^import" "$file" | wc -l)
if [ "$IMPORTS" -gt 10 ]; then
WARNINGS+=("High import count in $file ($IMPORTS imports)")
fi
fi
done
fi

# 5. Commit Message Quality Check

echo ""
echo "📝 Validating commit message..."
COMMIT_MSG=$(git log --format=%B -n 1 HEAD)
if [ -n "$COMMIT_MSG" ]; then # Check for descriptive commit messages
MSG_LENGTH=$(echo "$COMMIT_MSG" | wc -c)
if [ "$MSG_LENGTH" -lt 10 ]; then
WARNINGS+=("Commit message too short (< 10 characters)")
fi

    # Check for conventional commit format
    if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)"; then
        WARNINGS+=("Consider using conventional commit format")
    fi

else
WARNINGS+=("No commit message found")
fi

# 6. Code Duplication Check

echo ""
echo "🔄 Checking code duplication..."
if command -v jscpd &> /dev/null; then
DUPLICATION=$(jscpd --reporters console --format "javascript,typescript" --min-lines 10 --min-tokens 50 . 2>/dev/null | grep -o "[0-9]*\.[0-9]*%" | head -1)
    if [[ -n "$DUPLICATION" ]]; then
DUP_NUM=$(echo "$DUPLICATION" | sed 's/%//')
if (( $(echo "$DUP_NUM > 5" | bc -l 2>/dev/null) )); then
ISSUES+=("High code duplication: ${DUPLICATION}%")
COMPLIANT=false
echo "⚠️ High code duplication detected"
else
echo "✅ Code duplication within acceptable limits"
fi
fi
else
WARNINGS+=("Code duplication analysis unavailable")
fi

# Report Results

echo ""
echo "📊 PRE-COMMIT INTROSPECTION REPORT"
echo "==================================="

if [ "$COMPLIANT" = true ]; then
echo "✅ COMMIT APPROVED"
echo "Code quality standards met"
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

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️ Warnings (non-blocking):"
    for warning in "${WARNINGS[@]}"; do
echo " - $warning"
done
fi

echo ""
echo "🎯 StringRay 1.0.0: INTROSPECTION COMPLETE"
echo "Commit ready for integration"
