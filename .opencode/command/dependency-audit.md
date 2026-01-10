# Dependency Audit Command

## Description
Comprehensive dependency analysis and security audit for all project dependencies across npm, pip, cargo, and other package managers.

## Usage
/dependency-audit [options]

## Options
- `--managers=<list>`: Package managers to audit (npm,pip,cargo,go,maven)
- `--severity=<level>`: Minimum severity to report (low,medium,high,critical)
- `--fix`: Auto-fix issues where possible
- `--update`: Update dependencies to latest compatible versions
- `--report=<format>`: Output format (json, html, markdown, sarif)

## Implementation

### 1. Dependency Discovery
- **Package Managers**: Auto-detect and scan all used managers
- **Lock Files**: Parse package-lock.json, requirements.txt, Cargo.lock, etc.
- **Transitive Dependencies**: Analyze entire dependency tree
- **Dev Dependencies**: Separate analysis for dev vs production deps

### 2. Security Vulnerability Scanning
- **CVE Database**: Check against NIST NVD
- **Advisory Sources**: NPM, PyPI, RustSec, GitHub Advisories
- **Custom Rules**: Project-specific security policies
- **License Compliance**: Open source license validation

### 3. Version Analysis
- **Outdated Packages**: Identify packages with available updates
- **Compatibility**: Check version compatibility across dependencies
- **Breaking Changes**: Identify potentially breaking updates
- **Maintenance Status**: Check package maintenance activity

### 4. Performance Impact
- **Bundle Size**: Impact of dependencies on bundle size
- **Load Time**: Network loading performance
- **Tree Shaking**: Dead code elimination effectiveness
- **Caching**: Browser caching efficiency

### 5. Quality Metrics
- **Maintenance**: Commit frequency, issue response time
- **Popularity**: Download counts, GitHub stars
- **Security**: Security audit history
- **Compatibility**: Platform and Node.js version support

## Output Formats

### JSON Report
```json
{
  "timestamp": "2024-01-09T12:00:00Z",
  "summary": {
    "totalDeps": 245,
    "vulnerable": 3,
    "outdated": 12,
    "unmaintained": 1
  },
  "vulnerabilities": [
    {
      "package": "lodash",
      "version": "4.17.20",
      "severity": "high",
      "cve": "CVE-2021-23337",
      "description": "Command injection vulnerability"
    }
  ],
  "recommendations": [...]
}
```

### SARIF Report
Security-focused format for CI/CD integration:
```json
{
  "version": "2.1.0",
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "Dependency Audit",
          "version": "1.0.0"
        }
      },
      "results": [...]
    }
  ]
}
```

### HTML Dashboard
Interactive dashboard with:
- Vulnerability timeline
- Dependency tree visualization
- Risk assessment charts
- Remediation recommendations

## Remediation Actions

### Automatic Fixes
- **Patch Updates**: Apply security patches
- **Version Pinning**: Lock to secure versions
- **Dependency Removal**: Remove unused dependencies
- **Alternative Packages**: Suggest secure alternatives

### Manual Actions Required
- **Code Changes**: Update API usage for breaking changes
- **Configuration Updates**: Modify config for new versions
- **Testing**: Validate functionality after updates
- **Documentation**: Update docs for API changes

## Integration

### CI/CD Pipeline
```yaml
- name: Dependency Audit
  run: /dependency-audit --severity=medium --report=sarif
  continue-on-error: false
```

### Pre-commit Hook
```bash
#!/bin/bash
/dependency-audit --managers=npm --severity=high
if [ $? -ne 0 ]; then
  echo "Dependency audit failed. Fix vulnerabilities before committing."
  exit 1
fi
```

### Scheduled Scans
- Daily security scans
- Weekly dependency updates
- Monthly comprehensive audits

## Configuration
Project-specific settings in `.dependency-audit.json`:

```json
{
  "managers": {
    "npm": {
      "ignore": ["devDependencies"],
      "allowList": ["lodash@4.17.21"]
    },
    "pip": {
      "index-url": "https://pypi.org/simple/"
    }
  },
  "policies": {
    "maxAge": "1y",
    "minDownloads": 1000,
    "requireSbom": true
  }
}
```

## Dependencies
- Node.js 18+
- Package managers (npm, yarn, pnpm, pip, cargo, etc.)
- Security databases (NVD, OSV)
- Vulnerability scanners (npm audit, safety, cargo audit)
