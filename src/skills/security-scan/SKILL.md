---
source: framework
name: security-scan
description: Security vulnerability scanning and assessment
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [security, security, scan]
capabilities:
  - scan_vulnerabilities
  - assess_risks
  - provide_recommendations
dependencies: []

mcp:
  security-scan:
    command: node
    args: [node_modules/strray-ai/dist/mcps/security-scan.server.js]
---

# Security Scan Skill

Security vulnerability scanning and assessment.

## Tools Available

- **security_scanning**: Security scanning
- **vulnerability_assessment**: Vulnerability assessment
- **security_reports**: Security reports

## Usage

This skill provides security capabilities for security scan functionality.

## Integration

Activated when security capabilities are requested through the skills system.
