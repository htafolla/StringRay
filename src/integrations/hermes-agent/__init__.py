"""StringRay Hermes Plugin — full framework pipeline integration.

Mirrors the OpenCode strray-codex-injection.ts behavior:
  1. Captures ALL tool calls and logs to disk
  2. Runs quality gates on code-producing tools
  3. Runs pre/post processors via Node.js bridge
  4. Persists activity to activity.log + plugin-tool-events.log
  5. Tracks session statistics

Bridge protocol: JSON over stdin/stdout to bridge.mjs (Node.js).
"""

import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from . import schemas, tools
except ImportError:
    # Standalone import (e.g., pytest discovery) — modules loaded separately
    import importlib
    import types
    _pkg_dir = Path(__file__).resolve().parent
    sys.path.insert(0, str(_pkg_dir))
    schemas = importlib.import_module("schemas")
    tools = importlib.import_module("tools")

logger = logging.getLogger("strray-hermes")

# ── Paths ─────────────────────────────────────────────────────

PLUGIN_DIR = Path(__file__).resolve().parent
BRIDGE_PATH = PLUGIN_DIR / "bridge.mjs"

# Project root: find the StringRay project directory
# The plugin lives at ~/.hermes/plugins/ which is NOT inside any project tree,
# so walking up from PLUGIN_DIR will never find the project. Instead:
#   1. Check STRRAY_PROJECT_ROOT env var (explicit override)
#   2. Walk up from cwd looking for node_modules/strray-ai (consumer install)
#   3. Walk up from cwd looking for .opencode/strray/features.json (dev repo)
#   4. Walk up from cwd looking for package.json (skip home dir)
def _find_project_root():
    env_root = os.environ.get("STRRAY_PROJECT_ROOT") or os.environ.get("HERMES_PROJECT_ROOT")
    if env_root:
        p = Path(env_root).resolve()
        if p.is_dir():
            return p

    cwd = Path.cwd()
    home = Path.home()

    # Walk up from cwd
    d = cwd
    for _ in range(20):
        # node_modules/strray-ai — consumer install marker
        if (d / "node_modules" / "strray-ai" / "package.json").exists():
            return d
        # .opencode/strray — dev repo marker
        if (d / ".opencode" / "strray" / "features.json").exists():
            return d
        # package.json but not home dir
        if d != home and (d / "package.json").exists():
            return d
        d = d.parent
        if d == d.parent:
            break

    return cwd

PROJECT_ROOT = _find_project_root()
LOG_DIR = PROJECT_ROOT / "logs" / "framework"

# ── Constants ─────────────────────────────────────────────────

# Tools that produce/modify code — these get the full pipeline
_CODE_TOOLS = {"write_file", "patch", "execute_code", "write", "edit"}

# Tools where StringRay has a better alternative
# terminal: only nudge when the command looks lint/security/search related
_BETTER_WITH_STRRAY = {
    "search_files": "Use mcp_strray_researcher_search_codebase for code pattern searches",
}

# Patterns that suggest the terminal command should use an MCP tool instead
_TERMINAL_NUDGE_PATTERNS = {
    "grep": "Use mcp_strray_researcher_search_codebase instead of grep",
    "rg ": "Use mcp_strray_researcher_search_codebase instead of ripgrep",
    "eslint": "Use mcp_strray_lint_lint instead of raw eslint",
    "npx eslint": "Use mcp_strray_lint_lint instead of raw eslint",
    "npm audit": "Use mcp_strray_security_scan_security_scan instead of npm audit",
    "yarn audit": "Use mcp_strray_security_scan_security_scan instead of yarn audit",
    "find ": "Use search_files(target='files') instead of find",
    "sed ": "Use patch tool instead of sed",
    "awk ": "Use patch tool instead of awk",
}

# ── Session stats ─────────────────────────────────────────────

_session_stats = {
    "started_at": None,
    "session_id": None,
    "code_operations": 0,
    "total_tool_calls": 0,
    "strray_mcp_calls": 0,
    "native_tool_calls": 0,
    "quality_gate_runs": 0,
    "quality_gate_blocks": 0,
    "pre_processor_runs": 0,
    "post_processor_runs": 0,
    "bridge_calls": 0,
    "bridge_errors": 0,
}

# ── File logging ──────────────────────────────────────────────

def _ensure_log_dir():
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def _log_to_file(filename, message):
    """Append a timestamped line to a log file in logs/framework/."""
    try:
        _ensure_log_dir()
        log_path = LOG_DIR / filename
        timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        entry = f"{timestamp} {message}\n"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(entry)
    except OSError:
        pass  # never break the agent over logging


def _log_tool_event(event_type, tool, args=None, duration=0, error=None):
    """Log tool events in the same format as the OpenCode plugin."""
    import random
    job_id = f"plugin-{int(datetime.now(timezone.utc).timestamp() * 1000)}-{random.randint(100000, 999999)}"
    if event_type == "start":
        args_keys = list((args or {}).keys())
        msg = f"[{job_id}] [agent] tool-started - INFO | {{\"tool\":\"{tool}\",\"args\":{json.dumps(args_keys)}}}"
    else:
        level = "ERROR" if error else "SUCCESS"
        err_part = f",\"error\":\"{error}\"" if error else ""
        msg = f"[{job_id}] [agent] tool-complete - {level} | {{\"tool\":\"{tool}\",\"duration\":{duration}{err_part}}}"
    _log_to_file("plugin-tool-events.log", msg)


# ── Bridge calls ──────────────────────────────────────────────

def _call_bridge(command: dict, timeout: int = 10) -> dict:
    """Call bridge.mjs with a JSON command, return parsed response."""
    _session_stats["bridge_calls"] += 1
    try:
        result = subprocess.run(
            ["node", str(BRIDGE_PATH), "--cwd", str(PROJECT_ROOT)],
            input=json.dumps(command),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            _session_stats["bridge_errors"] += 1
            return {"error": result.stderr[:300] if result.stderr else "bridge failed"}
        return json.loads(result.stdout)
    except FileNotFoundError:
        _session_stats["bridge_errors"] += 1
        return {"error": "node not found"}
    except subprocess.TimeoutExpired:
        _session_stats["bridge_errors"] += 1
        return {"error": f"bridge timed out after {timeout}s"}
    except (json.JSONDecodeError, OSError) as e:
        _session_stats["bridge_errors"] += 1
        return {"error": str(e)}


# ── Hook: pre_tool_call ───────────────────────────────────────

def _is_strray_mcp(tool_name: str) -> bool:
    return tool_name.startswith("mcp_strray_")


def _on_pre_tool_call(tool_name: str, args: dict, task_id: str, **kwargs):
    """Fires before ANY tool executes.

    Pipeline:
      1. Track stats
      2. Log tool-start event to disk
      3. For code-producing tools: run quality gate + pre-processors via bridge
      4. For non-code tools: nudge if StringRay alternative exists
    """
    _session_stats["total_tool_calls"] += 1

    # Log start event
    _log_tool_event("start", tool_name, args)

    # StringRay MCP tools — track but don't interfere
    if _is_strray_mcp(tool_name):
        _session_stats["strray_mcp_calls"] += 1
        _log_to_file("activity.log", f"[quality-gate] SKIP (strray-mcp): {tool_name}")
        return

    _session_stats["native_tool_calls"] += 1

    # Code-producing tools get the full pipeline
    if tool_name in _CODE_TOOLS:
        _session_stats["code_operations"] += 1

        # Extract file path for logging
        file_path = None
        if isinstance(args, dict):
            file_path = args.get("path") or args.get("filePath")

        _log_to_file("activity.log",
            f"[pre-tool] CODE OPERATION: tool={tool_name} file={file_path}")

        # Run quality gate via bridge
        _session_stats["quality_gate_runs"] += 1
        bridge_result = _call_bridge({
            "command": "pre-process",
            "tool": tool_name,
            "args": args or {},
        }, timeout=15)

        if "error" not in bridge_result:
            quality = bridge_result.get("qualityGate", {})
            processors = bridge_result.get("processors", {})

            # Log quality gate results
            if quality.get("passed") is False:
                violations = quality.get("violations", [])
                _session_stats["quality_gate_blocks"] += 1
                violation_msg = "; ".join(violations)
                _log_to_file("activity.log",
                    f"[quality-gate] BLOCKED: tool={tool_name} violations={violation_msg}")
                logger.warning(
                    "[strray] Quality gate BLOCKED %s: %s",
                    tool_name, violation_msg,
                )
            else:
                _log_to_file("activity.log",
                    f"[quality-gate] PASSED: tool={tool_name}")

            # Log processor results
            if processors.get("ran"):
                _session_stats["pre_processor_runs"] += 1
                success = processors.get("success", True)
                count = processors.get("processorCount", 0)
                _log_to_file("activity.log",
                    f"[pre-processors] {'SUCCESS' if success else 'FAILED'}: "
                    f"{count} processors for {tool_name}")
                if processors.get("details"):
                    for detail in processors["details"]:
                        status = "OK" if detail.get("success") else f"FAILED: {detail.get('error')}"
                        _log_to_file("activity.log",
                            f"[pre-processor] {detail.get('name', 'unknown')}: {status}")
        else:
            _log_to_file("activity.log",
                f"[bridge] ERROR in pre-process: {bridge_result.get('error', 'unknown')}")
        return

    # Non-code tools: nudge for StringRay alternatives
    if tool_name in _BETTER_WITH_STRRAY:
        tip = _BETTER_WITH_STRRAY[tool_name]
        logger.info("[strray] Tip: %s — %s", tool_name, tip)
        _log_to_file("activity.log",
            f"[nudge] {tool_name}: {tip}")

    # Terminal: smart nudge based on command content
    if tool_name == "terminal" and isinstance(args, dict):
        cmd = args.get("command", "")
        if isinstance(cmd, str):
            for pattern, tip in _TERMINAL_NUDGE_PATTERNS.items():
                if pattern in cmd:
                    logger.info("[strray] Tip: %s — %s", tool_name, tip)
                    _log_to_file("activity.log",
                        f"[nudge] {tool_name}: {tip}")
                    break


# ── Hook: post_tool_call ──────────────────────────────────────

def _on_post_tool_call(tool_name: str, args: dict, result, task_id: str, **kwargs):
    """Fires after ANY tool returns.

    Pipeline:
      1. Log tool-complete event to disk
      2. Extract file info from write/patch operations
      3. For code-producing tools: run post-processors via bridge
      4. Track file modifications for session context
    """
    duration = 0

    # Extract file path — BUG FIX: only when path key exists with truthy value
    file_path = None
    if isinstance(args, dict) and tool_name in ("write_file", "patch"):
        file_path = args.get("path")
        if not file_path:
            # No path key or empty string — skip file logging
            pass

    # Extract duration from result if available
    if isinstance(result, dict):
        duration = result.get("duration", 0)

    # Log completion event
    error = None
    if isinstance(result, dict) and result.get("error"):
        error = result["error"]
    _log_tool_event("complete", tool_name, args, duration, error)

    # Track file modifications
    if file_path:
        _log_to_file("activity.log",
            f"[post-tool] file-written: tool={tool_name} path={file_path}")

    # Code-producing tools get post-processors
    if tool_name in _CODE_TOOLS:
        # Run post-processors via bridge
        bridge_result = _call_bridge({
            "command": "post-process",
            "tool": tool_name,
            "args": args or {},
            "result": result,
            "error": error,
        }, timeout=15)

        if "error" not in bridge_result:
            processors = bridge_result.get("processors", {})
            if processors.get("ran"):
                _session_stats["post_processor_runs"] += 1
                success = processors.get("success", True)
                count = processors.get("processorCount", 0)
                _log_to_file("activity.log",
                    f"[post-processors] {'SUCCESS' if success else 'FAILED'}: "
                    f"{count} processors for {tool_name}")
                if processors.get("details"):
                    for detail in processors["details"]:
                        status = "OK" if detail.get("success") else f"FAILED: {detail.get('error')}"
                        _log_to_file("activity.log",
                            f"[post-processor] {detail.get('name', 'unknown')}: {status}")
        else:
            _log_to_file("activity.log",
                f"[bridge] ERROR in post-process: {bridge_result.get('error', 'unknown')}")


# ── Hook: session_start ───────────────────────────────────────

def _on_session_start(session_id: str, platform: str, **kwargs):
    """Fires when a new session starts. Resets stats, logs to disk."""
    _session_stats["started_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    _session_stats["session_id"] = session_id
    for key in ("code_operations", "total_tool_calls", "strray_mcp_calls",
                "native_tool_calls", "quality_gate_runs", "quality_gate_blocks",
                "pre_processor_runs", "post_processor_runs",
                "bridge_calls", "bridge_errors"):
        _session_stats[key] = 0

    _ensure_log_dir()
    _log_to_file("activity.log",
        f"[session-start] session={session_id} platform={platform}")
    logger.info("[strray] Session %s started on %s", session_id, platform)


# ── Slash command ─────────────────────────────────────────────

def _strray_command(args: str) -> str:
    """Slash command handler: /strray [status|stats|help]"""
    cmd = (args or "status").strip().lower()

    if cmd == "stats":
        return (
            f"StringRay Session Stats\n"
            f"  Session: {_session_stats['session_id'] or 'N/A'}\n"
            f"  Started: {_session_stats['started_at'] or 'N/A'}\n"
            f"  Tool calls: {_session_stats['total_tool_calls']}\n"
            f"  Code operations: {_session_stats['code_operations']}\n"
            f"  StringRay MCP: {_session_stats['strray_mcp_calls']}\n"
            f"  Native tools: {_session_stats['native_tool_calls']}\n"
            f"  Quality gate runs: {_session_stats['quality_gate_runs']}\n"
            f"  Quality gate blocks: {_session_stats['quality_gate_blocks']}\n"
            f"  Pre-processor runs: {_session_stats['pre_processor_runs']}\n"
            f"  Post-processor runs: {_session_stats['post_processor_runs']}\n"
            f"  Bridge calls: {_session_stats['bridge_calls']}\n"
            f"  Bridge errors: {_session_stats['bridge_errors']}"
        )

    if cmd == "help":
        return (
            "StringRay Commands:\n"
            "  /strray status — Plugin and framework health\n"
            "  /strray stats  — Session pipeline statistics\n"
            "  /strray help   — This message"
        )

    # Default: status (calls bridge health)
    bridge_result = _call_bridge({"command": "health"}, timeout=10)
    if "error" in bridge_result:
        return f"StringRay plugin loaded. Bridge: {bridge_result['error']}"

    return (
        f"StringRay Hermes Plugin Status\n"
        f"  Framework: {bridge_result.get('framework', 'unknown')}\n"
        f"  Version: {bridge_result.get('version', 'unknown')}\n"
        f"  Quality Gate: {'ready' if bridge_result.get('components', {}).get('qualityGate') else 'not loaded'}\n"
        f"  Processors: {'ready' if bridge_result.get('components', {}).get('processorManager') else 'not loaded'}\n"
        f"  Project: {bridge_result.get('projectRoot', 'unknown')}\n"
        f"  Bridge calls: {_session_stats['bridge_calls']} (errors: {_session_stats['bridge_errors']})"
    )


# ── Registration ──────────────────────────────────────────────

def register(ctx):
    """Wire schemas to handlers and register lifecycle hooks."""
    # ── Register tools ────────────────────────────────────────
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

    # ── Register hooks ────────────────────────────────────────
    ctx.register_hook("pre_tool_call", _on_pre_tool_call)
    ctx.register_hook("post_tool_call", _on_post_tool_call)

    # Try to register session hooks
    try:
        ctx.register_hook("on_session_start", _on_session_start)
    except (AttributeError, TypeError):
        logger.debug("[strray] on_session_start hook not yet available")

    # ── Register slash command ────────────────────────────────
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

    # ── Bootstrap ─────────────────────────────────────────────
    _ensure_log_dir()
    _log_to_file("activity.log",
        f"[plugin-loaded] StringRay Hermes Plugin v2.0 — "
        f"3 tools, 2 hooks, bridge={BRIDGE_PATH.exists()}")

    logger.info(
        "[strray] Plugin v2.0 loaded: 3 tools, 2 hooks, "
        "bridge=%s — full framework pipeline active",
        BRIDGE_PATH.exists(),
    )
