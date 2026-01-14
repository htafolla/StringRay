#!/bin/bash

echo "🔍 StrRay Framework - Profiling System Validation"
echo "==============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

validate_profiling() {
    echo -e "\n📊 Checking profiling system components..."

    # Check if profiling files exist
    if [ -f "src/monitoring/advanced-profiler.ts" ]; then
        echo -e "${GREEN}✅ Advanced profiler module exists${NC}"
    else
        echo -e "${RED}❌ Advanced profiler module missing${NC}"
        return 1
    fi

    if [ -f "src/monitoring/enterprise-monitoring-system.ts" ]; then
        echo -e "${GREEN}✅ Enterprise monitoring system exists${NC}"
    else
        echo -e "${RED}❌ Enterprise monitoring system missing${NC}"
        return 1
    fi

    # Check TypeScript compilation
    echo -e "\n🔧 Checking TypeScript compilation..."
    if command -v npx &> /dev/null; then
        if npx tsc --noEmit --skipLibCheck src/monitoring/advanced-profiler.ts 2>/dev/null; then
            echo -e "${GREEN}✅ Profiler TypeScript compilation successful${NC}"
        else
            echo -e "${RED}❌ Profiler TypeScript compilation failed${NC}"
            return 1
        fi

        if npx tsc --noEmit --skipLibCheck src/monitoring/enterprise-monitoring-system.ts 2>/dev/null; then
            echo -e "${GREEN}✅ Monitoring system TypeScript compilation successful${NC}"
        else
            echo -e "${RED}❌ Monitoring system TypeScript compilation failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  npx not available - skipping TypeScript validation${NC}"
    fi

    # Check profiling directory
    if [ -d ".strray/profiles" ]; then
        echo -e "${GREEN}✅ Profiling storage directory exists${NC}"
        local report_count=$(find .strray/profiles -name "*.json" 2>/dev/null | wc -l)
        echo -e "${GREEN}📊 Found $report_count performance reports${NC}"
    else
        echo -e "${YELLOW}⚠️  Profiling storage directory not yet created (will be created on first run)${NC}"
    fi

    echo -e "\n🎉 Profiling system validation completed!"
    return 0
}

# Run validation
validate_profiling
