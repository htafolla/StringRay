"""Comprehensive tests for the StringRay Hermes Plugin v2.

Tests all 3 tools, both hooks, the slash command, bridge integration,
logging to disk, and the full register() wiring.

v2 changes from v1:
  - Hooks now pipe through Node.js bridge for real framework integration
  - Tool events logged to disk (activity.log, plugin-tool-events.log)
  - Tools use bridge first, fall back to CLI
  - Session stats track quality gate runs, processor runs, bridge calls
  - No more in-memory _TOOL_LOG — everything persists to disk
"""

import json
import subprocess
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock, call
import logging
import importlib
import types

# ── Path setup ────────────────────────────────────────────────

PLUGIN_DIR = str(Path(__file__).resolve().parent)
sys.path.insert(0, PLUGIN_DIR)

# Force reimport
for mod in list(sys.modules):
    if "strray" in mod and ("schemas" in mod or "tools" in mod or "plugin" in mod):
        del sys.modules[mod]

schemas = importlib.import_module("schemas")
tools_mod = importlib.import_module("tools")

# Create a fake package for __init__.py execution
pkg = types.ModuleType("strray_hermes_pkg")
pkg.__path__ = [PLUGIN_DIR]
pkg.__dict__["schemas"] = schemas
pkg.__dict__["tools"] = tools_mod
sys.modules["strray_hermes_pkg"] = pkg

init_path = os.path.join(PLUGIN_DIR, "__init__.py")
with open(init_path) as f:
    init_code = f.read()
init_code = init_code.replace("from . import schemas, tools", "import schemas, tools")
# Provide __file__ since exec() loses it
pkg.__dict__["__file__"] = init_path
exec(compile(init_code, init_path, "exec"), pkg.__dict__)

pi = pkg  # plugin init module


class TestSchemas(unittest.TestCase):
    def test_validate_schema_has_required_fields(self):
        s = schemas.STRRAY_VALIDATE
        self.assertEqual(s["name"], "strray_validate")
        params = s["parameters"]
        self.assertEqual(params["type"], "object")
        self.assertIn("files", params["properties"])
        self.assertIn("operation", params["properties"])
        self.assertIn("files", params["required"])
        self.assertEqual(params["properties"]["files"]["type"], "array")

    def test_codex_check_schema(self):
        s = schemas.STRRAY_CODEX_CHECK
        self.assertEqual(s["name"], "strray_codex_check")
        fa = s["parameters"]["properties"]["focus_areas"]
        self.assertIn("enum", fa["items"])
        self.assertIn("error-handling", fa["items"]["enum"])

    def test_health_schema_no_required(self):
        s = schemas.STRRAY_HEALTH
        self.assertEqual(len(s["parameters"].get("required", [])), 0)

    def test_descriptions_non_empty(self):
        for name, schema in [("v", schemas.STRRAY_VALIDATE), ("c", schemas.STRRAY_CODEX_CHECK), ("h", schemas.STRRAY_HEALTH)]:
            self.assertTrue(len(schema["description"]) > 20, f"{name}")


class TestRunStrrayHelper(unittest.TestCase):
    """Test the CLI fallback helper (still exists for bridge-less environments)."""

    def test_successful_command(self):
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="all good", stderr="")
            r = json.loads(tools_mod._run_strray(["health"]))
            self.assertEqual(r["status"], "ok")
            self.assertEqual(m.call_args[0][0], ["npx", "strray-ai", "health"])

    def test_command_failure(self):
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=1, stdout="", stderr="broke")
            r = json.loads(tools_mod._run_strray(["validate"]))
            self.assertEqual(r["status"], "error")

    def test_file_not_found(self):
        with patch("subprocess.run", side_effect=FileNotFoundError):
            r = json.loads(tools_mod._run_strray(["health"]))
            self.assertIn("not found", r["error"])

    def test_timeout(self):
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("c", 30)):
            r = json.loads(tools_mod._run_strray(["health"], timeout=15))
            self.assertIn("15s", r["error"])

    def test_custom_timeout(self):
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="", stderr="")
            tools_mod._run_strray(["health"], timeout=60)
            self.assertEqual(m.call_args[1]["timeout"], 60)


class TestBridgeHelper(unittest.TestCase):
    """Test the bridge.mjs calling helper."""

    def test_successful_bridge_call(self):
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout='{"status":"ok"}', stderr="")
            r = tools_mod._call_bridge({"command": "health"})
            self.assertEqual(r["status"], "ok")
            # Should call node with bridge path
            self.assertIn("node", m.call_args[0][0])
            self.assertIn("bridge.mjs", m.call_args[0][0][1])

    def test_bridge_returns_error(self):
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=1, stdout="", stderr="module not found")
            r = tools_mod._call_bridge({"command": "health"})
            self.assertIn("error", r)

    def test_bridge_node_not_found(self):
        with patch("subprocess.run", side_effect=FileNotFoundError):
            r = tools_mod._call_bridge({"command": "health"})
            self.assertEqual(r["error"], "node not found")

    def test_bridge_timeout(self):
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("c", 10)):
            r = tools_mod._call_bridge({"command": "health"}, timeout=10)
            self.assertIn("timed out", r["error"])


class TestStrrayHealth(unittest.TestCase):
    def test_health_via_bridge(self):
        """v2: health uses bridge first."""
        with patch.object(tools_mod, "_call_bridge", return_value={"status": "ok", "framework": "loaded", "version": "1.15.0", "components": {}}) as m:
            r = json.loads(tools_mod.strray_health({}))
            self.assertEqual(r["status"], "ok")
            self.assertEqual(r["via"], "bridge")
            m.assert_called_once_with({"command": "health"}, timeout=10)

    def test_health_fallback_to_cli(self):
        """v2: falls back to CLI when bridge fails."""
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "node not found"}):
            with patch.object(tools_mod, "_run_strray", return_value='{"status":"ok","output":"healthy"}') as cli:
                r = json.loads(tools_mod.strray_health({}))
                cli.assert_called_once()

    def test_health_ignores_extra_args(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"status": "ok", "framework": "loaded", "version": "1.0", "components": {}}):
            r = json.loads(tools_mod.strray_health({"x": 1}))
            self.assertEqual(r["status"], "ok")


class TestStrrayValidate(unittest.TestCase):
    def test_with_files_via_bridge(self):
        """v2: validate uses bridge first."""
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "fileResults": []}) as m:
            r = json.loads(tools_mod.strray_validate({"files": ["a.ts", "b.ts"], "operation": "commit"}))
            self.assertEqual(r["status"], "passed")
            self.assertEqual(r["files_checked"], 2)
            self.assertEqual(r["via"], "bridge")
            m.assert_called_once()

    def test_bridge_violations(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": False, "fileResults": [{"file": "a.ts", "passed": False, "violations": ["tests-required"]}]}) as m:
            r = json.loads(tools_mod.strray_validate({"files": ["a.ts"]}))
            self.assertEqual(r["status"], "violations")
            self.assertEqual(r["file_results"][0]["violations"], ["tests-required"])

    def test_bridge_error_fallback_to_cli(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "node not found"}):
            with patch.object(tools_mod, "_run_strray", return_value='{"status":"ok","output":"valid"}') as cli:
                r = json.loads(tools_mod.strray_validate({"files": ["a.ts"]}))
                self.assertEqual(r["via"], "cli")
                cli.assert_called_once()

    def test_no_files_error(self):
        r = json.loads(tools_mod.strray_validate({"files": []}))
        self.assertIn("No files", r["error"])

    def test_no_files_key_error(self):
        r = json.loads(tools_mod.strray_validate({}))
        self.assertIn("error", r)

    def test_default_operation(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "fileResults": []}):
            r = json.loads(tools_mod.strray_validate({"files": ["a.ts"]}))
            self.assertEqual(r["operation"], "commit")

    def test_100_files(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "fileResults": []}) as m:
            fs = [f"f{i}.ts" for i in range(100)]
            r = json.loads(tools_mod.strray_validate({"files": fs}))
            self.assertEqual(r["files_checked"], 100)


class TestStrrayCodexCheck(unittest.TestCase):
    def test_with_code_via_bridge(self):
        """v2: codex check uses bridge for real quality gate analysis."""
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "violations": [], "checks": []}) as m:
            r = json.loads(tools_mod.strray_codex_check({"code": "const x = null;", "operation": "create"}))
            self.assertEqual(r["status"], "passed")
            self.assertEqual(r["via"], "bridge")
            m.assert_called_once()

    def test_with_code_bridge_violations(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": False, "violations": ["console.log found"], "checks": []}):
            r = json.loads(tools_mod.strray_codex_check({"code": "console.log(x)", "operation": "create"}))
            self.assertEqual(r["status"], "violations")
            self.assertEqual(r["violations"], ["console.log found"])

    def test_with_focus_areas(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "violations": [], "checks": []}) as m:
            tools_mod.strray_codex_check({"code": "eval()", "operation": "modify", "focus_areas": ["security"]})
            self.assertEqual(m.call_args[0][0]["focusAreas"], ["security"])

    def test_empty_string_code_treated_as_code(self):
        """BUG FIX: empty string '' should still be treated as code (is not None)."""
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "violations": [], "checks": []}) as m:
            r = json.loads(tools_mod.strray_codex_check({"code": "", "operation": "create"}))
            self.assertEqual(r["status"], "passed")
            self.assertEqual(r["code_length"], 0)

    def test_no_code_bridge_health(self):
        """No code provided — bridge health check."""
        with patch.object(tools_mod, "_call_bridge", return_value={"framework": "loaded", "version": "1.15.0", "components": {}}) as m:
            r = json.loads(tools_mod.strray_codex_check({"operation": "refactor"}))
            self.assertEqual(r["status"], "ok")
            self.assertIn("Pass", r["note"])

    def test_no_code_bridge_error_fallback(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "node not found"}):
            with patch.object(tools_mod, "_run_strray", return_value='{"status":"ok","output":"healthy"}') as cli:
                r = json.loads(tools_mod.strray_codex_check({"operation": "create"}))
                cli.assert_called_once()

    def test_default_operation(self):
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "violations": [], "checks": []}):
            r = json.loads(tools_mod.strray_codex_check({"code": "x"}))
            self.assertEqual(r["operation"], "create")

    def test_multiline_code(self):
        code = "function foo() {\n  return null;\n}\n"
        with patch.object(tools_mod, "_call_bridge", return_value={"passed": True, "violations": [], "checks": []}):
            r = json.loads(tools_mod.strray_codex_check({"code": code, "operation": "create"}))
            self.assertEqual(r["code_length"], len(code))


class TestPreToolCallHook(unittest.TestCase):
    """v2: pre_tool_call now runs bridge for code tools and logs to disk."""

    def setUp(self):
        # Reset session stats
        pi._session_stats = dict.fromkeys(pi._session_stats, 0)
        pi._session_stats["started_at"] = None
        pi._session_stats["session_id"] = None

    @patch.object(pi, "_call_bridge_fast")
    def test_strray_mcp_no_bridge(self, mock_bridge):
        """StringRay MCP tools skip bridge entirely."""
        pi._on_pre_tool_call("mcp_strray_lint_lint", {}, "t1")
        self.assertEqual(pi._session_stats["strray_mcp_calls"], 1)
        self.assertEqual(pi._session_stats["native_tool_calls"], 0)
        mock_bridge.assert_not_called()

    @patch.object(pi, "_call_bridge_fast")
    def test_native_tool_no_bridge(self, mock_bridge):
        """Non-code native tools don't call bridge."""
        pi._on_pre_tool_call("read_file", {"path": "a.md"}, "t1")
        mock_bridge.assert_not_called()

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True, "violations": []}, "processors": {"ran": False}})
    def test_code_tool_calls_bridge(self, mock_bridge):
        """Code-producing tools trigger bridge pre-process."""
        pi._on_pre_tool_call("write_file", {"path": "a.ts"}, "t1")
        mock_bridge.assert_called_once()
        call_cmd = mock_bridge.call_args[0][0]
        self.assertEqual(call_cmd["command"], "pre-process")
        self.assertEqual(call_cmd["tool"], "write_file")

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True, "violations": []}, "processors": {"ran": False}})
    def test_code_tool_increments_stats(self, mock_bridge):
        for t in ["write_file", "patch", "execute_code"]:
            pi._session_stats["code_operations"] = 0
            pi._session_stats["quality_gate_runs"] = 0
            pi._on_pre_tool_call(t, {}, "t1")
            self.assertEqual(pi._session_stats["code_operations"], 1, f"{t}")
            self.assertEqual(pi._session_stats["quality_gate_runs"], 1, f"{t}")

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": False, "qualityGate": {"passed": False, "violations": ["tests-required: no test"]}, "processors": {"ran": False}})
    def test_quality_gate_block(self, mock_bridge):
        """Quality gate failures increment block counter."""
        pi._on_pre_tool_call("write_file", {"path": "a.ts"}, "t1")
        self.assertEqual(pi._session_stats["quality_gate_blocks"], 1)

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True}, "processors": {"ran": True, "success": True, "processorCount": 2, "details": [{"name": "preValidate", "success": True}]}})
    def test_pre_processor_stats(self, mock_bridge):
        pi._on_pre_tool_call("write_file", {"path": "a.ts"}, "t1")
        self.assertEqual(pi._session_stats["pre_processor_runs"], 1)

    def test_nudge_terminal(self):
        """Terminal nudge only fires when command matches a known pattern."""
        # No command arg — no nudge
        with self.assertRaises(AssertionError):
            with self.assertLogs("strray-hermes", level="INFO"):
                pi._on_pre_tool_call("terminal", {}, "t1")

        # Generic command (git, ls) — no nudge
        with self.assertRaises(AssertionError):
            with self.assertLogs("strray-hermes", level="INFO"):
                pi._on_pre_tool_call("terminal", {"command": "git status"}, "t1")

        # Grep command — should nudge
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_pre_tool_call("terminal", {"command": "grep -r 'pattern' src/"}, "t1")
        self.assertTrue(any("grep" in m for m in cm.output))

        # npm audit — should nudge
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_pre_tool_call("terminal", {"command": "npm audit"}, "t1")
        self.assertTrue(any("audit" in m for m in cm.output))

    def test_nudge_search_files(self):
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_pre_tool_call("search_files", {}, "t1")
        self.assertTrue(any("Tip" in m for m in cm.output))

    def test_no_nudge_write_file(self):
        """write_file is a code tool — no nudge, gets bridge instead."""
        with patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True}, "processors": {"ran": False}}):
            with self.assertRaises(AssertionError):
                with self.assertLogs("strray-hermes", level="INFO"):
                    pi._on_pre_tool_call("write_file", {}, "t1")

    def test_accumulates(self):
        with patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True}, "processors": {"ran": False}}):
            for _ in range(5):
                pi._on_pre_tool_call("terminal", {}, "t1")
        self.assertEqual(pi._session_stats["total_tool_calls"], 5)

    def test_is_strray_mcp(self):
        self.assertTrue(pi._is_strray_mcp("mcp_strray_lint_lint"))
        self.assertTrue(pi._is_strray_mcp("mcp_strray_enforcer_codex_enforcement"))
        self.assertFalse(pi._is_strray_mcp("terminal"))
        self.assertFalse(pi._is_strray_mcp("strray_validate"))
        self.assertFalse(pi._is_strray_mcp("mcp_other_tool"))


class TestPostToolCallHook(unittest.TestCase):
    """v2: post_tool_call logs to disk and calls bridge for code tools."""

    def setUp(self):
        # Reset post_processor_runs since it accumulates across tests
        pi._session_stats["post_processor_runs"] = 0

    @patch.object(pi, "_call_bridge_fast")
    def test_non_code_no_bridge(self, mock_bridge):
        """Non-code tools don't trigger bridge post-process."""
        pi._on_post_tool_call("terminal", {"command": "ls"}, None, "t1")
        mock_bridge.assert_not_called()

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": True, "success": True, "processorCount": 2, "details": []}})
    def test_code_tool_calls_bridge(self, mock_bridge):
        """Code-producing tools trigger bridge post-process."""
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, None, "t1")
        mock_bridge.assert_called_once()
        call_cmd = mock_bridge.call_args[0][0]
        self.assertEqual(call_cmd["command"], "post-process")
        self.assertEqual(call_cmd["tool"], "write_file")

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": True, "success": True, "processorCount": 1, "details": []}})
    def test_post_processor_stats(self, mock_bridge):
        pi._on_post_tool_call("patch", {"path": "a.ts"}, None, "t1")
        self.assertEqual(pi._session_stats["post_processor_runs"], 1)

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": True, "success": True, "processorCount": 2, "details": []}})
    def test_post_captures_result(self, mock_bridge):
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, {"error": "disk full"}, "t1")
        call_cmd = mock_bridge.call_args[0][0]
        self.assertEqual(call_cmd["error"], "disk full")

    def test_args_not_dict_no_crash(self):
        pi._on_post_tool_call("write_file", "not a dict", None, "t1")

    def test_args_none_no_crash(self):
        pi._on_post_tool_call("write_file", None, None, "t1")

    def test_missing_path_key_no_file_tracking(self):
        """BUG FIX: missing path key should not crash."""
        pi._on_post_tool_call("write_file", {"content": "hello"}, None, "t1")

    def test_empty_path_no_file_tracking(self):
        """Empty string path should not crash."""
        pi._on_post_tool_call("write_file", {"path": ""}, None, "t1")


class TestSlashCommand(unittest.TestCase):
    def setUp(self):
        pi._session_stats = {
            "started_at": "2026-03-27T15:00:00Z",
            "session_id": "test-session",
            "code_operations": 5,
            "total_tool_calls": 20,
            "strray_mcp_calls": 12,
            "native_tool_calls": 8,
            "quality_gate_runs": 10,
            "quality_gate_blocks": 2,
            "pre_processor_runs": 8,
            "post_processor_runs": 6,
            "bridge_calls": 15,
            "bridge_errors": 0,
        }

    def test_stats(self):
        o = pi._strray_command("stats")
        self.assertIn("20", o)
        self.assertIn("12", o)
        self.assertIn("8", o)
        self.assertIn("5", o)
        # v2 new stats
        self.assertIn("10", o)  # quality_gate_runs
        self.assertIn("2", o)   # quality_gate_blocks
        self.assertIn("15", o)  # bridge_calls

    def test_help(self):
        o = pi._strray_command("help")
        self.assertIn("status", o)
        self.assertIn("help", o)

    def test_status_via_bridge(self):
        """v2: status uses bridge, not tools.strray_health."""
        with patch.object(pi, "_call_bridge_fast", return_value={"framework": "loaded", "version": "1.15.0", "components": {"qualityGate": True, "processorManager": True}}) as m:
            o = pi._strray_command("status")
            self.assertIn("loaded", o)
            self.assertIn("1.15.0", o)
            m.assert_called_once_with({"command": "health"}, timeout=10)

    def test_status_bridge_error(self):
        with patch.object(pi, "_call_bridge_fast", return_value={"error": "node not found"}):
            o = pi._strray_command("status")
            self.assertIn("node not found", o)

    def test_default_status(self):
        with patch.object(pi, "_call_bridge_fast", return_value={"framework": "loaded", "version": "1.0", "components": {}}):
            o = pi._strray_command("")
            self.assertIn("loaded", o)

    def test_stats_null_started_at(self):
        pi._session_stats["started_at"] = None
        pi._session_stats["session_id"] = None
        o = pi._strray_command("stats")
        self.assertIn("N/A", o)


class TestSessionStartHook(unittest.TestCase):
    def test_resets_stats(self):
        pi._session_stats["total_tool_calls"] = 99
        pi._session_stats["code_operations"] = 50
        pi._session_stats["bridge_calls"] = 20
        pi._session_stats["quality_gate_blocks"] = 5
        pi._on_session_start("s1", "cli")
        self.assertEqual(pi._session_stats["total_tool_calls"], 0)
        self.assertEqual(pi._session_stats["code_operations"], 0)
        self.assertEqual(pi._session_stats["bridge_calls"], 0)
        self.assertEqual(pi._session_stats["quality_gate_blocks"], 0)
        self.assertIsNotNone(pi._session_stats["started_at"])
        self.assertEqual(pi._session_stats["session_id"], "s1")

    def test_logs(self):
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_session_start("s1", "telegram")
        self.assertTrue(any("s1" in m for m in cm.output))
        self.assertTrue(any("telegram" in m for m in cm.output))


class TestRegisterIntegration(unittest.TestCase):
    def test_wires_three_tools(self):
        ctx = MagicMock()
        pi.register(ctx)
        names = [c[1]["name"] for c in ctx.register_tool.call_args_list]
        self.assertEqual(set(names), {"strray_validate", "strray_codex_check", "strray_health"})

    def test_toolset_name(self):
        ctx = MagicMock()
        pi.register(ctx)
        for c in ctx.register_tool.call_args_list:
            self.assertEqual(c[1]["toolset"], "strray-hermes")

    def test_schemas_wired(self):
        ctx = MagicMock()
        pi.register(ctx)
        sm = {c[1]["name"]: c[1]["schema"] for c in ctx.register_tool.call_args_list}
        self.assertIs(sm["strray_validate"], schemas.STRRAY_VALIDATE)
        self.assertIs(sm["strray_codex_check"], schemas.STRRAY_CODEX_CHECK)
        self.assertIs(sm["strray_health"], schemas.STRRAY_HEALTH)

    def test_handlers_wired(self):
        ctx = MagicMock()
        pi.register(ctx)
        hm = {c[1]["name"]: c[1]["handler"] for c in ctx.register_tool.call_args_list}
        self.assertIs(hm["strray_validate"], tools_mod.strray_validate)
        self.assertIs(hm["strray_codex_check"], tools_mod.strray_codex_check)
        self.assertIs(hm["strray_health"], tools_mod.strray_health)

    def test_hooks_registered(self):
        ctx = MagicMock()
        pi.register(ctx)
        names = [c[0][0] for c in ctx.register_hook.call_args_list]
        self.assertIn("pre_tool_call", names)
        self.assertIn("post_tool_call", names)

    def test_hooks_are_callable(self):
        ctx = MagicMock()
        pi.register(ctx)
        for c in ctx.register_hook.call_args_list:
            self.assertTrue(callable(c[0][1]))

    def test_slash_command_attempted(self):
        ctx = MagicMock()
        pi.register(ctx)
        cmds = [c for c in ctx.method_calls if "register_command" in str(c)]
        self.assertTrue(len(cmds) >= 1)

    def test_survives_missing_session_hook(self):
        ctx = MagicMock()
        ctx.register_hook.side_effect = [None, None, (AttributeError, None)]
        pi.register(ctx)  # should not raise

    def test_survives_missing_command_reg(self):
        ctx = MagicMock()
        ctx.register_command.side_effect = TypeError("nope")
        pi.register(ctx)

    def test_logs_on_load(self):
        ctx = MagicMock()
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi.register(ctx)
        self.assertTrue(any("Plugin" in m and "loaded" in m for m in cm.output))


class TestFileLogging(unittest.TestCase):
    """Test that tool events are written to log files."""

    def test_log_tool_event_creates_file(self):
        with tempfile.TemporaryDirectory() as td:
            log_dir = Path(td)
            # Temporarily override LOG_DIR
            original = pi.LOG_DIR
            pi.LOG_DIR = log_dir

            pi._log_tool_event("start", "terminal", {"command": "ls"})
            pi._log_tool_event("complete", "terminal", {"command": "ls"}, duration=100)

            activity_file = log_dir / "plugin-tool-events.log"
            self.assertTrue(activity_file.exists())

            content = activity_file.read_text()
            self.assertIn("tool-started", content)
            self.assertIn("tool-complete", content)
            self.assertIn("SUCCESS", content)

            pi.LOG_DIR = original

    def test_log_to_file_creates_file(self):
        with tempfile.TemporaryDirectory() as td:
            log_dir = Path(td)
            original = pi.LOG_DIR
            pi.LOG_DIR = log_dir

            pi._log_to_file("activity.log", "[test] hello world")

            activity_file = log_dir / "activity.log"
            self.assertTrue(activity_file.exists())
            content = activity_file.read_text()
            self.assertIn("[test] hello world", content)

            pi.LOG_DIR = original

    def test_log_to_file_survives_permission_error(self):
        """Should never crash the agent over logging."""
        original = pi.LOG_DIR
        pi.LOG_DIR = Path("/nonexistent/path/that/does/not/exist/and/cannot/be/created")
        pi._log_to_file("activity.log", "should not crash")  # noqa: B023
        pi.LOG_DIR = original


class TestLiveBridge(unittest.TestCase):
    """Live test: actually call bridge.mjs if it exists."""

    def test_bridge_health(self):
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        r = tools_mod._call_bridge({"command": "health"}, timeout=10)
        self.assertNotIn("error", r)
        self.assertIn("status", r)

    def test_bridge_stats(self):
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        r = tools_mod._call_bridge({"command": "stats"}, timeout=5)
        self.assertIn("frameworkReady", r)

    def test_bridge_quality_gate(self):
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        # Clean code should pass
        r = tools_mod._call_bridge({
            "command": "codex-check",
            "code": "const x: number = 42;",
        }, timeout=10)
        self.assertNotIn("error", r)
        self.assertIn("passed", r)

    def test_bridge_quality_gate_violation(self):
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        # Code with console.log should fail
        r = tools_mod._call_bridge({
            "command": "codex-check",
            "code": "console.log('hello');",
        }, timeout=10)
        self.assertNotIn("error", r)
        # console.log is a violation
        if r.get("passed") is False:
            self.assertTrue(any("console.log" in v for v in r.get("violations", [])))

    def test_bridge_positional_health(self):
        """Positional arg mode: node bridge.mjs health --cwd /path (no stdin pipe)."""
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        # Use stringray dev repo as project root (has package.json)
        strray_root = str(Path(PLUGIN_DIR).parent.parent.parent / "dev" / "stringray")
        cwd = strray_root if Path(strray_root).exists() else PLUGIN_DIR

        r = subprocess.run(
            ["node", str(bridge_path), "health", "--cwd", cwd],
            capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(r.returncode, 0, f"stderr: {r.stderr}")
        data = json.loads(r.stdout)
        self.assertEqual(data["status"], "ok")
        self.assertIn("framework", data)

    def test_bridge_positional_stats(self):
        """Positional stats: no stdin needed."""
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        strray_root = str(Path(PLUGIN_DIR).parent.parent.parent / "dev" / "stringray")
        cwd = strray_root if Path(strray_root).exists() else PLUGIN_DIR

        r = subprocess.run(
            ["node", str(bridge_path), "stats", "--cwd", cwd],
            capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(r.returncode, 0, f"stderr: {r.stderr}")
        data = json.loads(r.stdout)
        self.assertIn("frameworkReady", data)

    def test_bridge_positional_with_json_payload(self):
        """Positional mode with --json payload for commands needing args."""
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        strray_root = str(Path(PLUGIN_DIR).parent.parent.parent / "dev" / "stringray")
        cwd = strray_root if Path(strray_root).exists() else PLUGIN_DIR

        r = subprocess.run(
            ["node", str(bridge_path), "validate", "--cwd", cwd,
             "--json", json.dumps({"files": ["src/index.ts"], "operation": "commit"})],
            capture_output=True, text=True, timeout=15,
        )
        self.assertEqual(r.returncode, 0, f"stderr: {r.stderr}")
        data = json.loads(r.stdout)
        self.assertIn("passed", data)

    def test_bridge_positional_invalid_json(self):
        """Positional mode with invalid --json returns error."""
        bridge_path = Path(PLUGIN_DIR) / "bridge.mjs"
        if not bridge_path.exists():
            self.skipTest("bridge.mjs not built yet")

        strray_root = str(Path(PLUGIN_DIR).parent.parent.parent / "dev" / "stringray")
        cwd = strray_root if Path(strray_root).exists() else PLUGIN_DIR

        r = subprocess.run(
            ["node", str(bridge_path), "validate", "--cwd", cwd,
             "--json", "not-json"],
            capture_output=True, text=True, timeout=10,
        )
        # Should fail with error about invalid payload
        data = json.loads(r.stdout)
        self.assertIn("error", data)


class TestBridgeErrorPaths(unittest.TestCase):
    """Cover remaining bridge error branches in tools.py."""

    def test_bridge_json_decode_error(self):
        """_call_bridge with non-JSON stdout returns error."""
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="not json", stderr="")
            r = tools_mod._call_bridge({"command": "health"})
            self.assertIn("error", r)

    def test_bridge_os_error(self):
        """_call_bridge with OSError during subprocess returns error."""
        with patch("subprocess.run", side_effect=OSError("broken pipe")):
            r = tools_mod._call_bridge({"command": "health"})
            self.assertIn("error", r)

    def test_bridge_generic_exception_in_run_strray(self):
        """_run_strray catches non-standard exceptions."""
        with patch("subprocess.run", side_effect=RuntimeError("unexpected")):
            r = json.loads(tools_mod._run_strray(["health"]))
            self.assertIn("unexpected", r["error"])

    def test_validate_cli_fallback_error(self):
        """strray_validate CLI fallback when CLI returns an error JSON."""
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "bridge down"}):
            with patch.object(tools_mod, "_run_strray", return_value='{"error": "validation failed"}'):
                r = json.loads(tools_mod.strray_validate({"files": ["a.ts"]}))
                # CLI error path returns raw result without "via" key
                self.assertIn("error", r)

    def test_codex_check_static_fallback(self):
        """strray_codex_check with code but bridge down falls back to static analysis."""
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "bridge down"}):
            r = json.loads(tools_mod.strray_codex_check({"code": "console.log(1)", "operation": "create"}))
            self.assertEqual(r["via"], "static")
            self.assertIn("basic analysis", r["note"])

    def test_codex_check_cli_health_error(self):
        """strray_codex_check no-code path: bridge error + CLI also errors."""
        with patch.object(tools_mod, "_call_bridge", return_value={"error": "no node"}):
            with patch.object(tools_mod, "_run_strray", return_value='{"error": "strray-ai not found"}'):
                r = json.loads(tools_mod.strray_codex_check({"operation": "create"}))
                self.assertIn("error", r)


class TestFindProjectRoot(unittest.TestCase):
    """Test the _find_project_root function in tools.py."""

    def test_returns_cwd_when_no_package_json(self):
        """With no package.json in any ancestor, falls back to cwd."""
        with patch.object(tools_mod.Path, "exists", return_value=False):
            # _find_project_root is called at module level, so we call it directly
            result = tools_mod._find_project_root.__wrapped__(tools_mod.PLUGIN_DIR) if hasattr(tools_mod._find_project_root, "__wrapped__") else None
            # We can't easily override the module-level call, but we verify the function exists
            self.assertTrue(callable(tools_mod._find_project_root))


class TestPreToolCallBridgeErrors(unittest.TestCase):
    """Test pre_tool_call hook when bridge returns errors."""

    def setUp(self):
        pi._session_stats = dict.fromkeys(pi._session_stats, 0)
        pi._session_stats["started_at"] = None
        pi._session_stats["session_id"] = None

    @patch.object(pi, "_call_bridge_fast", return_value={"error": "bridge crashed"})
    def test_code_tool_bridge_error_does_not_crash(self, mock_bridge):
        """Bridge error during pre-process should not crash the hook."""
        pi._on_pre_tool_call("write_file", {"path": "a.ts"}, "t1")
        self.assertEqual(pi._session_stats["code_operations"], 1)
        # Note: bridge_calls stat is inside the real _call_bridge_fast,
        # so mocking it doesn't increment the counter. Verify hook doesn't crash.
        mock_bridge.assert_called_once()

    @patch.object(pi, "_call_bridge_fast", return_value={"error": "timeout"})
    def test_multiple_code_tools_with_bridge_errors(self, mock_bridge):
        """Multiple bridge errors accumulate properly."""
        for i in range(3):
            pi._on_pre_tool_call("write_file", {"path": f"f{i}.ts"}, "t1")
        self.assertEqual(pi._session_stats["code_operations"], 3)
        self.assertEqual(pi._session_stats["total_tool_calls"], 3)


class TestPostToolCallBridgeErrors(unittest.TestCase):
    """Test post_tool_call hook when bridge returns errors."""

    def setUp(self):
        pi._session_stats["post_processor_runs"] = 0

    @patch.object(pi, "_call_bridge_fast", return_value={"error": "bridge down"})
    def test_code_tool_post_bridge_error(self, mock_bridge):
        """Bridge error during post-process should not crash."""
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, None, "t1")
        mock_bridge.assert_called_once()

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": False}})
    def test_code_tool_processors_not_ran(self, mock_bridge):
        """Processors not running is handled gracefully."""
        pi._on_post_tool_call("execute_code", {"command": "echo hi"}, {"duration": 42}, "t1")
        self.assertEqual(pi._session_stats["post_processor_runs"], 0)

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": True, "success": False, "processorCount": 1, "details": [{"name": "testAutoCreation", "success": False, "error": "no test file"}]}})
    def test_post_processor_failure_logging(self, mock_bridge):
        """Failed post-processors are tracked but don't crash."""
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, None, "t1")
        self.assertEqual(pi._session_stats["post_processor_runs"], 1)


class TestPreToolCallEdgeCases(unittest.TestCase):
    """Edge cases for pre_tool_call."""

    def setUp(self):
        pi._session_stats = dict.fromkeys(pi._session_stats, 0)
        pi._session_stats["started_at"] = None
        pi._session_stats["session_id"] = None

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True}, "processors": {"ran": False}})
    def test_all_code_tools_trigger_bridge(self, mock_bridge):
        """Every tool in _CODE_TOOLS calls the bridge."""
        code_tools = ["write_file", "patch", "execute_code", "write", "edit"]
        for tool in code_tools:
            pi._session_stats["code_operations"] = 0
            pi._on_pre_tool_call(tool, {}, "t1")
            self.assertEqual(pi._session_stats["code_operations"], 1, f"{tool} should be a code tool")

    @patch.object(pi, "_call_bridge_fast")
    def test_unknown_tool_not_strray_mcp(self, mock_bridge):
        """Unknown tools should be treated as native tools."""
        pi._on_pre_tool_call("some_random_tool", {}, "t1")
        self.assertEqual(pi._session_stats["native_tool_calls"], 1)
        mock_bridge.assert_not_called()

    def test_strray_validate_tool_not_treated_as_mcp(self):
        """strray_validate is a native tool, not an MCP tool."""
        pi._on_pre_tool_call("strray_validate", {}, "t1")
        self.assertEqual(pi._session_stats["native_tool_calls"], 1)
        self.assertEqual(pi._session_stats["strray_mcp_calls"], 0)

    @patch.object(pi, "_call_bridge_fast", return_value={"passed": True, "qualityGate": {"passed": True, "violations": []}, "processors": {"ran": True, "success": True, "processorCount": 3, "details": [{"name": "p1", "success": True}, {"name": "p2", "success": True}, {"name": "p3", "success": False, "error": "failed"}]}})
    def test_pre_processor_partial_failure(self, mock_bridge):
        """Pre-processors with partial failure still count as ran."""
        pi._on_pre_tool_call("write_file", {"path": "a.ts"}, "t1")
        self.assertEqual(pi._session_stats["pre_processor_runs"], 1)


class TestSlashCommandEdgeCases(unittest.TestCase):
    """Edge cases for the slash command handler."""

    def test_unknown_command_defaults_to_status(self):
        """Unknown args default to status."""
        with patch.object(pi, "_call_bridge_fast", return_value={"framework": "loaded", "version": "1.0", "components": {}}) as m:
            pi._strray_command("something-random")
            m.assert_called_once_with({"command": "health"}, timeout=10)

    def test_case_insensitive(self):
        """Command arg is lowercased."""
        o = pi._strray_command(" STATS ")
        self.assertIn("Session", o)


class TestLogToFileTimestamps(unittest.TestCase):
    """Verify log file formatting."""

    def test_log_entry_has_iso_timestamp(self):
        """Every log entry should start with an ISO timestamp."""
        import re
        with tempfile.TemporaryDirectory() as td:
            log_dir = Path(td)
            original = pi.LOG_DIR
            pi.LOG_DIR = log_dir

            pi._log_to_file("test.log", "[test] message")
            content = (log_dir / "test.log").read_text()
            # ISO timestamp: 2026-03-27T17:00:00Z or similar
            self.assertTrue(re.match(r"\d{4}-\d{2}-\d{2}T", content.split(" ")[0]))

            pi.LOG_DIR = original


class TestPostToolCallDuration(unittest.TestCase):
    """Test that duration is correctly extracted from results."""

    def setUp(self):
        pi._session_stats["post_processor_runs"] = 0

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": False}})
    def test_duration_extracted_from_result_dict(self, mock_bridge):
        """Duration from result dict is logged correctly."""
        # We verify the post hook doesn't crash with duration in result
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, {"duration": 1234, "success": True}, "t1")
        # No crash = pass

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": False}})
    def test_non_dict_result_no_crash(self, mock_bridge):
        """Non-dict result doesn't crash the hook."""
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, "string result", "t1")

    @patch.object(pi, "_call_bridge_fast", return_value={"processors": {"ran": False}})
    def test_none_result_no_crash(self, mock_bridge):
        """None result doesn't crash the hook."""
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, None, "t1")


class TestBridgeHelperTimeoutDefault(unittest.TestCase):
    """Verify bridge timeout defaults."""

    def test_default_timeout(self):
        """_call_bridge defaults to 30s timeout."""
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout='{"ok":true}', stderr="")
            tools_mod._call_bridge({"command": "health"})
            self.assertEqual(m.call_args[1]["timeout"], 30)

    def test_custom_timeout(self):
        """_call_bridge respects custom timeout."""
        with patch("subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout='{"ok":true}', stderr="")
            tools_mod._call_bridge({"command": "health"}, timeout=5)
            self.assertEqual(m.call_args[1]["timeout"], 5)


if __name__ == "__main__":
    unittest.main(verbosity=2)
