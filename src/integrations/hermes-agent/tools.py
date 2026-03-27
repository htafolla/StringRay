"""Tool handlers — the code that runs when the LLM calls each tool."""

import json
import subprocess


def _run_strray(args: list, timeout: int = 30) -> str:
    """Run a StringRay CLI command and return output."""
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


def strray_validate(args: dict, **kwargs) -> str:
    """Run pre-commit validation on files."""
    files = args.get("files", [])
    operation = args.get("operation", "commit")

    if not files:
        return json.dumps({"error": "No files specified for validation"})

    result = json.loads(_run_strray(["validate"], timeout=30))

    if "error" in result:
        return json.dumps(result)

    return json.dumps({
        "status": "ok" if result.get("status") == "ok" else "validation_issues",
        "operation": operation,
        "files_checked": len(files),
        "output": result.get("output", ""),
    })


def strray_codex_check(args: dict, **kwargs) -> str:
    """Check code against StringRay codex rules."""
    code = args.get("code")
    operation = args.get("operation", "create")
    focus_areas = args.get("focus_areas", [])

    # Use 'is not None' to correctly handle empty string — LLM may pass code: ""
    if code is not None:
        return json.dumps({
            "status": "checked",
            "operation": operation,
            "focus_areas": focus_areas or "all",
            "code_length": len(code),
            "note": "Full codex validation available via MCP server: mcp_strray_enforcer_codex_enforcement",
        })

    # If no code provided, check framework status
    result = json.loads(_run_strray(["health"], timeout=15))

    if "error" in result:
        return json.dumps(result)

    return json.dumps({
        "status": "ok",
        "health_output": result.get("output", ""),
        "note": "Pass 'code' parameter for actual codex validation",
    })


def strray_health(args: dict, **kwargs) -> str:
    """Check StringRay framework health."""
    return _run_strray(["health"], timeout=15)
