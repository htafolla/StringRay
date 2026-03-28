"""Tool schemas — what the LLM sees."""

STRRAY_VALIDATE = {
    "name": "strray_validate",
    "description": (
        "Run StringRay pre-commit validation on specified files. "
        "Checks codex compliance, rule validation, and quality gates. "
        "Use this before committing any code changes. Returns pass/fail "
        "with actionable remediation for any violations."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "files": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of file paths to validate",
            },
            "operation": {
                "type": "string",
                "description": "Operation type (commit, create, modify, refactor)",
                "default": "commit",
            },
        },
        "required": ["files"],
    },
}

STRRAY_CODEX_CHECK = {
    "name": "strray_codex_check",
    "description": (
        "Validate code against the Universal Development Codex (60 error-prevention terms). "
        "Checks error-handling, type-safety, performance, security, and architecture patterns. "
        "Use when you want to verify code quality against systematic standards."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Code snippet to validate against codex rules",
            },
            "operation": {
                "type": "string",
                "description": "What operation the code performs (create, modify, refactor)",
            },
            "focus_areas": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["error-handling", "type-safety", "performance", "security", "architecture"],
                },
                "description": "Specific codex areas to focus on",
            },
        },
        "required": ["operation"],
    },
}

STRRAY_HEALTH = {
    "name": "strray_health",
    "description": (
        "Run StringRay framework health check. Returns version, agent count, "
        "MCP server status, and enforcement statistics. Use to verify the "
        "StringRay integration is working correctly."
    ),
    "parameters": {
        "type": "object",
        "properties": {},
    },
}

STRRAY_HOOKS = {
    "name": "strray_hooks",
    "description": (
        "Manage StringRay git hooks (install, uninstall, list, status). "
        "Installs pre-commit, post-commit, pre-push, and post-push hooks "
        "that run TypeScript validation, Codex checks, and monitoring. "
        "Use 'install' to set up all hooks, 'list' to see current status."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["install", "uninstall", "list", "status"],
                "description": "Action to perform on git hooks",
            },
            "hooks": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["pre-commit", "post-commit", "pre-push", "post-push"],
                },
                "description": "Specific hooks to manage (default: all)",
            },
        },
        "required": ["action"],
    },
}
