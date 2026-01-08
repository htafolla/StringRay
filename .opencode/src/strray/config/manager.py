"""Configuration management for StrRay framework."""

import os
import json
from pathlib import Path
from typing import Any, Dict, Optional, List

try:
    import yaml

    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    yaml = None


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

            # Add agent YAML configurations
            # When running from .opencode, go up one level to find agents
            agent_config_dir = Path.cwd().parent / ".opencode" / "agents"
            if not agent_config_dir.exists():
                # Fallback: try current directory
                agent_config_dir = Path.cwd() / "agents"

            if agent_config_dir.exists():
                for yaml_file in agent_config_dir.glob("*.yml"):
                    config_paths.append(yaml_file)
                for yaml_file in agent_config_dir.glob("*.yaml"):
                    config_paths.append(yaml_file)

        self.config_paths = config_paths
        self._config_cache: Dict[str, Any] = {}
        self._agent_yaml_configs: Dict[str, Dict[str, Any]] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Load configuration from available files."""
        for config_path in self.config_paths:
            if config_path.exists():
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        if (
                            config_path.suffix.lower() == ".yaml"
                            or config_path.suffix.lower() == ".yml"
                        ):
                            if YAML_AVAILABLE:
                                config_data = yaml.safe_load(f)
                                # Check if this is an agent YAML config
                                if (
                                    isinstance(config_data, dict)
                                    and "name" in config_data
                                ):
                                    agent_name = config_data["name"]
                                    self._agent_yaml_configs[agent_name] = config_data
                                else:
                                    self._config_cache.update(config_data)
                            else:
                                print(
                                    f"Warning: YAML support not available, skipping {config_path}"
                                )
                                continue
                        else:
                            config_data = json.load(f)
                            self._config_cache.update(config_data)
                except (json.JSONDecodeError, IOError, yaml.YAMLError) as e:
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
        # Default capabilities - could be extended
        return ["task-execution", "ai-integration", "state-management", "communication"]

    def get_agent_config(self, agent_name: str) -> Dict[str, Any]:
        """Get configuration for a specific agent, including YAML settings."""
        # Start with basic agent config from JSON
        agent_config = self._config_cache.get(agent_name, {}).copy()

        # Merge with YAML configuration if available
        if agent_name in self._agent_yaml_configs:
            yaml_config = self._agent_yaml_configs[agent_name]
            # YAML takes precedence for detailed enterprise settings
            agent_config.update(yaml_config)

        return agent_config

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
