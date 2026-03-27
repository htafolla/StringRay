"""Comprehensive tests for the StringRay Hermes plugin.

Tests all 3 tools, both hooks, the slash command, the _run_strray helper,
and the full register() integration.
"""

import json
import sys
import os
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
from io import StringIO
import logging
import importlib
import types

# Add plugin to path
PLUGIN_DIR = os.path.expanduser("~/.hermes/plugins/strray-hermes")
sys.path.insert(0, PLUGIN_DIR)

# Force reimport
for mod in list(sys.modules):
    if "strray" in mod and ("schemas" in mod or "tools" in mod or "plugin" in mod):
        del sys.modules[mod]

schemas = importlib.import_module("schemas")
tools = importlib.import_module("tools")

# Create a fake package for __init__.py execution
pkg = types.ModuleType("strray_hermes_pkg")
pkg.__path__ = [PLUGIN_DIR]
pkg.__dict__["schemas"] = schemas
pkg.__dict__["tools"] = tools
sys.modules["strray_hermes_pkg"] = pkg

init_path = os.path.join(PLUGIN_DIR, "__init__.py")
with open(init_path) as f:
    init_code = f.read()
init_code = init_code.replace("from . import schemas, tools", "import schemas, tools")
exec(compile(init_code, init_path, "exec"), pkg.__dict__)

pi = pkg  # plugin init


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
    def test_successful_command(self):
        with patch("tools.subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="all good", stderr="")
            r = json.loads(tools._run_strray(["health"]))
            self.assertEqual(r["status"], "ok")
            self.assertEqual(m.call_args[0][0], ["npx", "strray-ai", "health"])

    def test_command_failure(self):
        with patch("tools.subprocess.run") as m:
            m.return_value = MagicMock(returncode=1, stdout="", stderr="broke")
            r = json.loads(tools._run_strray(["validate"]))
            self.assertEqual(r["status"], "error")
            self.assertEqual(r["exit_code"], 1)

    def test_failure_uses_stdout_if_no_stderr(self):
        with patch("tools.subprocess.run") as m:
            m.return_value = MagicMock(returncode=1, stdout="err stdout", stderr="")
            r = json.loads(tools._run_strray(["validate"]))
            self.assertEqual(r["stderr"], "err stdout")

    def test_file_not_found(self):
        with patch("tools.subprocess.run", side_effect=FileNotFoundError):
            r = json.loads(tools._run_strray(["health"]))
            self.assertIn("not found", r["error"])

    def test_timeout(self):
        with patch("tools.subprocess.run", side_effect=tools.subprocess.TimeoutExpired("c", 30)):
            r = json.loads(tools._run_strray(["health"], timeout=15))
            self.assertIn("15s", r["error"])

    def test_unexpected_exception(self):
        with patch("tools.subprocess.run", side_effect=OSError("perm")):
            r = json.loads(tools._run_strray(["health"]))
            self.assertIn("perm", r["error"])

    def test_custom_timeout(self):
        with patch("tools.subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="", stderr="")
            tools._run_strray(["health"], timeout=60)
            self.assertEqual(m.call_args[1]["timeout"], 60)

    def test_multiple_args(self):
        with patch("tools.subprocess.run") as m:
            m.return_value = MagicMock(returncode=0, stdout="", stderr="")
            tools._run_strray(["validate", "--fix"])
            self.assertEqual(m.call_args[0][0], ["npx", "strray-ai", "validate", "--fix"])


class TestStrrayHealth(unittest.TestCase):
    def test_health_ok(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"healthy"}'):
            r = json.loads(tools.strray_health({}))
            self.assertEqual(r["status"], "ok")

    def test_health_timeout(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}') as m:
            tools.strray_health({})
            m.assert_called_once_with(["health"], timeout=15)

    def test_health_ignores_extra_args(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}') as m:
            tools.strray_health({"x": 1})
            m.assert_called_once_with(["health"], timeout=15)


class TestStrrayValidate(unittest.TestCase):
    def test_with_files_ok(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"valid"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts", "b.ts"], "operation": "commit"}))
            self.assertEqual(r["status"], "ok")
            self.assertEqual(r["files_checked"], 2)
            self.assertEqual(r["operation"], "commit")

    def test_with_files_validation_issues(self):
        with patch("tools._run_strray", return_value='{"status":"error","exit_code":1,"stderr":"violations"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts"]}))
            self.assertEqual(r["status"], "validation_issues")

    def test_no_files_error(self):
        r = json.loads(tools.strray_validate({"files": []}))
        self.assertIn("No files", r["error"])

    def test_no_files_key_error(self):
        r = json.loads(tools.strray_validate({}))
        self.assertIn("error", r)

    def test_default_operation(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts"]}))
            self.assertEqual(r["operation"], "commit")

    def test_custom_operation(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts"], "operation": "refactor"}))
            self.assertEqual(r["operation"], "refactor")

    def test_strray_error_propagated(self):
        with patch("tools._run_strray", return_value='{"error":"not found"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts"]}))
            self.assertIn("error", r)
            self.assertEqual(r["error"], "not found")

    def test_100_files(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}'):
            fs = [f"f{i}.ts" for i in range(100)]
            r = json.loads(tools.strray_validate({"files": fs}))
            self.assertEqual(r["files_checked"], 100)

    def test_uses_run_strray(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"ok"}') as m:
            tools.strray_validate({"files": ["a.ts"]})
            m.assert_called_once_with(["validate"], timeout=30)

    def test_output_included(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"all clean"}'):
            r = json.loads(tools.strray_validate({"files": ["a.ts"]}))
            self.assertEqual(r["output"], "all clean")


class TestStrrayCodexCheck(unittest.TestCase):
    def test_with_code(self):
        r = json.loads(tools.strray_codex_check({"code": "const x = null;", "operation": "create"}))
        self.assertEqual(r["status"], "checked")
        self.assertEqual(r["operation"], "create")
        self.assertEqual(r["code_length"], 15)
        self.assertIn("MCP server", r["note"])

    def test_with_focus_areas(self):
        r = json.loads(tools.strray_codex_check({"code": "eval()", "operation": "modify", "focus_areas": ["security"]}))
        self.assertEqual(r["focus_areas"], ["security"])

    def test_empty_focus_areas(self):
        r = json.loads(tools.strray_codex_check({"code": "x", "operation": "create", "focus_areas": []}))
        self.assertEqual(r["focus_areas"], "all")

    def test_empty_string_code_goes_to_codex_branch(self):
        """BUG FIX: empty string '' is now treated as code provided (not falsy skip)."""
        r = json.loads(tools.strray_codex_check({"code": "", "operation": "create"}))
        self.assertEqual(r["status"], "checked")
        self.assertEqual(r["code_length"], 0)

    def test_no_code_key_runs_health(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"healthy"}'):
            r = json.loads(tools.strray_codex_check({"operation": "refactor"}))
            self.assertEqual(r["status"], "ok")
            self.assertIn("Pass", r["note"])

    def test_no_code_strray_error_propagated(self):
        with patch("tools._run_strray", return_value='{"error":"not found"}'):
            r = json.loads(tools.strray_codex_check({"operation": "create"}))
            self.assertIn("error", r)

    def test_default_operation(self):
        r = json.loads(tools.strray_codex_check({"code": "x"}))
        self.assertEqual(r["operation"], "create")

    def test_multiline_code(self):
        code = "function foo() {\n  return null;\n}\n"
        r = json.loads(tools.strray_codex_check({"code": code, "operation": "create"}))
        self.assertEqual(r["code_length"], len(code))

    def test_no_code_uses_run_strray(self):
        with patch("tools._run_strray", return_value='{"status":"ok","output":"h"}') as m:
            tools.strray_codex_check({"operation": "refactor"})
            m.assert_called_once_with(["health"], timeout=15)


class TestPreToolCallHook(unittest.TestCase):
    def setUp(self):
        pi._session_stats = {"started_at": None, "code_operations": 0, "total_tool_calls": 0,
                             "strray_mcp_calls": 0, "native_tool_calls": 0}

    def test_strray_mcp(self):
        pi._on_pre_tool_call("mcp_strray_lint_lint", {}, "t1")
        self.assertEqual(pi._session_stats["strray_mcp_calls"], 1)
        self.assertEqual(pi._session_stats["native_tool_calls"], 0)
        self.assertEqual(pi._session_stats["total_tool_calls"], 1)

    def test_native_tool(self):
        pi._on_pre_tool_call("terminal", {}, "t1")
        self.assertEqual(pi._session_stats["native_tool_calls"], 1)
        self.assertEqual(pi._session_stats["strray_mcp_calls"], 0)

    def test_code_tools(self):
        for t in ["write_file", "patch", "execute_code"]:
            pi._session_stats["code_operations"] = 0
            pi._on_pre_tool_call(t, {}, "t1")
            self.assertEqual(pi._session_stats["code_operations"], 1, f"{t}")

    def test_non_code_no_increment(self):
        pi._on_pre_tool_call("read_file", {}, "t1")
        self.assertEqual(pi._session_stats["code_operations"], 0)

    def test_nudge_terminal(self):
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_pre_tool_call("terminal", {}, "t1")
        self.assertTrue(any("Tip" in m for m in cm.output))

    def test_nudge_search_files(self):
        with self.assertLogs("strray-hermes", level="INFO") as cm:
            pi._on_pre_tool_call("search_files", {}, "t1")
        self.assertTrue(any("Tip" in m for m in cm.output))

    def test_no_nudge_write_file(self):
        with self.assertRaises(AssertionError):
            with self.assertLogs("strray-hermes", level="INFO"):
                pi._on_pre_tool_call("write_file", {}, "t1")

    def test_accumulates(self):
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
    def setUp(self):
        pi._TOOL_LOG.clear()

    def test_entry_created(self):
        pi._on_post_tool_call("terminal", {}, None, "t1")
        e = pi._TOOL_LOG[0]
        self.assertEqual(e["tool"], "terminal")
        self.assertFalse(e["is_strray"])
        self.assertIn("ts", e)

    def test_strray_tool(self):
        pi._on_post_tool_call("mcp_strray_lint", {}, None, "t2")
        self.assertTrue(pi._TOOL_LOG[0]["is_strray"])

    def test_write_file_tracks_path(self):
        pi._on_post_tool_call("write_file", {"path": "a.ts"}, None, "t1")
        self.assertEqual(pi._TOOL_LOG[0]["file"], "a.ts")

    def test_patch_tracks_path(self):
        pi._on_post_tool_call("patch", {"path": "b.ts"}, None, "t1")
        self.assertEqual(pi._TOOL_LOG[0]["file"], "b.ts")

    def test_non_file_no_file_key(self):
        pi._on_post_tool_call("terminal", {"command": "ls"}, None, "t1")
        self.assertNotIn("file", pi._TOOL_LOG[0])

    def test_missing_path_key_no_empty_file(self):
        """BUG FIX: missing path key no longer writes file: ''"""
        pi._on_post_tool_call("write_file", {"content": "hello"}, None, "t1")
        self.assertNotIn("file", pi._TOOL_LOG[0])

    def test_empty_path_no_file_key(self):
        """Empty string path should not be stored."""
        pi._on_post_tool_call("write_file", {"path": ""}, None, "t1")
        self.assertNotIn("file", pi._TOOL_LOG[0])

    def test_log_rotation(self):
        for i in range(60):
            pi._on_post_tool_call("terminal", {}, None, f"t{i}")
        self.assertEqual(len(pi._TOOL_LOG), 50)
        self.assertEqual(pi._TOOL_LOG[0]["task_id"], "t10")

    def test_args_not_dict(self):
        pi._on_post_tool_call("write_file", "not a dict", None, "t1")
        self.assertNotIn("file", pi._TOOL_LOG[0])

    def test_args_none(self):
        pi._on_post_tool_call("write_file", None, None, "t1")
        self.assertNotIn("file", pi._TOOL_LOG[0])

    def test_result_not_used_no_crash(self):
        pi._on_post_tool_call("terminal", {}, {"output": "stuff"}, "t1")
        self.assertEqual(len(pi._TOOL_LOG), 1)


class TestSlashCommand(unittest.TestCase):
    def setUp(self):
        pi._session_stats = {"started_at": "2026-03-27T15:00:00", "code_operations": 5,
                             "total_tool_calls": 20, "strray_mcp_calls": 12, "native_tool_calls": 8}

    def test_stats(self):
        o = pi._strray_command("stats")
        self.assertIn("20", o)
        self.assertIn("12", o)
        self.assertIn("8", o)
        self.assertIn("5", o)

    def test_help(self):
        o = pi._strray_command("help")
        self.assertIn("status", o)
        self.assertIn("help", o)

    def test_status(self):
        with patch("tools.strray_health", return_value='{"status":"ok","output":"healthy"}'):
            o = pi._strray_command("status")
            self.assertIn("healthy", o)

    def test_default_status(self):
        with patch("tools.strray_health", return_value='{"status":"ok","output":"ok"}'):
            o = pi._strray_command("")
            self.assertIn("ok", o)

    def test_status_exception(self):
        with patch("tools.strray_health", side_effect=Exception("boom")):
            o = pi._strray_command("status")
            self.assertIn("loaded", o)

    def test_unknown_falls_to_status(self):
        with patch("tools.strray_health", return_value='{"status":"ok","output":"ok"}'):
            o = pi._strray_command("foobar")
            self.assertTrue("ok" in o or "loaded" in o)

    def test_stats_null_started_at(self):
        pi._session_stats["started_at"] = None
        o = pi._strray_command("stats")
        self.assertIn("N/A", o)


class TestSessionStartHook(unittest.TestCase):
    def test_resets_stats(self):
        pi._session_stats["total_tool_calls"] = 99
        pi._session_stats["code_operations"] = 50
        pi._on_session_start("s1", "cli")
        self.assertEqual(pi._session_stats["total_tool_calls"], 0)
        self.assertEqual(pi._session_stats["code_operations"], 0)
        self.assertEqual(pi._session_stats["strray_mcp_calls"], 0)
        self.assertEqual(pi._session_stats["native_tool_calls"], 0)
        self.assertIsNotNone(pi._session_stats["started_at"])

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
        self.assertIs(hm["strray_validate"], tools.strray_validate)
        self.assertIs(hm["strray_codex_check"], tools.strray_codex_check)
        self.assertIs(hm["strray_health"], tools.strray_health)

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
        self.assertTrue(any("Plugin loaded" in m for m in cm.output))


class TestLiveHealth(unittest.TestCase):
    def test_real_health(self):
        try:
            r = json.loads(tools.strray_health({}))
            self.assertEqual(r["status"], "ok")
            self.assertIn("output", r)
        except FileNotFoundError:
            self.skipTest("strray-ai not installed")


if __name__ == "__main__":
    unittest.main(verbosity=2)
