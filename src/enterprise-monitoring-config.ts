/**
 * StringRay AI v1.0.27 - Enterprise Monitoring Configuration
 *
 * Configuration templates and deployment guides for enterprise-scale monitoring.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EnterpriseMonitoringConfig } from "./enterprise-monitoring";

// =============================================================================
// CONFIGURATION TEMPLATES
// =============================================================================

/**
 * Basic enterprise monitoring configuration
 * Suitable for small to medium deployments
 */
export const basicEnterpriseConfig: Partial<EnterpriseMonitoringConfig> = {
  distributed: {
    enabled: false,
    instanceId: "strray-instance-1",
    clusterSize: 1,
    leaderElectionInterval: 30000,
    consensusTimeout: 10000,
    dataReplicationFactor: 1,
  },

  loadBalancing: {
    enabled: false,
    provider: "nginx",
    endpoints: [],
    healthCheckInterval: 30000,
    trafficAnalysisInterval: 60000,
  },

  autoScaling: {
    enabled: false,
    provider: "aws",
    minInstances: 1,
    maxInstances: 3,
    scaleUpThresholds: {
      cpuUtilization: 80,
      memoryUtilization: 85,
      errorRate: 0.05,
      responseTime: 5000,
      queueDepth: 100,
    },
    scaleDownThresholds: {
      cpuUtilization: 30,
      memoryUtilization: 40,
      errorRate: 0.01,
      responseTime: 1000,
      queueDepth: 10,
    },
    cooldownPeriod: 300,
    predictiveScaling: false,
  },

  highAvailability: {
    enabled: false,
    redundancyLevel: 1,
    failoverStrategy: "active-passive",
    failoverTimeout: 30000,
    backupFrequency: 3600000,
  },

  integrations: {
    prometheus: {
      enabled: false,
      endpoint: "http://localhost:9090",
      scrapeInterval: 15000,
      metricsPath: "/metrics",
      labels: { service: "strray" },
    },
    datadog: {
      enabled: false,
      apiKey: "",
      appKey: "",
      site: "datadoghq.com",
      serviceName: "strray",
      env: "production",
    },
    newrelic: {
      enabled: false,
      licenseKey: "",
      appName: "StringRay Framework",
      distributedTracing: true,
      aiMonitoring: true,
    },
    slack: {
      enabled: false,
      webhookUrl: "",
      channel: "#alerts",
      username: "StringRay Monitor",
    },
    pagerduty: {
      enabled: false,
      integrationKey: "",
      serviceId: "",
    },
  },

  healthChecks: {
    systemHealthInterval: 30000,
    applicationHealthInterval: 60000,
    dependencyHealthInterval: 120000,
    securityHealthInterval: 300000,
    performanceHealthInterval: 15000,
  },

  alerting: {
    enabled: true,
    escalationPolicies: [
      {
        id: "critical-policy",
        name: "Critical Alert Escalation",
        conditions: [
          { metric: "severity", operator: "eq", threshold: 4, duration: 0 },
        ],
        escalationSteps: [
          {
            delay: 0,
            channels: ["pagerduty"],
            message: "🚨 CRITICAL: {alert.title}",
          },
          {
            delay: 300000,
            channels: ["slack"],
            message: "🚨 CRITICAL ALERT: {alert.title} - {alert.description}",
          },
        ],
        cooldownPeriod: 1800000,
      },
      {
        id: "high-policy",
        name: "High Priority Alert Escalation",
        conditions: [
          {
            metric: "severity",
            operator: "eq",
            threshold: 3,
            duration: 300000,
          },
        ],
        escalationSteps: [
          {
            delay: 0,
            channels: ["slack"],
            message: "⚠️ HIGH ALERT: {alert.title}",
          },
          {
            delay: 900000,
            channels: ["email"],
            message: "HIGH PRIORITY ALERT: {alert.title}",
          },
        ],
        cooldownPeriod: 3600000,
      },
    ],
    notificationChannels: [
      {
        id: "slack",
        type: "slack",
        config: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
      },
      {
        id: "pagerduty",
        type: "pagerduty",
        config: { integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY },
      },
      {
        id: "email",
        type: "email",
        config: {
          smtpHost: process.env.SMTP_HOST,
          recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(","),
        },
      },
    ],
    alertCooldown: 300000,
    alertRetention: 2592000000,
  },

  dashboards: {
    enabled: true,
    realTimeUpdateInterval: 30000,
    historicalRetentionDays: 30,
    customDashboards: [
      {
        id: "system-overview",
        name: "System Overview",
        description: "Real-time system health and performance metrics",
        panels: [
          {
            id: "cpu-usage",
            title: "CPU Usage",
            type: "gauge",
            metrics: ["system.cpu"],
            timeRange: "1h",
            aggregation: "avg",
          },
          {
            id: "memory-usage",
            title: "Memory Usage",
            type: "gauge",
            metrics: ["system.memory"],
            timeRange: "1h",
            aggregation: "avg",
          },
          {
            id: "active-sessions",
            title: "Active Sessions",
            type: "line",
            metrics: ["application.activeSessions"],
            timeRange: "1h",
            aggregation: "max",
          },
          {
            id: "error-rate",
            title: "Error Rate",
            type: "line",
            metrics: ["performance.errorRate"],
            timeRange: "1h",
            aggregation: "avg",
          },
        ],
        refreshInterval: 30000,
      },
    ],
  },
};

/**
 * Advanced enterprise monitoring configuration
 * Suitable for large-scale production deployments
 */
export const advancedEnterpriseConfig: EnterpriseMonitoringConfig = {
  distributed: {
    enabled: true,
    instanceId: process.env.STRRAY_INSTANCE_ID || "strray-instance-1",
    clusterSize: parseInt(process.env.STRRAY_CLUSTER_SIZE || "3"),
    leaderElectionInterval: 15000,
    consensusTimeout: 5000,
    dataReplicationFactor: parseInt(process.env.DATA_REPLICATION_FACTOR || "2"),
  },

  loadBalancing: {
    enabled: true,
    provider: (process.env.LOAD_BALANCER_PROVIDER as any) || "aws",
    endpoints: JSON.parse(process.env.LOAD_BALANCER_ENDPOINTS || "[]"),
    healthCheckInterval: 10000,
    trafficAnalysisInterval: 30000,
  },

  autoScaling: {
    enabled: true,
    provider: (process.env.AUTO_SCALING_PROVIDER as any) || "aws",
    minInstances: parseInt(process.env.MIN_INSTANCES || "2"),
    maxInstances: parseInt(process.env.MAX_INSTANCES || "10"),
    scaleUpThresholds: {
      cpuUtilization: parseFloat(process.env.SCALE_UP_CPU_THRESHOLD || "75"),
      memoryUtilization: parseFloat(
        process.env.SCALE_UP_MEMORY_THRESHOLD || "80",
      ),
      errorRate: parseFloat(process.env.SCALE_UP_ERROR_RATE || "0.03"),
      responseTime: parseInt(process.env.SCALE_UP_RESPONSE_TIME || "3000"),
      queueDepth: parseInt(process.env.SCALE_UP_QUEUE_DEPTH || "50"),
    },
    scaleDownThresholds: {
      cpuUtilization: parseFloat(process.env.SCALE_DOWN_CPU_THRESHOLD || "25"),
      memoryUtilization: parseFloat(
        process.env.SCALE_DOWN_MEMORY_THRESHOLD || "30",
      ),
      errorRate: parseFloat(process.env.SCALE_DOWN_ERROR_RATE || "0.005"),
      responseTime: parseInt(process.env.SCALE_DOWN_RESPONSE_TIME || "500"),
      queueDepth: parseInt(process.env.SCALE_DOWN_QUEUE_DEPTH || "5"),
    },
    cooldownPeriod: parseInt(process.env.AUTO_SCALING_COOLDOWN || "600"),
    predictiveScaling: true,
  },

  highAvailability: {
    enabled: true,
    redundancyLevel: parseInt(process.env.REDUNDANCY_LEVEL || "2"),
    failoverStrategy: (process.env.FAILOVER_STRATEGY as any) || "active-active",
    failoverTimeout: parseInt(process.env.FAILOVER_TIMEOUT || "15000"),
    backupFrequency: parseInt(process.env.BACKUP_FREQUENCY || "1800000"),
  },

  integrations: {
    prometheus: {
      enabled: true,
      endpoint: process.env.PROMETHEUS_ENDPOINT || "http://prometheus:9090",
      scrapeInterval: parseInt(
        process.env.PROMETHEUS_SCRAPE_INTERVAL || "10000",
      ),
      metricsPath: "/metrics",
      labels: {
        service: "strray",
        cluster: process.env.STRRAY_CLUSTER_NAME || "production",
      },
    },
    datadog: {
      enabled: true,
      apiKey: process.env.DATADOG_API_KEY || "",
      appKey: process.env.DATADOG_APP_KEY || "",
      site: process.env.DATADOG_SITE || "datadoghq.com",
      serviceName: "strray",
      env: process.env.NODE_ENV || "production",
    },
    newrelic: {
      enabled: true,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY || "",
      appName: "StringRay Framework",
      distributedTracing: true,
      aiMonitoring: true,
    },
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
      channel: process.env.SLACK_ALERT_CHANNEL || "#strray-alerts",
      username: "StringRay Enterprise Monitor",
    },
    pagerduty: {
      enabled: true,
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || "",
      serviceId: process.env.PAGERDUTY_SERVICE_ID || "",
    },
  },

  healthChecks: {
    systemHealthInterval: 15000,
    applicationHealthInterval: 30000,
    dependencyHealthInterval: 60000,
    securityHealthInterval: 180000,
    performanceHealthInterval: 10000,
  },

  alerting: {
    enabled: true,
    escalationPolicies: [
      {
        id: "enterprise-critical",
        name: "Enterprise Critical Escalation",
        conditions: [
          { metric: "severity", operator: "eq", threshold: 4, duration: 0 },
          {
            metric: "cluster_instances_healthy",
            operator: "lt",
            threshold: 2,
            duration: 0,
          },
        ],
        escalationSteps: [
          {
            delay: 0,
            channels: ["pagerduty"],
            message:
              "🚨 ENTERPRISE CRITICAL: {alert.title} - Cluster Impact Detected",
          },
          {
            delay: 60000,
            channels: ["slack"],
            message:
              "🚨 CLUSTER CRITICAL: {alert.title} - Immediate Action Required",
          },
          {
            delay: 300000,
            channels: ["email"],
            message: "CRITICAL SYSTEM ALERT: {alert.title}",
          },
        ],
        cooldownPeriod: 900000,
      },
      {
        id: "performance-degradation",
        name: "Performance Degradation Policy",
        conditions: [
          {
            metric: "performance.p95_latency",
            operator: "gt",
            threshold: 5000,
            duration: 300000,
          },
          {
            metric: "system.cpu",
            operator: "gt",
            threshold: 85,
            duration: 180000,
          },
        ],
        escalationSteps: [
          {
            delay: 0,
            channels: ["slack"],
            message: "⚡ PERFORMANCE DEGRADATION: {alert.title}",
          },
          {
            delay: 600000,
            channels: ["pagerduty"],
            message: "Performance Alert: {alert.title}",
          },
        ],
        cooldownPeriod: 1800000,
      },
    ],
    notificationChannels: [
      {
        id: "slack-critical",
        type: "slack",
        config: {
          webhookUrl: process.env.SLACK_CRITICAL_WEBHOOK_URL,
          channel: "#strray-critical",
        },
      },
      {
        id: "slack",
        type: "slack",
        config: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
      },
      {
        id: "pagerduty",
        type: "pagerduty",
        config: { integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY },
      },
      {
        id: "email",
        type: "email",
        config: {
          smtpHost: process.env.SMTP_HOST,
          recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(","),
          subjectPrefix: "[StringRay Enterprise Alert]",
        },
      },
      {
        id: "webhook",
        type: "webhook",
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            Authorization: `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`,
          },
        },
      },
    ],
    alertCooldown: 180000,
    alertRetention: 7776000000,
  },

  dashboards: {
    enabled: true,
    realTimeUpdateInterval: 10000,
    historicalRetentionDays: 90,
    customDashboards: [
      {
        id: "enterprise-overview",
        name: "Enterprise Overview",
        description: "Comprehensive enterprise monitoring dashboard",
        panels: [
          {
            id: "cluster-health",
            title: "Cluster Health",
            type: "gauge",
            metrics: ["cluster.healthy_instances", "cluster.total_instances"],
            timeRange: "5m",
            aggregation: "current",
          },
          {
            id: "system-performance",
            title: "System Performance",
            type: "line",
            metrics: ["system.cpu", "system.memory", "performance.throughput"],
            timeRange: "1h",
            aggregation: "avg",
          },
          {
            id: "scaling-events",
            title: "Auto-Scaling Events",
            type: "table",
            metrics: ["scaling.action", "scaling.instances", "scaling.reason"],
            timeRange: "24h",
            aggregation: "count",
          },
          {
            id: "alert-summary",
            title: "Alert Summary",
            type: "bar",
            metrics: ["alerts.critical", "alerts.error", "alerts.warning"],
            timeRange: "24h",
            aggregation: "count",
          },
        ],
        refreshInterval: 10000,
      },
      {
        id: "ai-performance",
        name: "AI Performance Monitoring",
        description: "Specialized dashboard for AI agent performance",
        panels: [
          {
            id: "agent-response-times",
            title: "Agent Response Times",
            type: "line",
            metrics: ["agent.*.response_time"],
            timeRange: "1h",
            aggregation: "p95",
          },
          {
            id: "task-success-rates",
            title: "Task Success Rates",
            type: "gauge",
            metrics: ["agent.*.success_rate"],
            timeRange: "1h",
            aggregation: "avg",
          },
          {
            id: "ai-errors",
            title: "AI-Specific Errors",
            type: "table",
            metrics: [
              "ai.hallucination_errors",
              "ai.timeout_errors",
              "ai.validation_errors",
            ],
            timeRange: "24h",
            aggregation: "count",
          },
        ],
        refreshInterval: 15000,
      },
    ],
  },
};

// =============================================================================
// DEPLOYMENT CONFIGURATIONS
// =============================================================================

/**
 * Docker Compose configuration for enterprise monitoring
 */
export const dockerComposeConfig = `
version: '3.8'
services:
  strray:
    image: strray/strray:v1.0.27
    environment:
      - NODE_ENV=production
      - STRRAY_INSTANCE_ID=strray-1
      - STRRAY_CLUSTER_SIZE=3
      - LOAD_BALANCER_PROVIDER=nginx
      - AUTO_SCALING_PROVIDER=aws
      - PROMETHEUS_ENDPOINT=http://prometheus:9090
      - DATADOG_API_KEY=\${DATADOG_API_KEY}
      - NEW_RELIC_LICENSE_KEY=\${NEW_RELIC_LICENSE_KEY}
      - SLACK_WEBHOOK_URL=\${SLACK_WEBHOOK_URL}
      - PAGERDUTY_INTEGRATION_KEY=\${PAGERDUTY_INTEGRATION_KEY}
    depends_on:
      - prometheus
      - grafana
    networks:
      - monitoring

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - monitoring

  nginx:
    image: nginx:alpine
    volumes:
      - ./monitoring/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./monitoring/nginx/conf.d:/etc/nginx/conf.d
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - strray
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
`;

/**
 * Kubernetes deployment configuration
 */
export const kubernetesConfig = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: strray-enterprise
  labels:
    app: strray
    component: enterprise-monitor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: strray
  template:
    metadata:
      labels:
        app: strray
        component: enterprise-monitor
    spec:
      containers:
      - name: strray
        image: strray/strray:v1.0.27
        env:
        - name: NODE_ENV
          value: "production"
        - name: STRRAY_INSTANCE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: STRRAY_CLUSTER_SIZE
          value: "3"
        - name: LOAD_BALANCER_PROVIDER
          value: "kubernetes"
        - name: AUTO_SCALING_PROVIDER
          value: "kubernetes"
        - name: PROMETHEUS_ENDPOINT
          value: "http://prometheus.monitoring:9090"
        envFrom:
        - secretRef:
            name: strray-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      - name: datadog-agent
        image: datadog/agent:latest
        env:
        - name: DD_API_KEY
          valueFrom:
            secretKeyRef:
              name: datadog-secret
              key: api-key
        - name: DD_SITE
          value: "datadoghq.com"
---
apiVersion: v1
kind: Service
metadata:
  name: strray-service
  labels:
    app: strray
spec:
  selector:
    app: strray
  ports:
  - name: http
    port: 80
    targetPort: 3000
  - name: metrics
    port: 9090
    targetPort: 9090
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: strray-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: strray-enterprise
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
`;

/**
 * AWS CloudFormation template for enterprise monitoring
 */
export const cloudFormationTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'StringRay Enterprise Monitoring Stack'

Parameters:
  InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type for StringRay instances

  MinInstances:
    Type: Number
    Default: 2
    Description: Minimum number of instances

  MaxInstances:
    Type: Number
    Default: 10
    Description: Maximum number of instances

Resources:
  StringRayAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: strray-enterprise-asg
      LaunchTemplate:
        LaunchTemplateId: !Ref StringRayLaunchTemplate
        Version: !GetAtt StringRayLaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref MinInstances
      TargetGroupARNs:
        - !Ref StringRayTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300

  StringRayLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: strray-enterprise-lt
      LaunchTemplateData:
        ImageId: ami-12345678  # Replace with actual AMI
        InstanceType: !Ref InstanceType
        SecurityGroupIds:
          - !Ref StringRaySecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            # Install Docker, StringRay, monitoring agents
            systemctl start docker
            docker run -d --name strray strray/strray:v1.0.27

  StringRayLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: strray-enterprise-alb
      Type: application
      SecurityGroups:
        - !Ref StringRaySecurityGroup

  StringRayTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: strray-enterprise-tg
      Protocol: HTTP
      Port: 80
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2

  StringRayScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref StringRayAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 75.0

  StringRaySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for StringRay instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
`;

// =============================================================================
// MONITORING DASHBOARDS
// =============================================================================

/**
 * Grafana dashboard configuration for StringRay enterprise monitoring
 */
export const grafanaDashboardConfig = `
{
  "dashboard": {
    "title": "StringRay Enterprise Monitoring",
    "tags": ["strray", "enterprise", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Cluster Health Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\\"strray\\"}",
            "legendFormat": "Healthy Instances"
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
        "title": "System Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(process_cpu_user_seconds_total{job=\\"strray\\"}[5m]) * 100",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "process_resident_memory_bytes{job=\\"strray\\"} / 1024 / 1024",
            "legendFormat": "Memory Usage MB"
          }
        ]
      },
      {
        "title": "Application Metrics",
        "type": "graph",
        "targets": [
          {
            "expr": "strray_sessions_active",
            "legendFormat": "Active Sessions"
          },
          {
            "expr": "rate(strray_tasks_completed_total[5m])",
            "legendFormat": "Tasks per Second"
          },
          {
            "expr": "strray_performance_error_rate",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "AI Agent Performance",
        "type": "table",
        "targets": [
          {
            "expr": "strray_agent_response_time{quantile=\\"0.95\\"}",
            "legendFormat": "{{agent_id}} P95 Response Time"
          },
          {
            "expr": "rate(strray_agent_tasks_failed_total[5m]) / rate(strray_agent_tasks_total[5m]) * 100",
            "legendFormat": "{{agent_id}} Error Rate %"
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
`;

// =============================================================================
// ALERTING RULES
// =============================================================================

/**
 * Prometheus alerting rules for StringRay enterprise monitoring
 */
export const prometheusAlertingRules = `
groups:
  - name: strray-enterprise
    rules:
      - alert: StringRayInstanceDown
        expr: up{job="strray"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "StringRay instance {{ $labels.instance }} is down"
          description: "StringRay instance {{ $labels.instance }} has been down for more than 5 minutes."

      - alert: StringRayHighCPUUsage
        expr: rate(process_cpu_user_seconds_total{job="strray"}[5m]) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% for more than 10 minutes."

      - alert: StringRayHighMemoryUsage
        expr: process_resident_memory_bytes{job="strray"} / process_virtual_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 90% for more than 5 minutes."

      - alert: StringRayHighErrorRate
        expr: rate(strray_errors_total[5m]) / rate(strray_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: error
        annotations:
          summary: "High error rate on {{ $labels.instance }}"
          description: "Error rate is {{ $value }}% for more than 5 minutes."

      - alert: StringRaySlowResponseTime
        expr: histogram_quantile(0.95, rate(strray_request_duration_seconds_bucket[5m])) > 5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time on {{ $labels.instance }}"
          description: "95th percentile response time is {{ $value }}s for more than 10 minutes."

      - alert: StringRayAgentFailures
        expr: increase(strray_agent_task_failures_total[10m]) > 10
        for: 5m
        labels:
          severity: error
        annotations:
          summary: "High agent task failure rate"
          description: "Agent task failures increased by {{ $value }} in the last 10 minutes."

      - alert: StringRayClusterUnhealthy
        expr: count(up{job="strray"} == 1) / count(up{job="strray"}) < 0.5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "StringRay cluster is unhealthy"
          description: "Less than 50% of cluster instances are healthy."
`;

// =============================================================================
// EXPORT CONFIGURATIONS
// =============================================================================
