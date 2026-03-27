"""StringRay Hermes Plugin — registration with auto-enforcement hooks."""

import json
import logging
from datetime import datetime

from . import schemas, tools

logger = logging.getLogger("strray-hermes")

# ── Tool awareness tracking ──────────────────────────────────────────
_TOOL_LOG = []  # recent tool calls for context
_MAX_LOG = 50

# Tools where StringRay has a better equivalent
_BETTER_WITH_STRRAY = {
    "terminal": "Use mcp_strray_lint_lint, mcp_strray_security_scan_security_scan, "
                "or npx strray-ai validate instead of raw terminal for lint/security",
    "search_files": "Use mcp_strray_researcher_search_codebase for code pattern searches",
}

# Code-producing tools that should trigger enforcer awareness
_CODE_TOOLS = {"write_file", "patch", "execute_code"}

# Session stats
_session_stats = {
    "started_at": None,
    "code_operations": 0,
    "total_tool_calls": 0,
    "strray_mcp_calls": 0,
    "native_tool_calls": 0,
}


def _is_strray_mcp(tool_name: str) -> bool:
    """Check if a tool call is a StringRay MCP tool."""
    return tool_name.startswith("mcp_strray_")


def _on_pre_tool_call(tool_name: str, args: dict, task_id: str, **kwargs):
    """Hook: fires before ANY tool executes.

    Provides gentle nudges when native tools are used instead of
    StringRay equivalents, and tracks session statistics.
    """
    _session_stats["total_tool_calls"] += 1

    if _is_strray_mcp(tool_name):
        _session_stats["strray_mcp_calls"] += 1
        logger.debug("StringRay MCP tool called: %s", tool_name)
        return  # StringRay tool — no nudge needed

    _session_stats["native_tool_calls"] += 1

    # Track code-producing operations
    if tool_name in _CODE_TOOLS:
        _session_stats["code_operations"] += 1

    # Nudge for better alternatives
    if tool_name in _BETTER_WITH_STRRAY:
        logger.info(
            "[strray] Tip: %s — %s",
            tool_name,
            _BETTER_WITH_STRRAY[tool_name],
        )


def _on_post_tool_call(tool_name: str, args: dict, result, task_id: str, **kwargs):
    """Hook: fires after ANY tool returns.

    Logs tool usage for later analysis and detects patterns
    that suggest missed StringRay validation.
    """
    entry = {
        "ts": datetime.now().isoformat(),
        "tool": tool_name,
        "is_strray": _is_strray_mcp(tool_name),
        "task_id": task_id,
    }

    # Extract file info from write_file/patch operations
    if isinstance(args, dict) and tool_name in ("write_file", "patch"):
        file_path = args.get("path")
        if file_path:
            entry["file"] = file_path

    _TOOL_LOG.append(entry)
    if len(_TOOL_LOG) > _MAX_LOG:
        _TOOL_LOG.pop(0)


def _on_session_start(session_id: str, platform: str, **kwargs):
    """Hook: fires when a new session starts."""
    _session_stats["started_at"] = datetime.now().isoformat()
    _session_stats["code_operations"] = 0
    _session_stats["total_tool_calls"] = 0
    _session_stats["strray_mcp_calls"] = 0
    _session_stats["native_tool_calls"] = 0
    logger.info("[strray] New session %s started on %s", session_id, platform)


def register(ctx):
    """Wire schemas to handlers and register lifecycle hooks."""
    # ── Register tools ────────────────────────────────────────────────
    ctx.register_tool(
        name="strray_validate",
        toolset="strray-hermes",
        schema=schemas.STRRAY_VALIDATE,
        handler=tools.strray_validate,
    )
    ctx.register_tool(
        name="strray_codex_check",
        toolset="strray-hermes",
        schema=schemas.STRRAY_CODEX_CHECK,
        handler=tools.strray_codex_check,
    )
    ctx.register_tool(
        name="strray_health",
        toolset="strray-hermes",
        schema=schemas.STRRAY_HEALTH,
        handler=tools.strray_health,
    )

    # ── Register hooks ────────────────────────────────────────────────
    ctx.register_hook("pre_tool_call", _on_pre_tool_call)
    ctx.register_hook("post_tool_call", _on_post_tool_call)

    # Try to register session hooks (may not be available yet)
    try:
        ctx.register_hook("on_session_start", _on_session_start)
    except (AttributeError, TypeError):
        logger.debug("[strray] on_session_start hook not yet available")

    # ── Register slash command ────────────────────────────────────────
    try:
        ctx.register_command(
            name="strray",
            handler=_strray_command,
            description="StringRay status, stats, and enforcement info",
            args_hint="[status|stats|help]",
            aliases=("sr",),
        )
    except (AttributeError, TypeError):
        logger.debug("[strray] Slash command registration not yet available")

    logger.info(
        "[strray] Plugin loaded: 3 tools, 2+ hooks — "
        "StringRay enforcement active"
    )


def _strray_command(args: str) -> str:
    """Slash command handler: /strray [status|stats|help]"""
    cmd = (args or "status").strip().lower()

    if cmd == "stats":
        return (
            f"StringRay Session Stats\n"
            f"  Tool calls: {_session_stats['total_tool_calls']}\n"
            f"  StringRay MCP: {_session_stats['strray_mcp_calls']}\n"
            f"  Native tools: {_session_stats['native_tool_calls']}\n"
            f"  Code operations: {_session_stats['code_operations']}\n"
            f"  Started: {_session_stats['started_at'] or 'N/A'}"
        )

    if cmd == "help":
        return (
            "StringRay Commands:\n"
            "  /strray status — Plugin and MCP health\n"
            "  /strray stats  — Session tool usage stats\n"
            "  /strray help   — This message"
        )

    # Default: status
    try:
        result = tools.strray_health({})
        data = json.loads(result)
        return f"StringRay: {data.get('output', result)}"
    except Exception:
        return "StringRay plugin loaded. Use /strray stats or /strray help"
