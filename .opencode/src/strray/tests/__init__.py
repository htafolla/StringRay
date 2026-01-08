"""Test fixtures and utilities for StrRay framework tests."""

import pytest
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock

from strray.core.agent import BaseAgent
from strray.config.manager import ConfigManager


@pytest.fixture
def temp_config_file():
    """Create a temporary config file for testing."""
    config_data = {
        "model_default": "opencode/grok-code",
        "ai_auto_log_responses": True,
        "logging_level": "INFO",
        "max_concurrent_tasks": 5,
        "timeout_default": 30
    }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        import json
        json.dump(config_data, f)
        temp_path = f.name

    yield temp_path

    # Cleanup
    os.unlink(temp_path)


@pytest.fixture
def mock_ai_service():
    """Mock AI service for testing."""
    service = Mock()
    service.analyze.return_value = "Mock analysis result"
    service.generate.return_value = "Mock generation result"
    return service


@pytest.fixture
def base_agent(mock_ai_service):
    """Create a BaseAgent instance with mocked AI service."""
    config = {
        'model_default': 'opencode/grok-code',
        'ai_auto_log_responses': True,
        'logging_level': 'INFO'
    }

    agent = BaseAgent(config=config)
    agent.ai_service = mock_ai_service
    return agent


@pytest.fixture
def config_manager(temp_config_file):
    """Create a ConfigManager instance for testing."""
    return ConfigManager(config_paths=[Path(temp_config_file)])


@pytest.fixture
def sample_task():
    """Sample task dictionary for testing."""
    return {
        'id': 'test_task_001',
        'type': 'analysis',
        'content': 'def hello(): return "world"',
        'priority': 'medium',
        'timeout': 30
    }


@pytest.fixture
def sample_response():
    """Sample AI response for testing."""
    return {
        'content': 'Analysis complete: Function returns greeting',
        'confidence': 0.95,
        'metadata': {
            'model': 'opencode/grok-code',
            'tokens': 150,
            'processing_time': 0.234
        }
    }