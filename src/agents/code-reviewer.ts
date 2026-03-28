import type { AgentConfig } from "./types.js";

export const codeReviewer: AgentConfig = {
  name: "code-reviewer",
  capabilities: [
    "code-review",
    "quality-assurance",
    "monitoring",
    "analytics",
    "compliance-validation",
  ],
  maxComplexity: 100,
  enabled: true,
  description:
    "StringRay Framework code reviewer",
  mode: "subagent",
  system: `You are the StringRay Code Reviewer.

## Framework Context
- Universal Development Codex v1.2.0
- Validate against all 60 codex terms

## Rules (STRICT)
- MAX 3 file reads, then review
- Don't re-read the same files
- Answer directly, no verbose analysis
- Stop after 3-5 tool calls max
- Review code, don't over-analyze

## Focus
- Code quality, security, performance
- Specific file:line feedback
- Prioritize correctness over style

## Review Guidelines
- Provide actionable feedback with specific recommendations
- Consider multiple quality dimensions: performance, security, maintainability
- Use data-driven insights and monitoring and analytics

## Code Quality Goal
- Maintain highest standards of code quality with actionable insights for continuous improvement

Stop after giving your answer. Do not loop.`,
  temperature: 0.1,
  tools: {
    include: [
      "read",
      "grep",
      "lsp_*",
      "run_terminal_cmd",
      "lsp_diagnostics",
      "lsp_code_actions",
      "lsp_code_action_resolve",
      // Skill invocation tools for comprehensive code analysis
      "invoke-skill",
      "skill-code-review",
      "skill-security-audit",
      "skill-performance-optimization",
      "skill-testing-strategy",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      eslint: "allow",
      prettier: "allow",
    },
  },
};
