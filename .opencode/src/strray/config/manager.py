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
                    with open(config_path, 'r', encoding='utf-8') as f:
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
            'ai_default_provider': 'openai',
            'ai_default_model': 'gpt-4',
            'ai_auto_log_responses': True,
            'model_default': 'opencode/grok-code',
            'agent_default_temperature': 0.3,
            'logging_level': 'INFO',
            'state_dir': '.strray/state',
            'max_concurrent_tasks': 10,
            'timeout_default': 300,
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
        return [
            "task-execution",
            "ai-integration",
            "state-management",
            "communication"
        ]

    def save_config(self, path: Optional[Path] = None) -> None:
        """Save current configuration."""
        if path is None:
            path = self.config_paths[0]

        path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(self._config_cache, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving config to {path}: {e}")

    def reload_config(self) -> None:
        """Reload configuration from files."""
        self._config_cache.clear()
        self._load_config()