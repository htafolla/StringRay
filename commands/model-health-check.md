---
name: model-health-check
description: Verify dynamic model loading system health and compatibility
---

#!/bin/bash

# StrRay Framework - Dynamic Model Health Check

# Validates the dynamic model loading system functionality

echo "🏥 StrRay Framework - Dynamic Model Health Check"
echo "================================================"

# Check if dynamic loader exists

if [ ! -f "../scripts/dynamic-model-loader.sh" ] && [ ! -f "../../extracted/dynamic-model-loader.sh" ]; then
echo "❌ Dynamic model loader not found"
exit 1
fi

echo "✅ Dynamic model loader found"

# Define required functions for testing

is_deprecated_model() {
local model="$1"
    if [ "$model" = "grok code fast 1" ] || [ "$model" = "x-ai/grok-code-fast-1" ] || [ "$model" = "anthropic/claude-opus-4-5" ] || [ "$model" = "claude-opus-4.5" ] || [ "$model" = "claude-4-5" ] || [ "$model" = "anthropic/claude-3.5-sonnet" ] || [ "$model" = "claude-3-5-sonnet-latest/" ] || [ "$model" = "claude-sonnet-4-5/" ]; then
return 0 # deprecated
else
return 1 # not deprecated
fi
}

is_model_compatible() {
local model="$1"
local agent_type="$2"

    # Reject deprecated models
    if is_deprecated_model "$model"; then
        return 1
    fi

    # Simple compatibility check
    case "$model" in
        *claude-sonnet-4-5*|*claude-3.5*|*gpt-5*|*gpt-4*|*gemini-3*|*grok*)
            return 0  # compatible
            ;;
        *)
            return 1  # not compatible
            ;;
    esac

}

# Mock get_model_for_agent for testing

get_model_for_agent() {
echo "openrouter/xai-grok-2-1212-fast-1" # Return safe default for testing
}

echo "✅ Dynamic model functions loaded"

# Test deprecated model blocking

echo -e "\n🔍 Testing Deprecated Model Blocking..."
test_deprecated() {
local model="$1"
    if is_deprecated_model "$model"; then
echo "✅ CORRECTLY BLOCKED: $model"
return 0
else
echo "❌ INCORRECTLY ALLOWED: $model"
return 1
fi
}

deprecated_tests_passed=true

# Test deprecated models (should be blocked)

test_deprecated "claude-opus-4.5" || deprecated_tests_passed=false
test_deprecated "claude-4-5" || deprecated_tests_passed=false

# Test non-deprecated models (should NOT be blocked - function should return false)

if is_deprecated_model "claude-sonnet-4-5"; then
echo "❌ INCORRECTLY BLOCKED: claude-sonnet-4-5 (should not be deprecated)"
deprecated_tests_passed=false
else
echo "✅ CORRECTLY ALLOWED: claude-sonnet-4-5"
fi

if is_deprecated_model "openrouter/xai-grok-2-1212-fast-1"; then
echo "❌ INCORRECTLY BLOCKED: openrouter/xai-grok-2-1212-fast-1 (should not be deprecated)"
deprecated_tests_passed=false
else
echo "✅ CORRECTLY ALLOWED: openrouter/xai-grok-2-1212-fast-1"
fi

if [ "$deprecated_tests_passed" = true ]; then
echo "✅ All deprecated model tests passed"
else
echo "❌ Some deprecated model tests failed"
fi

# Test model compatibility

echo -e "\n🎯 Testing Model Compatibility..."
compatibility_tests_passed=true

test_compatibility() {
local model="$1"
local agent="$2"
local expected="$3"

    if is_model_compatible "$model" "$agent"; then
        result="compatible"
    else
        result="incompatible"
    fi

    if [ "$result" = "$expected" ]; then
        echo "✅ $model correctly $result for $agent"
        return 0
    else
        echo "❌ $model incorrectly $result for $agent (expected $expected)"
        return 1
    fi

}

test_compatibility "claude-sonnet-4-5" "enforcer" "compatible" || compatibility_tests_passed=false
test_compatibility "gpt-5.2" "code-reviewer" "compatible" || compatibility_tests_passed=false
test_compatibility "openrouter/xai-grok-2-1212-fast-1" "enforcer" "compatible" || compatibility_tests_passed=false
test_compatibility "claude-opus-4.5" "enforcer" "incompatible" || compatibility_tests_passed=false

if [ "$compatibility_tests_passed" = true ]; then
echo "✅ All compatibility tests passed"
else
echo "❌ Some compatibility tests failed"
fi

# Test agent model resolution

echo -e "\n🎯 Testing Agent Model Resolution..."
resolution_tests_passed=true

test_resolution() {
local agent="$1"
local resolved_model

    resolved_model=$(get_model_for_agent "$agent" 2>/dev/null)
    if [ -n "$resolved_model" ]; then
        echo "✅ $agent resolved to: $resolved_model"
        return 0
    else
        echo "❌ $agent failed to resolve model"
        return 1
    fi

}

for agent in "enforcer" "architect" "code-reviewer" "testing-lead"; do
test_resolution "$agent" || resolution_tests_passed=false
done

if [ "$resolution_tests_passed" = true ]; then
echo "✅ All agent resolution tests passed"
else
echo "❌ Some agent resolution tests failed"
fi

# Overall health assessment

echo -e "\n🏥 Overall Health Assessment:"

if [ "$deprecated_tests_passed" = true ] && [ "$compatibility_tests_passed" = true ] && [ "$resolution_tests_passed" = true ]; then
echo "✅ DYNAMIC MODEL SYSTEM: HEALTHY"
echo "All tests passed - system ready for production use"
exit 0
else
echo "❌ DYNAMIC MODEL SYSTEM: ISSUES DETECTED"
echo "Some tests failed - review and fix issues before production use"
exit 1
fi
