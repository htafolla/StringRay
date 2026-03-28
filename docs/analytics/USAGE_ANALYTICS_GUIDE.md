# StringRay Framework - Usage Analytics & Monitoring

## 📊 Overview

StringRay provides comprehensive usage analytics and performance monitoring to track framework performance, agent utilization, and system health.

## 🚀 Quick Setup

### Enable Monitoring
```bash
# Monitoring is enabled by default
# Check current status
node node_modules/strray-ai/scripts/test:postinstall-config.js
```

### View Analytics Dashboard
```bash
# Generate comprehensive analytics report
node node_modules/strray-ai/scripts/generate-activity-report.js

# View framework health metrics
framework-reporting-system generate-report --type full-analysis
```

## 📈 Available Analytics

### Agent Usage Analytics
Track how agents are being utilized across your development workflow:

- **Invocation Counts**: Total calls per agent type
- **Success Rates**: Agent performance metrics
- **Response Times**: Average processing duration
- **Error Patterns**: Common failure modes

### Framework Performance Metrics
Monitor system performance and resource utilization:

- **Test Coverage**: Current coverage percentages
- **Build Times**: Compilation and packaging duration
- **Error Prevention**: Codex compliance rates
- **Memory Usage**: Framework resource consumption

### Task Complexity Analysis
Understand task routing and delegation patterns:

- **Complexity Distribution**: Task difficulty breakdown
- **Agent Assignment**: Which agents handle which tasks
- **Processing Efficiency**: Task completion rates
- **Delegation Patterns**: Multi-agent coordination usage

## 🔧 Analytics Commands

### Generate Reports
```bash
# Comprehensive framework analysis
framework-reporting-system generate-report --type full-analysis

# Agent usage statistics
framework-reporting-system generate-report --type agent-usage

# Performance metrics
framework-reporting-system generate-report --type performance

# Orchestration patterns
framework-reporting-system generate-report --type orchestration
```

### Real-time Monitoring
```bash
# Start monitoring daemon
npm run monitoring

# Check framework health
@orchestrator check framework health

# View agent status
@enforcer show system status
```

## 📋 Report Types

### Full Analysis Report
**Location**: `logs/reports/framework-report-{commit}-{date}.md`
**Contents**:
- Agent usage statistics and performance
- System health indicators
- Task complexity distribution
- Error prevention metrics
- Test coverage analysis

### Agent Usage Report
**Contents**:
- Total invocations per agent
- Success/failure rates
- Average response times
- Most used capabilities
- Agent specialization patterns

### Performance Report
**Contents**:
- Build and test execution times
- Memory and CPU usage
- Error rates and patterns
- Performance regression analysis
- Resource utilization trends

### Orchestration Report
**Contents**:
- Multi-agent coordination frequency
- Task delegation patterns
- Conflict resolution usage
- Complexity threshold effectiveness
- Workflow efficiency metrics

## 📊 Dashboard Features

### Real-time Metrics
- Live agent activity monitoring
- Current system health status
- Active task tracking
- Performance indicators

### Historical Trends
- Usage patterns over time
- Performance trends analysis
- Error rate monitoring
- Agent utilization growth

### Alert System
- Performance degradation alerts
- High error rate notifications
- Resource usage warnings
- Agent failure detection

## 🔍 Monitoring Logs

### Activity Logs
**Location**: `logs/framework/activity.log`
**Contents**: All framework operations and agent interactions

### Error Logs
**Location**: `logs/framework/error.log`
**Contents**: System errors, agent failures, and exceptions

### Performance Logs
**Location**: `logs/performance/metrics.log`
**Contents**: Performance metrics and benchmarking data

## 📈 Analytics API

### Programmatic Access
```typescript
import { frameworkReportingSystem } from './reporting/framework-reporting-system';

// Generate custom reports
const report = await frameworkReportingSystem.generateReport({
  type: 'agent-usage',
  timeRange: 'last-7-days',
  format: 'json'
});

// Access real-time metrics
const metrics = await frameworkReportingSystem.getMetrics({
  categories: ['agents', 'performance', 'errors']
});
```

### Custom Dashboards
```typescript
// Create custom monitoring dashboard
const dashboard = new FrameworkDashboard({
  metrics: ['agent-usage', 'performance', 'errors'],
  refreshInterval: 30000, // 30 seconds
  alerts: {
    'high-error-rate': { threshold: 5, action: 'notify' },
    'performance-degradation': { threshold: 10, action: 'alert' }
  }
});
```

## 🚨 Alert Configuration

### Performance Alerts
```json
{
  "alerts": {
    "response-time": {
      "threshold": 5000,
      "operator": ">",
      "action": "log",
      "severity": "warning"
    },
    "error-rate": {
      "threshold": 5,
      "operator": ">",
      "action": "notify",
      "severity": "error"
    }
  }
}
```

### Agent Health Alerts
```json
{
  "agent-alerts": {
    "low-success-rate": {
      "agent": "orchestrator",
      "threshold": 90,
      "action": "investigate"
    },
    "high-failure-rate": {
      "threshold": 10,
      "action": "escalate"
    }
  }
}
```

## 📊 Data Export

### Export Formats
- **JSON**: Structured data for programmatic analysis
- **CSV**: Spreadsheet-compatible data
- **Markdown**: Human-readable reports
- **HTML**: Web dashboard format

### Automated Exports
```bash
# Export to different formats
framework-reporting-system export --format json --type agent-usage
framework-reporting-system export --format csv --type performance
framework-reporting-system export --format html --type full-analysis
```

## 🔧 Configuration

### Monitoring Settings
```json
{
  "monitoring": {
    "enabled": true,
    "collectionInterval": 60000,
    "retentionPeriod": 2592000000,
    "alerts": {
      "enabled": true,
      "email": "dev-team@company.com",
      "webhook": "https://hooks.slack.com/webhook-url"
    }
  }
}
```

### Analytics Settings
```json
{
  "analytics": {
    "enabled": true,
    "anonymizeData": true,
    "exportFrequency": "daily",
    "metrics": [
      "agent-usage",
      "performance",
      "errors",
      "complexity"
    ]
  }
}
```

## 🎯 Best Practices

### Regular Monitoring
- Check analytics reports weekly
- Monitor performance trends
- Review agent usage patterns
- Track error rates and patterns

### Alert Management
- Configure appropriate alert thresholds
- Set up notification channels
- Regularly review and update alerts
- Investigate alert causes promptly

### Performance Optimization
- Use analytics to identify bottlenecks
- Monitor resource usage patterns
- Optimize frequently used agent workflows
- Track performance regression

### Data-Driven Decisions
- Use analytics for agent utilization insights
- Identify areas for framework improvement
- Make data-driven architecture decisions
- Track team productivity metrics

## 📚 Troubleshooting

### Common Issues

#### Reports Not Generating
```bash
# Check framework status
@orchestrator check framework health

# Verify logging configuration
node node_modules/strray-ai/scripts/test:postinstall-config.js

# Check disk space and permissions
df -h && ls -la logs/
```

#### Performance Degradation
```bash
# Generate performance report
framework-reporting-system generate-report --type performance

# Check system resources
@enforcer validate system health

# Review recent activity
tail -f logs/framework/activity.log
```

#### Missing Analytics Data
```bash
# Check monitoring daemon
ps aux | grep monitoring

# Restart monitoring if needed
npm run monitoring

# Verify configuration
cat .stringray/config.json
```

## 📖 API Reference

### FrameworkReportingSystem
```typescript
class FrameworkReportingSystem {
  // Generate reports
  generateReport(config: ReportConfig): Promise<Report>

  // Get real-time metrics
  getMetrics(config: MetricsConfig): Promise<Metrics>

  // Export data
  exportData(config: ExportConfig): Promise<Blob>

  // Configure alerts
  configureAlerts(config: AlertConfig): Promise<void>
}
```

### Monitoring Daemon
```typescript
class MonitoringDaemon {
  // Start monitoring
  start(): Promise<void>

  // Stop monitoring
  stop(): Promise<void>

  // Get current status
  getStatus(): Promise<DaemonStatus>

  // Configure monitoring
  configure(config: DaemonConfig): Promise<void>
}
```

---

**Monitor your StringRay Framework performance and make data-driven development decisions!** 📊</content>
<parameter name="filePath">USAGE_ANALYTICS_GUIDE.md