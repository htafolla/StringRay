---
name: security-scan
description: Automated security vulnerability scanning with dependency and code analysis
---

#!/bin/bash

# StringRay 1.0.0 - Security Scan Hook

# Comprehensive security analysis for vulnerabilities and threats

echo "🔒 StringRay 1.0.0 - Security Scan"
echo "================================================="

# Initialize security status

SECURE=true
VULNERABILITIES=()
THREATS=()

# 1. Dependency Vulnerability Scanning

echo "📦 Scanning dependencies for vulnerabilities..."
if command -v npm &> /dev/null && [ -f "package.json" ]; then # Use npm audit if available
if npm audit --audit-level moderate > /dev/null 2>&1; then
echo "✅ No critical dependency vulnerabilities found"
else
VULNERABILITIES+=("Dependency vulnerabilities detected")
SECURE=false
echo "⚠️ Dependency vulnerabilities found"
fi

    # Check for outdated packages
    OUTDATED=$(npm outdated 2>/dev/null | wc -l)
    if [ "$OUTDATED" -gt 1 ]; then
        echo "📅 $((OUTDATED-1)) packages are outdated"
        if [ "$OUTDATED" -gt 5 ]; then
            VULNERABILITIES+=("$((OUTDATED-1)) packages significantly outdated")
        fi
    fi

else
echo "⚠️ npm/package.json not available"
fi

# 2. Code Security Analysis

echo ""
echo "🔍 Scanning code for security issues..."

# Check for hardcoded secrets

SECRET_PATTERNS=("password" "secret" "key" "token" "api_key" "API_KEY" "PRIVATE_KEY")

FOUND_SECRETS=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    SECRET_FILES=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.json" src/ 2>/dev/null | grep -v "node_modules" | wc -l)
    if [ "$SECRET_FILES" -gt 0 ]; then
THREATS+=("Potential hardcoded secrets detected ($SECRET_FILES files)")
SECURE=false
FOUND_SECRETS=true
fi
done

if [ "$FOUND_SECRETS" = false ]; then
echo "✅ No hardcoded secrets detected"
else
echo "⚠️ Potential hardcoded secrets found"
fi

# Check for insecure practices

INSECURE_PATTERNS=("eval(" "innerHTML" "document.write" "setTimeout" "setInterval")

for pattern in "${INSECURE_PATTERNS[@]}"; do
    INSECURE_FILES=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ 2>/dev/null | grep -v "node_modules" | wc -l)
    if [ "$INSECURE_FILES" -gt 0 ]; then
THREATS+=("Insecure code patterns detected: $pattern ($INSECURE_FILES instances)")
SECURE=false
fi
done

# 3. File Permissions Check

echo ""
echo "🔐 Checking file permissions..."
if [["$OSTYPE" == "darwin"*]] || [["$OSTYPE" == "linux-gnu"*]]; then # Check for world-writable files
WRITABLE_FILES=$(find . -type f -perm -o+w 2>/dev/null | grep -v ".git" | grep -v "node_modules" | wc -l)
    if [ "$WRITABLE_FILES" -gt 0 ]; then
THREATS+=("$WRITABLE_FILES files have world-writable permissions")
SECURE=false
echo "⚠️ World-writable files detected"
else
echo "✅ File permissions secure"
fi
fi

# 4. Environment Variable Exposure

echo ""
echo "🌍 Checking environment variable exposure..."
if [ -f ".env" ]; then
ENV*VARS=$(grep -c "^[A-Z*][A-Z0-9_]\*=" .env 2>/dev/null || echo "0")
if [ "$ENV_VARS" -gt 0 ]; then
echo "📄 Environment file contains $ENV_VARS variables"

        # Check if .env is in .gitignore
        if ! grep -q ".env" .gitignore 2>/dev/null; then
            THREATS+=("Environment file not excluded from version control")
            SECURE=false
            echo "⚠️ .env file not in .gitignore"
        fi
    fi

fi

# 5. SSL/TLS Configuration Check (if applicable)

echo ""
echo "🔒 Checking SSL/TLS configuration..."
if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then # Check for HTTPS enforcement in dev
if ! grep -q "https.*true\|server.*https" vite.config.\* 2>/dev/null; then
echo "ℹ️ Consider enabling HTTPS in development"
else
echo "✅ HTTPS configuration detected"
fi
fi

# Report Results

echo ""
echo "📊 SECURITY SCAN REPORT"
echo "======================="

if [ "$SECURE" = true ]; then
echo "✅ SECURITY COMPLIANT"
echo "No critical security issues detected"
else
echo "❌ SECURITY VIOLATIONS DETECTED"
echo ""
echo "Vulnerabilities:"
for vuln in "${VULNERABILITIES[@]}"; do
        echo " - 🔴 $vuln"
    done
    echo ""
    echo "Threats:"
    for threat in "${THREATS[@]}"; do
echo " - 🟡 $threat"
done
echo ""
echo "Immediate remediation required"
exit 1
fi

echo ""
echo "🛡️ StringRay 1.0.0 Status: SECURE"
echo "Next security scan: Pre-commit and daily"
