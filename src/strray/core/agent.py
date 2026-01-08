"""Base Agent class with state management and async coordination."""

import asyncio
import json
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union
from enum import Enum
import structlog

from strray.config.manager import ConfigManager
from strray.security import InputValidator, SecurityError
from strray.performance.monitor import PerformanceMonitor
from .codex_loader import CodexLoader, CodexViolationError, get_default_codex_loader

logger = structlog.get_logger(__name__)


class AgentState(Enum):
    """Agent execution states."""

    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentCapability(Enum):
    """Standard agent capabilities."""

    COMPLIANCE_MONITORING = "compliance-monitoring"
    DESIGN_REVIEW = "design-review"
    TASK_COORDINATION = "task-coordination"
    ERROR_ANALYSIS = "error-analysis"
    CODE_QUALITY_ASSESSMENT = "code-quality-assessment"
    VULNERABILITY_DETECTION = "vulnerability-detection"
    CODE_MODERNIZATION = "code-modernization"
    TEST_STRATEGY_DESIGN = "test-strategy-design"


@dataclass
class AgentContext:
    """Execution context for agent operations."""

    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: Optional[str] = None
    parent_agent: Optional[str] = None
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    timeout: Optional[float] = None
    priority: int = 1
    tags: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResult:
    """Result of agent operation."""

    agent_name: str
    session_id: str
    success: bool
    data: Any = None
    error: Optional[str] = None
    duration: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "agent_name": self.agent_name,
            "session_id": self.session_id,
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "duration": self.duration,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


class AgentStateManager:
    """Manages agent state persistence and recovery."""

    def __init__(self, state_dir: Optional[Path] = None):
        """Initialize state manager."""
        self.state_dir = state_dir or Path.cwd() / ".strray" / "state"
        self.state_dir.mkdir(parents=True, exist_ok=True)

    def save_state(
        self, agent_name: str, session_id: str, state: Dict[str, Any]
    ) -> None:
        """Save agent state to disk."""
        state_file = self.state_dir / f"{agent_name}_{session_id}.json"
        try:
            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "agent_name": agent_name,
                        "session_id": session_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "state": state,
                    },
                    f,
                    indent=2,
                    ensure_ascii=False,
                )
            logger.debug("Agent state saved", agent=agent_name, session=session_id)
        except Exception as e:
            logger.error("Failed to save agent state", agent=agent_name, error=str(e))

    def load_state(self, agent_name: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Load agent state from disk."""
        state_file = self.state_dir / f"{agent_name}_{session_id}.json"
        try:
            if state_file.exists():
                with open(state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                logger.debug("Agent state loaded", agent=agent_name, session=session_id)
                return data.get("state", {})
        except Exception as e:
            logger.error("Failed to load agent state", agent=agent_name, error=str(e))
        return None

    def cleanup_old_states(self, max_age_days: int = 7) -> None:
        """Clean up old state files."""
        cutoff = datetime.now(timezone.utc).timestamp() - (max_age_days * 24 * 60 * 60)

        for state_file in self.state_dir.glob("*.json"):
            try:
                if state_file.stat().st_mtime < cutoff:
                    state_file.unlink()
                    logger.debug("Cleaned up old state file", file=state_file.name)
            except Exception as e:
                logger.error(
                    "Failed to cleanup state file", file=state_file.name, error=str(e)
                )


class BaseAgent(ABC):
    """Base Agent class with state management and async coordination."""

    def __init__(
        self,
        name: str,
        config_manager: ConfigManager,
        capabilities: Optional[List[str]] = None,
        model: Optional[str] = None,
        temperature: float = 0.3,
        state_dir: Optional[Path] = None,
    ):
        """Initialize base agent."""
        self.name = name
        self.config_manager = config_manager
        self.capabilities = capabilities or self.config_manager.get_agent_capabilities(
            name
        )
        self.model = model or self.config_manager.get_value(
            "model_default", "opencode/grok-code"
        )
        self.temperature = temperature

        # State management
        self.state_manager = AgentStateManager(state_dir)
        self.current_state = AgentState.IDLE
        self.context: Optional[AgentContext] = None
        self._running_tasks: Set[asyncio.Task] = set()

        # Coordination
        self._coordination_queue: asyncio.Queue = asyncio.Queue()
        self._shutdown_event = asyncio.Event()

        # Communication bus (set externally)
        self.communication_bus = None

        # Performance monitoring
        self._performance_monitor = PerformanceMonitor()

        # AI service (lazy-loaded to avoid circular imports)
        self._ai_service = None

        # Response interceptor for auto-logging direct responses
        self._response_interceptor = self._create_response_interceptor()

        self.codex_loader = get_default_codex_loader()
        self.codex_enabled = self.config_manager.get_value("codex_enabled", True)
        self._codex_manifest = None

        if self.codex_enabled and self.codex_loader.is_loaded:
            self._codex_manifest = self.codex_loader.get_manifest()
            logger.info(
                "Codex loaded",
                agent=name,
                codex_version=self._codex_manifest.get("version"),
                terms_count=self._codex_manifest.get("term_count"),
            )

        logger.info("Agent initialized", agent=name, capabilities=self.capabilities)

    def _create_response_interceptor(self):
        """Create response interceptor for auto-logging."""

        def intercept_response(response):
            if isinstance(response, str) and response.strip():
                self.log_response_sync(response)
            return response

        return intercept_response

    def process_response(self, response: Any) -> Any:
        """Process response through interceptor - override in subclasses or use as hook."""
        return self._response_interceptor(response)

    @property
    def ai_service(self):
        """Get AI service instance with auto-logging enabled."""
        if self._ai_service is None:
            # Lazy import to avoid circular dependencies
            from strray.ai.service import MockAIService as AIService

            self._ai_service = AIService(
                provider=self.config_manager.get_value("ai_default_provider", "openai"),
                model=self.config_manager.get_value("ai_default_model", "gpt-4"),
                config=self.config_manager,
                auto_log=True,  # ALWAYS ENABLED for comprehensive logging
            )
        return self._ai_service

    async def analyze_with_ai(
        self, content: str, task: str, **kwargs
    ) -> Dict[str, Any]:
        """Analyze content using AI service with automatic response logging.

        Args:
            content: Content to analyze
            task: Analysis task description
            **kwargs: Additional AI service parameters

        Returns:
            Analysis results from AI service
        """
        try:
            # Perform AI analysis
            result = await self.ai_service.analyze(content, task, **kwargs)

            # Automatic async logging of AI response (success case) - ALWAYS ENABLED
            asyncio.create_task(
                self._trigger_logging_hooks_async(result, "analysis", content, task)
            )

            return result

        except Exception as e:
            # Automatic async logging of AI failure (error case) - ALWAYS ENABLED
            asyncio.create_task(
                self._trigger_logging_hooks_async(
                    {"error": str(e), "error_type": type(e).__name__},
                    "analysis_failed",
                    content,
                    task,
                )
            )

            logger.error("AI analysis failed", agent=self.name, error=str(e))
            raise

    async def generate_with_ai(self, prompt: str, **kwargs) -> str:
        """Generate content using AI service with automatic response logging.

        Args:
            prompt: Generation prompt
            **kwargs: Additional AI service parameters

        Returns:
            Generated content from AI service
        """
        try:
            # Perform AI generation
            result = await self.ai_service.generate(prompt, **kwargs)

            # Automatic async logging of AI response (success case) - ALWAYS ENABLED
            asyncio.create_task(
                self._trigger_logging_hooks_async(
                    result, "generation", prompt, "content_generation"
                )
            )

            return result

        except Exception as e:
            # Automatic async logging of AI failure (error case) - ALWAYS ENABLED
            asyncio.create_task(
                self._trigger_logging_hooks_async(
                    {"error": str(e), "error_type": type(e).__name__},
                    "generation_failed",
                    prompt,
                    "content_generation",
                )
            )

            logger.error("AI generation failed", agent=self.name, error=str(e))
            raise

    async def _log_ai_analysis_completion(
        self, task: str, content: str, result: Dict[str, Any]
    ):
        """Log successful AI analysis at agent level."""
        try:
            summary = f"""## 🤖 Agent AI Analysis: {self.name}

**Agent**: {self.name}
**Task**: {task}
**Analysis Result**: {str(result)[:500]}{'...' if len(str(result)) > 500 else ''}
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""
            self.log_response_sync(summary)
        except Exception as e:
            logger.error(
                "Error logging agent AI analysis completion",
                agent=self.name,
                error=str(e),
            )

    async def _log_ai_analysis_error(self, task: str, content: str, error: Exception):
        """Log AI analysis error at agent level."""
        try:
            summary = f"""## ❌ Agent AI Analysis Error: {self.name}

**Agent**: {self.name}
**Task**: {task}
**Error**: {str(error)}
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""
            self.log_response_sync(summary)
        except Exception as e:
            logger.error(
                "Error logging agent AI analysis error", agent=self.name, error=str(e)
            )

    async def _log_ai_generation_completion(self, prompt: str, result: str):
        """Log successful AI generation at agent level."""
        try:
            summary = f"""## 🤖 Agent AI Generation: {self.name}

**Agent**: {self.name}
**Generated Length**: {len(result)} characters
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""
            self.log_response_sync(summary)
        except Exception as e:
            logger.error(
                "Error logging agent AI generation completion",
                agent=self.name,
                error=str(e),
            )

    async def _log_ai_generation_error(self, prompt: str, error: Exception):
        """Log AI generation error at agent level."""
        try:
            summary = f"""## ❌ Agent AI Generation Error: {self.name}

**Agent**: {self.name}
**Error**: {str(error)}
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""
            self.log_response_sync(summary)
        except Exception as e:
            logger.error(
                "Error logging agent AI generation error", agent=self.name, error=str(e)
            )
        """Log task completion output verbatim to REFACTORING_LOG.md."""
        try:
            # Format the actual output verbatim
            verbatim_output = f"""## 🤖 Agent Task Completion: {self.name}

**Agent**: {self.name}
**Task**: {task}
**Execution Time**: {duration:.2f} seconds
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
**Capabilities Used**: {', '.join(self.capabilities)}

### Actual Output

{self._format_result_verbatim(result_data)}

### Agent Context
- Agent Type: {self.__class__.__name__}
- Session ID: {getattr(self.context, 'session_id', 'unknown') if self.context else 'unknown'}
- Framework Version: StrRay v1.1.0
- Auto-logged: True

### Performance Metrics
- Task Duration: {duration:.2f}s
- Success Status: ✅ Completed
- Result Size: {len(str(result_data))} characters"""

            # Log verbatim output directly to REFACTORING_LOG.md
            success = await self._append_to_refactoring_log(verbatim_output)

            if success:
                logger.info(
                    "Task completion output logged verbatim",
                    agent=self.name,
                    task=task[:50],
                )
            else:
                logger.warning(
                    "Failed to log task completion output",
                    agent=self.name,
                    task=task[:50],
                )

        except Exception as e:
            logger.error(
                "Error logging task completion output", agent=self.name, error=str(e)
            )

    def _format_result_verbatim(self, result_data: Any) -> str:
        """Format result data verbatim for logging."""
        import json

        try:
            # Try to format as pretty JSON if it's a dict/list
            if isinstance(result_data, (dict, list)):
                return json.dumps(result_data, indent=2, ensure_ascii=False)
            else:
                # Return the actual string representation
                return str(result_data)
        except Exception:
            # Fallback to string representation
            return str(result_data)

    def _format_result_summary(self, result_data: Any) -> str:
        """Format result data for logging summary."""
        if isinstance(result_data, dict):
            # Format dictionary results
            formatted = []
            for key, value in result_data.items():
                if isinstance(value, (list, dict)):
                    formatted.append(
                        f"- **{key}**: {type(value).__name__} with {len(value)} items"
                    )
                else:
                    formatted.append(
                        f"- **{key}**: {str(value)[:100]}{'...' if len(str(value)) > 100 else ''}"
                    )
            return "\n".join(formatted)
        elif isinstance(result_data, list):
            return (
                f"List with {len(result_data)} items:\n"
                + "\n".join(f"- {item}" for item in result_data[:5])
                + (
                    f"\n... and {len(result_data) - 5} more items"
                    if len(result_data) > 5
                    else ""
                )
            )
        else:
            result_str = str(result_data)
            if len(result_str) > 500:
                return result_str[:500] + "...[truncated]"
            return result_str

    async def _append_to_refactoring_log(self, content: str) -> bool:
        """Append content directly to REFACTORING_LOG.md."""
        try:
            import os

            # Find the project root and REFACTORING_LOG.md
            current_file = os.path.abspath(__file__)
            # Navigate up: .opencode/src/strray/core/agent.py -> .opencode/src/strray/core -> .opencode/src/strray -> .opencode/src -> .opencode -> project_root
            project_root = os.path.dirname(
                os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
                )
            )
            log_file = os.path.join(project_root, ".opencode", "REFACTORING_LOG.md")

            logger.debug(
                "Attempting to log to file",
                log_file=log_file,
                exists=os.path.exists(log_file),
            )

            # Format the entry with proper separators
            entry = f"\n\n---\n\n{content}\n\n---\n\n_This entry was automatically logged by the StrRay Framework agent system._"

            # Append to the log file
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(entry)

            logger.debug(
                "Successfully appended to REFACTORING_LOG.md",
                content_length=len(content),
            )
            return True

        except Exception as e:
            logger.error(
                "Failed to append to REFACTORING_LOG.md", error=str(e), file=__file__
            )
            return False

    async def _trigger_logging_hooks_async(
        self, content: Any, operation_type: str, original_input: str, task: str
    ):
        """Trigger manual piping logging asynchronously for AI responses."""
        try:
            # Pipe the raw AI response content directly (not formatted) to maintain readability
            if isinstance(content, dict):
                import json

                raw_content = json.dumps(content, indent=2, ensure_ascii=False)
            else:
                raw_content = str(content)

            # Execute manual piping logging asynchronously with raw content
            await self._execute_manual_piping_logging_async(raw_content)

        except Exception as e:
            logger.warning(
                "Failed to trigger manual piping logging async",
                agent=self.name,
                error=str(e),
            )

    def _format_response_for_logging(
        self, content: Any, operation_type: str, original_input: str, task: str
    ) -> str:
        """Format AI response content for logging hooks - only the core content."""
        # Return only the raw content without any JSON wrapper or boilerplate
        if isinstance(content, dict):
            import json

            return json.dumps(content, indent=2, ensure_ascii=False)
        else:
            return str(content)

    def log_response_sync(self, content: str) -> None:
        """Synchronously log a response to the REFACTORING_LOG.md."""
        try:
            import subprocess
            import os

            # Get project root for script path
            current_file = os.path.abspath(__file__)
            project_root = os.path.dirname(
                os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
                )
            )
            script_path = os.path.join(
                project_root, "scripts", "ai-response-processor.sh"
            )

            # Simple, direct logging via the working script
            result = subprocess.run(
                ["bash", script_path],
                input=content,
                text=True,
                capture_output=True,
                timeout=3,
                cwd=project_root,
            )

            if result.returncode == 0:
                logger.debug(
                    "Response logged successfully",
                    agent=self.name,
                    content_length=len(content),
                )
            else:
                logger.warning(
                    "Response logging failed",
                    agent=self.name,
                    returncode=result.returncode,
                )

        except Exception as e:
            logger.error("Response logging failed", agent=self.name, error=str(e))

    async def _execute_manual_piping_logging_async(self, content: str):
        """Execute logging via manual piping to working scripts."""
        try:
            import subprocess
            import asyncio
            import os

            # Manual piping approach - directly pipe to working logging system
            # This replaces the complex hook execution with simple, reliable piping

            logger.debug("Executing manual piping logging", agent=self.name)

            # Get the project root to locate scripts
            project_root = os.path.dirname(
                os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                )
            )

            # Use the working ai-response-processor.sh for automatic logging
            script_path = os.path.join(
                project_root, "scripts", "ai-response-processor.sh"
            )

            if not os.path.exists(script_path):
                logger.warning(
                    "Logging script not found", agent=self.name, path=script_path
                )
                return

            # Execute the logging script with piped content
            process = await asyncio.create_subprocess_exec(
                "bash",
                script_path,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=project_root,
            )

            # Pipe the formatted content to the logging script
            stdout, stderr = await process.communicate(input=content.encode("utf-8"))

            if process.returncode == 0:
                logger.debug("Manual piping logging successful", agent=self.name)
            else:
                stderr_text = stderr.decode("utf-8", errors="ignore")
                logger.warning(
                    "Manual piping logging failed",
                    agent=self.name,
                    returncode=process.returncode,
                    stderr=stderr_text,
                )

        except Exception as e:
            logger.error("Manual piping logging failed", agent=self.name, error=str(e))

    @classmethod
    def intercept_agent_response(
        cls, agent_name: str, response: str, metadata: dict = None
    ) -> str:
        """Framework API: Intercept any agent response for automatic processing.

        Usage in external framework:
            from strray.core.agent import BaseAgent
            final_response = BaseAgent.intercept_agent_response(agent_name, response, metadata)
        """
        # Always attempt logging first, regardless of interceptor success
        try:
            # Direct logging attempt for reliability - LOG ALL RESPONSES
            if response and response.strip():
                import subprocess
                import os

                current_file = os.path.abspath(__file__)
                project_root = os.path.dirname(
                    os.path.dirname(
                        os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
                    )
                )
                script_path = os.path.join(
                    project_root, "scripts", "ai-response-processor.sh"
                )

                subprocess.run(
                    ["bash", script_path],
                    input=response,
                    text=True,
                    capture_output=True,
                    timeout=2,  # Shorter timeout for reliability
                    cwd=project_root,
                )
        except Exception as e:
            logger.debug("Direct logging attempt failed", error=str(e))

        # Return the original response (pass-through)
        return response

    class ArchitectResponseInterceptor:
        """Framework-level interceptor for auto-logging architect responses."""

        @staticmethod
        def intercept_response(response: str) -> str:
            """Auto-log all architect responses at framework level."""
            from strray.core.agent import BaseAgent

            return BaseAgent.intercept_agent_response("architect", response)

    @classmethod
    def create_summary(
        cls, summary_type: str, rich_content: str = None, **kwargs
    ) -> str:
        """Centralized summary creation method that automatically logs.

        Usage:
            # Rich content (preserves full formatting)
            summary = BaseAgent.create_summary('success',
                rich_content=my_detailed_content
            )

            # Template-based (structured)
            summary = BaseAgent.create_summary('ai_analysis',
                agent_name='architect',
                task='code_review',
                result='Analysis complete',
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            # Automatically logged!

        Args:
            summary_type: Type of summary ('ai_analysis', 'error', 'plan', 'success', 'status')
            rich_content: Full rich content to log directly (bypasses templates)
            **kwargs: Summary-specific parameters for template generation

        Returns:
            Formatted summary string (already logged)
        """
        # Use rich content directly if provided
        if rich_content:
            summary = rich_content
        else:
            # Create the summary based on type using templates
            if summary_type == "ai_analysis":
                summary = cls._create_ai_analysis_summary(**kwargs)
            elif summary_type == "error":
                summary = cls._create_error_summary(**kwargs)
            elif summary_type == "plan":
                summary = cls._create_plan_summary(**kwargs)
            elif summary_type == "success":
                summary = cls._create_success_summary(**kwargs)
            elif summary_type == "status":
                summary = cls._create_status_summary(**kwargs)
            else:
                # Generic summary
                summary = cls._create_generic_summary(summary_type, **kwargs)

        # Automatically log it
        cls.log_response(summary)

        return summary

    @classmethod
    def _create_ai_analysis_summary(
        cls,
        agent_name: str,
        task: str,
        result: str,
        timestamp: str,
        rich_content: str = None,
    ) -> str:
        """Create AI analysis summary with standard format or rich content."""
        if rich_content:
            return rich_content
        return f"""## 🤖 Agent AI Analysis: {agent_name}

**Agent**: {agent_name}
**Task**: {task}
**Analysis Result**: {result[:500]}{'...' if len(result) > 500 else ''}
**Timestamp**: {timestamp}
"""

    @classmethod
    def _create_error_summary(
        cls,
        agent_name: str,
        task: str,
        error: str,
        timestamp: str,
        rich_content: str = None,
    ) -> str:
        """Create error summary with standard format or rich content."""
        if rich_content:
            return rich_content
        return f"""## ❌ Agent AI Analysis Error: {agent_name}

**Agent**: {agent_name}
**Task**: {task}
**Error**: {error}
**Timestamp**: {timestamp}
"""

    @classmethod
    def _create_plan_summary(
        cls,
        plan_type: str,
        objective: str,
        steps: list,
        expected_result: str,
        rich_content: str = None,
    ) -> str:
        """Create plan summary with standard format or rich content."""
        if rich_content:
            return rich_content
        steps_formatted = "\n".join(f"{i+1}. {step}" for i, step in enumerate(steps))
        return f"""## 📋 {plan_type} Plan

**Objective**: {objective}
**Steps**:
{steps_formatted}
**Expected Result**: {expected_result}
"""

    @classmethod
    def _create_success_summary(
        cls,
        achievement_type: str,
        sections: dict,
        key_metric: str = None,
        value: str = None,
        rich_content: str = None,
    ) -> str:
        """Create success summary with standard format or rich content."""
        if rich_content:
            # Use rich content directly if provided
            return rich_content

        # Fallback to standard format
        sections_formatted = "\n".join(f"### {k}\n{v}" for k, v in sections.items())
        metric_line = f"\n**{key_metric}**: {value}" if key_metric and value else ""
        return f"""## ✅ {achievement_type}

{sections_formatted}{metric_line}
"""

    @classmethod
    def _create_status_summary(
        cls,
        status_type: str,
        subject: str,
        status_desc: str,
        mechanism: str,
        sections: dict,
        rich_content: str = None,
    ) -> str:
        """Create status summary with standard format or rich content."""
        if rich_content:
            return rich_content
        sections_formatted = "\n".join(f"### {k}\n{v}" for k, v in sections.items())
        return f"""## 🎯 {status_type}: {subject}

**Status**: ✅ {status_desc}
**Mechanism**: {mechanism}
{sections_formatted}
"""

    @classmethod
    def _create_generic_summary(
        cls, summary_type: str, rich_content: str = None, **kwargs
    ) -> str:
        """Create generic summary for unsupported types."""
        if rich_content:
            return rich_content
        emoji_map = {
            "analysis": "🔍",
            "implementation": "🚀",
            "data": "📊",
            "documentation": "📝",
            "warning": "⚠️",
        }
        emoji = emoji_map.get(summary_type, "📋")
        content = "\n".join(f"**{k}**: {v}" for k, v in kwargs.items())
        return f"""## {emoji} {summary_type.title()} Summary

{content}
"""

    @classmethod
    def log_response(cls, response: str) -> None:
        """DEPRECATED: Use create_summary() for automatic logging or log_response_sync() for manual logging.

        This method is deprecated. Use BaseAgent.create_summary() for automatic logging of structured summaries,
        or agent.log_response_sync() for manual logging of arbitrary content.

        Usage (deprecated):
            BaseAgent.log_response(response_content)  # DEPRECATED
        """
        # Mark as deprecated but still functional for backward compatibility
        import warnings

        warnings.warn(
            "BaseAgent.log_response() is deprecated. Use BaseAgent.create_summary() for automatic logging.",
            DeprecationWarning,
            stacklevel=2,
        )

        # Create a minimal agent instance for logging
        try:
            from strray.config.manager import ConfigManager

            config = ConfigManager()
            agent = cls("logging_agent", config)
            agent.log_response_sync(response)
        except Exception as e:
            # Fallback: direct script call
            import subprocess
            import os

            current_file = os.path.abspath(__file__)
            project_root = os.path.dirname(
                os.path.dirname(
                    os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
                )
            )
            script_path = os.path.join(
                project_root, "scripts", "ai-response-processor.sh"
            )

            try:
                subprocess.run(
                    [["bash", script_path]],
                    input=response,
                    text=True,
                    capture_output=True,
                    timeout=3,
                    cwd=project_root,
                )
            except Exception:
                pass  # Silent failure for static method

    @property
    def is_running(self) -> bool:
        """Check if agent is currently running."""
        return self.current_state in [AgentState.RUNNING, AgentState.WAITING]

    async def execute(
        self, task: str, context: Optional[AgentContext] = None, **kwargs
    ) -> AgentResult:
        """Execute agent task with full lifecycle management."""
        start_time = datetime.now(timezone.utc)

        # Security validation
        try:
            validated_task = InputValidator.validate_agent_task(task)
        except SecurityError as e:
            logger.warning("Task validation failed", agent=self.name, error=str(e))
            return AgentResult(
                agent_name=self.name,
                session_id=context.session_id if context else "unknown",
                success=False,
                error=f"Security validation failed: {e}",
                duration=0.0,
            )

        # Codex pre-validation (zero-tolerance blocking)
        if self.codex_enabled and self.codex_loader.is_loaded:
            try:
                self.validate_action_blocking(validated_task, kwargs)
            except CodexViolationError as e:
                logger.error(
                    "Codex violation blocked execution",
                    agent=self.name,
                    term_id=e.term_id,
                    error=str(e),
                )
                return AgentResult(
                    agent_name=self.name,
                    session_id=context.session_id if context else "unknown",
                    success=False,
                    error=f"Codex violation blocked: {e.message}",
                    duration=0.0,
                    metadata={"codex_violation": True, "term_id": e.term_id},
                )

        # Initialize context
        if context is None:
            context = AgentContext()

        self.context = context
        self.current_state = AgentState.INITIALIZING

        try:
            # Load previous state if resuming
            previous_state = self.state_manager.load_state(
                self.name, context.session_id
            )
            if previous_state:
                await self._restore_state(previous_state)
                logger.info(
                    "Agent state restored", agent=self.name, session=context.session_id
                )

            # Execute task
            self.current_state = AgentState.RUNNING
            logger.info(
                "Agent execution started", agent=self.name, task=validated_task[:50]
            )

            # Monitor performance
            start_exec = time.perf_counter()
            result_data = await self._execute_task(validated_task, **kwargs)
            exec_duration = time.perf_counter() - start_exec

            self._performance_monitor.record_metric(
                f"agent.{self.name}.execution",
                exec_duration,
                "seconds",
                {"task": validated_task[:50]},
            )

            # Save final state
            await self._save_current_state()

            self.current_state = AgentState.COMPLETED

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            result = AgentResult(
                agent_name=self.name,
                session_id=context.session_id,
                success=True,
                data=result_data,
                duration=duration,
                metadata={
                    "task": validated_task,
                    "capabilities_used": self.capabilities,
                },
            )

            # Codex post-validation (error prevention metrics)
            if self.codex_enabled and self.codex_loader.is_loaded:
                post_validation = self.validate_codex_compliance(str(result_data))
                result.metadata["codex_post_validation"] = post_validation

                if not post_validation["compliant"]:
                    logger.warning(
                        "Codex violations detected after execution",
                        agent=self.name,
                        violations_count=post_validation["violations_count"],
                    )

                    self._performance_monitor.record_metric(
                        f"codex.{self.name}.post_execution_violations",
                        post_validation["violations_count"],
                        "count",
                        {"critical_count": post_validation["critical_violations"]},
                    )

            # Task completed successfully - process through response interceptor for auto-logging
            processed_result = self.process_response(result_data)

            # Trigger automatic logging for ALL responses - ALWAYS ENABLED
            # Always log all result data as strings to ensure comprehensive logging
            result_str = str(processed_result)
            asyncio.create_task(
                self._trigger_logging_hooks_async(
                    result_str, "task_completion", validated_task, "agent_response"
                )
            )

            logger.info("Agent execution completed", agent=self.name, duration=duration)
            return result

        except Exception as e:
            self.current_state = AgentState.FAILED
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()

            # Record error performance metric
            self._performance_monitor.record_metric(
                f"agent.{self.name}.error_duration",
                duration,
                "seconds",
                {"error_type": type(e).__name__},
            )

            logger.error("Agent execution failed", agent=self.name, error=str(e))

            result = AgentResult(
                agent_name=self.name,
                session_id=context.session_id if context else "unknown",
                success=False,
                error=str(e),
                duration=duration,
                metadata={
                    "task": validated_task if "validated_task" in locals() else task,
                    "failure_point": "execution",
                },
            )

            return result
        finally:
            self.context = None

    async def _execute_task(self, task: str, **kwargs) -> Any:
        """Execute the specific agent task - base implementation delegates to AI service."""
        try:
            # Default implementation: delegate to AI service
            if hasattr(self.ai_service, "execute_task"):
                return await self.ai_service.execute_task(task, **kwargs)
            else:
                # Fallback: treat as analysis task
                return await self.analyze_with_ai(
                    kwargs.get("content", ""),
                    task,
                    **{k: v for k, v in kwargs.items() if k != "content"},
                )
        except Exception as e:
            logger.error(
                "Task execution failed", agent=self.name, task=task, error=str(e)
            )
            raise

    async def send_message(
        self,
        recipient: str,
        message_type: str,
        content: Any,
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send a message to another agent via the communication bus."""
        # Auto-log string content sent via communication bus
        processed_content = self.process_response(content)

        if self.communication_bus:
            await self.communication_bus.send_message(
                sender=self.name,
                recipient=recipient,
                message_type=message_type,
                content=processed_content,
                correlation_id=correlation_id,
                metadata=metadata,
            )
        else:
            logger.warning("No communication bus available", agent=self.name)

    async def broadcast_message(
        self,
        message_type: str,
        content: Any,
        exclude_self: bool = True,
        correlation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Broadcast a message to all agents."""
        if self.communication_bus:
            await self.communication_bus.broadcast_message(
                sender=self.name,
                message_type=message_type,
                content=content,
                exclude_self=exclude_self,
                correlation_id=correlation_id,
                metadata=metadata,
            )
        else:
            logger.warning("No communication bus available", agent=self.name)

    async def request_agent_status(self, target_agent: str) -> Optional[Dict[str, Any]]:
        """Request status from another agent."""
        if not self.communication_bus:
            return None

        # Send status request
        correlation_id = f"status_{self.name}_{target_agent}_{id(self)}"
        await self.send_message(
            recipient=target_agent,
            message_type="status_request",
            content={},
            correlation_id=correlation_id,
        )

        # In a real implementation, we'd wait for the response
        # For now, return None as async response handling would be more complex
        return None

    async def delegate_task(
        self, target_agent: str, task: str, **kwargs
    ) -> Optional[Any]:
        """Delegate a task to another agent."""
        if not self.communication_bus:
            return None

        # Send task request
        correlation_id = f"task_{self.name}_{target_agent}_{id(self)}"
        await self.send_message(
            recipient=target_agent,
            message_type="task_request",
            content={"task": task, "kwargs": kwargs},
            correlation_id=correlation_id,
        )

        # In a real implementation, we'd wait for the response
        # For now, return None as async response handling would be more complex
        return None

    async def coordinate_with_agent(
        self,
        target_agent: "BaseAgent",
        task: str,
        context: Optional[AgentContext] = None,
        timeout: float = 300.0,
    ) -> AgentResult:
        """Coordinate with another agent asynchronously."""
        if not self.context:
            raise AgentError("No active context for agent coordination")

        # Create coordination context
        coord_context = context or AgentContext(
            workflow_id=self.context.workflow_id,
            parent_agent=self.name,
            timeout=timeout,
            priority=self.context.priority,
        )

        # Execute target agent
        try:
            result = await asyncio.wait_for(
                target_agent.execute(task, coord_context), timeout=timeout
            )
            return result
        except asyncio.TimeoutError:
            logger.error(
                "Agent coordination timeout", target=target_agent.name, timeout=timeout
            )
            return AgentResult(
                agent_name=target_agent.name,
                session_id=coord_context.session_id,
                success=False,
                error=f"Coordination timeout after {timeout}s",
                metadata={"coordinator": self.name},
            )

    async def wait_for_coordination(
        self, timeout: float = 60.0
    ) -> Optional[Dict[str, Any]]:
        """Wait for coordination message from other agents."""
        try:
            message = await asyncio.wait_for(
                self._coordination_queue.get(), timeout=timeout
            )
            return message
        except asyncio.TimeoutError:
            return None

    async def send_coordination_message(
        self, target_agent: "BaseAgent", message: Dict[str, Any]
    ) -> None:
        """Send coordination message to another agent."""
        await target_agent._coordination_queue.put(
            {
                "from": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **message,
            }
        )

    async def _save_current_state(self) -> None:
        """Save current agent state."""
        if not self.context:
            return

        state = {
            "current_state": self.current_state.value,
            "context": (
                {
                    "session_id": self.context.session_id,
                    "workflow_id": self.context.workflow_id,
                    "start_time": self.context.start_time.isoformat(),
                    "priority": self.context.priority,
                    "tags": list(self.context.tags),
                    "metadata": self.context.metadata,
                }
                if self.context
                else None
            ),
            "agent_specific": await self._get_agent_state(),
        }

        self.state_manager.save_state(self.name, self.context.session_id, state)

    async def _restore_state(self, state: Dict[str, Any]) -> None:
        """Restore agent state."""
        if "current_state" in state:
            self.current_state = AgentState(state["current_state"])

        if "context" in state and state["context"]:
            ctx_data = state["context"]
            self.context = AgentContext(
                session_id=ctx_data["session_id"],
                workflow_id=ctx_data.get("workflow_id"),
                start_time=datetime.fromisoformat(ctx_data["start_time"]),
                priority=ctx_data.get("priority", 1),
                tags=set(ctx_data.get("tags", [])),
                metadata=ctx_data.get("metadata", {}),
            )

        if "agent_specific" in state:
            await self._restore_agent_state(state["agent_specific"])

    async def _get_agent_state(self) -> Dict[str, Any]:
        """Get agent-specific state - to be overridden by subclasses."""
        return {}

    async def _restore_agent_state(self, state: Dict[str, Any]) -> None:
        """Restore agent-specific state - to be overridden by subclasses."""
        pass

    async def shutdown(self) -> None:
        """Shutdown agent gracefully."""
        logger.info("Agent shutdown initiated", agent=self.name)

        # Cancel running tasks
        for task in self._running_tasks:
            if not task.done():
                task.cancel()

        # Wait for tasks to complete
        if self._running_tasks:
            await asyncio.gather(*self._running_tasks, return_exceptions=True)

        self._shutdown_event.set()
        self.current_state = AgentState.IDLE

        logger.info("Agent shutdown completed", agent=self.name)

    def get_capabilities(self) -> List[str]:
        """Get agent capabilities."""
        return self.capabilities.copy()

    def has_capability(self, capability: Union[str, AgentCapability]) -> bool:
        """Check if agent has specific capability."""
        cap_str = (
            capability.value if isinstance(capability, AgentCapability) else capability
        )
        return cap_str in self.capabilities

    def get_codex_term(self, term_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific codex term by ID.

        Args:
            term_id: Term identifier (1-43)

        Returns:
            Dictionary with term details or None if not found
        """
        if not self.codex_enabled or not self.codex_loader.is_loaded:
            return None

        term = self.codex_loader.get_term(term_id)
        return term.to_dict() if term else None

    def search_codex(self, query: str) -> List[Dict[str, Any]]:
        """Search codex terms by content.

        Args:
            query: Search query string

        Returns:
            List of matching term dictionaries
        """
        if not self.codex_enabled or not self.codex_loader.is_loaded:
            return []

        terms = self.codex_loader.search_terms(query)
        return [term.to_dict() for term in terms]

    def validate_codex_compliance(
        self, code_or_action: str, relevant_terms: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Validate code or action against codex terms.

        Args:
            code_or_action: Code snippet or action description to validate
            relevant_terms: Optional list of term IDs to check. If None, checks all terms.

        Returns:
            Dictionary with validation results:
            {
                "compliant": bool,
                "violations": List[violation_dicts],
                "violations_count": int,
                "critical_violations": int
            }
        """
        if not self.codex_enabled or not self.codex_loader.is_loaded:
            return {
                "compliant": True,
                "violations": [],
                "violations_count": 0,
                "critical_violations": 0,
            }

        is_compliant, violations = self.codex_loader.validate_compliance(
            code_or_action, relevant_terms
        )

        critical_violations = sum(1 for v in violations if v.get("severity") == "high")

        if not is_compliant:
            self._performance_monitor.record_metric(
                f"codex.{self.name}.validation_failures",
                len(violations),
                "count",
                {"critical_violations": critical_violations},
            )

        return {
            "compliant": is_compliant,
            "violations": violations,
            "violations_count": len(violations),
            "critical_violations": critical_violations,
        }

    def validate_action_blocking(
        self, action: str, action_details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Validate action against codex with zero-tolerance blocking.

        Args:
            action: Action description or code to validate
            action_details: Additional context about the action

        Raises:
            CodexViolationError: If zero-tolerance violation detected
        """
        if not self.codex_enabled or not self.codex_loader.is_loaded:
            return

        validation = self.validate_codex_compliance(action)

        if not validation["compliant"]:
            for violation in validation["violations"]:
                severity = violation.get("severity", "low")
                if severity in ["high", "blocking"]:
                    raise CodexViolationError(
                        term_id=violation["term_id"],
                        term_title=violation["term_title"],
                        message=f"Zero-tolerance violation: {violation['message']}",
                    )

        logger.debug("Action passed zero-tolerance validation", action=action[:50])

        self._performance_monitor.record_metric(
            f"codex.{self.name}.validations_passed", 1, "count"
        )

    async def execute_with_codex_context(
        self, task: str, context: Optional[AgentContext] = None, **kwargs
    ) -> AgentResult:
        """Execute agent task with automatic codex context enhancement.

        Wraps the execute() method with:
        - Pre-execution codex compliance validation
        - Codex context injection into AI service calls
        - Post-execution compliance checking

        Args:
            task: Task to execute
            context: Optional agent context
            **kwargs: Additional parameters

        Returns:
            AgentResult with codex validation metadata
        """
        if not self.codex_enabled or not self.codex_loader.is_loaded:
            return await self.execute(task, context, **kwargs)

        start_time = datetime.now(timezone.utc)

        try:
            validation = self.validate_codex_compliance(task)

            if not validation["compliant"] and validation["critical_violations"] > 0:
                logger.warning(
                    "Codex violations detected before execution",
                    task=task[:50],
                    violations_count=validation["violations_count"],
                )

            if context is None:
                context = AgentContext()

            context.metadata["codex_validation"] = validation

            result = await self.execute(task, context, **kwargs)

            if result.success and result.data:
                post_validation = self.validate_codex_compliance(str(result.data))
                result.metadata["codex_post_validation"] = post_validation

                if not post_validation["compliant"]:
                    logger.warning(
                        "Codex violations detected after execution",
                        agent=self.name,
                        violations_count=post_validation["violations_count"],
                    )

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            self._performance_monitor.record_metric(
                "codex.enhanced_execution", duration, "seconds"
            )

            return result

        except CodexViolationError as e:
            logger.error("Codex violation blocked execution", error=str(e))

            self._performance_monitor.record_metric(
                f"codex.{self.name}.blocked_violations",
                1,
                "count",
                {"term_id": e.term_id, "term_title": e.term_title},
            )

            return AgentResult(
                agent_name=self.name,
                session_id=context.session_id if context else "unknown",
                success=False,
                error=f"Codex violation: {e.message}",
                duration=(datetime.now(timezone.utc) - start_time).total_seconds(),
                metadata={"codex_violation": True, "term_id": e.term_id},
            )

    @property
    def codex_manifest(self) -> Optional[Dict[str, Any]]:
        """Get codex manifest with summary information."""
        return self._codex_manifest

    @property
    def codex_available(self) -> bool:
        """Check if codex is loaded and available."""
        return self.codex_enabled and self.codex_loader.is_loaded

    async def handle_message(self, message: Any) -> None:
        """Handle incoming messages from other agents."""
        # Default message handling - can be overridden by subclasses
        logger.info(
            "Received message",
            agent=self.name,
            sender=message.sender,
            type=message.message_type,
        )

        # Basic coordination responses
        if message.message_type == "ping":
            await self.send_message(
                recipient=message.sender,
                message_type="pong",
                content={"status": "ok", "timestamp": message.timestamp.isoformat()},
                correlation_id=message.correlation_id,
            )

        elif message.message_type == "status_request":
            status = self.get_status()
            await self.send_message(
                recipient=message.sender,
                message_type="status_response",
                content=status,
                correlation_id=message.correlation_id,
            )

        elif message.message_type == "state_sync_request":
            # Share current state
            state = await self._get_agent_state()
            await self.send_message(
                recipient=message.sender,
                message_type="state_sync_response",
                content=state,
                correlation_id=message.correlation_id,
            )

        elif message.message_type == "state_update":
            # Receive state update from another agent
            if message.content:
                await self._restore_agent_state(message.content)
                logger.info(
                    "State synchronized from agent",
                    agent=self.name,
                    from_agent=message.sender,
                )

    async def synchronize_state(self, target_agent: str) -> None:
        """Synchronize state with another agent."""
        if not self.communication_bus:
            return

        correlation_id = f"sync_{self.name}_{target_agent}_{id(self)}"
        await self.send_message(
            recipient=target_agent,
            message_type="state_sync_request",
            content={},
            correlation_id=correlation_id,
        )

    def get_status(self) -> Dict[str, Any]:
        """Get agent status information."""
        return {
            "name": self.name,
            "state": (
                self.current_state.value
                if hasattr(self.current_state, "value")
                else str(self.current_state)
            ),
            "capabilities": self.capabilities,
            "model": self.model,
            "temperature": self.temperature,
            "active_session": (
                getattr(self.context, "session_id", None) if self.context else None
            ),
            "running_tasks": len(self._running_tasks),
            "communication_enabled": self.communication_bus is not None,
        }


class AgentError(Exception):
    """Agent-related errors."""

    pass
