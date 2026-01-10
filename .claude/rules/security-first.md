---
title: Security First
severity: critical
category: security
tags: [security, vulnerability, compliance]
enabled: true
---

# Security First Rule

## Description
Enforce security best practices and prevent common vulnerabilities in code.

## Rationale
Security vulnerabilities can lead to data breaches, financial loss, and reputational damage. This rule ensures security is considered in every code change.

## Rules

### Input Validation
**Pattern**: All user inputs must be validated
```typescript
// ❌ Bad
function processUserInput(input: string) {
  return eval(input); // Dangerous!
}

// ✅ Good
function processUserInput(input: string) {
  if (!isValidInput(input)) {
    throw new Error('Invalid input');
  }
  return safeProcess(input);
}
```

### Authentication & Authorization
**Pattern**: Proper auth checks before sensitive operations
```typescript
// ❌ Bad
app.get('/admin', (req, res) => {
  // No auth check!
  return res.send(adminData);
});

// ✅ Good
app.get('/admin', authenticate, authorize('admin'), (req, res) => {
  return res.send(adminData);
});
```

### Data Sanitization
**Pattern**: Sanitize data before rendering or storage
```typescript
// ❌ Bad
const html = `<div>${userInput}</div>`;

// ✅ Good
const html = `<div>${sanitizeHtml(userInput)}</div>`;
```

### Secure Dependencies
**Pattern**: No vulnerable dependencies
```json
// ❌ Bad - vulnerable version
"dependencies": {
  "lodash": "4.17.4"
}

// ✅ Good - patched version
"dependencies": {
  "lodash": "4.17.21"
}
```

### Secrets Management
**Pattern**: Never commit secrets
```typescript
// ❌ Bad
const apiKey = 'sk-1234567890';

// ✅ Good
const apiKey = process.env.API_KEY;
```

### HTTPS Only
**Pattern**: All external requests use HTTPS
```typescript
// ❌ Bad
const response = await fetch('http://api.example.com');

// ✅ Good
const response = await fetch('https://api.example.com');
```

### Error Handling
**Pattern**: Don't leak sensitive information in errors
```typescript
// ❌ Bad
catch (error) {
  res.status(500).send(error.message); // Leaks internal details
}

// ✅ Good
catch (error) {
  logger.error('Database error:', error);
  res.status(500).send('Internal server error');
}
```

## Configuration

### Severity Levels
- **Critical**: Immediate security risk (SQL injection, XSS, etc.)
- **High**: Significant security concern (weak crypto, auth bypass)
- **Medium**: Moderate risk (information disclosure, DoS)
- **Low**: Minor issues (deprecated APIs, weak configs)

### Scope
- **Files**: `src/**/*.{ts,js,py,go,java}`
- **Exclude**: `test/**/*`, `node_modules/**/*`

### Custom Rules
Add project-specific security rules in `.security-rules.json`:

```json
{
  "customRules": [
    {
      "name": "no-api-keys-in-code",
      "pattern": "api[_-]?key\\s*[:=]\\s*['\"][^'\"]+['\"]",
      "message": "API keys should be in environment variables"
    }
  ]
}
```

## Enforcement

### Pre-commit Hook
```bash
#!/bin/bash
/security-check --files="$(git diff --cached --name-only)"
if [ $? -ne 0 ]; then
  echo "Security violations found. Please fix before committing."
  exit 1
fi
```

### CI Pipeline
```yaml
- name: Security Check
  run: /security-check --severity=high --fail-on-warnings
```

### IDE Integration
- Real-time security warnings
- Quick fixes for common issues
- Security best practice suggestions

## Dependencies
- ESLint security plugins
- Dependency scanners (npm audit, Snyk)
- Secret detection tools (git-secrets, truffleHog)
- Code analysis tools (Semgrep, CodeQL)

## Maintenance
- **Update Frequency**: Daily vulnerability database updates
- **Rule Updates**: Weekly security rule updates
- **False Positive Review**: Monthly review and tuning
