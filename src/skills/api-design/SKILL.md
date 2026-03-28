---
source: framework
name: api-design
description: RESTful API design and validation
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [design, api, design]
capabilities:
  - design_rest_api
  - validate_api_specs
  - generate_api_docs
dependencies: []

mcp:
  api-design:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/api-design.server.js]
---

# Api Design Skill

RESTful API design and validation.

## Tools Available

- **api_design**: API design
- **endpoint_validation**: Endpoint validation
- **api_documentation**: API documentation

## Usage

This skill provides design capabilities for api design functionality.

## Integration

Activated when design capabilities are requested through the skills system.
