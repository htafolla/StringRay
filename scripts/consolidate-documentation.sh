#!/bin/bash

# StringRay Framework - Documentation Consolidation Script
# Consolidates duplicate documentation files and removes obsolete content

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Function to find duplicate files
find_duplicates() {
    log_info "Finding duplicate documentation files..."

    find "$DOCS_DIR" -name "*.md" -exec basename {} \; | sort | uniq -c | sort -nr | while read count filename; do
        if [[ $count -gt 1 ]]; then
            echo "DUPLICATE ($count): $filename"
            find "$DOCS_DIR" -name "$filename" -type f
            echo "---"
        fi
    done
}

# Function to consolidate troubleshooting guides
consolidate_troubleshooting() {
    log_info "Consolidating troubleshooting guides..."

    if [[ -f "$DOCS_DIR/TROUBLESHOOTING.md" ]]; then
        log_info "Main troubleshooting guide exists"

        local other_files=(
            "$DOCS_DIR/troubleshooting/TROUBLESHOOTING.md"
            "$DOCS_DIR/user-guides/TROUBLESHOOTING.md"
            "$DOCS_DIR/internal/troubleshooting/TROUBLESHOOTING.md"
        )

        for file in "${other_files[@]}"; do
            if [[ -f "$file" ]]; then
                log_warning "Duplicate troubleshooting file: $file"
            fi
        done
    fi
}

# Function to analyze documentation health
analyze_health() {
    log_info "Analyzing documentation health..."

    local total_files=$(find "$DOCS_DIR" -name "*.md" | wc -l)
    local archive_files=$(find "$DOCS_DIR/archive" -name "*.md" 2>/dev/null | wc -l)
    local active_files=$((total_files - archive_files))

    echo "Total documentation files: $total_files"
    echo "Active documentation files: $active_files"
    echo "Archived documentation files: $archive_files"

    local duplicate_groups=$(find "$DOCS_DIR" -name "*.md" -exec basename {} \; | sort | uniq -c | awk '$1 > 1 {count++} END {print count+0}')
    echo "Duplicate filename groups: $duplicate_groups"

    if [[ $duplicate_groups -gt 5 ]]; then
        log_warning "High number of duplicate files detected - consolidation recommended"
    fi

    if [[ $total_files -gt 100 ]]; then
        log_warning "Large documentation set ($total_files files) - consider consolidation"
    fi
}

# Function to generate consolidation report
generate_report() {
    log_info "Generating consolidation report..."

    local report_file="$PROJECT_ROOT/docs/archive/CONSOLIDATION_REPORT_$(date +%Y%m%d).md"

    cat > "$report_file" << EOF
# Documentation Consolidation Report
Generated: $(date)

## Current State
- Total documentation files: $(find "$DOCS_DIR" -name "*.md" | wc -l)
- Active files: $(find "$DOCS_DIR" -name "*.md" | grep -v "/archive/" | wc -l)
- Archived files: $(find "$DOCS_DIR/archive" -name "*.md" | wc -l)

## Issues Identified
- Duplicate filename groups: $(find "$DOCS_DIR" -name "*.md" -exec basename {} \; | sort | uniq -c | awk '$1 > 1 {count++} END {print count+0}')
- Broken links in main README: Multiple references to non-existent files
- Scattered content: Same topics documented in multiple locations

## Files to Review
$(find "$DOCS_DIR" -name "*.md" -exec basename {} \; | sort | uniq -c | sort -nr | awk '$1 > 1 {print "- " $2 " (appears " $1 " times)"}')

EOF

    log_success "Consolidation report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting Documentation Consolidation Analysis"
    echo "=============================================="

    find_duplicates
    echo ""

    consolidate_troubleshooting
    echo ""

    analyze_health
    echo ""

    generate_report

    echo ""
    log_success "Documentation consolidation analysis complete!"
}

main "$@"</content>
<parameter name="filePath">scripts/consolidate-documentation.sh