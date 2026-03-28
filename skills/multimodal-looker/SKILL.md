---
name: multimodal-looker
description: Visual content analysis for diagrams, screenshots, and UI mockups
author: StrRay Framework
version: 1.0.0
tags: [visual, diagrams, screenshots, accessibility, ui-analysis]

mcp:
  multimodal-looker:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/multimodal-looker.server.js]
---

# Multimodal Looker Skill

Visual content analysis for diagrams, screenshots, and UI mockups.

## Tools Available

- **analyze_diagram**: Analyze flowcharts, sequence diagrams, architecture diagrams
- **analyze_screenshot**: Identify UI components and layout patterns
- **generate_ui_spec**: Generate UI specification from mockups
- **extract_design_tokens**: Extract colors, typography, spacing
- **accessibility_audit**: Perform WCAG accessibility audit
- **compare_visuals**: Compare visual elements for differences

## Usage

This skill provides visual analysis capabilities for:
- Diagram understanding and extraction
- UI mockup analysis
- Design token extraction
- Accessibility compliance checking
- Visual regression testing

## Integration

Activated when visual analysis or UI understanding capabilities are requested.
