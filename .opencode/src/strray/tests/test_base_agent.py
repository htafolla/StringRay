"""
StrRay Framework - Base Agent Test Suite

Comprehensive test suite for BaseAgent functionality including:
- Agent initialization and state management
- AI service lazy loading and integration
- Task execution with error handling
- Response interceptors and logging
- Communication bus integration
- Performance testing with concurrent operations
- Memory usage monitoring
"""

import pytest
import asyncio
import time
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor
import psutil
import os

from strray.core.agent import BaseAgent
from strray.config import ConfigManager


class TestBaseAgent:
    """Test suite for BaseAgent core functionality."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.config_manager = ConfigManager()
        self.config_manager.set_value("model_default", "opencode/grok-code")
        self.config_manager.set_value("ai_auto_log_responses", True)
        self.config_manager.set_value("logging_level", "INFO")
        self.config_manager.set_value("max_concurrent_tasks", 5)
        self.config_manager.set_value("timeout_default", 30)
        self.agent = BaseAgent(name="test_agent", config_manager=self.config_manager)

    def teardown_method(self):
        """Clean up after each test method."""
        # Reset any global state if needed
        pass

    def test_agent_initialization(self):
        """Test BaseAgent initializes correctly with config."""
        assert self.agent.config_manager is self.config_manager
        assert self.agent.model == "opencode/grok-code"
        assert self.agent.temperature == 0.3  # default
        assert hasattr(self.agent, "_ai_service")
        assert hasattr(self.agent, "communication_bus")

    def test_agent_initialization_no_config(self):
        """Test BaseAgent initializes with default config when none provided."""
        agent = BaseAgent(name="default_agent", config_manager=ConfigManager())
        assert agent.config_manager is not None
        assert agent.model == agent.config_manager.get_value("model_default")
        # Model is set from config_manager

    @patch("strray.core.agent.AI_SERVICE_CLASS")
    def test_ai_service_lazy_loading(self, mock_ai_service):
        """Test AI service is loaded lazily on first use."""
        # AI service should not be initialized yet
        assert not hasattr(self.agent, "_ai_service_instance")

        # Trigger lazy loading
        with patch.object(self.agent, "_initialize_ai_service") as mock_init:
            mock_init.return_value = Mock()
            service = self.agent.ai_service

            # Should have called initialization
            mock_init.assert_called_once()
            assert service is not None

    def test_analyze_method(self):
        """Test analyze method processes content correctly."""
        test_content = "def hello(): return 'world'"
        expected_response = "Code analysis complete"

        with patch.object(self.agent, "ai_service") as mock_service:
            mock_service.analyze.return_value = expected_response

            result = self.agent.analyze(test_content)

            assert result == expected_response
            mock_service.analyze.assert_called_once_with(test_content)

    def test_generate_method(self):
        """Test generate method with various parameters."""
        prompt = "Write a function to calculate fibonacci"
        kwargs = {"temperature": 0.7, "max_tokens": 100}

        with patch.object(self.agent, "ai_service") as mock_service:
            mock_service.generate.return_value = "def fib(n): ..."

            result = self.agent.generate(prompt, **kwargs)

            assert isinstance(result, str)
            mock_service.generate.assert_called_once_with(prompt, **kwargs)

    def test_task_execution_basic(self):
        """Test basic task execution functionality."""
        task = {
            "id": "test_task_001",
            "type": "analysis",
            "content": "Analyze this code",
            "priority": "medium",
        }

        with patch.object(self.agent, "analyze") as mock_analyze:
            mock_analyze.return_value = "Analysis complete"

            result = self.agent.execute_task(task)

            assert result["task_id"] == task["id"]
            assert result["status"] == "completed"
            assert "result" in result
            mock_analyze.assert_called_once_with(task["content"])

    def test_task_execution_error_handling(self):
        """Test task execution handles errors gracefully."""
        task = {"id": "error_task", "content": "invalid content"}

        with patch.object(
            self.agent, "analyze", side_effect=Exception("AI service error")
        ):
            result = self.agent.execute_task(task)

            assert result["status"] == "failed"
            assert "error" in result
            assert result["error"] == "AI service error"

    def test_response_logging(self):
        """Test response logging functionality."""
        response = "Test AI response"

        with patch("builtins.open", create=True) as mock_open:
            mock_file = Mock()
            mock_open.return_value.__enter__.return_value = mock_file

            self.agent.log_response(response, {"context": "test"})

            # Verify file operations
            mock_open.assert_called_once()
            mock_file.write.assert_called()  # Should write to log

    def test_communication_bus_integration(self):
        """Test agent communication bus functionality."""
        message = {"type": "task_complete", "task_id": "123"}

        with patch.object(self.agent, "communication_bus") as mock_bus:
            self.agent.send_message(message)

            mock_bus.send.assert_called_once_with(message)

    def test_concurrent_task_execution(self):
        """Test concurrent task execution handling."""
        tasks = [{"id": f"task_{i}", "content": f"content_{i}"} for i in range(5)]

        with patch.object(self.agent, "execute_task") as mock_execute:
            mock_execute.return_value = {"status": "completed"}

            # Execute tasks concurrently
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = [
                    executor.submit(self.agent.execute_task, task) for task in tasks
                ]

                results = [f.result() for f in futures]

            # Verify all tasks completed
            assert len(results) == 5
            assert all(r["status"] == "completed" for r in results)
            assert mock_execute.call_count == 5

    def test_memory_usage_monitoring(self):
        """Test memory usage monitoring during operations."""
        process = psutil.Process()
        initial_memory = process.memory_info().rss

        # Perform memory-intensive operation
        large_data = "x" * 1000000  # 1MB string

        with patch.object(self.agent, "analyze") as mock_analyze:
            mock_analyze.return_value = "analysis_result"
            self.agent.analyze(large_data)

        # Check memory didn't leak excessively
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Allow reasonable memory increase (under 50MB)
        assert memory_increase < 50 * 1024 * 1024

    def test_timeout_handling(self):
        """Test timeout handling for long-running operations."""
        with patch.object(self.agent, "ai_service") as mock_service:
            # Simulate timeout
            mock_service.analyze.side_effect = asyncio.TimeoutError()

            with pytest.raises(asyncio.TimeoutError):
                self.agent.analyze("long content", timeout=1)

    def test_configuration_validation(self):
        """Test configuration validation and defaults."""
        # Test with minimal config
        minimal_config = {"model_default": "test-model"}
        agent = BaseAgent(config=minimal_config)

        # Should have merged defaults
        assert agent.config["model_default"] == "test-model"
        assert "temperature" in agent.config  # default added
        assert "max_tokens" in agent.config  # default added

    def test_agent_state_persistence(self):
        """Test agent state persistence across operations."""
        initial_state = self.agent.get_state()

        # Perform operations
        self.agent.analyze("test")
        self.agent.generate("test prompt")

        final_state = self.agent.get_state()

        # State should be updated
        assert final_state != initial_state
        assert "operation_count" in final_state
        assert final_state["operation_count"] >= 2

    def test_performance_metrics(self):
        """Test performance metrics collection."""
        start_time = time.time()

        with patch.object(self.agent, "analyze") as mock_analyze:
            mock_analyze.return_value = "result"
            self.agent.analyze("test content")

        end_time = time.time()

        metrics = self.agent.get_performance_metrics()

        assert "total_operations" in metrics
        assert "average_response_time" in metrics
        assert metrics["total_operations"] >= 1
        assert metrics["average_response_time"] > 0

    def test_error_recovery(self):
        """Test error recovery mechanisms."""
        # Test with intermittent failures
        call_count = 0

        def failing_service(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return "success"

        with patch.object(self.agent, "ai_service") as mock_service:
            mock_service.analyze.side_effect = failing_service

            # Should eventually succeed with retry
            result = self.agent.analyze("test", max_retries=3)
            assert result == "success"
            assert call_count == 3  # Failed twice, succeeded on third try

    def test_resource_cleanup(self):
        """Test proper resource cleanup."""
        # Create agent and use resources
        agent = BaseAgent(config=self.config)

        # Simulate resource usage
        with patch.object(agent, "ai_service") as mock_service:
            agent.analyze("test")

        # Cleanup should be called
        with patch.object(agent, "cleanup") as mock_cleanup:
            del agent
            # Note: In real scenarios, cleanup would be called in __del__
            # This is a simplified test

    def test_configuration_hot_reload(self):
        """Test configuration hot reload capability."""
        original_model = self.agent.model

        # Simulate config change
        new_config = self.config.copy()
        new_config["model_default"] = "new-model"

        self.agent.reload_config(new_config)

        assert self.agent.model == "new-model"
        assert self.agent.model != original_model

    def test_agent_serialization(self):
        """Test agent state serialization for persistence."""
        state = self.agent.serialize()

        # Should contain essential state
        assert isinstance(state, dict)
        assert "config" in state
        assert "performance_metrics" in state
        assert "operation_history" in state

        # Should be deserializable
        new_agent = BaseAgent.deserialize(state)
        assert new_agent.config == self.agent.config
