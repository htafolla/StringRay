"""Configuration management for StrRay framework."""

import os
import json
from pathlib import Path
from typing import Any, Dict, Optional, List


class ConfigManager:
    """Manages configuration for StrRay agents and services."""

    def __init__(self, config_paths: Optional[List[Path]] = None):
        """Initialize config manager with search paths."""
        if config_paths is None:
            config_paths = [
                Path.cwd() / "strray-config.json",
                Path.cwd() / "strray" / "strray-config.json",
                Path.cwd() / ".strray" / "config.json",
                Path.home() / ".config" / "strray" / "config.json",
            ]

        self.config_paths = config_paths
        self._config_cache: Dict[str, Any] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Load configuration from available files."""
        for config_path in self.config_paths:
            if config_path.exists():
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        config_data = json.load(f)
                        self._config_cache.update(config_data)
                except (json.JSONDecodeError, IOError) as e:
                    # Log error but continue
                    print(f"Warning: Could not load config from {config_path}: {e}")

        # Set defaults if not loaded
        self._set_defaults()

    def _set_defaults(self) -> None:
        """Set default configuration values."""
        defaults = {
            "ai_default_provider": "openai",
            "ai_default_model": "gpt-4",
            "ai_auto_log_responses": True,
            "model_default": "opencode/grok-code",
            "agent_default_temperature": 0.3,
            "logging_level": "INFO",
            "state_dir": ".strray/state",
            "max_concurrent_tasks": 10,
            "timeout_default": 300,
            # StrRay Framework Configuration
            "strray_version": "1.0.0",
            "codex_enabled": True,
            "codex_version": "v1.2.20",
            "codex_cache_ttl_seconds": 3600,
            "codex_auto_reload_on_change": True,
            "codex_terms": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20,
                21,
                22,
                23,
                24,
                25,
                26,
                27,
                28,
                29,
                30,
                31,
                32,
                33,
                34,
                35,
                36,
                37,
                38,
                39,
                40,
                41,
                42,
                43,
            ],
            "session_auto_format": True,
            "session_security_scan": True,
            "session_compliance_check": True,
            "session_threshold_monitoring": True,
            "automation_hooks": {
                "pre_commit": ["pre-commit-introspection"],
                "post_commit": ["auto-format"],
                "daily": ["enforcer-daily-scan"],
                "security": ["security-scan"],
                "deployment": ["post-deployment-audit"],
                "summary": ["summary-logger"],
                "job_completion": ["job-summary-logger"],
            },
            "mcp_knowledge_skills": [
                "project-analysis",
                "testing-strategy",
                "architecture-patterns",
                "performance-optimization",
                "git-workflow",
                "api-design",
            ],
            "sisyphus_coordination_model": "async-multi-agent",
            "sisyphus_max_concurrent_agents": 3,
            "sisyphus_task_distribution": {
                "enforcer": ["compliance", "thresholds", "automation"],
                "architect": ["design", "architecture", "dependencies"],
                "code-reviewer": ["quality", "best-practices", "security"],
                "test-architect": ["testing", "coverage", "behavioral"],
                "refactorer": ["modernization", "debt-reduction", "consolidation"],
                "security-auditor": ["vulnerabilities", "threats", "validation"],
                "bug-triage-specialist": ["errors", "root-cause", "fixes"],
            },
            "sisyphus_workflow_patterns": {
                "complex-refactor": ["architect", "refactorer", "test-architect"],
                "security-audit": ["security-auditor", "enforcer", "code-reviewer"],
                "new-feature": ["architect", "code-reviewer", "test-architect"],
                "bug-fix": ["bug-triage-specialist", "code-reviewer", "test-architect"],
            },
            "monitoring_metrics": [
                "bundle-size",
                "test-coverage",
                "code-duplication",
                "build-time",
                "error-rate",
            ],
            "monitoring_alerts": [
                "threshold-violations",
                "security-issues",
                "performance-degradation",
                "test-failures",
            ],
            "monitoring_reporting": {
                "frequency": "daily",
                "format": "json",
                "destinations": ["console", "logs", "notifications"],
            },
            "agent_capabilities": {
                "enforcer": [
                    "compliance-monitoring",
                    "threshold-enforcement",
                    "automation-orchestration",
                ],
                "architect": [
                    "design-review",
                    "architecture-validation",
                    "dependency-analysis",
                ],
                "orchestrator": [
                    "task-coordination",
                    "multi-agent-orchestration",
                    "workflow-management",
                ],
                "bug-triage-specialist": [
                    "error-analysis",
                    "root-cause-identification",
                    "fix-suggestions",
                ],
                "code-reviewer": [
                    "code-quality-assessment",
                    "best-practice-validation",
                    "security-review",
                ],
                "security-auditor": [
                    "vulnerability-detection",
                    "threat-analysis",
                    "security-validation",
                ],
                "refactorer": ["code-modernization", "debt-reduction", "consolidation"],
                "test-architect": [
                    "test-strategy-design",
                    "coverage-optimization",
                    "behavioral-testing",
                ],
            },
        }

        for key, value in defaults.items():
            if key not in self._config_cache:
                self._config_cache[key] = value

    def get_value(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self._config_cache.get(key, default)

    def set_value(self, key: str, value: Any) -> None:
        """Set configuration value."""
        self._config_cache[key] = value

    def get_agent_capabilities(self, agent_name: str) -> List[str]:
        """Get capabilities for specific agent."""
        agent_capabilities = self.get_value("agent_capabilities", {})
        return agent_capabilities.get(
            agent_name,
            ["task-execution", "ai-integration", "state-management", "communication"],
        )

    def save_config(self, path: Optional[Path] = None) -> None:
        """Save current configuration."""
        if path is None:
            path = self.config_paths[0]

        path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(self._config_cache, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving config to {path}: {e}")

    def reload_config(self) -> None:
        """Reload configuration from files."""
        self._config_cache.clear()
        self._load_config()
