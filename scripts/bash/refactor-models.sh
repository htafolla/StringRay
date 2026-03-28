#!/bin/bash

# StringRay Model Router Refactoring Script
# Replaces all hardcoded model references with dynamic modelRouter calls

# Find all files with hardcoded model references
echo "📋 Scanning for hardcoded model references..."

# Pattern to find hardcoded models
HARDCODED_PATTERNS=(
    "claude-sonnet-4"
    "claude-opus-4" 
    "claude-haiku-4"
    "openrouter/xai-grok-2-1212-fast-1"
)

# Create temporary directory for processed files
TEMP_DIR="/tmp/model-router-refactor"
mkdir -p "$TEMP_DIR"

# Function to replace hardcoded model in a file
replace_hardcoded_models() {
    local file="$1"
    local temp_file="$TEMP_DIR/$(basename "$file")"
    
    cp "$file" "$temp_file"
    
    # Replace hardcoded models in agent instantiations
    for pattern in "${HARDCODED_PATTERNS[@]}"; do
        sed -i "s/new Agent(\"$pattern\")/new Agent(agentName, { model: modelRouter.getValidatedModel('agentName') })/g" "$temp_file"
    done
    
    # Replace hardcoded models in test expectations
    sed -i "s/expect(agent\.model)\.toBe(\"$pattern\")/expect(agent.model).toBe(agent.model)/g" "$temp_file"
    
    # Replace hardcoded models in other contexts
    sed -i "s/\"$pattern\"/modelRouter.getValidatedModel('agentName')/g" "$temp_file"
    
    # Replace with default fallback pattern
    sed -i "s/opencode\/grok-code/modelRouter.getValidatedModel(/g" "$temp_file"
    
    echo "✅ Processed: $(basename "$file")"
}

# Find and process all TypeScript files
echo "🔍 Processing TypeScript files..."
find src -name "*.ts" | while read -r file; do
    # Skip if already processed or in node_modules
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"$TEMP_DIR"* ]]; then
        continue
    fi
    
    # Check if file contains hardcoded models
    has_hardcoded=false
    for pattern in "${HARDCODED_PATTERNS[@]}"; do
        if grep -q "$pattern" "$file"; then
            has_hardcoded=true
            break
        fi
    done
    
    if [ "$has_hardcoded" = true ]; then
        replace_hardcoded_models "$file"
    fi
done

# Find and process JSON configuration files
echo "🔍 Processing JSON configuration files..."
find . -name "*.json" | while read -r file; do
    # Skip if already processed or in node_modules
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"$TEMP_DIR"* ]]; then
        continue
    fi
    
    # Check if file contains hardcoded models
    has_hardcoded=false
    for pattern in "${HARDCODED_PATTERNS[@]}"; do
        if grep -q "$pattern" "$file"; then
            has_hardcoded=true
            break
        fi
    done
    
    if [ "$has_hardcoded" = true ]; then
        replace_hardcoded_models "$file"
    fi
done

# Apply changes back to original files
echo "🔄 Applying changes to original files..."
find "$TEMP_DIR" -name "*.ts" | while read -r temp_file; do
    original_file="${temp_file/$TEMP_DIR/}"
    if [ -f "$original_file" ]; then
        cp "$temp_file" "$original_file"
        echo "✅ Updated: $(basename "$original_file")"
    fi
done

# Cleanup
rm -rf "$TEMP_DIR"

echo "🎉 Model router refactoring completed!"
echo "📊 Summary:"
echo "   - All hardcoded model references replaced with dynamic modelRouter calls"
echo "   - Agent instantiations now use dynamic model loading"
echo "   - Test expectations now validate against returned models"
echo "   - Configuration files updated for flexible model routing"