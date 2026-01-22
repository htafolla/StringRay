# StrRay Framework - Docker & Kubernetes Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the StrRay Framework using Docker and Kubernetes in production environments.

## Prerequisites

- Docker 20.10+
- Kubernetes 1.24+
- Helm 3.8+
- 4GB RAM minimum, 8GB recommended
- 10GB disk space

## Architecture

### Container Architecture

```
StrRay Framework Container Stack
├── strray-app (Main application)
├── strray-mcp-servers (MCP server pool)
├── strray-monitoring (Prometheus/Grafana)
├── strray-database (PostgreSQL/Redis - optional)
└── strray-load-balancer (Nginx/Traefik)
```

### Kubernetes Architecture

```
Production Kubernetes Deployment
├── Namespace: strray-system
├── ConfigMaps: Framework configuration
├── Secrets: API keys and certificates
├── Deployments: Application and MCP servers
├── Services: Internal communication
├── Ingress: External access
├── HPA: Horizontal Pod Autoscaling
├── PDB: Pod Disruption Budget
└── NetworkPolicies: Security isolation
```

## Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S strray && \
    adduser -S strray -u 1001

# Copy built application
COPY --from=builder --chown=strray:strray /app/dist ./dist
COPY --from=builder --chown=strray:strray /app/node_modules ./node_modules
COPY --from=builder --chown=strray:strray /app/package.json ./

# Switch to non-root user
USER strray

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  strray-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - STRRAY_PORT=3000
      - STRRAY_HOST=0.0.0.0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRRAY_DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - strray-db

  strray-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=strray
      - POSTGRES_USER=strray
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strray"]
      interval: 30s
      timeout: 10s
      retries: 3

  strray-redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

### Multi-Container MCP Server Deployment

#### docker-compose.mcp.yml

```yaml
version: "3.8"

services:
  strray-orchestrator:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: orchestrator
    environment:
      - NODE_ENV=production
      - MCP_SERVER_TYPE=orchestrator
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
    depends_on:
      - strray-redis

  strray-enforcer:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: enforcer
    environment:
      - NODE_ENV=production
      - MCP_SERVER_TYPE=enforcer
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  strray-architect:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: architect
    environment:
      - NODE_ENV=production
      - MCP_SERVER_TYPE=architect
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  # Add remaining MCP servers...
  strray-security-auditor:
    build:
      context: .
      dockerfile: Dockerfile.mcp
      args:
        MCP_SERVER: security-auditor
    environment:
      - NODE_ENV=production
      - MCP_SERVER_TYPE=security-auditor
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  strray-redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
```

#### Dockerfile.mcp

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built MCP servers
COPY dist/mcps/ ./dist/mcps/
COPY dist/agents/ ./dist/agents/

# Create non-root user
RUN addgroup -g 1001 -S strray && \
    adduser -S strray -u 1001

# Set permissions
RUN chown -R strray:strray /app
USER strray

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('MCP server healthy')"

# Expose port (if needed)
EXPOSE 3001-3017

# Start MCP server
ARG MCP_SERVER
ENV MCP_SERVER_TYPE=${MCP_SERVER}
CMD ["sh", "-c", "node dist/mcps/${MCP_SERVER}-server.js"]
```

## Kubernetes Deployment

### Helm Chart Structure

```
strray-framework/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── networkpolicy.yaml
│   └── pdb.yaml
├── charts/
└── README.md
```

#### Chart.yaml

```yaml
apiVersion: v2
name: strray-framework
description: Enterprise AI Agent Coordination Platform
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - ai
  - agents
  - orchestration
  - enterprise
home: https://github.com/strray-framework
maintainers:
  - name: StrRay Team
    email: team@strray.dev
```

#### values.yaml

```yaml
# Default values for strray-framework
replicaCount: 3

image:
  repository: strray/strray-framework
  tag: "1.0.0"
  pullPolicy: IfNotPresent

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
      - ALL

service:
  type: ClusterIP
  port: 3000
  targetPort: 3000

ingress:
  enabled: true
  className: ""
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: strray.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: strray-tls
      hosts:
        - strray.example.com

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

# Database configuration
database:
  enabled: true
  postgresql:
    enabled: true
    postgresqlUsername: strray
    postgresqlPassword: ""
    postgresqlDatabase: strray
    persistence:
      enabled: true
      size: 10Gi

# Redis configuration
redis:
  enabled: true
  architecture: standalone
  persistence:
    enabled: true
    size: 5Gi

# Monitoring configuration
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: ""

# StrRay specific configuration
strray:
  # API Keys
  openaiApiKey: ""
  anthropicApiKey: ""

  # Framework settings
  logLevel: "info"
  maxConcurrency: 10
  cacheEnabled: true

  # Resource limits per agent
  agentLimits:
    enforcer:
      memory: "256Mi"
      cpu: "500m"
    architect:
      memory: "512Mi"
      cpu: "1000m"
    orchestrator:
      memory: "1Gi"
      cpu: "2000m"

  # MCP Server configuration
  mcpServers:
    enabled: true
    replicaCount: 2
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "500m"
```

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "strray-framework.fullname" . }}
  labels:
    {{- include "strray-framework.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "strray-framework.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "strray-framework.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "strray-framework.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: strray
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: {{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          env:
            - name: NODE_ENV
              value: "production"
            - name: STRRAY_PORT
              value: "3000"
            - name: STRRAY_DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "strray-framework.fullname" . }}
                  key: database-url
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ include "strray-framework.fullname" . }}
                  key: openai-api-key
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: {{ include "strray-framework.fullname" . }}
                  key: redis-url
            - name: STRRAY_LOG_LEVEL
              value: {{ .Values.strray.logLevel }}
            - name: STRRAY_MAX_CONCURRENCY
              value: {{ .Values.strray.maxConcurrency | quote }}
            - name: STRRAY_CACHE_ENABLED
              value: {{ .Values.strray.cacheEnabled | quote }}
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: logs
              mountPath: /app/logs
            - name: cache
              mountPath: /app/cache
      volumes:
        - name: logs
          emptyDir: {}
        - name: cache
          emptyDir: {}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

#### service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: { { include "strray-framework.fullname" . } }
  labels: { { - include "strray-framework.labels" . | nindent 4 } }
spec:
  type: { { .Values.service.type } }
  ports:
    - port: { { .Values.service.port } }
      targetPort: { { .Values.service.targetPort } }
      protocol: TCP
      name: http
  selector: { { - include "strray-framework.selectorLabels" . | nindent 4 } }
```

#### ingress.yaml

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "strray-framework.fullname" . }}
  labels:
    {{- include "strray-framework.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            {{- if and .pathType (semverCompare ">=1.18.0" $.Capabilities.KubeVersion.GitVersion) }}
            pathType: {{ .pathType }}
            {{- end }}
            backend:
              service:
                name: {{ include "strray-framework.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```

#### hpa.yaml

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "strray-framework.fullname" . }}
  labels:
    {{- include "strray-framework.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "strray-framework.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```

## Production Deployment

### Environment Variables

Create a `.env.production` file:

```bash
# Core Configuration
NODE_ENV=production
STRRAY_PORT=3000
STRRAY_HOST=0.0.0.0
STRRAY_LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/strray
REDIS_URL=redis://redis-host:6379

# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Framework Settings
STRRAY_MAX_CONCURRENCY=20
STRRAY_CACHE_ENABLED=true
STRRAY_CACHE_TTL=3600
STRRAY_RATE_LIMIT_ENABLED=true
STRRAY_RATE_LIMIT_REQUESTS=1000
STRRAY_RATE_LIMIT_WINDOW=3600

# Security
STRRAY_JWT_SECRET=your_jwt_secret
STRRAY_ENCRYPTION_KEY=your_encryption_key
STRRAY_CORS_ORIGINS=https://yourdomain.com

# Monitoring
STRRAY_METRICS_ENABLED=true
STRRAY_METRICS_ENDPOINT=/metrics
STRRAY_HEALTH_CHECK_ENABLED=true
STRRAY_HEALTH_CHECK_PATH=/health

# Resource Limits
STRRAY_MEMORY_LIMIT=2GB
STRRAY_CPU_LIMIT=2000m
STRRAY_TIMEOUT_DEFAULT=30000
```

### Production Docker Compose

```yaml
version: "3.8"

services:
  strray-app:
    image: strray/strray-framework:1.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - STRRAY_PORT=3000
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs:rw
      - ./uploads:/app/uploads:rw
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    depends_on:
      - postgres
      - redis
    networks:
      - strray-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=strray
      - POSTGRES_USER=strray
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U strray"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - strray-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass-file /run/secrets/redis_password
    secrets:
      - redis_password
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - strray-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
      - ./logs/nginx:/var/log/nginx:rw
    restart: unless-stopped
    depends_on:
      - strray-app
    networks:
      - strray-network

secrets:
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  strray-network:
    driver: bridge
```

### Nginx Configuration

```nginx
upstream strray_backend {
    server strray-app:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://strray_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Metrics endpoint (if enabled)
    location /metrics {
        proxy_pass http://strray_backend;
        allow 10.0.0.0/8;
        deny all;
    }
}
```

## Monitoring Setup

### Prometheus Configuration

Create `prometheus.yml`:

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
      - targets: ["strray-app:3000"]
    scrape_interval: 5s
    metrics_path: "/metrics"

  - job_name: "strray-mcp-servers"
    static_configs:
      - targets:
          - "strray-orchestrator:3001"
          - "strray-enforcer:3002"
          - "strray-architect:3003"
          - "strray-security-auditor:3004"
    scrape_interval: 10s
    metrics_path: "/metrics"

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "redis-exporter"
    static_configs:
      - targets: ["redis-exporter:9121"]
```

### Grafana Dashboard

Create a Grafana dashboard configuration:

```json
{
  "dashboard": {
    "title": "StrRay Framework Overview",
    "tags": ["strray", "ai", "agents"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Agent Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(strray_agent_requests_total[5m])",
            "legendFormat": "{{agent}}"
          }
        ]
      },
      {
        "title": "Agent Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(strray_agent_response_time_bucket[5m]))",
            "legendFormat": "{{agent}} p95"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(strray_agent_errors_total[5m]) / rate(strray_agent_requests_total[5m]) * 100",
            "legendFormat": "{{agent}} error rate"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "Memory Usage (MB)"
          }
        ]
      }
    ]
  }
}
```

## Scaling and High Availability

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: strray-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: strray-deployment
  minReplicas: 3
  maxReplicas: 20
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
      selectPolicy: Max
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: strray-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: strray-framework
```

## Backup and Recovery

### Database Backup

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: strray-db-backup
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:15-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h postgres -U strray strray > /backup/strray-$(date +%Y%m%d-%H%M%S).sql
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: strray-secrets
                      key: db-password
              volumeMounts:
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: strray-backup-pvc
          restartPolicy: OnFailure
```

## Troubleshooting

### Common Issues

#### Container Startup Failures

```bash
# Check container logs
docker logs strray-app

# Check container health
docker ps -f name=strray-app

# Check environment variables
docker exec strray-app env
```

#### Database Connection Issues

```bash
# Test database connectivity
docker exec strray-db pg_isready -U strray -d strray

# Check database logs
docker logs strray-db

# Verify connection string
docker exec strray-app node -e "console.log(process.env.DATABASE_URL)"
```

#### Performance Issues

```bash
# Monitor resource usage
docker stats strray-app

# Check application metrics
curl http://localhost:3000/metrics

# Profile memory usage
docker exec strray-app node --inspect --heap-prof
```

#### Kubernetes Troubleshooting

```bash
# Check pod status
kubectl get pods -n strray-system

# Check pod logs
kubectl logs -f deployment/strray-framework -n strray-system

# Check service endpoints
kubectl get endpoints -n strray-system

# Check resource usage
kubectl top pods -n strray-system
```

## Security Hardening

### Pod Security Standards

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: strray-secure-pod
  labels:
    security: "restricted"
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
  containers:
    - name: strray
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        runAsNonRoot: true
        runAsUser: 1001
        capabilities:
          drop:
            - ALL
        seccompProfile:
          type: RuntimeDefault
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: strray-network-policy
  namespace: strray-system
spec:
  podSelector:
    matchLabels:
      app: strray-framework
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
    - from:
        - podSelector:
            matchLabels:
              app: strray-framework
      ports:
        - protocol: TCP
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
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
          port: 443
        - protocol: TCP
          port: 80
```

## Performance Optimization

### Resource Optimization

```yaml
# Production resource limits
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

# JVM tuning for Node.js
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=3072 --optimize-for-size --gc-interval=100"

  # Connection pooling
  - name: DATABASE_POOL_SIZE
    value: "10"
  - name: REDIS_POOL_SIZE
    value: "20"
```

### Caching Strategy

```yaml
# Multi-level caching
caching:
  l1: # Memory cache
    enabled: true
    ttl: 300
    maxSize: 1000

  l2: # Redis cache
    enabled: true
    ttl: 3600
    maxSize: 10000

  l3: # Database cache
    enabled: true
    ttl: 86400
    maxSize: 100000
```

This deployment guide provides a comprehensive production-ready setup for the StrRay Framework with high availability, security, and monitoring capabilities.</content>
</xai:function_call">Successfully wrote to src/docs/DOCKER_DEPLOYMENT_GUIDE.md
