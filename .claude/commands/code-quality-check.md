# Code Quality Check Command

## Description
Comprehensive code quality assessment combining linting, testing, security scanning, and performance analysis.

## Usage
/code-quality-check [options]

## Options
- `--files=<pattern>`: File pattern to check (default: "src/**/*.{ts,js,py}")
- `--strict`: Enable strict mode with zero tolerance
- `--fix`: Auto-fix issues where possible
- `--report=<format>`: Output format (json, html, markdown)
- `--threshold=<score>`: Minimum quality score (0-100)

## Implementation Steps

### 1. Code Analysis
- **Linting**: ESLint, Prettier, TSLint
- **Type Checking**: TypeScript compiler
- **Complexity**: Cyclomatic complexity analysis
- **Duplication**: Code duplication detection

### 2. Testing Assessment
- **Coverage**: Test coverage percentage
- **Quality**: Test effectiveness metrics
- **Performance**: Test execution time
- **Flakiness**: Test reliability analysis

### 3. Security Scanning
- **Vulnerabilities**: Known security issues
- **Dependencies**: Outdated/malicious packages
- **Secrets**: Exposed credentials detection
- **Permissions**: Access control validation

### 4. Performance Evaluation
- **Bundle Size**: JavaScript bundle analysis
- **Load Time**: Initial page load metrics
- **Runtime**: Memory usage and leaks
- **Network**: API call efficiency

### 5. Quality Scoring
```json
{
  "overall": 87,
  "breakdown": {
    "code": 92,
    "tests": 85,
    "security": 95,
    "performance": 78
  },
  "issues": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 12
  }
}
```

## Output Formats

### JSON Report
```json
{
  "timestamp": "2024-01-09T12:00:00Z",
  "files": ["src/component.ts", "src/utils.ts"],
  "results": {
    "passed": true,
    "score": 87,
    "duration": "45s"
  },
  "details": [...]
}
```

### HTML Report
Interactive web report with:
- Charts and graphs
- Drill-down details
- Trend analysis
- Recommendations

### Markdown Report
GitHub-compatible markdown with:
- Summary table
- Issue breakdown
- Action items
- Links to documentation

## Integration

### Pre-commit Hook
```bash
#!/bin/bash
/code-quality-check --files="$(git diff --cached --name-only)" --strict
if [ $? -ne 0 ]; then
  echo "Code quality check failed. Please fix issues before committing."
  exit 1
fi
```

### CI Pipeline
```yaml
- name: Code Quality Check
  run: /code-quality-check --report=json --threshold=80
  continue-on-error: false
```

### IDE Integration
- VS Code extension available
- Real-time feedback
- Quick fixes for common issues

## Dependencies
- Node.js 18+
- ESLint, Prettier
- Jest/Vitest
- Security scanners (npm audit, Snyk)
- Performance tools (Lighthouse, WebPageTest)

## Configuration
Custom rules and thresholds can be defined in `.code-quality.json`:

```json
{
  "rules": {
    "max-complexity": 10,
    "min-coverage": 85,
    "security-level": "high"
  },
  "exclusions": [
    "test/**/*",
    "dist/**/*"
  ]
}
```
