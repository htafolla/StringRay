#!/bin/bash

# Simple documentation analysis script

DOCS_DIR="docs"

echo "=== Documentation Analysis ==="
echo "Total files: $(find $DOCS_DIR -name "*.md" | wc -l)"
echo ""

echo "=== Duplicate Files ==="
find $DOCS_DIR -name "*.md" -exec basename {} \; | sort | uniq -c | sort -nr | awk '$1 > 1 {print $1 " copies of: " $2}'

echo ""
echo "=== Directory Structure ==="
find $DOCS_DIR -type d | sort

echo ""
echo "Analysis complete!"</content>
<parameter name="filePath">scripts/simple-docs-analysis.sh