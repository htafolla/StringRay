#!/usr/bin/env python3
"""Test script to validate StrRay backend migration."""

import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    # Test imports
    from strray.core.agent import BaseAgent, AgentState
    from strray.config.manager import ConfigManager
    from strray.security import InputValidator
    from strray.performance.monitor import PerformanceMonitor
    from strray.ai.service import AIService

    # Test core orchestration
    from strray.core.orchestration import AsyncCoordinator, ProgressStore, ConflictResolver

    print("✅ All imports successful")

    # Test basic instantiation
    config = ConfigManager()
    agent = BaseAgent("test_agent", config)
    coordinator = AsyncCoordinator()
    progress_store = ProgressStore()
    conflict_resolver = ConflictResolver()

    print("✅ Basic instantiation successful")

    # Test orchestration components
    from strray.core.orchestration import AsyncDelegation
    delegation = AsyncDelegation(
        task_id="test_task",
        agent_type="enforcer",
        priority="high",
        timeout=30,
        retry_policy={"max_retries": 3}
    )

    print("✅ Orchestration components functional")

    print("🎉 Migration and orchestration validation passed!")

except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Validation error: {e}")
    sys.exit(1)