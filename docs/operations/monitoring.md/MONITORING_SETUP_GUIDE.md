# StrRay Framework - Production Monitoring & Alerting Guide

## Overview

This guide provides comprehensive monitoring and alerting setup for StrRay Framework using Prometheus, Grafana, and AlertManager in production environments.

## Architecture

### Monitoring Stack

```
StrRay Monitoring Architecture
├── Application Metrics (Prometheus client)
├── System Metrics (Node Exporter)
├── Database Metrics (PostgreSQL/Redis Exporters)
├── Log Aggregation (Fluent Bit)
├── Alert Management (AlertManager)
├── Visualization (Grafana)
└── Long-term Storage (VictoriaMetrics/Thanos)
```

### Metrics Collection Points

- **Application Layer**: Request rates, response times, error rates, agent utilization
- **System Layer**: CPU, memory, disk I/O, network I/O
- **Database Layer**: Connection pools, query performance, cache hit rates
- **Business Layer**: Agent performance, task completion rates, SLA compliance

## Prometheus Setup

### Core Configuration

#### prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  # StrRay Application
  - job_name: "strray-app"
    static_configs:
      - targets: ["localhost:3000"]
    scrape_interval: 5s
    metrics_path: "/metrics"
    labels:
      service: "strray"
      component: "app"

  # StrRay MCP Servers
  - job_name: "strray-mcp-servers"
    static_configs:
      - targets:
          - "localhost:3001" # orchestrator
          - "localhost:3002" # enforcer
          - "localhost:3003" # architect
          - "localhost:3004" # security-auditor
          - "localhost:3005" # bug-triage-specialist
          - "localhost:3006" # code-reviewer
          - "localhost:3007" # refactorer
          - "localhost:3008" # test-architect
    scrape_interval: 10s
    metrics_path: "/metrics"
    labels:
      service: "strray"
      component: "mcp"

  # System Metrics
  - job_name: "node-exporter"
    static_configs:
      - targets: ["localhost:9100"]
    labels:
      service: "system"

  # PostgreSQL Metrics
  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["localhost:9187"]
    labels:
      service: "database"
      db: "postgres"

  # Redis Metrics
  - job_name: "redis-exporter"
    static_configs:
      - targets: ["localhost:9121"]
    labels:
      service: "cache"
      db: "redis"

  # Kubernetes Metrics (if applicable)
  - job_name: "kubernetes-apiservers"
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      insecure_skip_verify: true
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels:
          [
            __meta_kubernetes_namespace,
            __meta_kubernetes_service_name,
            __meta_kubernetes_endpoint_port_name,
          ]
        action: keep
        regex: default;kubernetes;https

  - job_name: "kubernetes-nodes"
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      insecure_skip_verify: true
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics

  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels:
          [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
```

### Recording Rules

#### recording_rules.yml

```yaml
groups:
  - name: strray_recording_rules
    rules:
      # Agent performance metrics
      - record: strray:agent_request_rate:rate5m
        expr: rate(strray_agent_requests_total[5m])

      - record: strray:agent_error_rate:rate5m
        expr: rate(strray_agent_errors_total[5m]) / rate(strray_agent_requests_total[5m])

      - record: strray:agent_response_time:p95
        expr: histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m]))

      - record: strray:agent_response_time:p99
        expr: histogram_quantile(0.99, rate(strray_agent_response_time_bucket[5m]))

      # System resource metrics
      - record: strray:cpu_usage_percent
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

      - record: strray:memory_usage_percent
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

      - record: strray:disk_usage_percent
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100

      # Database metrics
      - record: strray:db_connection_utilization
        expr: pg_stat_activity_count / pg_settings_max_connections

      - record: strray:redis_memory_usage_percent
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100

      # Business metrics
      - record: strray:task_completion_rate
        expr: rate(strray_tasks_completed_total[5m]) / rate(strray_tasks_started_total[5m])

      - record: strray:agent_utilization_rate
        expr: strray_agent_active_tasks / strray_agent_max_concurrent_tasks
```

### Alert Rules

#### alert_rules.yml

```yaml
groups:
  - name: strray_alerts
    rules:
      # Critical Alerts
      - alert: StrRayDown
        expr: up{job="strray-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "StrRay Framework is down"
          description: "StrRay Framework has been down for more than 1 minute."

      - alert: StrRayHighErrorRate
        expr: rate(strray_agent_errors_total[5m]) / rate(strray_agent_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: 'StrRay Framework error rate is {{ $value | printf "%.2f" }}% over the last 5 minutes.'

      - alert: StrRayHighLatency
        expr: histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m])) > 30
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High response latency"
          description: 'StrRay Framework 95th percentile response time is {{ $value | printf "%.2f" }}s.'

      # Warning Alerts
      - alert: StrRayDegradedPerformance
        expr: histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m])) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Degraded performance detected"
          description: 'StrRay Framework 95th percentile response time is {{ $value | printf "%.2f" }}s.'

      - alert: StrRayHighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: 'CPU usage is {{ $value | printf "%.2f" }}%.'

      - alert: StrRayHighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: 'Memory usage is {{ $value | printf "%.2f" }}%.'

      - alert: StrRayDiskSpaceLow
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: 'Disk usage is {{ $value | printf "%.2f" }}%.'

      # Database Alerts
      - alert: StrRayDatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
          description: "PostgreSQL database has been down for more than 1 minute."

      - alert: StrRayDatabaseHighConnections
        expr: pg_stat_activity_count > pg_settings_max_connections * 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connection usage"
          description: 'Database connections are {{ $value }} ({{ $value | printf "%.1f" }}% of max).'

      # Redis Alerts
      - alert: StrRayRedisDown
        expr: up{job="redis-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis cache is down"
          description: "Redis cache has been down for more than 1 minute."

      - alert: StrRayRedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Redis memory usage"
          description: 'Redis memory usage is {{ $value | printf "%.2f" }}%.'

      # Agent-specific Alerts
      - alert: StrRayAgentUnhealthy
        expr: strray_agent_health_status != 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent is unhealthy"
          description: "Agent {{ $labels.agent }} is reporting unhealthy status."

      - alert: StrRayAgentHighErrorRate
        expr: rate(strray_agent_errors_total[5m]) / rate(strray_agent_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent high error rate"
          description: 'Agent {{ $labels.agent }} error rate is {{ $value | printf "%.2f" }}%.'

      - alert: StrRayTaskQueueBacklog
        expr: strray_task_queue_length > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Task queue backlog"
          description: "Task queue length is {{ $value }}, indicating processing backlog."

      # Business Logic Alerts
      - alert: StrRaySLABreach
        expr: strray_sla_breach_count > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "SLA breach detected"
          description: "SLA breach count is {{ $value }}."

      - alert: StrRayCodexViolation
        expr: rate(strray_codex_violations_total[5m]) > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Codex violation detected"
          description: "Codex violations detected: {{ $value }} in the last 5 minutes."
```

## AlertManager Configuration

### alertmanager.yml

```yaml
global:
  smtp_smarthost: "smtp.gmail.com:587"
  smtp_from: "alerts@strray.dev"
  smtp_auth_username: "alerts@strray.dev"
  smtp_auth_password: "your_app_password"

templates:
  - "/etc/alertmanager/templates/*.tmpl"

route:
  group_by: ["alertname", "severity"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: "strray-team"
  routes:
    - match:
        severity: critical
      receiver: "strray-critical"
      continue: true
    - match:
        severity: warning
      receiver: "strray-warning"
    - match:
        service: database
      receiver: "strray-db-team"
    - match:
        service: cache
      receiver: "strray-infra-team"

receivers:
  - name: "strray-critical"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
        channel: "#strray-critical"
        send_resolved: true
        title: "{{ .GroupLabels.alertname }}"
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Severity:* {{ .Labels.severity }}
          *Instance:* {{ .Labels.instance }}
          {{ end }}
    email_configs:
      - to: "strray-critical@company.com"
        send_resolved: true

  - name: "strray-warning"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
        channel: "#strray-warnings"
        send_resolved: true
        title: "{{ .GroupLabels.alertname }}"
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          {{ end }}

  - name: "strray-team"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
        channel: "#strray-alerts"
        send_resolved: true

  - name: "strray-db-team"
    email_configs:
      - to: "database-team@company.com"
        send_resolved: true

  - name: "strray-infra-team"
    email_configs:
      - to: "infrastructure@company.com"
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "instance"]
```

## Grafana Dashboards

### Main Overview Dashboard

```json
{
  "dashboard": {
    "title": "StrRay Framework Overview",
    "tags": ["strray", "ai", "agents", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"strray-app\"}",
            "legendFormat": "Application"
          },
          {
            "expr": "up{job=\"strray-mcp-servers\"}",
            "legendFormat": "MCP Servers"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {
                    "text": "DOWN",
                    "color": "red"
                  },
                  "1": {
                    "text": "UP",
                    "color": "green"
                  }
                },
                "type": "value"
              }
            ]
          }
        }
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(strray_agent_requests_total[5m])",
            "legendFormat": "{{agent}} requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(strray_agent_errors_total[5m]) / rate(strray_agent_requests_total[5m]) * 100",
            "legendFormat": "{{agent}} error rate %"
          }
        ]
      },
      {
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m]))",
            "legendFormat": "{{agent}} p95"
          }
        ]
      },
      {
        "title": "Agent Utilization",
        "type": "bargauge",
        "targets": [
          {
            "expr": "strray_agent_active_tasks / strray_agent_max_concurrent_tasks * 100",
            "legendFormat": "{{agent}}"
          }
        ]
      },
      {
        "title": "System Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active Connections"
          },
          {
            "expr": "rate(pg_stat_database_tup_fetched[5m])",
            "legendFormat": "Rows Fetched/sec"
          }
        ]
      },
      {
        "title": "Cache Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100",
            "legendFormat": "Cache Hit Rate %"
          },
          {
            "expr": "redis_memory_used_bytes / 1024 / 1024",
            "legendFormat": "Memory Usage MB"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### Agent Performance Dashboard

```json
{
  "dashboard": {
    "title": "StrRay Agent Performance",
    "tags": ["strray", "agents", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Agent Health Status",
        "type": "table",
        "targets": [
          {
            "expr": "strray_agent_health_status",
            "legendFormat": "{{agent}}"
          }
        ]
      },
      {
        "title": "Agent Request Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(rate(strray_agent_requests_total[1h])) by (agent)",
            "legendFormat": "{{agent}}"
          }
        ]
      },
      {
        "title": "Agent Response Time Comparison",
        "type": "bargauge",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m]))",
            "legendFormat": "{{agent}} p95"
          }
        ]
      },
      {
        "title": "Agent Error Rates",
        "type": "table",
        "targets": [
          {
            "expr": "rate(strray_agent_errors_total[1h]) / rate(strray_agent_requests_total[1h]) * 100",
            "legendFormat": "{{agent}}"
          }
        ]
      },
      {
        "title": "Task Queue Length",
        "type": "graph",
        "targets": [
          {
            "expr": "strray_task_queue_length",
            "legendFormat": "{{queue}}"
          }
        ]
      },
      {
        "title": "Agent Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "strray_agent_memory_usage_bytes / 1024 / 1024",
            "legendFormat": "{{agent}} memory MB"
          },
          {
            "expr": "rate(strray_agent_cpu_seconds_total[5m]) * 100",
            "legendFormat": "{{agent}} CPU %"
          }
        ]
      }
    ],
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh": "1m"
  }
}
```

### Business Metrics Dashboard

```json
{
  "dashboard": {
    "title": "StrRay Business Metrics",
    "tags": ["strray", "business", "sla"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Task Completion Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(strray_tasks_completed_total[1h]) / rate(strray_tasks_started_total[1h]) * 100",
            "legendFormat": "Completion Rate %"
          }
        ]
      },
      {
        "title": "SLA Compliance",
        "type": "stat",
        "targets": [
          {
            "expr": "(1 - rate(strray_sla_breaches_total[1h]) / rate(strray_tasks_completed_total[1h])) * 100",
            "legendFormat": "SLA Compliance %"
          }
        ]
      },
      {
        "title": "Codex Compliance Score",
        "type": "stat",
        "targets": [
          {
            "expr": "strray_codex_compliance_score",
            "legendFormat": "Compliance Score"
          }
        ]
      },
      {
        "title": "Agent Utilization Trends",
        "type": "graph",
        "targets": [
          {
            "expr": "avg by (agent) (rate(strray_agent_active_time_total[5m]) / rate(strray_agent_total_time_total[5m])) * 100",
            "legendFormat": "{{agent}} utilization %"
          }
        ]
      },
      {
        "title": "Error Rate Trends",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(strray_agent_errors_total[1h]) / rate(strray_agent_requests_total[1h]) * 100",
            "legendFormat": "{{agent}} error rate %"
          }
        ]
      },
      {
        "title": "Task Volume by Type",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(rate(strray_tasks_started_total[1h])) by (task_type)",
            "legendFormat": "{{task_type}}"
          }
        ]
      }
    ],
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "refresh": "5m"
  }
}
```

## Application Metrics Implementation

### StrRay Metrics Collection

Add to your StrRay application:

```typescript
import {
  collectDefaultMetrics,
  register,
  Gauge,
  Counter,
  Histogram,
} from "prom-client";

// Enable default metrics collection
collectDefaultMetrics();

// Custom metrics
const agentRequestCount = new Counter({
  name: "strray_agent_requests_total",
  help: "Total number of agent requests",
  labelNames: ["agent", "operation"],
});

const agentErrorCount = new Counter({
  name: "strray_agent_errors_total",
  help: "Total number of agent errors",
  labelNames: ["agent", "operation", "error_type"],
});

const agentResponseTime = new Histogram({
  name: "strray_agent_response_time",
  help: "Agent response time in seconds",
  labelNames: ["agent", "operation"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

const agentHealthStatus = new Gauge({
  name: "strray_agent_health_status",
  help: "Agent health status (1=healthy, 0=unhealthy)",
  labelNames: ["agent"],
});

const taskQueueLength = new Gauge({
  name: "strray_task_queue_length",
  help: "Current task queue length",
  labelNames: ["queue_type"],
});

const activeTasks = new Gauge({
  name: "strray_agent_active_tasks",
  help: "Number of currently active tasks per agent",
  labelNames: ["agent"],
});

const maxConcurrentTasks = new Gauge({
  name: "strray_agent_max_concurrent_tasks",
  help: "Maximum concurrent tasks per agent",
  labelNames: ["agent"],
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

### Metrics Usage in Code

```typescript
// Track agent requests
agentRequestCount.inc({ agent: agentName, operation: operationName });

// Track errors
agentErrorCount.inc({
  agent: agentName,
  operation: operationName,
  error_type: error.type,
});

// Measure response time
const endTimer = agentResponseTime.startTimer({
  agent: agentName,
  operation: operationName,
});
try {
  const result = await processRequest(request);
  endTimer();
  return result;
} catch (error) {
  endTimer();
  throw error;
}

// Update health status
agentHealthStatus.set({ agent: agentName }, isHealthy ? 1 : 0);

// Track queue length
taskQueueLength.set({ queue_type: "main" }, queue.size);

// Track active tasks
activeTasks.set({ agent: agentName }, activeTaskCount);
maxConcurrentTasks.set({ agent: agentName }, maxConcurrency);
```

## Log Aggregation

### Fluent Bit Configuration

#### fluent-bit.conf

```ini
[INPUT]
    Name              tail
    Path              /app/logs/*.log
    Parser            json
    Tag               strray.app.*
    Refresh_Interval  5

[INPUT]
    Name              tail
    Path              /var/log/containers/*strray*.log
    Parser            cri
    Tag               strray.k8s.*
    Refresh_Interval  5

[FILTER]
    Name                grep
    Match               strray.*
    Exclude             log level info

[FILTER]
    Name                record_modifier
    Match               strray.*
    Record              service strray
    Record              environment production

[OUTPUT]
    Name                loki
    Match               strray.*
    Host                loki.strray.svc.cluster.local
    Port                3100
    Labels              service=strray,environment=production
    Replace_Outgoing_TS  true

[OUTPUT]
    Name                stdout
    Match               strray.*
    Format              json_lines
```

### Loki Configuration

#### loki-config.yaml

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
```

## Docker Compose Monitoring Stack

### docker-compose.monitoring.yml

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/etc/prometheus/console_libraries"
      - "--web.console.templates=/etc/prometheus/consoles"
      - "--storage.tsdb.retention.time=200h"
      - "--web.enable-lifecycle"
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/config.yml:ro
    command:
      - "--config.file=/etc/alertmanager/config.yml"
      - "--storage.path=/alertmanager"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.rootfs=/rootfs"
      - "--path.sysfs=/host/sys"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://strray:strray_password@postgres:5432/strray?sslmode=disable
    restart: unless-stopped
    depends_on:
      - postgres

  redis-exporter:
    image: oliver006/redis_exporter:latest
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=strray_password
    restart: unless-stopped
    depends_on:
      - redis

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki
      - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml:ro
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  fluent-bit:
    image: fluent/fluent-bit:latest
    volumes:
      - ./monitoring/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
      - /var/log/containers:/var/log/containers:ro
      - /app/logs:/app/logs:ro
    depends_on:
      - loki
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

## Health Checks and Probes

### Application Health Checks

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    services: {
      database: checkDatabaseHealth(),
      redis: checkRedisHealth(),
      agents: checkAgentsHealth(),
    },
  };

  const isHealthy = Object.values(health.services).every(
    (service) => service.status === "healthy",
  );

  res.status(isHealthy ? 200 : 503).json(health);
});

// Readiness check
app.get("/ready", (req, res) => {
  // Check if application can accept traffic
  const isReady = checkReadiness();
  res.status(isReady ? 200 : 503).json({ ready: isReady });
});
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## Alert Response Procedures

### Critical Alert Response

1. **StrRayDown Alert**
   - Check application logs
   - Verify container health
   - Restart affected services
   - Check database connectivity
   - Escalate if issue persists

2. **High Error Rate Alert**
   - Analyze error patterns
   - Check agent health status
   - Review recent deployments
   - Scale resources if needed
   - Implement circuit breakers

3. **High Latency Alert**
   - Profile application performance
   - Check database query performance
   - Review cache hit rates
   - Optimize slow endpoints
   - Scale horizontally if required

### Warning Alert Response

1. **Degraded Performance**
   - Monitor trend over time
   - Identify performance bottlenecks
   - Optimize resource allocation
   - Schedule maintenance if needed

2. **High Resource Usage**
   - Monitor resource trends
   - Identify resource-intensive operations
   - Optimize memory/CPU usage
   - Consider horizontal scaling

## Performance Benchmarking

### Automated Benchmarking

```bash
#!/bin/bash
# Performance benchmarking script

echo "Starting StrRay Performance Benchmark"

# Load testing
echo "Running load tests..."
npm run test:load -- --duration=300 --concurrency=50

# Memory profiling
echo "Memory profiling..."
npm run profile:memory

# CPU profiling
echo "CPU profiling..."
npm run profile:cpu

# Database performance
echo "Database performance test..."
npm run test:db-performance

# Cache performance
echo "Cache performance test..."
npm run test:cache-performance

echo "Benchmark complete. Results saved to ./performance-reports/"
```

### Key Performance Metrics

- **Response Time**: p50, p95, p99 latencies
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Resource Usage**: CPU, memory, disk I/O
- **Cache Hit Rate**: Percentage of cache hits
- **Database Performance**: Query response times, connection pooling

This monitoring guide provides a comprehensive production-ready monitoring stack for the StrRay Framework with alerting, visualization, and performance tracking capabilities.</content>
</xai:function_call">Successfully wrote to src/docs/MONITORING_SETUP_GUIDE.md
