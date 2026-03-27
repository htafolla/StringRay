"""Tool handlers — code that runs when the LLM calls each tool.

v2.0: Now uses the Node.js bridge for real framework integration.
Falls back to CLI (npx strray-ai) when bridge is unavailable.
"""

import json
import subprocess
import sys
from pathlib import Path

# ── Bridge path ───────────────────────────────────────────────

PLUGIN_DIR = Path(__file__).resolve().parent
BRIDGE_PATH = PLUGIN_DIR / "bridge.mjs"


def _find_project_root():
    d = PLUGIN_DIR
    for _ in range(6):
        if (d / "package.json").exists():
            return d
    return Path.cwd()

PROJECT_ROOT = _find_project_root()


# ── Bridge helper ─────────────────────────────────────────────

def _call_bridge(command: dict, timeout: int = 30) -> dict:
    """Call bridge.mjs via Node.js, return parsed JSON response."""
    try:
        result = subprocess.run(
            ["node", str(BRIDGE_PATH), "--cwd", str(PROJECT_ROOT)],
            input=json.dumps(command),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            stderr = result.stderr[:300] if result.stderr else "unknown"
            return {"error": stderr}
        return json.loads(result.stdout)
    except FileNotFoundError:
        return {"error": "node not found"}
    except subprocess.TimeoutExpired:
        return {"error": f"timed out after {timeout}s"}
    except (json.JSONDecodeError, OSError) as e:
        return {"error": str(e)}


def _run_strray(args: list, timeout: int = 30) -> str:
    """Fallback: run a StringRay CLI command and return output."""
    try:
        result = subprocess.run(
            ["npx", "strray-ai"] + args,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode == 0:
            return json.dumps({"status": "ok", "output": result.stdout.strip()})
        return json.dumps({
            "status": "error",
            "exit_code": result.returncode,
            "stderr": result.stderr.strip() if result.stderr else result.stdout.strip(),
        })
    except FileNotFoundError:
        return json.dumps({"error": "strray-ai not found. Run: npm install -g strray-ai"})
    except subprocess.TimeoutExpired:
        return json.dumps({"error": f"Command timed out after {timeout}s"})
    except Exception as e:
        return json.dumps({"error": str(e)})


# ── Tool: strray_validate ─────────────────────────────────────

def strray_validate(args: dict, **kwargs) -> str:
    """Run pre-commit validation on files using the framework.

    Uses bridge for real quality gate + processor pipeline.
    Falls back to CLI if bridge unavailable.
    """
    files = args.get("files", [])
    operation = args.get("operation", "commit")

    if not files:
        return json.dumps({"error": "No files specified for validation"})

    # Try bridge first (real framework integration)
    bridge_result = _call_bridge({
        "command": "validate",
        "files": files,
        "operation": operation,
    }, timeout=30)

    if "error" not in bridge_result:
        return json.dumps({
            "status": "passed" if bridge_result.get("passed") else "violations",
            "operation": operation,
            "files_checked": len(files),
            "file_results": bridge_result.get("fileResults", []),
            "via": "bridge",
        })

    # Fallback to CLI
    result = json.loads(_run_strray(["validate"], timeout=30))
    if "error" in result:
        return json.dumps(result)

    return json.dumps({
        "status": "ok" if result.get("status") == "ok" else "validation_issues",
        "operation": operation,
        "files_checked": len(files),
        "output": result.get("output", ""),
        "via": "cli",
    })


# ── Tool: strray_codex_check ──────────────────────────────────

def strray_codex_check(args: dict, **kwargs) -> str:
    """Check code against StringRay codex rules.

    Uses bridge for real quality gate codex checks.
    Falls back to CLI if bridge unavailable.
    """
    code = args.get("code")
    operation = args.get("operation", "create")
    focus_areas = args.get("focus_areas", [])

    # Use 'is not None' to correctly handle empty string
    if code is not None:
        # Try bridge for real codex checking
        bridge_result = _call_bridge({
            "command": "codex-check",
            "code": code,
            "focusAreas": focus_areas,
        }, timeout=15)

        if "error" not in bridge_result:
            return json.dumps({
                "status": "passed" if bridge_result.get("passed") else "violations",
                "operation": operation,
                "focus_areas": focus_areas or "all",
                "code_length": len(code),
                "violations": bridge_result.get("violations", []),
                "checks": bridge_result.get("checks", []),
                "via": "bridge",
            })

        # Bridge unavailable — fall back to static analysis
        return json.dumps({
            "status": "checked",
            "operation": operation,
            "focus_areas": focus_areas or "all",
            "code_length": len(code),
            "note": "Bridge unavailable — basic analysis only. "
                   "Full codex validation available via MCP: mcp_strray_enforcer_codex_enforcement",
            "via": "static",
        })

    # No code provided — check framework health
    bridge_result = _call_bridge({"command": "health"}, timeout=10)
    if "error" not in bridge_result:
        return json.dumps({
            "status": "ok",
            "framework": bridge_result.get("framework"),
            "version": bridge_result.get("version"),
            "components": bridge_result.get("components"),
            "note": "Pass 'code' parameter for actual codex validation",
            "via": "bridge",
        })

    result = json.loads(_run_strray(["health"], timeout=15))
    if "error" in result:
        return json.dumps(result)

    return json.dumps({
        "status": "ok",
        "health_output": result.get("output", ""),
        "note": "Pass 'code' parameter for actual codex validation",
        "via": "cli",
    })


# ── Tool: strray_health ───────────────────────────────────────

def strray_health(args: dict, **kwargs) -> str:
    """Check StringRay framework health via bridge.

    Returns framework status, loaded components, version.
    """
    bridge_result = _call_bridge({"command": "health"}, timeout=10)
    if "error" not in bridge_result:
        return json.dumps({
            "status": "ok",
            "framework": bridge_result.get("framework"),
            "version": bridge_result.get("version"),
            "project_root": bridge_result.get("projectRoot"),
            "components": bridge_result.get("components"),
            "node_version": bridge_result.get("nodeVersion"),
            "via": "bridge",
        })

    # Fallback to CLI
    return _run_strray(["health"], timeout=15)
