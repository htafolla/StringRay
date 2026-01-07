"""Security utilities for input validation and sanitization."""

from typing import Any


class SecurityError(Exception):
    """Security-related errors."""
    pass


class InputValidator:
    """Input validation and sanitization utilities."""

    @staticmethod
    def validate_agent_task(task: str) -> str:
        """Validate agent task input."""
        if not isinstance(task, str):
            raise SecurityError("Task must be a string")

        if not task.strip():
            raise SecurityError("Task cannot be empty")

        if len(task) > 10000:  # Reasonable limit
            raise SecurityError("Task too long")

        # Basic sanitization
        return task.strip()

    @staticmethod
    def validate_agent_name(name: str) -> str:
        """Validate agent name."""
        if not isinstance(name, str):
            raise SecurityError("Agent name must be a string")

        if not name.strip():
            raise SecurityError("Agent name cannot be empty")

        # Allow alphanumeric, underscore, dash
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', name):
            raise SecurityError("Agent name contains invalid characters")

        return name.strip()

    @staticmethod
    def sanitize_string(content: str, max_length: int = 50000) -> str:
        """Sanitize string content for safe processing.

        Args:
            content: The content to sanitize
            max_length: Maximum allowed length

        Returns:
            Sanitized content or None if invalid
        """
        if not content or not content.strip():
            return None

        if len(content) > max_length:
            return None

        # Basic sanitization - remove null bytes and excessive whitespace
        sanitized = content.replace('\x00', '').strip()

        # Ensure it's still valid after sanitization
        if not sanitized:
            return None

        return sanitized