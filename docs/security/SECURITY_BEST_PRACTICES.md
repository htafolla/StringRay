# Security Best Practices - StrRay Framework

## Overview

This document outlines security best practices specifically tailored for StrRay Framework development. It provides actionable recommendations based on the framework's architecture, security components, and real-world implementation patterns.

## Framework Security Architecture

### Understanding StrRay Security Layers

The StrRay Framework implements multiple security layers that work together to provide comprehensive protection:

```
┌─────────────────────────────────────┐
│         Plugin Sandboxing           │ ← Isolated execution
├─────────────────────────────────────┤
│      Permission-Based Access        │ ← Granular controls
├─────────────────────────────────────┤
│        Input Validation             │ ← Boundary protection
├─────────────────────────────────────┤
│      Authentication & Session       │ ← Identity management
├─────────────────────────────────────┤
│         Data Protection             │ ← Encryption & privacy
├─────────────────────────────────────┤
│      Security Monitoring            │ ← Detection & alerting
└─────────────────────────────────────┘
```

### Security by Design Principle

StrRay enforces "Security by Design" through:
- **Secure defaults**: All security features enabled by default
- **Framework validation**: Automated security checks in CI/CD
- **Codex compliance**: 45 mandatory security terms enforced
- **Zero-tolerance policy**: No unresolved security issues allowed

## Authentication & Authorization

### Implementing Secure Authentication

**Use StrRay's session management patterns:**

```typescript
import { SessionManager } from './security/session-manager';

class SecureAuthService {
  private sessionManager = new SessionManager();

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate input
    if (!this.validateCredentials(credentials)) {
      await this.logFailedAttempt(credentials.username);
      throw new Error('Invalid credentials');
    }

    // Create secure session
    const user = await this.getUser(credentials.username);
    const sessionId = await this.sessionManager.createSecureSession(user.id, user.roles);

    // Log successful authentication
    await this.logAuthSuccess(user.id, sessionId);

    return {
      sessionId,
      user: this.sanitizeUserData(user),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
  }

  async validateSession(sessionId: string): Promise<User | null> {
    return await this.sessionManager.validateSession(sessionId);
  }

  private validateCredentials(credentials: LoginCredentials): boolean {
    return credentials.username?.length >= 3 &&
           credentials.password?.length >= 8 &&
           /^[a-zA-Z0-9_]+$/.test(credentials.username);
  }

  private sanitizeUserData(user: User): SanitizedUser {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
```

### Authorization Best Practices

**Implement role-based access control (RBAC) with StrRay patterns:**

```typescript
enum Permission {
  READ_PROJECTS = 'read:projects',
  WRITE_PROJECTS = 'write:projects',
  DELETE_PROJECTS = 'delete:projects',
  MANAGE_USERS = 'manage:users',
  ADMIN_SYSTEM = 'admin:system'
}

class RBACService {
  private rolePermissions: Record<string, Permission[]> = {
    'developer': [Permission.READ_PROJECTS, Permission.WRITE_PROJECTS],
    'project_manager': [Permission.READ_PROJECTS, Permission.WRITE_PROJECTS, Permission.MANAGE_USERS],
    'admin': Object.values(Permission)
  };

  async checkPermission(userId: string, permission: Permission, resource?: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Check if user has the required permission
    const userPermissions = this.rolePermissions[user.role] || [];
    if (!userPermissions.includes(permission)) {
      await this.logAccessDenied(userId, permission, resource);
      return false;
    }

    // Additional resource-specific checks
    if (resource && !(await this.checkResourceAccess(user, permission, resource))) {
      await this.logAccessDenied(userId, permission, resource);
      return false;
    }

    return true;
  }

  private async checkResourceAccess(user: User, permission: Permission, resource: string): Promise<boolean> {
    // Implement resource ownership or sharing logic
    const resourceOwner = await this.getResourceOwner(resource);
    return resourceOwner === user.id || user.role === 'admin';
  }
}
```

### Session Security

**Follow StrRay's session isolation principles:**

```typescript
class SecureSessionManager {
  private sessions = new Map<string, SessionData>();
  private readonly maxSessionsPerUser = 5;
  private readonly sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  async createSession(userId: string, metadata: SessionMetadata): Promise<string> {
    // Enforce session limits
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId);

    if (userSessions.length >= this.maxSessionsPerUser) {
      // Remove oldest session
      const oldestSession = userSessions
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      this.sessions.delete(oldestSession.id);
    }

    const sessionId = crypto.randomUUID();
    const session: SessionData = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();

    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
```

## Input Validation & Data Sanitization

### Comprehensive Input Validation

**Implement multi-layer validation following StrRay patterns:**

```typescript
class InputValidator {
  // Schema-based validation
  private schemas = {
    userProfile: {
      username: { type: 'string', minLength: 3, maxLength: 50, pattern: /^[a-zA-Z0-9_]+$/ },
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 13, maximum: 120 }
    },
    projectCreate: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 1000 },
      visibility: { type: 'string', enum: ['public', 'private', 'internal'] }
    }
  };

  async validate<T>(data: any, schemaName: string): Promise<ValidationResult<T>> {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown validation schema: ${schemaName}`);
    }

    const errors: string[] = [];

    // Type validation
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    // Business logic validation
    const businessErrors = await this.validateBusinessLogic(data, schemaName);
    errors.push(...businessErrors);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? this.sanitizeData(data, schemaName) : null
    };
  }

  private validateField(field: string, value: any, rules: any): string[] {
    const errors: string[] = [];

    // Required field check
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`);
      return errors; // Don't validate further if missing
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.minimum !== undefined && value < rules.minimum) {
        errors.push(`${field} must be at least ${rules.minimum}`);
      }
      if (rules.maximum !== undefined && value > rules.maximum) {
        errors.push(`${field} must be at most ${rules.maximum}`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    return errors;
  }

  private async validateBusinessLogic(data: any, schemaName: string): Promise<string[]> {
    const errors: string[] = [];

    switch (schemaName) {
      case 'userProfile':
        if (data.username) {
          const existingUser = await this.checkUsernameExists(data.username);
          if (existingUser) {
            errors.push('Username already exists');
          }
        }
        break;
      case 'projectCreate':
        if (data.name) {
          const existingProject = await this.checkProjectExists(data.name);
          if (existingProject) {
            errors.push('Project name already exists');
          }
        }
        break;
    }

    return errors;
  }

  private sanitizeData(data: any, schemaName: string): any {
    const sanitized = { ...data };

    // HTML escaping for string fields
    for (const [field, rules] of Object.entries(this.schemas[schemaName])) {
      if (rules.type === 'string' && typeof sanitized[field] === 'string') {
        sanitized[field] = sanitized[field].replace(/[<>]/g, '');
      }
    }

    return sanitized;
  }

  private async checkUsernameExists(username: string): Promise<boolean> {
    // Implementation would check database
    return false; // Placeholder
  }

  private async checkProjectExists(name: string): Promise<boolean> {
    // Implementation would check database
    return false; // Placeholder
  }
}

interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  sanitizedData: T | null;
}
```

### Data Sanitization Patterns

**Use StrRay's sanitization utilities:**

```typescript
class DataSanitizer {
  // HTML sanitization
  sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // SQL-safe escaping (for cases where parameterized queries aren't available)
  sanitizeSql(input: string): string {
    return input.replace(/['\\]/g, '\\$&');
  }

  // File path sanitization
  sanitizePath(input: string): string {
    // Remove dangerous path components
    return input
      .replace(/\.\./g, '') // Remove directory traversal
      .replace(/[<>:"|?*]/g, '') // Remove Windows forbidden chars
      .replace(/^\//, '') // Remove leading slash
      .substring(0, 255); // Limit length
  }

  // Log sanitization (prevent log injection)
  sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return data.replace(/[\r\n]/g, ' ');
    }
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

## Plugin Security

### Secure Plugin Development

**Follow StrRay's plugin security requirements:**

```typescript
// Secure plugin structure
export class SecurePlugin {
  name = 'secure-data-processor';
  version = '1.0.0';
  description = 'Processes sensitive data securely';

  // Declare minimal required permissions
  permissions = [
    'read:secure-data',
    'write:processed-data'
    // Avoid requesting excessive permissions
  ];

  // Resource limits (framework-enforced)
  resourceLimits = {
    memory: '50MB',
    timeout: '30s',
    maxConcurrent: 5
  };

  async initialize(context: PluginContext): Promise<void> {
    // Validate context
    if (!context.config.apiKey) {
      throw new Error('API key required for plugin initialization');
    }

    // Initialize securely
    this.apiClient = this.createSecureClient(context.config.apiKey);
  }

  async execute(input: PluginInput): Promise<PluginOutput> {
    // Input validation
    if (!this.validateInput(input)) {
      throw new Error('Invalid input data');
    }

    try {
      // Process with timeout protection
      const result = await this.processData(input);

      // Log securely (no sensitive data)
      context.logger.info('Data processed successfully', {
        recordCount: result.recordsProcessed,
        processingTime: result.duration
      });

      return result;
    } catch (error) {
      // Secure error handling
      context.logger.error('Processing failed', {
        error: error.message,
        inputSize: input.data?.length
        // Don't log sensitive input data
      });
      throw new Error('Data processing failed');
    }
  }

  private validateInput(input: PluginInput): boolean {
    return input &&
           typeof input === 'object' &&
           input.data &&
           Array.isArray(input.data) &&
           input.data.length > 0 &&
           input.data.length <= 1000; // Reasonable limit
  }

  private createSecureClient(apiKey: string) {
    // Use secure HTTP client with timeouts and validation
    return {
      request: async (endpoint: string, data: any) => {
        // Implement secure API calls
        // - Use HTTPS
        // - Validate SSL certificates
        // - Implement retry logic
        // - Add request timeouts
      }
    };
  }

  private async processData(input: PluginInput): Promise<PluginOutput> {
    // Implement data processing with security checks
    // - Validate data integrity
    // - Implement access controls
    // - Use secure temporary storage
    // - Clean up resources
  }
}
```

### Plugin Permission Management

**Implement proper permission validation:**

```typescript
class PluginPermissionManager {
  private pluginPermissions = new Map<string, string[]>();

  registerPlugin(pluginId: string, permissions: string[]): void {
    // Validate permissions are reasonable
    const allowedPermissions = [
      'read:public-data',
      'read:secure-data',
      'write:processed-data',
      'network:external-api',
      'storage:temp'
    ];

    const validPermissions = permissions.filter(p => allowedPermissions.includes(p));

    if (validPermissions.length !== permissions.length) {
      throw new Error('Invalid permissions requested by plugin');
    }

    this.pluginPermissions.set(pluginId, validPermissions);
  }

  async checkPermission(pluginId: string, permission: string): Promise<boolean> {
    const permissions = this.pluginPermissions.get(pluginId) || [];
    return permissions.includes(permission);
  }

  async executeWithPermission<T>(
    pluginId: string,
    permission: string,
    action: () => Promise<T>
  ): Promise<T> {
    if (!(await this.checkPermission(pluginId, permission))) {
      throw new Error(`Plugin ${pluginId} lacks permission: ${permission}`);
    }

    // Audit the permission usage
    await this.auditLog(pluginId, permission, 'granted');

    return await action();
  }

  private async auditLog(pluginId: string, permission: string, action: string): Promise<void> {
    // Log permission usage for security monitoring
    console.log(`[AUDIT] Plugin ${pluginId} ${action} permission: ${permission}`);
  }
}
```

## Data Protection & Encryption

### Secure Data Storage

**Implement encryption at rest:**

```typescript
import { createCipher, createDecipher, randomBytes, scrypt } from 'crypto';

class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;

  async encryptData(data: string, password: string): Promise<EncryptedData> {
    // Derive key from password using scrypt
    const salt = randomBytes(32);
    const key = await this.deriveKey(password, salt);

    // Generate initialization vector
    const iv = randomBytes(16);

    // Create cipher
    const cipher = createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('additional-auth-data'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    // Derive key from password
    const key = await this.deriveKey(password, encryptedData.salt);

    // Create decipher
    const decipher = createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('additional-auth-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private async deriveKey(password: string, salt: Buffer | string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'hex');
      scrypt(password, saltBuffer, this.keyLength, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  authTag: string;
}
```

### Secure Communication

**Implement HTTPS and secure API communication:**

```typescript
import * as https from 'https';
import * as tls from 'tls';

class SecureHttpClient {
  private readonly caCertificate: string;
  private readonly clientCertificate: string;
  private readonly clientKey: string;

  constructor(config: HttpsConfig) {
    this.caCertificate = config.caCert;
    this.clientCertificate = config.clientCert;
    this.clientKey = config.clientKey;
  }

  async request(options: RequestOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestOptions: https.RequestOptions = {
        hostname: options.hostname,
        port: 443,
        path: options.path,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'StrRay-Secure-Client/1.0',
          ...options.headers
        },
        // Security configurations
        rejectUnauthorized: true, // Reject invalid certificates
        checkServerIdentity: (host, cert) => {
          // Additional certificate validation
          return tls.checkServerIdentity(host, cert);
        },
        ca: this.caCertificate,
        cert: this.clientCertificate,
        key: this.clientKey,
        // Timeout protection
        timeout: 30000, // 30 seconds
        // Cipher suite restrictions
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:!RC4:!MD5:!DSS',
        secureProtocol: 'TLSv1_2_method'
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        // Validate response
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Send request body if provided
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }
}

interface HttpsConfig {
  caCert: string;
  clientCert: string;
  clientKey: string;
}

interface RequestOptions {
  hostname: string;
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}
```

## Security Monitoring & Logging

### Comprehensive Security Logging

**Implement StrRay-style security event logging:**

```typescript
enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  ACCESS_DENIED = 'access_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS = 'data_access',
  CONFIG_CHANGE = 'config_change'
}

class SecurityLogger {
  private logFile = '/var/log/strray/security.log';
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private maxFiles = 5;

  async logSecurityEvent(
    eventType: SecurityEventType,
    details: SecurityEventDetails
  ): Promise<void> {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      userId: details.userId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      resource: details.resource,
      action: details.action,
      success: details.success,
      metadata: this.sanitizeMetadata(details.metadata)
    };

    // Write to log file
    await this.writeToFile(JSON.stringify(event));

    // Check for security alerts
    await this.checkForAlerts(event);

    // Rotate logs if needed
    await this.rotateLogsIfNeeded();
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata) return {};

    const sanitized = { ...metadata };
    // Remove sensitive information
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.creditCard;
    delete sanitized.ssn;

    return sanitized;
  }

  private async writeToFile(logEntry: string): Promise<void> {
    // Implementation would write to secure log file
    // with proper permissions and rotation
  }

  private async checkForAlerts(event: any): Promise<void> {
    // Check for suspicious patterns
    if (event.type === SecurityEventType.AUTH_FAILURE) {
      const recentFailures = await this.getRecentFailures(event.userId);
      if (recentFailures >= 5) {
        await this.alertBruteForce(event.userId, event.ipAddress);
      }
    }

    if (event.type === SecurityEventType.ACCESS_DENIED) {
      const recentDenials = await this.getRecentDenials(event.userId);
      if (recentDenials >= 10) {
        await this.alertPotentialAttack(event.userId);
      }
    }
  }

  private async rotateLogsIfNeeded(): Promise<void> {
    // Implement log rotation logic
  }

  private async getRecentFailures(userId: string): Promise<number> {
    // Query recent authentication failures
    return 0; // Placeholder
  }

  private async getRecentDenials(userId: string): Promise<number> {
    // Query recent access denials
    return 0; // Placeholder
  }

  private async alertBruteForce(userId: string, ipAddress: string): Promise<void> {
    console.error(`[ALERT] Brute force attack detected for user ${userId} from ${ipAddress}`);
    // Implement alerting logic (email, Slack, etc.)
  }

  private async alertPotentialAttack(userId: string): Promise<void> {
    console.error(`[ALERT] Potential attack pattern detected for user ${userId}`);
    // Implement alerting logic
  }
}

interface SecurityEventDetails {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success?: boolean;
  metadata?: any;
}
```

### Automated Security Monitoring

**Implement continuous security monitoring:**

```typescript
class SecurityMonitor {
  private alerts: Alert[] = [];
  private readonly checkInterval = 60000; // 1 minute

  startMonitoring(): void {
    setInterval(() => {
      this.runSecurityChecks();
    }, this.checkInterval);
  }

  private async runSecurityChecks(): Promise<void> {
    await Promise.all([
      this.checkFailedAuthentications(),
      this.checkSuspiciousFileAccess(),
      this.checkResourceUsage(),
      this.checkConfigurationChanges(),
      this.checkDependencyVulnerabilities()
    ]);
  }

  private async checkFailedAuthentications(): Promise<void> {
    const recentFailures = await this.getFailedAuthentications(300000); // Last 5 minutes

    if (recentFailures >= 10) {
      this.createAlert({
        severity: 'high',
        type: 'brute_force_attempt',
        message: `${recentFailures} failed authentications in 5 minutes`,
        details: { count: recentFailures }
      });
    }
  }

  private async checkSuspiciousFileAccess(): Promise<void> {
    const suspiciousAccess = await this.getSuspiciousFileAccess(300000);

    for (const access of suspiciousAccess) {
      this.createAlert({
        severity: 'medium',
        type: 'suspicious_file_access',
        message: `Suspicious file access: ${access.file}`,
        details: access
      });
    }
  }

  private async checkResourceUsage(): Promise<void> {
    const usage = await this.getResourceUsage();

    if (usage.memory > 0.9) { // 90% memory usage
      this.createAlert({
        severity: 'medium',
        type: 'high_memory_usage',
        message: `High memory usage: ${(usage.memory * 100).toFixed(1)}%`,
        details: usage
      });
    }
  }

  private async checkConfigurationChanges(): Promise<void> {
    const changes = await this.getRecentConfigChanges(3600000); // Last hour

    for (const change of changes) {
      this.createAlert({
        severity: 'low',
        type: 'configuration_change',
        message: `Configuration changed: ${change.file}`,
        details: change
      });
    }
  }

  private async checkDependencyVulnerabilities(): Promise<void> {
    // Run security audit
    const auditResult = await this.runDependencyAudit();

    if (auditResult.vulnerabilities > 0) {
      this.createAlert({
        severity: 'high',
        type: 'dependency_vulnerabilities',
        message: `${auditResult.vulnerabilities} dependency vulnerabilities found`,
        details: auditResult
      });
    }
  }

  private createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.alerts.push(newAlert);

    // Send alert notification
    this.sendAlert(newAlert);
  }

  private sendAlert(alert: Alert): void {
    // Implement alert delivery (email, Slack, webhook, etc.)
    console.error(`[SECURITY ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  // Placeholder implementations
  private async getFailedAuthentications(timeWindow: number): Promise<number> { return 0; }
  private async getSuspiciousFileAccess(timeWindow: number): Promise<any[]> { return []; }
  private async getResourceUsage(): Promise<any> { return { memory: 0.5 }; }
  private async getRecentConfigChanges(timeWindow: number): Promise<any[]> { return []; }
  private async runDependencyAudit(): Promise<any> { return { vulnerabilities: 0 }; }
}

interface Alert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  details: any;
}
```

## Configuration Security

### Secure Configuration Management

**Follow StrRay's configuration security patterns:**

```typescript
class SecureConfig {
  private config: any = {};
  private readonly configFile = '/etc/strray/config.json';
  private readonly backupDir = '/etc/strray/backups/';

  async loadConfig(): Promise<void> {
    // Validate file permissions
    await this.validateConfigFilePermissions();

    // Load and parse configuration
    const configData = await this.readConfigFile();

    // Validate configuration schema
    this.validateConfigSchema(configData);

    // Decrypt sensitive values
    this.config = await this.decryptSensitiveValues(configData);

    // Validate configuration values
    this.validateConfigValues();
  }

  private async validateConfigFilePermissions(): Promise<void> {
    const stats = await fs.promises.stat(this.configFile);

    // Check ownership (should be root or strray user)
    if (stats.uid !== 0 && stats.uid !== 1000) { // Adjust UIDs as needed
      throw new Error('Config file has incorrect ownership');
    }

    // Check permissions (should be 600 or 640)
    const permissions = (stats.mode & parseInt('777', 8)).toString(8);
    if (!['600', '640'].includes(permissions)) {
      throw new Error('Config file has incorrect permissions');
    }
  }

  private async readConfigFile(): Promise<string> {
    try {
      return await fs.promises.readFile(this.configFile, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read config file: ${error.message}`);
    }
  }

  private validateConfigSchema(configData: string): void {
    try {
      const config = JSON.parse(configData);

      // Required fields
      const requiredFields = ['database', 'security', 'logging'];
      for (const field of requiredFields) {
        if (!(field in config)) {
          throw new Error(`Missing required config field: ${field}`);
        }
      }

      // Validate nested structures
      this.validateDatabaseConfig(config.database);
      this.validateSecurityConfig(config.security);
      this.validateLoggingConfig(config.logging);

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Config file contains invalid JSON');
      }
      throw error;
    }
  }

  private validateDatabaseConfig(dbConfig: any): void {
    if (!dbConfig.host || !dbConfig.database) {
      throw new Error('Database configuration incomplete');
    }
  }

  private validateSecurityConfig(secConfig: any): void {
    if (secConfig.encryptionKey?.length < 32) {
      throw new Error('Encryption key too short (minimum 32 characters)');
    }
  }

  private validateLoggingConfig(logConfig: any): void {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(logConfig.level)) {
      throw new Error('Invalid log level');
    }
  }

  private async decryptSensitiveValues(config: any): Promise<any> {
    const decrypted = { ...config };

    // Decrypt encrypted fields
    if (config.database?.password) {
      decrypted.database.password = await this.decryptValue(config.database.password);
    }
    if (config.security?.apiKey) {
      decrypted.security.apiKey = await this.decryptValue(config.security.apiKey);
    }

    return decrypted;
  }

  private async decryptValue(encryptedValue: string): Promise<string> {
    // Implementation would decrypt using secure key management
    return encryptedValue; // Placeholder
  }

  private validateConfigValues(): void {
    // Business logic validation
    if (this.config.database?.port < 1024 || this.config.database?.port > 65535) {
      throw new Error('Database port out of valid range');
    }

    if (this.config.security?.sessionTimeout < 300000) { // 5 minutes minimum
      throw new Error('Session timeout too short');
    }
  }

  async saveConfig(newConfig: any): Promise<void> {
    // Create backup
    await this.createBackup();

    // Validate new configuration
    this.validateConfigSchema(JSON.stringify(newConfig));

    // Encrypt sensitive values
    const encryptedConfig = await this.encryptSensitiveValues(newConfig);

    // Write configuration
    await fs.promises.writeFile(this.configFile, JSON.stringify(encryptedConfig, null, 2));

    // Update in-memory config
    this.config = newConfig;
  }

  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${this.backupDir}config-${timestamp}.json`;

    await fs.promises.copyFile(this.configFile, backupFile);
  }

  private async encryptSensitiveValues(config: any): Promise<any> {
    // Implementation would encrypt sensitive fields
    return config; // Placeholder
  }

  get(key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config);
  }
}
```

## Dependency & Environment Security

### Secure Dependency Management

**Implement StrRay's dependency security practices:**

```json
{
  "name": "strray-secure-app",
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "security-check": "npm run audit && npm run security-audit",
    "security-audit": "node scripts/security-audit.js",
    "preinstall": "npm run security-check"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "joi": "^17.9.2"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

```typescript
// Automated dependency vulnerability checking
class DependencySecurity {
  async checkVulnerabilities(): Promise<VulnerabilityReport> {
    const auditResult = await this.runNpmAudit();
    const customChecks = await this.runCustomSecurityChecks();

    return {
      npmAudit: auditResult,
      customChecks,
      overallRisk: this.calculateOverallRisk(auditResult, customChecks),
      recommendations: this.generateRecommendations(auditResult, customChecks)
    };
  }

  private async runNpmAudit(): Promise<any> {
    // Run npm audit and parse results
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('npm audit --json', (error, stdout, stderr) => {
        if (error && error.code !== 1) { // Code 1 means vulnerabilities found
          reject(error);
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  private async runCustomSecurityChecks(): Promise<any[]> {
    // Custom security checks for StrRay-specific concerns
    const checks = [
      this.checkForInsecureImports(),
      this.checkForHardcodedSecrets(),
      this.checkForDangerousPatterns()
    ];

    return await Promise.all(checks);
  }

  private async checkForInsecureImports(): Promise<any> {
    // Check for potentially dangerous imports
    const dangerousImports = ['eval', 'child_process', 'fs', 'net'];
    // Implementation would scan codebase
    return { type: 'insecure_imports', findings: [] };
  }

  private async checkForHardcodedSecrets(): Promise<any> {
    // Check for hardcoded secrets
    const secretPatterns = [/password\s*[:=]/, /api[_-]?key\s*[:=]/];
    // Implementation would scan codebase
    return { type: 'hardcoded_secrets', findings: [] };
  }

  private async checkForDangerousPatterns(): Promise<any> {
    // Check for dangerous code patterns
    const patterns = [/eval\s*\(/, /Function\s*\(/, /setTimeout.*0/];
    // Implementation would scan codebase
    return { type: 'dangerous_patterns', findings: [] };
  }

  private calculateOverallRisk(npmAudit: any, customChecks: any[]): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // NPM audit scoring
    if (npmAudit.metadata?.vulnerabilities) {
      const vuln = npmAudit.metadata.vulnerabilities;
      riskScore += vuln.critical * 10;
      riskScore += vuln.high * 5;
      riskScore += vuln.moderate * 2;
      riskScore += vuln.low * 1;
    }

    // Custom check scoring
    for (const check of customChecks) {
      riskScore += check.findings.length * 3;
    }

    if (riskScore >= 20) return 'critical';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
  }

  private generateRecommendations(npmAudit: any, customChecks: any[]): string[] {
    const recommendations: string[] = [];

    if (npmAudit.metadata?.vulnerabilities) {
      const vuln = npmAudit.metadata.vulnerabilities;
      if (vuln.critical > 0 || vuln.high > 0) {
        recommendations.push('Update dependencies with critical/high vulnerabilities immediately');
      }
    }

    for (const check of customChecks) {
      if (check.findings.length > 0) {
        recommendations.push(`${check.type}: ${check.findings.length} issues found`);
      }
    }

    return recommendations;
  }
}

interface VulnerabilityReport {
  npmAudit: any;
  customChecks: any[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}
```

## Summary

Following these StrRay Framework security best practices ensures:

1. **Multi-layered security** with defense in depth
2. **Secure defaults** that protect even with misconfiguration
3. **Comprehensive validation** at all input boundaries
4. **Proper authentication and authorization** with session security
5. **Data protection** through encryption and secure handling
6. **Plugin security** with sandboxing and permission controls
7. **Continuous monitoring** and automated security checks
8. **Secure configuration** management with validation
9. **Dependency security** through automated scanning and updates

Implement these patterns consistently across your StrRay Framework applications to maintain the framework's security posture and protect against common vulnerabilities.