---
severity: warning
category: best-practice
---

# No Console Statements

## Description
Disallow console statements in production code.

## Rationale
Console statements should not be committed to production code.

## Examples
```javascript
// Bad
console.log('debug');

// Good
logger.info('debug');
```
