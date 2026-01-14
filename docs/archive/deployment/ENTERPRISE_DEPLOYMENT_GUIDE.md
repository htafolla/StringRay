# StrRay Framework - Enterprise Deployment Guide

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Cloud Platform Deployments](#cloud-platform-deployments)
7. [High Availability Configuration](#high-availability-configuration)
8. [Monitoring and Observability Setup](#monitoring-and-observability-setup)
9. [Security Hardening](#security-hardening)
10. [Performance Optimization](#performance-optimization)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)

---

## Deployment Overview

The StrRay Framework supports multiple deployment strategies for enterprise environments, from simple Docker containers to complex Kubernetes orchestrations with high availability.

### Deployment Options

- **Local Development**: Quick setup for development and testing
- **Docker**: Containerized deployment with Docker Compose
- **Kubernetes**: Orchestrated deployment with auto-scaling and rolling updates
- **Cloud Platforms**: AWS, Azure, GCP native integrations
- **Hybrid**: Combination of on-premises and cloud resources

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                API Gateway                           │    │
│  │  ┌─────────────┬─────────────┬─────────────┐        │    │
│  │  │   StrRay    │   StrRay    │   StrRay    │        │    │
│  │  │ Framework   │ Framework   │ Framework   │        │    │
│  │  │ Instance 1  │ Instance 2  │ Instance 3  │        │    │
│  │  └─────────────┴─────────────┴─────────────┘        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │                        │
          └────────────────────────┼─────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │         Database           │
                    │  (PostgreSQL/Redis/Mongo)  │
                    └─────────────────────────────┘
```

---

## Prerequisites

### System Requirements

#### Minimum Requirements

- **Node.js**: 18.0.0 or higher
- **Memory**: 2GB RAM
- **Storage**: 5GB available disk space
- **Network**: Stable internet connection

#### Recommended for Production

- **Node.js**: 18.17.0+ LTS
- **Memory**: 4GB RAM per instance
- **Storage**: 20GB SSD storage
- **CPU**: 2+ cores per instance
- **Network**: 1Gbps connection

### Software Dependencies

#### Required Packages

```bash
# oh-my-opencode framework
npm install -g oh-my-opencode

# Docker (for containerized deployment)
# Install from https://docs.docker.com/get-docker/

# kubectl (for Kubernetes deployment)
# Install from https://kubernetes.io/docs/tasks/tools/
```

#### Optional Dependencies

```bash
# Prometheus monitoring
# Install from https://prometheus.io/docs/prometheus/latest/installation/

# Grafana dashboards
# Install from https://grafana.com/docs/grafana/latest/installation/

# cert-manager (for TLS certificates)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### Network Requirements

#### Inbound Ports

- **80/443**: HTTP/HTTPS traffic
- **3000**: Framework API (internal)
- **9090**: Prometheus metrics (monitoring)
- **9093**: Alertmanager (alerting)

#### Outbound Connectivity

- **oh-my-opencode API**: For model routing and agent coordination
- **External APIs**: For plugin ecosystem and integrations
- **Monitoring Services**: For metrics export and alerting

---

## Local Development Setup

### Quick Start Setup

1. **Clone and Install**

```bash
git clone https://github.com/strray-framework/stringray.git
cd stringray
npm install
```

2. **Configure oh-my-opencode**

```json
// .opencode/oh-my-opencode.json
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
    "version": "1.0.0",
    "performance_mode": "optimized",
    "monitoring_enabled": true
  }
}
```

3. **Build and Start**

```bash
npm run build
npm start
```

4. **Verify Installation**

```bash
curl http://localhost:3000/api/status
```

### Development Environment Configuration

#### Environment Variables

```bash
# Application settings
NODE_ENV=development
PORT=3000

# oh-my-opencode integration
OPENAI_API_KEY=your_api_key_here

# Database configuration
DATABASE_URL=postgresql://localhost:5432/strray

# Redis for caching (optional)
REDIS_URL=redis://localhost:6379

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
```

#### Development Tools

```bash
# Install development dependencies
npm install -D typescript @types/node vitest

# Run tests
npm test

# Run with hot reload
npm run dev

# Debug mode
DEBUG=strray:* npm start
```

---

## Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build application
FROM base AS build
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S strray -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=strray:nodejs /app/dist ./dist
COPY --from=build --chown=strray:nodejs /app/package*.json ./
COPY --from=build --chown=strray:nodejs /app/node_modules ./node_modules

USER strray

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### Docker Compose Configuration

```yaml
version: "3.8"

services:
  strray:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Optional: PostgreSQL for data persistence
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=strray
      - POSTGRES_USER=strray
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

#### Build and Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f strray

# Scale services
docker-compose up -d --scale strray=3
```

### Multi-Stage Container Strategy

#### Optimized Production Build

```dockerfile
# Multi-stage build for optimized image
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --no-optional && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build && npm prune --production

FROM node:18-alpine AS runner
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strray

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER strray

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

---

## Kubernetes Deployment

### Basic Kubernetes Manifests

#### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: strray-system
  labels:
    name: strray-system
    app: strray
```

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: strray-config
  namespace: strray-system
data:
  config.json: |
    {
      "framework": {
        "name": "strray",
        "version": "1.0.0",
        "performance_mode": "optimized",
        "monitoring_enabled": true
      },
      "model_routing": {
        "enforcer": "opencode/grok-code",
        "architect": "opencode/grok-code"
      }
    }
```

#### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: strray-secrets
  namespace: strray-system
type: Opaque
data:
  openai-api-key: <base64-encoded-key>
  database-url: <base64-encoded-url>
```

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: strray-framework
  namespace: strray-system
  labels:
    app: strray
spec:
  replicas: 3
  selector:
    matchLabels:
      app: strray
  template:
    metadata:
      labels:
        app: strray
    spec:
      containers:
        - name: strray
          image: strray/strray:latest
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: strray-secrets
                  key: openai-api-key
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: strray-secrets
                  key: database-url
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
          livenessProbe:
            httpGet:
              path: /api/status
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/status
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
      volumes:
        - name: config
          configMap:
            name: strray-config
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: strray-service
  namespace: strray-system
  labels:
    app: strray
spec:
  selector:
    app: strray
  ports:
    - name: http
      port: 80
      targetPort: 3000
  type: ClusterIP
```

#### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: strray-ingress
  namespace: strray-system
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.strray.example.com
      secretName: strray-tls
  rules:
    - host: api.strray.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: strray-service
                port:
                  number: 80
```

### Advanced Kubernetes Configuration

#### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: strray-hpa
  namespace: strray-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: strray-framework
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

#### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: strray-pdb
  namespace: strray-system
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: strray
```

#### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: strray-network-policy
  namespace: strray-system
spec:
  podSelector:
    matchLabels:
      app: strray
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 443
      port: 80
```

---

## Cloud Platform Deployments

### AWS Deployment

#### CloudFormation Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "StrRay Framework AWS Deployment"

Parameters:
  InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: SSH key pair name

Resources:
  StrRayVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true

  StrraySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for StrRay Framework
      VpcId: !Ref StrRayVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  StrRayLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: strray-launch-template
      LaunchTemplateData:
        ImageId: ami-0abcdef1234567890
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref StrraySecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            source ~/.bashrc
            nvm install 18
            nvm use 18
            npm install -g pm2
            git clone https://github.com/strray-framework/stringray.git
            cd stringray
            npm install
            npm run build
            pm2 start dist/server.js --name strray

  StrRayAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref StrRayLaunchTemplate
        Version: "1"
      MinSize: "2"
      MaxSize: "10"
      DesiredCapacity: "3"
      AvailabilityZones:
        - !Select [0, !GetAZs ""]
        - !Select [1, !GetAZs ""]
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300

  StrRayLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref StrraySecurityGroup

  StrRayTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Protocol: HTTP
      Port: 3000
      VpcId: !Ref StrRayVPC
      HealthCheckPath: /api/status

  StrRayListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref StrRayLoadBalancer
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref StrRayTargetGroup

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the load balancer
    Value: !GetAtt StrRayLoadBalancer.DNSName
    Export:
      Name: StrRayLoadBalancerDNS
```

#### AWS Fargate Deployment

```yaml
# ECS Fargate task definition
{
  "family": "strray-framework",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions":
    [
      {
        "name": "strray",
        "image": "strray/strray:latest",
        "essential": true,
        "portMappings":
          [{ "containerPort": 3000, "hostPort": 3000, "protocol": "tcp" }],
        "environment":
          [
            { "name": "NODE_ENV", "value": "production" },
            { "name": "OPENAI_API_KEY", "value": "${OPENAI_API_KEY}" },
          ],
        "logConfiguration":
          {
            "logDriver": "awslogs",
            "options":
              {
                "awslogs-group": "/ecs/strray-framework",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs",
              },
          },
      },
    ],
}
```

### Azure Deployment

#### Azure Resource Manager Template

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appName": {
      "type": "string",
      "metadata": {
        "description": "Name of the application"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": {
        "description": "Location for all resources"
      }
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2020-06-01",
      "name": "[parameters('appName')]",
      "location": "[parameters('location')]",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "httpsOnly": true,
        "siteConfig": {
          "appSettings": [
            {
              "name": "NODE_ENV",
              "value": "production"
            },
            {
              "name": "OPENAI_API_KEY",
              "value": "[parameters('openaiApiKey')]"
            }
          ],
          "linuxFxVersion": "NODE|18-lts"
        }
      }
    },
    {
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2020-06-01",
      "name": "[variables('appServicePlanName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "B1",
        "tier": "Basic",
        "size": "B1",
        "family": "B",
        "capacity": 1
      },
      "properties": {
        "reserved": true
      }
    }
  ]
}
```

### Google Cloud Deployment

#### Cloud Run Service

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: strray-framework
  namespace: default
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
    spec:
      containers:
        - image: gcr.io/project-id/strray:latest
          ports:
            - name: http1
              containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: strray-secrets
                  key: openai-api-key
          resources:
            limits:
              cpu: 1000m
              memory: 512Mi
            requests:
              cpu: 100m
              memory: 128Mi
          livenessProbe:
            httpGet:
              path: /api/status
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/status
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## High Availability Configuration

### Multi-Region Deployment

#### Global Load Balancing

```yaml
# AWS Global Accelerator configuration
{
  "Accelerator":
    {
      "Name": "strray-global-accelerator",
      "IpAddressType": "IPV4",
      "Enabled": true,
    },
  "Listeners":
    [
      {
        "ClientAffinity": "NONE",
        "Protocol": "TCP",
        "PortRanges":
          [
            { "FromPort": 80, "ToPort": 80 },
            { "FromPort": 443, "ToPort": 443 },
          ],
      },
    ],
}
```

#### Database Replication

```yaml
# PostgreSQL replication configuration
postgresql:
  replication:
    enabled: true
    user: replicator
    password: replication_password
    database: strray
  slave:
    enabled: true
    masterHost: master-postgres
    masterPort: 5432
```

### Disaster Recovery

#### Backup Strategy

```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/opt/strray/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h localhost -U strray strray > "$BACKUP_DIR/database_$DATE.sql"

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/strray/config/

# Application data backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /opt/strray/data/

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/" s3://strray-backups/ --recursive

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

#### Recovery Procedures

```bash
#!/bin/bash
# Disaster recovery script

BACKUP_DATE="20231201_120000"

# Stop application
docker-compose down

# Restore database
psql -h localhost -U strray strray < "backups/database_$BACKUP_DATE.sql"

# Restore configuration
tar -xzf "backups/config_$BACKUP_DATE.tar.gz" -C /opt/strray/

# Restore application data
tar -xzf "backups/app_$BACKUP_DATE.tar.gz" -C /opt/strray/

# Start application
docker-compose up -d

# Verify recovery
curl -f http://localhost:3000/api/status
```

---

## Monitoring and Observability Setup

### Prometheus Configuration

#### prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: "strray-framework"
    static_configs:
      - targets: ["strray:3000"]
    metrics_path: "/metrics"
    scrape_interval: 5s

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["postgres-exporter:9187"]
```

#### Alert Rules

```yaml
groups:
  - name: strray
    rules:
      - alert: StrRayDown
        expr: up{job="strray-framework"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "StrRay Framework is down"
          description: "StrRay Framework has been down for more than 5 minutes."

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% which is above 5%."

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%."
```

### Grafana Dashboards

#### Installation

```bash
# Add StrRay dashboard to Grafana
curl -X POST -H "Content-Type: application/json" \
  -d @strray-dashboard.json \
  http://admin:admin@localhost:3000/api/dashboards/db
```

#### Sample Dashboard Panels

```json
{
  "dashboard": {
    "title": "StrRay Framework Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error %"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

---

## Security Hardening

### Container Security

#### Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: strray-secure
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
  containers:
    - name: strray
      image: strray/strray:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        runAsNonRoot: true
        runAsUser: 1001
        capabilities:
          drop:
            - ALL
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir: {}
```

### Network Security

#### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: strray-secure-network
spec:
  podSelector:
    matchLabels:
      app: strray
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: monitoring
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    - to: []
      ports:
        - protocol: TCP
          port: 443 # HTTPS for external APIs
        - protocol: TCP
          port: 80 # HTTP for package registries
```

### Secret Management

#### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: strray-secrets
type: Opaque
data:
  openai-api-key: <base64-encoded>
  database-password: <base64-encoded>
  jwt-secret: <base64-encoded>
---
apiVersion: v1
kind: Secret
metadata:
  name: strray-tls
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

#### AWS Secrets Manager

```typescript
import { SecretsManager } from "aws-sdk";

const secretsManager = new SecretsManager();

export async function getSecret(secretName: string): Promise<string> {
  const response = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();
  return response.SecretString!;
}
```

---

## Performance Optimization

### Application Optimization

#### Node.js Configuration

```javascript
// Optimize for production
process.env.NODE_ENV = "production";

// Enable garbage collection optimization
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 60000); // Run GC every minute
}

// Optimize thread pool size
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "8";
```

#### Memory Optimization

```typescript
// Implement memory-efficient caching
import NodeCache from "node-cache";

// LRU cache with TTL
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // Check every 10 minutes
  maxKeys: 1000, // Maximum 1000 keys
});

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 500 * 1024 * 1024) {
    // 500MB
    console.warn("High memory usage detected:", memUsage.heapUsed);
    if (global.gc) {
      global.gc();
    }
  }
}, 30000);
```

### Database Optimization

#### Connection Pooling

```typescript
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query optimization
export async function getUserById(id: number) {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0];
  } finally {
    client.release();
  }
}
```

### CDN Integration

#### CloudFront Configuration

```yaml
# AWS CloudFront distribution for static assets
Resources:
  StrRayCloudFront:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: strray-api.example.com
            Id: StrRayAPI
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
        Enabled: true
        DefaultCacheBehavior:
          TargetOriginId: StrRayAPI
          ViewerProtocolPolicy: redirect-to-https
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        CacheBehaviors:
          - PathPattern: "/api/*"
            TargetOriginId: StrRayAPI
            ViewerProtocolPolicy: https-only
            Compress: true
            ForwardedValues:
              QueryString: true
              Cookies:
                Forward: all
```

---

## Backup and Recovery

### Automated Backup Strategy

#### Daily Backups

```bash
#!/bin/bash
# Daily backup script

BACKUP_ROOT="/opt/strray/backups"
DATE=$(date +%Y%m%d)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

mkdir -p "$BACKUP_DIR"

# Database backup
docker exec strray-postgres pg_dump -U strray strray > "$BACKUP_DIR/database.sql"

# Configuration backup
tar -czf "$BACKUP_DIR/config.tar.gz" /opt/strray/config/

# Application logs backup
tar -czf "$BACKUP_DIR/logs.tar.gz" /opt/strray/logs/

# Upload to cloud storage
aws s3 sync "$BACKUP_DIR/" "s3://strray-backups/daily/$DATE/"

# Cleanup local backups older than 7 days
find "$BACKUP_ROOT" -name "20*" -type d -mtime +7 -exec rm -rf {} +

echo "Daily backup completed: $DATE"
```

#### Weekly Full Backups

```bash
#!/bin/bash
# Weekly full backup script

WEEK=$(date +%Y-W%U)
BACKUP_DIR="/opt/strray/backups/weekly/$WEEK"

mkdir -p "$BACKUP_DIR"

# Full system backup
docker run --rm \
  --volumes-from strray-app \
  -v "$BACKUP_DIR:/backup" \
  alpine:latest \
  tar -czf /backup/app.tar.gz -C /app .

# Database full backup
docker exec strray-postgres pg_dumpall -U postgres > "$BACKUP_DIR/database_full.sql"

# Upload to cloud storage
aws s3 sync "$BACKUP_DIR/" "s3://strray-backups/weekly/$WEEK/"

echo "Weekly backup completed: $WEEK"
```

### Recovery Procedures

#### Application Recovery

```bash
#!/bin/bash
# Application recovery script

BACKUP_DATE="20231201"
BACKUP_DIR="/opt/strray/backups/$BACKUP_DATE"

# Stop application
docker-compose down

# Restore configuration
tar -xzf "$BACKUP_DIR/config.tar.gz" -C /opt/strray/

# Restore application data
docker run --rm \
  --volumes-from strray-app \
  -v "$BACKUP_DIR:/backup" \
  alpine:latest \
  tar -xzf /backup/app.tar.gz -C /app

# Start application
docker-compose up -d

# Verify recovery
timeout 30 bash -c 'until curl -f http://localhost:3000/api/status; do sleep 1; done'
echo "Application recovery completed"
```

#### Database Recovery

```bash
#!/bin/bash
# Database recovery script

BACKUP_FILE="/opt/strray/backups/database.sql"

# Stop application
docker-compose stop strray-app

# Restore database
docker exec -i strray-postgres psql -U strray strray < "$BACKUP_FILE"

# Start application
docker-compose start strray-app

echo "Database recovery completed"
```

### Point-in-Time Recovery

#### WAL Archiving Setup

```postgresql
-- PostgreSQL configuration for PITR
wal_level = replica
archive_mode = on
archive_command = 'cp %p /opt/strray/wal/%f'
restore_command = 'cp /opt/strray/wal/%f %p'
recovery_target_time = '2023-12-01 12:00:00'
```

#### Recovery Script

```bash
#!/bin/bash
# Point-in-time recovery script

RECOVERY_TIME="2023-12-01 12:00:00"
BACKUP_FILE="/opt/strray/backups/base_backup.sql"
WAL_DIR="/opt/strray/wal"

# Create recovery configuration
cat > /opt/strray/recovery.conf << EOF
restore_command = 'cp $WAL_DIR/%f %p'
recovery_target_time = '$RECOVERY_TIME'
recovery_target_action = 'promote'
EOF

# Restore base backup
psql -U postgres < "$BACKUP_FILE"

# Start recovery
pg_ctl -D /var/lib/postgresql/data start

echo "Point-in-time recovery initiated for: $RECOVERY_TIME"
```

---

## Troubleshooting Deployment Issues

### Common Issues and Solutions

#### Container Won't Start

**Symptoms:**

- Container exits immediately
- Logs show startup errors

**Solutions:**

```bash
# Check container logs
docker logs <container-id>

# Verify environment variables
docker exec <container> env

# Check health endpoint
curl -f http://localhost:3000/api/status || echo "Health check failed"

# Validate configuration
docker exec <container> node -e "console.log(JSON.stringify(require('./config'), null, 2))"
```

#### Database Connection Issues

**Symptoms:**

- Application logs show connection errors
- Health checks fail

**Solutions:**

```bash
# Test database connectivity
docker exec strray-app nc -zv database 5432

# Check database logs
docker logs strray-postgres

# Verify connection string
docker exec strray-app node -e "console.log(process.env.DATABASE_URL)"

# Test database credentials
docker exec strray-postgres psql -U strray -d strray -c "SELECT 1;"
```

#### High Memory Usage

**Symptoms:**

- Container restarts due to OOM
- Performance degradation

**Solutions:**

```bash
# Monitor memory usage
docker stats <container-id>

# Check application memory usage
docker exec strray-app node -e "console.log(process.memoryUsage())"

# Enable garbage collection logging
docker run --env NODE_OPTIONS="--expose-gc --max-old-space-size=512" strray/strray

# Optimize memory settings
NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size" npm start
```

#### Network Connectivity Issues

**Symptoms:**

- External API calls fail
- Service discovery issues

**Solutions:**

```bash
# Test network connectivity
docker exec strray-app curl -I https://api.openai.com

# Check DNS resolution
docker exec strray-app nslookup api.openai.com

# Verify network policies (Kubernetes)
kubectl get networkpolicies

# Test service mesh connectivity
kubectl exec -it strray-pod -- curl -f http://other-service:port/api/status
```

#### Performance Issues

**Symptoms:**

- Slow response times
- High CPU usage
- Database query timeouts

**Solutions:**

```bash
# Profile application performance
docker exec strray-app node --prof dist/server.js

# Analyze performance logs
docker logs strray-app | grep -i "slow\|timeout\|error"

# Check database query performance
docker exec strray-postgres psql -U strray -d strray -c "SELECT * FROM pg_stat_activity;"

# Monitor system resources
docker stats
top -p $(pgrep node)
```

#### SSL/TLS Issues

**Symptoms:**

- HTTPS connections fail
- Certificate errors

**Solutions:**

```bash
# Check certificate validity
openssl s_client -connect localhost:443 -servername localhost

# Verify certificate chain
openssl verify -CAfile ca.pem certificate.pem

# Test SSL configuration
curl -v https://localhost:443/api/status

# Check certificate renewal (cert-manager)
kubectl get certificates
kubectl describe certificate strray-tls
```

### Logging and Debugging

#### Enable Debug Logging

```bash
# Application debug logging
DEBUG=strray:* npm start

# Database debug logging
docker exec strray-postgres bash -c 'echo "log_statement = all" >> /var/lib/postgresql/data/postgresql.conf && pg_ctl reload'

# Kubernetes debug logging
kubectl logs -f deployment/strray-framework --previous
kubectl describe pod <pod-name>
```

#### Log Analysis

```bash
# Search for error patterns
grep -r "ERROR\|FATAL" /opt/strray/logs/

# Analyze access patterns
tail -f /opt/strray/logs/access.log | grep " 5[0-9][0-9] "

# Monitor resource usage over time
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" --no-stream
```

### Emergency Procedures

#### Service Restart

```bash
# Restart application
docker-compose restart strray-app

# Force restart with cleanup
docker-compose down && docker-compose up -d

# Kubernetes rollout restart
kubectl rollout restart deployment/strray-framework
```

#### Data Recovery

```bash
# Restore from latest backup
./scripts/restore-backup.sh latest

# Restore from specific backup
./scripts/restore-backup.sh 20231201_120000

# Verify data integrity
./scripts/verify-data-integrity.sh
```

#### Incident Response

```bash
# Isolate affected components
kubectl cordon <node-name>

# Scale down problematic deployment
kubectl scale deployment strray-framework --replicas=0

# Investigate root cause
kubectl logs --previous deployment/strray-framework

# Restore service
kubectl scale deployment strray-framework --replicas=3
```

This comprehensive deployment guide provides everything needed to deploy the StrRay Framework in production environments with high availability, security, and performance optimization.
