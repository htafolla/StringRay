# Security Training Guide - StrRay Framework

## Overview

This guide provides comprehensive security training for developers working with the StrRay Framework. It covers core security principles, secure coding practices, and framework-specific security recommendations drawn from the framework's implementation.

## Core Security Principles

### Defense in Depth

The StrRay Framework implements multiple layers of security protection:

- **Plugin Sandboxing**: Isolated execution environments prevent system compromise
- **Input Validation**: Multi-layer validation at all entry points
- **Access Control**: Permission-based resource access control
- **Monitoring**: Continuous security event tracking and alerting

### Least Privilege

**Always grant minimum required permissions:**

```typescript
// ❌ Bad: Over-privileged access
class AdminService {
  async performAction(user: User) {
    // Grants all permissions regardless of user role
    return await this.executePrivilegedOperation(user);
  }
}

// ✅ Good: Role-based least privilege
class SecureService {
  async performAction(user: User) {
    // Check specific permissions
    if (!this.hasPermission(user, 'read_sensitive_data')) {
      throw new Error('Access denied: insufficient permissions');
    }
    return await this.executeOperation(user);
  }
}
```

### Zero Trust

**Never trust, always verify:**

```typescript
// ❌ Bad: Trust-based access
function processRequest(req: Request) {
  const userId = req.headers['user-id']; // Trusted without validation
  return await processUserData(userId);
}

// ✅ Good: Validate everything
function processRequest(req: Request) {
  // Validate input
  const userId = req.headers['user-id'];
  if (!userId || typeof userId !== 'string' || userId.length > 50) {
    throw new Error('Invalid user ID');
  }

  // Verify permissions
  const user = await authenticateUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }

  return await processUserData(user.id);
}
```

### Fail-Safe Defaults

**Secure behavior in failure scenarios:**

```typescript
// ✅ Good: Secure defaults
class SecurityConfig {
  constructor(options: Partial<SecurityConfig> = {}) {
    this.enableEncryption = options.enableEncryption ?? true; // Secure by default
    this.maxRetries = options.maxRetries ?? 3; // Reasonable limits
    this.timeout = options.timeout ?? 30000; // Prevent hanging
  }
}
```

## Secure Coding Practices

### Input Validation

**Validate all inputs at boundaries:**

```typescript
// From StrRay SecurityAuditor - comprehensive validation
function validateInput(input: any): string {
  // Type checking
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Length limits
  if (input.length > 10000) {
    throw new Error('Input exceeds maximum length');
  }

  // Content validation
  const dangerousPatterns = [
    /<script/i,  // XSS attempts
    /\.\.\//,    // Path traversal
    /eval\s*\(/, // Code injection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new Error('Invalid input: dangerous content detected');
    }
  }

  // Sanitize output
  return input.replace(/[<>]/g, ''); // Basic HTML escaping
}
```

### Authentication & Session Management

**Secure session handling:**

```typescript
// From StrRay Framework - secure session management
class SessionManager {
  private sessions = new Map<string, SessionData>();

  async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomUUID(); // Cryptographically secure
    const session: SessionData = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      ipAddress: getClientIP(),
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Check IP consistency (optional security measure)
    if (getClientIP() !== session.ipAddress) {
      this.sessions.delete(sessionId);
      return null;
    }

    return await getUser(session.userId);
  }
}
```

### Authorization

**Implement proper access controls:**

```typescript
// Role-Based Access Control (RBAC) implementation
enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

class AccessControl {
  private rolePermissions: Record<string, Permission[]> = {
    'user': [Permission.READ],
    'editor': [Permission.READ, Permission.WRITE],
    'admin': [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN]
  };

  hasPermission(userRole: string, requiredPermission: Permission): boolean {
    const permissions = this.rolePermissions[userRole] || [];
    return permissions.includes(requiredPermission);
  }

  // Usage in business logic
  async deleteResource(user: User, resourceId: string) {
    if (!this.hasPermission(user.role, Permission.DELETE)) {
      throw new Error('Access denied: delete permission required');
    }
    return await this.repository.delete(resourceId);
  }
}
```

### Data Protection

**Protect sensitive data:**

```typescript
// Data encryption and sanitization
class DataProtection {
  private encryptionKey: string;

  constructor() {
    // Never hardcode keys - use environment variables
    this.encryptionKey = process.env.ENCRYPTION_KEY!;
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable required');
    }
  }

  // Encrypt sensitive data
  encryptData(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Sanitize data before logging
  sanitizeForLogging(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.apiKey;
      delete sanitized.creditCard;
      return sanitized;
    }
    return data;
  }
}
```

### Error Handling

**Prevent information disclosure:**

```typescript
// Secure error handling patterns
class ErrorHandler {
  // Log errors securely without exposing sensitive information
  handleError(error: Error, context: any) {
    // Log full error details internally
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString()
    });

    // Return safe error to user
    return {
      success: false,
      error: 'An error occurred. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }

  private sanitizeContext(context: any) {
    // Remove sensitive information from context
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}

// Usage in API endpoints
app.post('/api/user', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    const errorResponse = errorHandler.handleError(error, req.body);
    res.status(500).json(errorResponse);
  }
});
```

### Secure Dependencies

**Manage dependencies securely:**

```json
// package.json - Secure dependency management
{
  "name": "my-strray-app",
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "security-check": "npm run audit && npm audit --audit-level=moderate"
  },
  "dependencies": {
    // Use specific versions, avoid wildcards
    "express": "^4.18.2",
    "helmet": "^7.0.0"  // Security middleware
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Configuration Security

**Secure configuration management:**

```typescript
// Environment-based configuration
class Config {
  public readonly port: number;
  public readonly databaseUrl: string;
  public readonly jwtSecret: string;
  public readonly environment: string;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000');
    this.databaseUrl = process.env.DATABASE_URL!;
    this.jwtSecret = process.env.JWT_SECRET!;
    this.environment = process.env.NODE_ENV || 'development';

    // Validate required environment variables
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (this.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }
}

// Never commit secrets to version control
// .env files should be in .gitignore
const config = new Config();
```

## Framework-Specific Security Practices

### Plugin Development Security

**When developing StrRay plugins:**

```typescript
// Secure plugin structure
export class SecurePlugin {
  name = 'secure-plugin';
  version = '1.0.0';

  // Declare required permissions explicitly
  permissions = [
    'read:files',
    'write:temp',
    // Avoid requesting excessive permissions
  ];

  async execute(context: PluginContext) {
    // Validate inputs
    if (!context.input || typeof context.input !== 'object') {
      throw new Error('Invalid input: expected object');
    }

    // Use framework's security utilities
    const sanitizedInput = await context.security.sanitizeInput(context.input);

    // Implement timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), 30000)
    );

    try {
      const result = await Promise.race([
        this.performOperation(sanitizedInput),
        timeoutPromise
      ]);

      return result;
    } catch (error) {
      // Log securely
      context.logger.error('Plugin execution failed', {
        plugin: this.name,
        error: error.message,
        // Don't log sensitive context
      });
      throw error;
    }
  }
}
```

### Session Security

**Secure multi-agent coordination:**

```typescript
// From StrRay Framework - session isolation
class SessionSecurity {
  async createSecureSession(agentId: string, permissions: string[]): Promise<string> {
    const sessionId = crypto.randomUUID();

    // Create isolated session with specific permissions
    const session = {
      id: sessionId,
      agentId,
      permissions,
      createdAt: Date.now(),
      isolationLevel: 'sandboxed', // Framework-specific security
    };

    // Store in secure session store
    await this.sessionStore.create(session);

    return sessionId;
  }

  async validateSessionAccess(sessionId: string, requiredPermission: string): Promise<boolean> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) return false;

    // Check session validity
    if (Date.now() - session.createdAt > 3600000) { // 1 hour
      await this.sessionStore.delete(sessionId);
      return false;
    }

    // Check permissions
    return session.permissions.includes(requiredPermission);
  }
}
```

### Security Headers Implementation

**Implement comprehensive HTTP security headers:**

```typescript
// From StrRay SecurityHeadersMiddleware
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// Apply to all responses
app.use((req, res, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

## Common Security Vulnerabilities & Prevention

### 1. Injection Attacks

**Prevention:**
- Use parameterized queries or ORMs
- Validate and sanitize all inputs
- Implement content security policies

### 2. Broken Authentication

**Prevention:**
- Use secure session management
- Implement proper password policies
- Enable multi-factor authentication

### 3. Sensitive Data Exposure

**Prevention:**
- Encrypt data at rest and in transit
- Use HTTPS everywhere
- Avoid logging sensitive information

### 4. XML External Entities (XXE)

**Prevention:**
- Disable XML external entity processing
- Use safe XML parsing libraries
- Validate XML input against schemas

### 5. Broken Access Control

**Prevention:**
- Implement role-based access control
- Check permissions on every request
- Use the principle of least privilege

### 6. Security Misconfiguration

**Prevention:**
- Use secure defaults
- Regularly audit configurations
- Automate security checks

### 7. Cross-Site Scripting (XSS)

**Prevention:**
- Sanitize user input
- Use Content Security Policy
- Escape output appropriately

### 8. Insecure Deserialization

**Prevention:**
- Avoid deserializing untrusted data
- Use safe deserialization libraries
- Validate data before deserialization

### 9. Vulnerable Components

**Prevention:**
- Keep dependencies updated
- Use automated vulnerability scanning
- Monitor for security advisories

### 10. Insufficient Logging & Monitoring

**Prevention:**
- Log security-relevant events
- Implement comprehensive monitoring
- Set up alerting for suspicious activities

## Security Testing Practices

### Automated Security Scanning

```typescript
// From StrRay SecurityAuditor - automated scanning
import { securityAuditor } from './security/security-auditor';

async function runSecurityAudit() {
  const auditResult = await securityAuditor.auditProject('./');

  console.log(`Security Score: ${auditResult.score}/100`);

  if (auditResult.issues.length > 0) {
    console.log('Security Issues Found:');
    auditResult.issues.forEach(issue => {
      console.log(`[${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
      console.log(`Recommendation: ${issue.recommendation}`);
      if (issue.cwe) {
        console.log(`CWE: ${issue.cwe}`);
      }
      console.log('---');
    });
  }

  return auditResult.score >= 80; // Pass threshold
}
```

### Manual Security Review Checklist

- [ ] Input validation on all user inputs
- [ ] Authentication checks before sensitive operations
- [ ] Authorization for all resource access
- [ ] Secure error handling (no sensitive data leakage)
- [ ] No hardcoded secrets in code
- [ ] Safe use of dangerous functions
- [ ] Proper session management
- [ ] Secure configuration management
- [ ] HTTPS everywhere
- [ ] Security headers implemented

## Best Practices Summary

1. **Validate all inputs** at application boundaries
2. **Use least privilege** for all operations
3. **Implement defense in depth** with multiple security layers
4. **Fail securely** with secure defaults
5. **Log security events** without exposing sensitive data
6. **Keep dependencies updated** and scan for vulnerabilities
7. **Use secure coding patterns** from the framework examples
8. **Test security** both automatically and manually
9. **Monitor and respond** to security events
10. **Learn continuously** from security incidents and updates

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web application security risks
- [CWE Top 25](https://cwe.mitre.org/top25/) - Common weakness enumeration
- [StrRay Security Architecture](./security/SECURITY_ARCHITECTURE.md) - Framework security details
- [Security Audit Report](./security/SECURITY_AUDIT_REPORT.md) - Current security status

Remember: Security is an ongoing process, not a one-time implementation. Stay vigilant, keep learning, and regularly review and update your security practices.