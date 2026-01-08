"""Context loader for loading and enforcing project documentation and context."""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
import structlog

logger = structlog.get_logger(__name__)


class ContextLoader:
    """Loads and manages project context from documentation files."""

    def __init__(self, project_root: Optional[Path] = None):
        """Initialize context loader.

        Args:
            project_root: Root directory of the project. Defaults to auto-detection.
        """
        self.project_root = project_root or self._find_project_root()
        self.context_cache: Dict[str, Any] = {}
        self._load_context()

    def _find_project_root(self) -> Path:
        """Find the project root directory."""
        current = Path.cwd()
        # Look for indicators of project root
        for path in [current] + list(current.parents):
            if (path / "AGENTS.md").exists() or (path / "package.json").exists():
                return path
        return current

    def _load_context(self) -> None:
        """Load context from all available documentation files."""
        context_files = [
            ("agents", "AGENTS.md"),
            ("refactoring_log", ".opencode/REFACTORING_LOG.md"),
            ("readme", "strray/README.md"),
            ("config", ".strray/config.json"),  # If exists
        ]

        for context_key, file_path in context_files:
            try:
                full_path = self.project_root / file_path
                if full_path.exists():
                    content = self._read_file_content(full_path)
                    self.context_cache[context_key] = content
                    logger.debug("Loaded context file", file=file_path, key=context_key)
                else:
                    logger.debug("Context file not found", file=file_path)
            except Exception as e:
                logger.warning("Failed to load context file", file=file_path, error=str(e))

        # Also try to load agents_template.md if it exists
        template_path = self.project_root / ".opencode" / "agents_template.md"
        if template_path.exists():
            try:
                content = self._read_file_content(template_path)
                self.context_cache["agents_template"] = content
                logger.debug("Loaded agents template")
            except Exception as e:
                logger.warning("Failed to load agents template", error=str(e))

    def _read_file_content(self, file_path: Path) -> str:
        """Read content from a file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def get_context(self, key: str) -> Optional[str]:
        """Get loaded context by key.

        Args:
            key: Context key ('agents', 'refactoring_log', etc.)

        Returns:
            Context content as string, or None if not found
        """
        return self.context_cache.get(key)

    def get_all_context(self) -> Dict[str, str]:
        """Get all loaded context.

        Returns:
            Dictionary of all context content
        """
        return self.context_cache.copy()

    def has_context(self, key: str) -> bool:
        """Check if specific context is loaded.

        Args:
            key: Context key to check

        Returns:
            True if context is loaded
        """
        return key in self.context_cache

    def validate_context(self) -> List[str]:
        """Validate that required context files are loaded.

        Returns:
            List of missing context keys
        """
        required_context = ["agents", "refactoring_log"]
        missing = []
        for key in required_context:
            if not self.has_context(key):
                missing.append(key)
        return missing

    def get_combined_context(self, keys: Optional[List[str]] = None) -> str:
        """Get combined context from multiple sources.

        Args:
            keys: List of context keys to combine. If None, uses all available.

        Returns:
            Combined context as a single string
        """
        if keys is None:
            keys = list(self.context_cache.keys())

        combined = []
        for key in keys:
            content = self.get_context(key)
            if content:
                combined.append(f"## {key.upper()} CONTEXT\n\n{content}\n\n---\n")

        return "\n".join(combined)

    def enforce_context(self, operation: str, context_keys: Optional[List[str]] = None) -> str:
        """Enforce context loading for a specific operation.

        Args:
            operation: Name of the operation requiring context
            context_keys: Specific context keys to enforce. Defaults to all.

        Returns:
            Combined context for the operation

        Raises:
            ValueError: If required context is missing
        """
        if context_keys is None:
            context_keys = ["agents"]

        missing = [key for key in context_keys if not self.has_context(key)]
        if missing:
            raise ValueError(f"Missing required context for operation '{operation}': {missing}")

        context = self.get_combined_context(context_keys)
        logger.info("Context enforced for operation", operation=operation, context_keys=context_keys)
        return context