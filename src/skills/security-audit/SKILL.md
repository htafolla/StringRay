---
source: framework
name: security-audit
description: Security auditing and compliance validation
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [security, security, audit]
capabilities:
  - audit_security
  - validate_compliance
  - find_vulnerabilities
dependencies: []

mcp:
  security-audit:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/security-audit.server.js]
  tools:
    - scan_security
    - audit_compliance
    - check_vulnerabilities

agent_binding:
  primary: security-auditor
  auto_invoke: false
  invoke_on:
    - manual
---

# Security Audit Skill

Security auditing and compliance validation.

## Tools Available

- **security_auditing**: Security auditing
- **compliance_validation**: Compliance validation
- **risk_assessment**: Risk assessment

## Usage

This skill provides security capabilities for security audit functionality.

## Integration

Activated when security capabilities are requested through the skills system.
