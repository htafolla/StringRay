# Claude SEO Integration

This directory contains the Claude SEO skill integrated into StringRay.

## Source

- **Original**: [https://github.com/AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)
- **License**: MIT
- **Version**: Installed 2026-03-09T07:40:30.001Z

## Features

### Core Skills (8)
- `seo-audit/` - Full website audit with parallel subagents
- `seo-page/` - Deep single-page analysis
- `seo-sitemap/` - XML sitemap analysis and generation
- `seo-schema/` - Schema markup detection and generation
- `seo-technical/` - Technical SEO audit (8 categories)
- `seo-content/` - E-E-A-T and content quality analysis
- `seo-geo/` - AI Search / GEO optimization
- `seo-plan/` - Strategic SEO planning

### Advanced Skills (4, --full only)
- `seo-programmatic/` - Programmatic SEO with quality gates
- `seo-competitor-pages/` - "X vs Y" comparison generator
- `seo-hreflang/` - Multi-language SEO validation
- `seo-images/` - Image optimization analysis

### Subagents (5, --full only)
- seo-ai-visibility
- seo-platform-analysis  
- seo-technical-agent
- seo-content-agent
- seo-schema-agent

## Usage

After installation, use these commands in Claude Code:

```
/seo audit <url>         - Full website audit
/seo page <url>          - Single page analysis
/seo technical <url>     - Technical SEO audit
/seo content <url>       - E-E-A-T analysis
/seo geo <url>           - AI search optimization
/seo schema <url>        - Schema markup
/seo sitemap generate    - Generate sitemap
```

## Integration with StringRay

This integration works alongside StringRay's built-in SEO tools:

| Feature | StringRay | Claude SEO |
|---------|-----------|------------|
| Technical SEO | Basic | Advanced (8 cats) |
| Schema | 6 types | 10+ types |
| AI Search | Basic | Advanced |
| E-E-A-T | ❌ | ✅ |
| PDF Reports | ❌ | ✅ |
| Programmatic | ❌ | ✅ |

## Commands

```bash
# Install core skills
node scripts/integrations/install-claude-seo.js

# Install everything
node scripts/integrations/install-claude-seo.js --full

# Re-install
node scripts/integrations/install-claude-seo.js --full
```

---
*Integrated into StringRay v1.7.5*
