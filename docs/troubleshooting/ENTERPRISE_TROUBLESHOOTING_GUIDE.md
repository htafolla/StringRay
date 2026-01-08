# StrRay Framework - Enterprise Troubleshooting Guide

## Table of Contents

1. [Troubleshooting Overview](#troubleshooting-overview)
2. [Framework Startup Issues](#framework-startup-issues)
3. [Agent Coordination Problems](#agent-coordination-problems)
4. [Performance Issues](#performance-issues)
5. [Security-Related Problems](#security-related-problems)
6. [Database and Persistence Issues](#database-and-persistence-issues)
7. [Network and Connectivity Issues](#network-and-connectivity-issues)
8. [Plugin and Extension Issues](#plugin-and-extension-issues)
9. [Monitoring and Alerting Issues](#monitoring-and-alerting-issues)
10. [Emergency Procedures](#emergency-procedures)

---

## Troubleshooting Overview

The StrRay Framework includes comprehensive diagnostic capabilities and troubleshooting tools designed for enterprise environments. This guide provides systematic approaches to identify and resolve common issues.

### Diagnostic Tools

#### Framework Health Check
```bash
# Comprehensive health check
npm run health-check

# Individual component checks
npm run check:codex
npm run check:agents
npm run check:performance
npm run check:security
```

#### Logging Configuration
```typescript
// Enable debug logging
process.env.DEBUG = 'strray:*';

// Structured logging configuration
const logger = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  outputs: [
    { type: 'console' },
    { type: 'file', path: './logs/strray.log' },
    { type: 'syslog', host: 'logs.papertrailapp.com', port: 12345 }
  ]
};
```

#### Diagnostic Commands
```bash
# Generate diagnostic report
npm run diagnostics > diagnostics-$(date +%Y%m%d-%H%M%S).txt

# Check system resources
npm run check:system

# Validate configuration
npm run validate:config

# Test agent communication
npm run test:agents
```

---

## Framework Startup Issues

### Bootstrap Failure

**Symptoms:**
- Framework fails to start
- Error messages about missing dependencies
- Codex injection failures

**Diagnostic Steps:**
```bash
# Check Node.js version
node --version
# Should be 18.0.0 or higher

# Verify npm dependencies
npm ls --depth=0

# Check oh-my-opencode installation
npm list -g oh-my-opencode

# Validate configuration files
npm run validate:config
```

**Common Solutions:**

#### Missing Dependencies
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency issues
npm ls --depth=0
```

#### Configuration Issues
```json
// .opencode/oh-my-opencode.json - Validate structure
{
  "$schema": "https://opencode.ai/oh-my-opencode.schema.json",
  "model_routing": {
    "enforcer": "opencode/grok-code",
    "architect": "opencode/grok-code",
    "orchestrator": "opencode/grok-code",
    "bug-triage-specialist": "opencode/grok-code",
    "code-reviewer": "opencode/grok-code",
    "security-auditor": "opencode/grok-code",
    "refactorer": "opencode/grok-code",
    "test-architect": "opencode/grok-code"
  },
  "framework": {
    "name": "strray",
    "version": "1.0.0"
  }
}
```

#### Codex Injection Failure
```bash
# Check codex file exists
ls -la .opencode/agents_template.md

# Validate codex structure
npm run validate:codex

# Reinitialize codex
npm run init:codex
```

### Agent Loading Issues

**Symptoms:**
- Agents fail to initialize
- Missing agent capabilities
- Model routing errors

**Diagnostic Steps:**
```bash
# Check agent registration
npm run list:agents

# Test individual agent loading
npm run test:agent -- enforcer
npm run test:agent -- architect

# Validate model routing
npm run check:model-routing
```

**Solutions:**

#### Agent Registration Issues
```typescript
// Check agent exports in src/agents/index.ts
export { StrRayEnforcer } from './enforcer';
export { StrRayArchitect } from './architect';
// ... ensure all agents are exported

// Validate agent interfaces
interface Agent {
  name: string;
  capabilities: string[];
  execute(context: AgentContext): Promise<TaskResult>;
}
```

#### Model Routing Problems
```bash
# Check oh-my-opencode model availability
oh-my-opencode models list

# Test model connectivity
oh-my-opencode models test opencode/grok-code

# Update model routing configuration
oh-my-opencode config set model_routing.enforcer "opencode/grok-code"
```

---

## Agent Coordination Problems

### Task Execution Failures

**Symptoms:**
- Tasks fail to execute
- Agent communication errors
- Task timeout issues

**Diagnostic Steps:**
```bash
# Monitor task execution
npm run monitor:tasks

# Check agent health
npm run health:agents

# Review task logs
tail -f logs/tasks.log

# Test task submission
npm run test:task-submission
```

**Solutions:**

#### Task Queue Issues
```typescript
// Check task queue configuration
const taskQueue = {
  maxConcurrency: 10,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  backoffMultiplier: 2
};

// Monitor queue status
const queueStatus = await taskQueue.getStatus();
console.log('Active tasks:', queueStatus.active);
console.log('Queued tasks:', queueStatus.queued);
console.log('Failed tasks:', queueStatus.failed);
```

#### Agent Communication Problems
```typescript
// Test inter-agent communication
const testCommunication = async () => {
  const agent1 = await agentRegistry.getAgent('enforcer');
  const agent2 = await agentRegistry.getAgent('architect');

  try {
    const result = await orchestrator.coordinate({
      task: 'cross-agent-validation',
      agents: [agent1, agent2],
      strategy: 'consensus'
    });
    console.log('Communication test passed');
  } catch (error) {
    console.error('Communication test failed:', error);
  }
};
```

### Conflict Resolution Issues

**Symptoms:**
- Agents disagree on decisions
- Task execution stalls
- Inconsistent results

**Diagnostic Steps:**
```bash
# Check conflict resolution strategy
npm run check:conflict-strategy

# Review agent consensus logs
grep "conflict" logs/agent.log

# Test consensus algorithm
npm run test:consensus
```

**Solutions:**

#### Consensus Algorithm Tuning
```typescript
const consensusConfig = {
  strategy: 'weighted-voting', // majority-vote, expert-priority, consensus
  weights: {
    enforcer: 1.0,
    architect: 1.2,
    'code-reviewer': 1.1,
    'security-auditor': 1.3
  },
  threshold: 0.7, // 70% agreement required
  timeout: 60000  // 60 seconds
};

// Adjust weights based on domain expertise
consensusConfig.weights['security-auditor'] = 1.5; // Higher weight for security
```

#### Expert Priority Configuration
```typescript
const expertConfig = {
  domains: {
    security: ['security-auditor'],
    architecture: ['architect'],
    code_quality: ['code-reviewer', 'enforcer'],
    testing: ['test-architect']
  },
  priority_rules: [
    { domain: 'security', priority: 'high' },
    { domain: 'architecture', priority: 'medium' },
    { condition: 'breaking_changes', priority: 'high' }
  ]
};
```

---

## Performance Issues

### Memory Leaks

**Symptoms:**
- Gradual memory usage increase
- Application restarts due to OOM
- Performance degradation over time

**Diagnostic Steps:**
```bash
# Monitor memory usage
npm run monitor:memory

# Generate heap snapshot
npm run heap:snapshot

# Analyze memory leaks
npm run analyze:memory

# Check for object retention
npm run check:retention
```

**Solutions:**

#### Memory Leak Detection
```typescript
// Enable memory monitoring
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
  // Log leak information
  logger.error('Memory leak', {
    growth: info.growth,
    reason: info.reason,
    timestamp: new Date().toISOString()
  });
});

// Periodic heap analysis
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected');

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Generate heap dump for analysis
    require('heapdump').writeSnapshot('./heap-' + Date.now() + '.heapsnapshot');
  }
}, 300000); // Check every 5 minutes
```

#### Object Pool Optimization
```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;

  constructor(createFn: () => T, resetFn?: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }
}

// Usage example
const taskPool = new ObjectPool(
  () => ({ id: '', type: '', payload: null, startTime: 0 }),
  (task) => {
    task.id = '';
    task.type = '';
    task.payload = null;
    task.startTime = 0;
  },
  100
);
```

### Slow Response Times

**Symptoms:**
- API responses >100ms
- Database query timeouts
- High CPU usage

**Diagnostic Steps:**
```bash
# Profile response times
npm run profile:responses

# Check database performance
npm run analyze:queries

# Monitor CPU usage
npm run monitor:cpu

# Test under load
npm run load:test
```

**Solutions:**

#### Response Time Optimization
```typescript
// Add response time monitoring middleware
const responseTimeMiddleware = (req: Request, res: Response, next: Function) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds

    // Log slow responses
    if (duration > 100) {
      logger.warn('Slow response', {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode
      });
    }

    // Add to metrics
    metrics.recordResponseTime(duration);
  });

  next();
};

// Database query optimization
const optimizeQuery = async (query: string, params: any[]) => {
  const start = process.hrtime.bigint();

  try {
    const result = await db.query(query, params);
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6;

    // Log slow queries
    if (duration > 50) {
      logger.warn('Slow query', { query, duration, params });
    }

    return result;
  } catch (error) {
    logger.error('Query error', { query, error, params });
    throw error;
  }
};
```

#### CPU Bottlenecks
```typescript
// CPU profiling
const profiler = require('v8-profiler-node8');

const startCPUProfiling = () => {
  profiler.startProfiling('cpu-profile', true);
  return profiler;
};

const stopCPUProfiling = (profilerInstance: any) => {
  const profile = profilerInstance.stopProfiling('cpu-profile');

  profile.export((error: Error, result: any) => {
    if (error) {
      logger.error('Profile export error', error);
    } else {
      // Save profile for analysis
      const fileName = `./profiles/cpu-${Date.now()}.cpuprofile`;
      require('fs').writeFileSync(fileName, JSON.stringify(result));
      logger.info('CPU profile saved', { fileName });
    }
    profile.delete();
  });
};

// Worker thread implementation for CPU-intensive tasks
const { Worker } = require('worker_threads');

const runInWorker = (task: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js');

    worker.postMessage(task);

    worker.on('message', (result: any) => {
      resolve(result);
      worker.terminate();
    });

    worker.on('error', (error: Error) => {
      reject(error);
      worker.terminate();
    });

    worker.on('exit', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};
```

---

## Security-Related Problems

### Authentication Failures

**Symptoms:**
- Login attempts failing
- Token validation errors
- Session timeout issues

**Diagnostic Steps:**
```bash
# Test authentication flow
npm run test:auth

# Check token validation
npm run validate:tokens

# Review security logs
tail -f logs/security.log

# Test session management
npm run test:sessions
```

**Solutions:**

#### JWT Token Issues
```typescript
// Validate JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '24h',
  issuer: 'strray-framework',
  audience: 'strray-api'
};

// Test token generation and validation
const testJWT = () => {
  const token = jwt.sign(
    { userId: 'test-user', roles: ['user'] },
    jwtConfig.secret,
    {
      algorithm: jwtConfig.algorithm,
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );

  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    console.log('JWT validation successful');
  } catch (error) {
    console.error('JWT validation failed:', error);
  }
};
```

#### Authorization Problems
```typescript
// Check permission configuration
const permissions = {
  'user.create': ['admin', 'manager'],
  'user.read': ['admin', 'manager', 'user'],
  'user.update': ['admin', 'manager'],
  'user.delete': ['admin'],

  'agent.execute': ['admin', 'developer'],
  'agent.configure': ['admin'],
  'system.monitor': ['admin', 'operator']
};

// Validate user permissions
const hasPermission = (user: User, permission: string): boolean => {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  const allowedRoles = permissions[permission];
  if (!allowedRoles) {
    return false; // Permission not defined
  }

  return user.roles.some(role => allowedRoles.includes(role));
};
```

### Security Audit Failures

**Symptoms:**
- Security scans failing
- Vulnerability alerts
- Compliance violations

**Diagnostic Steps:**
```bash
# Run security audit
npm run audit:security

# Check vulnerability database
npm run check:vulnerabilities

# Review security logs
grep "SECURITY" logs/framework.log

# Test security controls
npm run test:security
```

**Solutions:**

#### Dependency Vulnerability Management
```bash
# Check for vulnerable dependencies
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Update dependencies with security fixes
npm update --save

# Use npm audit fix --force for breaking changes (with caution)
```

#### Code Security Issues
```typescript
// Common security fixes

// 1. SQL Injection Prevention
// ❌ Bad
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);

// 2. XSS Prevention
// ❌ Bad
res.send(`<div>Hello ${userInput}</div>`);

// ✅ Good
res.send(`<div>Hello ${escapeHtml(userInput)}</div>`);

// 3. Command Injection Prevention
// ❌ Bad
exec(`ls ${userPath}`);

// ✅ Good
exec('ls', [userPath]); // Use array form
// or
exec(escapeShellArg(`ls ${userPath}`));
```

### Encryption Problems

**Symptoms:**
- Data decryption failures
- Certificate validation errors
- TLS handshake failures

**Diagnostic Steps:**
```bash
# Test encryption/decryption
npm run test:encryption

# Validate certificates
npm run check:certificates

# Test TLS connections
npm run test:tls

# Check encryption logs
grep "ENCRYPTION" logs/security.log
```

**Solutions:**

#### Certificate Management
```typescript
// SSL/TLS configuration
const tlsConfig = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
  ca: fs.readFileSync('ca.crt'),
  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:!RC4',
  honorCipherOrder: true,
  secureProtocol: 'TLSv1_2_method',
  requestCert: true,
  rejectUnauthorized: true
};

// Certificate validation
const validateCertificate = (cert: any): boolean => {
  try {
    // Check expiration
    const now = new Date();
    if (cert.valid_from > now || cert.valid_to < now) {
      return false;
    }

    // Check issuer
    if (cert.issuer.CN !== 'Expected CA') {
      return false;
    }

    // Check subject
    if (!cert.subject.CN.includes('strray-framework')) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Certificate validation error', error);
    return false;
  }
};
```

---

## Database and Persistence Issues

### Connection Problems

**Symptoms:**
- Database connection failures
- Connection pool exhaustion
- Query timeouts

**Diagnostic Steps:**
```bash
# Test database connectivity
npm run test:db-connection

# Check connection pool status
npm run monitor:db-pool

# Review database logs
tail -f logs/database.log

# Test query execution
npm run test:db-queries
```

**Solutions:**

#### Connection Pool Configuration
```typescript
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'strray',
  user: process.env.DB_USER || 'strray',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',

  // Connection pool settings
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout 2s

  // Retry configuration
  retry: {
    max: 3,                   // Maximum retry attempts
    timeout: 5000             // Timeout between retries
  }
};

// Connection pool monitoring
const pool = new Pool(dbConfig);

pool.on('connect', (client) => {
  logger.info('New database connection established');
});

pool.on('error', (err, client) => {
  logger.error('Database connection error', err);
});

pool.on('remove', (client) => {
  logger.info('Database connection removed from pool');
});
```

### Query Performance Issues

**Symptoms:**
- Slow query execution
- Database lock contention
- Index inefficiency

**Diagnostic Steps:**
```bash
# Analyze query performance
npm run analyze:queries

# Check index usage
npm run check:indexes

# Monitor database locks
npm run monitor:locks

# Review slow query logs
tail -f logs/slow-queries.log
```

**Solutions:**

#### Query Optimization
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY idx_agent_logs_timestamp ON agent_logs(timestamp);

-- Optimize slow queries
EXPLAIN ANALYZE
SELECT u.name, COUNT(t.id) as task_count
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
WHERE u.created_at > $1
GROUP BY u.id, u.name
ORDER BY task_count DESC
LIMIT 100;

-- Use appropriate query patterns
-- Instead of multiple queries, use JOINs
-- Instead of N+1 queries, use batch loading
-- Use pagination for large result sets
```

#### Database Maintenance
```bash
# Vacuum and analyze tables
VACUUM ANALYZE users;
VACUUM ANALYZE tasks;
VACUUM ANALYZE agent_logs;

# Reindex tables
REINDEX TABLE CONCURRENTLY users;
REINDEX TABLE CONCURRENTLY tasks;

# Monitor table bloat
SELECT
  schemaname, tablename,
  n_dead_tup, n_live_tup,
  round(n_dead_tup::float / (n_live_tup + n_dead_tup) * 100, 2) as bloat_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY bloat_ratio DESC;
```

---

## Network and Connectivity Issues

### API Connectivity Problems

**Symptoms:**
- API request failures
- Timeout errors
- Network partition issues

**Diagnostic Steps:**
```bash
# Test API connectivity
npm run test:api-connectivity

# Check network configuration
npm run check:network

# Monitor network traffic
npm run monitor:network

# Test load balancer
npm run test:load-balancer
```

**Solutions:**

#### Network Configuration
```typescript
// HTTP client configuration with retries and timeouts
const httpClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 30000, // 30 second timeout

  // Retry configuration
  retry: 3,
  retryDelay: 1000,

  // Connection pooling
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000,

  // Security
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    keepAlive: true,
    maxSockets: 100
  })
});

// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 minute timeout
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= 5) { // Open circuit after 5 failures
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

### Load Balancer Issues

**Symptoms:**
- Uneven request distribution
- Session persistence problems
- Health check failures

**Diagnostic Steps:**
```bash
# Check load balancer configuration
npm run check:load-balancer

# Monitor request distribution
npm run monitor:distribution

# Test session persistence
npm run test:sessions

# Review load balancer logs
tail -f /var/log/nginx/access.log
```

**Solutions:**

#### Load Balancer Configuration
```nginx
# Nginx load balancer configuration
upstream strray_backend {
    least_conn;  # Least connections algorithm

    server strray-1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server strray-2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server strray-3:3000 weight=1 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

server {
    listen 80;
    server_name api.strray.example.com;

    # SSL/TLS configuration
    ssl_certificate /etc/ssl/certs/strray.crt;
    ssl_certificate_key /etc/ssl/private/strray.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req zone=api burst=10 nodelay;

    location / {
        proxy_pass http://strray_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout configuration
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

---

## Plugin and Extension Issues

### Plugin Loading Failures

**Symptoms:**
- Plugin installation errors
- Sandbox initialization failures
- Permission denied errors

**Diagnostic Steps:**
```bash
# Check plugin status
npm run list:plugins

# Test plugin loading
npm run test:plugin-loading

# Validate plugin permissions
npm run check:plugin-permissions

# Review plugin logs
tail -f logs/plugins.log
```

**Solutions:**

#### Plugin Sandbox Configuration
```typescript
// Plugin sandbox configuration
const sandboxConfig = {
  memoryLimit: 50 * 1024 * 1024,  // 50MB
  timeout: 30000,                 // 30 seconds
  allowedModules: [
    'fs', 'path', 'crypto', 'util',
    'events', 'stream', 'buffer'
  ],
  restrictedGlobals: [
    'process', 'global', 'console', '__dirname', '__filename'
  ],
  networkAccess: false,
  fileSystemAccess: {
    read: ['./data', './config'],
    write: ['./temp']
  }
};

// Plugin validation
const validatePlugin = (pluginCode: string): ValidationResult => {
  const issues: string[] = [];

  // Check for dangerous patterns
  if (pluginCode.includes('eval(')) {
    issues.push('Use of eval() is not allowed');
  }

  if (pluginCode.includes('require(\'child_process\')')) {
    issues.push('Child process execution is not allowed');
  }

  // Check syntax
  try {
    new Function(pluginCode);
  } catch (error) {
    issues.push(`Syntax error: ${error.message}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};
```

### Plugin Compatibility Issues

**Symptoms:**
- Plugin API version mismatches
- Framework compatibility errors
- Extension loading failures

**Diagnostic Steps:**
```bash
# Check plugin compatibility
npm run check:plugin-compatibility

# Validate API versions
npm run validate:api-versions

# Test plugin isolation
npm run test:plugin-isolation

# Review compatibility logs
grep "COMPATIBILITY" logs/framework.log
```

**Solutions:**

#### Plugin Version Management
```typescript
// Plugin version compatibility matrix
const compatibilityMatrix = {
  'strray-1.0': {
    supportedPluginVersions: ['1.0.x', '1.1.x'],
    deprecatedFeatures: [],
    breakingChanges: []
  },
  'strray-1.1': {
    supportedPluginVersions: ['1.1.x', '1.2.x'],
    deprecatedFeatures: ['oldApiMethod'],
    breakingChanges: ['configFormatChanged']
  }
};

// Plugin migration helper
class PluginMigrator {
  async migratePlugin(plugin: Plugin, targetVersion: string): Promise<Plugin> {
    const migrationPath = this.getMigrationPath(plugin.version, targetVersion);

    for (const migration of migrationPath) {
      plugin = await migration.upgrade(plugin);
    }

    return plugin;
  }

  private getMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    // Calculate migration steps
    const migrations: Migration[] = [];

    if (fromVersion === '1.0.x' && toVersion === '1.1.x') {
      migrations.push(new ConfigFormatMigration());
    }

    return migrations;
  }
}
```

---

## Monitoring and Alerting Issues

### Alert Configuration Problems

**Symptoms:**
- Missing alerts
- False positive alerts
- Alert delivery failures

**Diagnostic Steps:**
```bash
# Check alert configuration
npm run validate:alerts

# Test alert delivery
npm run test:alert-delivery

# Review alert logs
tail -f logs/alerts.log

# Monitor alert queue
npm run monitor:alert-queue
```

**Solutions:**

#### Alert Configuration
```typescript
// Alert rule configuration
const alertRules = {
  performance: {
    highCpuUsage: {
      condition: 'cpu_usage > 80',
      duration: '5m',
      severity: 'warning',
      channels: ['email', 'slack'],
      cooldown: '10m'
    },
    memoryLeak: {
      condition: 'memory_growth_rate > 10',
      duration: '10m',
      severity: 'error',
      channels: ['email', 'slack', 'pagerduty'],
      cooldown: '30m'
    }
  },
  security: {
    failedLoginAttempts: {
      condition: 'failed_logins > 5',
      duration: '1m',
      severity: 'warning',
      channels: ['email'],
      cooldown: '15m'
    },
    suspiciousActivity: {
      condition: 'suspicious_requests > 10',
      duration: '5m',
      severity: 'critical',
      channels: ['email', 'slack', 'pagerduty'],
      cooldown: '5m'
    }
  }
};

// Alert delivery configuration
const alertDelivery = {
  email: {
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: 'alerts@strray-framework.com',
    to: ['team@company.com']
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#alerts',
    username: 'StrRay Monitor'
  },
  pagerduty: {
    integrationKey: process.env.PAGERDUTY_KEY,
    severity: 'error'
  }
};
```

### Dashboard Configuration Issues

**Symptoms:**
- Dashboard not loading
- Metrics not displaying
- Visualization errors

**Diagnostic Steps:**
```bash
# Test dashboard connectivity
npm run test:dashboard

# Check metrics collection
npm run validate:metrics

# Review dashboard logs
tail -f logs/dashboard.log

# Test visualization rendering
npm run test:visualizations
```

**Solutions:**

#### Dashboard Configuration
```typescript
// Grafana dashboard configuration
const grafanaDashboard = {
  title: 'StrRay Framework Overview',
  tags: ['strray', 'framework', 'monitoring'],
  timezone: 'browser',
  panels: [
    {
      title: 'Response Time',
      type: 'graph',
      targets: [
        {
          expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
          legendFormat: '95th percentile'
        }
      ],
      yAxes: {
        unit: 'seconds',
        min: 0
      }
    },
    {
      title: 'Error Rate',
      type: 'graph',
      targets: [
        {
          expr: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
          legendFormat: 'Error %'
        }
      ],
      yAxes: {
        unit: 'percent',
        max: 100
      }
    },
    {
      title: 'Active Agents',
      type: 'stat',
      targets: [
        {
          expr: 'count(strray_agent_status{status="active"})',
          legendFormat: 'Active Agents'
        }
      ]
    }
  ],
  time: {
    from: 'now-1h',
    to: 'now'
  },
  refresh: '30s'
};
```

---

## Emergency Procedures

### Service Outage Response

#### Immediate Actions
```bash
# 1. Assess the situation
curl -f http://localhost:3000/api/status || echo "Service is down"

# 2. Check system resources
top -b -n 1 | head -20
df -h
free -h

# 3. Review recent logs
tail -n 100 logs/framework.log | grep -i error

# 4. Check database connectivity
pg_isready -h localhost -p 5432 -U strray

# 5. Attempt service restart
npm run restart
```

#### Escalation Procedures
```typescript
// Automated incident response
class IncidentResponse {
  async handleOutage(severity: 'minor' | 'major' | 'critical'): Promise<void> {
    // 1. Gather diagnostic information
    const diagnostics = await this.collectDiagnostics();

    // 2. Determine impact
    const impact = await this.assessImpact(diagnostics);

    // 3. Execute response plan
    switch (severity) {
      case 'critical':
        await this.executeCriticalResponse(impact);
        break;
      case 'major':
        await this.executeMajorResponse(impact);
        break;
      case 'minor':
        await this.executeMinorResponse(impact);
        break;
    }

    // 4. Notify stakeholders
    await this.notifyStakeholders(severity, impact, diagnostics);

    // 5. Begin recovery
    await this.initiateRecovery(severity);
  }

  private async executeCriticalResponse(impact: ImpactAssessment): Promise<void> {
    // Immediate actions for critical incidents
    await this.enableEmergencyMode();
    await this.scaleResources(impact.requiredCapacity);
    await this.activateBackupSystems();
    await this.notifyExecutiveTeam(impact);
  }

  private async executeMajorResponse(impact: ImpactAssessment): Promise<void> {
    // Response for major incidents
    await this.increaseMonitoring();
    await this.prepareRollbackPlan();
    await this.notifyDevelopmentTeam(impact);
  }

  private async executeMinorResponse(impact: ImpactAssessment): Promise<void> {
    // Response for minor incidents
    await this.logIncident(impact);
    await this.schedulePostMortem();
  }
}
```

### Data Recovery Procedures

#### Database Recovery
```bash
# 1. Stop the application
docker-compose stop strray-app

# 2. Restore from backup
BACKUP_FILE="/opt/strray/backups/database-$(date +%Y%m%d).sql"
psql -U strray -d strray < "$BACKUP_FILE"

# 3. Verify data integrity
psql -U strray -d strray -c "SELECT COUNT(*) FROM users;"

# 4. Restart the application
docker-compose start strray-app

# 5. Monitor for issues
tail -f logs/framework.log
```

#### Configuration Recovery
```bash
# 1. Backup current configuration
cp .opencode/oh-my-opencode.json .opencode/backup.json

# 2. Restore from known good configuration
cp config/backup/oh-my-opencode.json .opencode/

# 3. Validate configuration
npm run validate:config

# 4. Restart services
npm run restart

# 5. Test functionality
npm run test:smoke
```

### Communication Templates

#### Incident Notification
```typescript
const incidentNotification = {
  subject: '🚨 CRITICAL: StrRay Framework Service Outage',
  body: `
INCIDENT SUMMARY
================
- Service: StrRay Framework
- Status: DOWN
- Start Time: ${new Date().toISOString()}
- Impact: All API operations unavailable
- Affected Users: All enterprise customers

CURRENT STATUS
==============
- Root cause: Database connectivity issues
- Recovery ETA: 30 minutes
- Communication Channel: #incident-response

ACTIONS TAKEN
=============
- Initiated database failover
- Activated backup systems
- Notified development team
- Started incident investigation

NEXT STEPS
==========
- Complete database recovery
- Validate system functionality
- Perform post-incident review
- Implement preventive measures

For real-time updates, join #incident-response Slack channel.
  `,
  priority: 'high',
  recipients: [
    'devops@company.com',
    'management@company.com',
    'customers@company.com'
  ]
};
```

#### Post-Incident Review
```typescript
const postIncidentReview = {
  template: `
INCIDENT POST-MORTEM REPORT
===========================

INCIDENT DETAILS
- Incident ID: INC-${Date.now()}
- Duration: ${incident.duration} minutes
- Impact: ${incident.impact} users affected
- Severity: ${incident.severity}

TIMELINE
========
${incident.timeline.map(entry =>
  `${entry.timestamp}: ${entry.event}`
).join('\n')}

ROOT CAUSE
==========
${incident.rootCause}

IMPACT ASSESSMENT
================
- Users Affected: ${incident.affectedUsers}
- Data Loss: ${incident.dataLoss}
- Financial Impact: ${incident.financialImpact}

LESSONS LEARNED
==============
${incident.lessonsLearned.map(lesson =>
  `- ${lesson}`
).join('\n')}

PREVENTIVE MEASURES
==================
${incident.preventiveMeasures.map(measure =>
  `- ${measure}`
).join('\n')}

ACTION ITEMS
============
${incident.actionItems.map((item, index) =>
  `${index + 1}. ${item.description} (Owner: ${item.owner}, Due: ${item.dueDate})`
).join('\n')}
  `
};
```

This comprehensive troubleshooting guide provides enterprise teams with the tools and procedures needed to maintain high availability and quickly resolve issues in StrRay Framework deployments.