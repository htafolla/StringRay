# Reporting Consolidation Analysis

## Current Reporting Locations (Audit)

### Root Directory Logs/Reports:

- `logs/` - General logging directory
- Various `*.log` files scattered in root

### Component-Specific Locations:

- `.opencode/logs/` - oh-my-opencode integration logs
- `.opencode/reports/` - Plugin reports
- `performance-reports/` - Performance analysis
- `monitoring/` - Monitoring data
- `reports/` - General reports
- `src/` components writing to various locations

### Documentation Archives:

- `docs/archive/reports/` - Historical reports
- `docs/performance/` - Performance docs
- `docs/reports/` - Documentation reports

## Problems Identified:

1. **Scattered Output**: 10+ different directories for logs/reports
2. **Inconsistent Naming**: Various naming conventions
3. **No Central Control**: Components write wherever they want
4. **Maintenance Nightmare**: Hard to find/manage all outputs
5. **Version Control Issues**: Generated files mixed with source

## Consolidation Strategy:

### Phase 1: Directory Consolidation

Create unified structure:

```
logs/
├── framework/          # Core framework logs
├── agents/            # Agent-specific logs
├── plugins/           # Plugin logs
├── sessions/          # Session logs
└── audit/             # Security/audit logs

reports/
├── performance/       # Performance reports
├── testing/          # Test reports
├── monitoring/       # Monitoring reports
├── compliance/       # Compliance reports
└── analysis/         # Analysis reports
```

### Phase 2: Central Logger Implementation

Create `ReportingManager` class:

```typescript
class ReportingManager {
  private loggers = new Map<string, Logger>();
  private reporters = new Map<string, Reporter>();

  getLogger(component: string): Logger {
    return this.loggers.get(component) || this.createLogger(component);
  }

  generateReport(type: ReportType, data: any): Report {
    const reporter = this.reporters.get(type);
    return reporter.generate(data);
  }
}
```

### Phase 3: Component Migration

Update all components to use centralized reporting:

- Framework components → `ReportingManager.getLogger('framework')`
- Agents → `ReportingManager.getLogger('agents')`
- Tests → `ReportingManager.generateReport('testing', testData)`
- Performance → `ReportingManager.generateReport('performance', metrics)`

### Phase 4: Configuration Management

Add reporting configuration:

```json
{
  "reporting": {
    "logLevel": "info",
    "retention": "30d",
    "compression": true,
    "remoteSync": false
  }
}
```
