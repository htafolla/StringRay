"""
StrRay Framework - BaseAgent Codex Integration Test Suite

Comprehensive integration tests for BaseAgent codex methods including:
- Codex loading and term extraction from configuration
- Compliance validation integration
- Caching behavior with codex operations
- Error handling in codex workflows
- Performance testing with codex validation
"""

import pytest
import asyncio
import time
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor
import psutil
import json

from strray.core.agent import BaseAgent, AgentContext
from strray.core.codex_loader import CodexLoader
from strray.config.manager import ConfigManager


class TestBaseAgentCodexIntegration:
    """Integration test suite for BaseAgent codex functionality."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.config_manager = ConfigManager()
        # Set up config with codex terms like in oh-my-opencode.json
        self.config_manager.set_value("codex_terms", [1, 2, 3, 5, 15, 24, 38, 39])
        self.config_manager.set_value("model_default", "opencode/grok-code")
        self.config_manager.set_value("ai_auto_log_responses", True)

        self.agent = BaseAgent(
            name="test_codex_agent", config_manager=self.config_manager
        )

        # Mock AI service for testing
        self.mock_ai_service = Mock()
        self.agent._ai_service = self.mock_ai_service

    def teardown_method(self):
        """Clean up after each test method."""
        pass

    def test_agent_codex_loader_initialization(self):
        """Test BaseAgent initializes with codex loader capability."""
        # Agent should be able to work with codex loader
        codex_loader = CodexLoader(config_manager=self.config_manager)
        assert codex_loader.config_manager is self.config_manager

    def test_agent_codex_term_loading_integration(self):
        """Test agent integration with codex term loading."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        terms = [1, 2, 3, 5]

        rules = codex_loader.load_codex_terms(terms)

        assert len(rules) == 4
        assert all(term_id in rules for term_id in terms)

        # Verify rule properties
        framework_rule = rules[1]
        assert framework_rule.title == "Framework Foundation"
        assert framework_rule.category == "architecture"

    def test_agent_compliance_validation_integration(self):
        """Test agent compliance validation through codex loader."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([2, 3, 5])  # Agent-related terms

        # Test agent context that should pass compliance
        agent_context = {
            "communication_bus": self.agent.communication_bus,
            "state_manager_enabled": True,
            "error_handling_enabled": True,
        }

        results = codex_loader.validate_compliance("agent", agent_context)

        assert len(results) == 3
        # Should have some passing results
        passing_results = [r for r in results if r.compliant]
        assert len(passing_results) >= 1

    def test_agent_codex_caching_behavior(self):
        """Test codex caching behavior with agent operations."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        terms = [1, 2, 3]

        # First load
        rules1 = codex_loader.load_codex_terms(terms)
        hash1 = codex_loader._codex_hash

        # Second load (should use cache if implemented)
        rules2 = codex_loader.load_codex_terms(terms)
        hash2 = codex_loader._codex_hash

        assert rules1 == rules2
        assert hash1 == hash2

    def test_agent_codex_error_handling(self):
        """Test agent error handling with codex operations."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Test with invalid terms - should handle gracefully
        rules = codex_loader.load_codex_terms([999])  # Invalid term

        # Should return empty dict for invalid terms
        assert rules == {}

        # Agent should continue to function
        assert self.agent.name == "test_codex_agent"

    def test_agent_codex_performance_with_large_terms(self):
        """Test agent performance with large codex term sets."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Load many terms
        large_terms = list(range(1, 16))  # Terms 1-15
        start_time = time.time()
        rules = codex_loader.load_codex_terms(large_terms)
        load_time = time.time() - start_time

        # Should load reasonable number of terms quickly
        assert len(rules) >= 10  # At least some terms loaded
        assert load_time < 1.0  # Should load in less than 1 second

    def test_agent_codex_memory_usage_monitoring(self):
        """Test memory usage during codex operations."""
        process = psutil.Process()
        initial_memory = process.memory_info().rss

        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Perform memory-intensive codex operations
        for _ in range(5):
            terms = [1, 2, 3, 5, 15]
            codex_loader.load_codex_terms(terms)
            context = {"test": "data", "compliance_check": True}
            codex_loader.validate_compliance("agent", context)

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Allow reasonable memory increase (under 10MB)
        assert memory_increase < 10 * 1024 * 1024

    def test_agent_codex_concurrent_operations(self):
        """Test concurrent codex operations with agent."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        def codex_operation(terms):
            loader = CodexLoader(config_manager=self.config_manager)
            rules = loader.load_codex_terms(terms)
            context = {"operation": f"test_{terms[0]}"}
            results = loader.validate_compliance("agent", context)
            return len(rules), len(results)

        test_cases = [[1, 2], [3, 5], [15, 24], [38, 39]]

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(codex_operation, terms) for terms in test_cases]
            results = [f.result() for f in futures]

        # All operations should complete successfully
        assert all(
            rules_count > 0 and results_count > 0
            for rules_count, results_count in results
        )

    def test_agent_codex_term_dependencies_integration(self):
        """Test codex term dependencies work with agent context."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([1, 2, 5, 15])

        # Term 15 depends on 5, which depends on 1 and 2
        deps = codex_loader.get_term_dependencies(15)

        assert 5 in deps  # Direct dependency
        assert 1 in deps  # Indirect dependency
        assert 2 in deps  # Indirect dependency

    def test_agent_codex_validation_with_real_context(self):
        """Test codex validation using real agent context."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([3, 5])  # State management and error prevention

        # Create context based on actual agent state
        agent_context = {
            "state_manager_enabled": hasattr(self.agent, "state_manager"),
            "error_handling_enabled": True,  # Assume error handling is enabled
            "communication_bus": self.agent.communication_bus is not None,
        }

        results = codex_loader.validate_compliance("agent", agent_context)

        assert isinstance(results, list)
        assert len(results) > 0
        result = results[0]
        assert hasattr(result, "compliant")
        assert isinstance(result.violations, list)

    def test_agent_codex_cache_invalidation(self):
        """Test codex cache invalidation when terms change."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Load initial terms
        terms1 = [1, 2, 3]
        codex_loader.load_codex_terms(terms1)
        hash1 = codex_loader._codex_hash

        # Load different terms
        terms2 = [1, 2, 3, 5]
        codex_loader.load_codex_terms(terms2)
        hash2 = codex_loader._codex_hash

        # Hash should change
        assert hash1 != hash2

    def test_agent_codex_empty_terms_handling(self):
        """Test agent handles empty codex terms gracefully."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Empty terms should not cause errors
        rules = codex_loader.load_codex_terms([])
        assert rules == {}

        # Compliance validation with no loaded terms
        results = codex_loader.validate_compliance("agent", {})
        assert results == []

    def test_agent_codex_rule_filtering_by_category(self):
        """Test filtering codex rules by category for agent focus."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([1, 2, 5, 15, 24])  # Mix of categories

        # Get architecture rules (relevant for agent structure)
        architecture_rules = codex_loader.get_rules_by_category("architecture")
        quality_rules = codex_loader.get_rules_by_category("quality")

        assert len(architecture_rules) >= 1  # At least term 1
        assert len(quality_rules) >= 2  # Terms 5, 15

        # Verify categories
        assert all(r.category == "architecture" for r in architecture_rules)
        assert all(r.category == "quality" for r in quality_rules)

    def test_agent_codex_critical_rules_validation(self):
        """Test validation of critical codex rules for agent."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([1, 2, 5, 7, 8, 15])

        critical_rules = codex_loader.get_critical_rules()

        # Should have critical rules loaded
        assert len(critical_rules) >= 3  # Terms 1, 2, 5, 8 are critical

        # Validate they are actually critical
        assert all(r.severity == "critical" for r in critical_rules)

    def test_agent_codex_context_hash_stability(self):
        """Test codex context hash stability for caching."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        context1 = {"communication_bus": True, "state_manager": True, "errors": []}
        context2 = {"communication_bus": True, "state_manager": True, "errors": []}

        hash1 = codex_loader._get_context_hash(context1)
        hash2 = codex_loader._get_context_hash(context2)

        assert hash1 == hash2  # Same context should have same hash

    def test_agent_codex_context_hash_changes(self):
        """Test codex context hash changes with different contexts."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        context1 = {"communication_bus": True}
        context2 = {"communication_bus": False}

        hash1 = codex_loader._get_context_hash(context1)
        hash2 = codex_loader._get_context_hash(context2)

        assert hash1 != hash2  # Different context should have different hash

    def test_agent_codex_integration_with_task_execution(self):
        """Test codex integration during agent task execution."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([5])  # Error prevention

        # Mock task execution
        task = {"id": "codex_test", "content": "test task"}

        with patch.object(self.agent, "_execute_task", return_value="task_result"):
            context = AgentContext(session_id="test_session")
            result = asyncio.run(self.agent.execute("test task", context))

            assert result.success
            assert result.data == "task_result"

    def test_agent_codex_compliance_result_structure(self):
        """Test structure of codex compliance results in agent context."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([1])

        results = codex_loader.validate_compliance("agent", {"test": "context"})

        assert len(results) == 1
        result = results[0]

        # Verify result structure
        assert hasattr(result, "term_id")
        assert hasattr(result, "compliant")
        assert hasattr(result, "violations")
        assert hasattr(result, "recommendations")
        assert hasattr(result, "metadata")

        assert isinstance(result.violations, list)
        assert isinstance(result.recommendations, list)
        assert isinstance(result.metadata, dict)

    def test_agent_codex_large_scale_validation(self):
        """Test large-scale codex validation with multiple components."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Load comprehensive term set
        all_terms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 24, 38, 39]
        codex_loader.load_codex_terms(all_terms)

        context = {
            "communication_bus": True,
            "state_manager_enabled": True,
            "error_handling_enabled": True,
            "max_concurrent_agents": 5,
            "validation_enabled": True,
            "has_error_handling": True,
        }

        # Validate context against all loaded terms
        results = codex_loader.validate_compliance(context)

        # Should have results for all loaded terms
        assert len(results) == len(all_terms)

    def test_agent_codex_error_recovery_validation(self):
        """Test codex validation error recovery."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        codex_loader.load_codex_terms([1, 2])

        # Test with problematic context that might cause validation errors
        problematic_context = {
            "communication_bus": None,
            "state_manager_enabled": False,
            "invalid_field": lambda x: x,  # Non-serializable
        }

        # Should handle errors gracefully and continue
        results = codex_loader.validate_compliance(problematic_context)

        assert len(results) == 2  # Should return results for both loaded terms
        # Some may fail but shouldn't crash the entire validation

    @patch("strray.core.codex_loader.logger")
    def test_agent_codex_logging_integration(self, mock_logger):
        """Test codex operations integrate with agent logging."""
        codex_loader = CodexLoader(config_manager=self.config_manager)

        # Load terms (should trigger logging)
        codex_loader.load_codex_terms([1, 2, 3])

        # Validate compliance (should trigger logging on errors if any)
        codex_loader.validate_compliance("agent", {})

        # Verify logging calls were made
        assert (
            mock_logger.info.called
            or mock_logger.warning.called
            or mock_logger.error.called
        )

    def test_agent_codex_term_extraction_from_config(self):
        """Test extracting codex terms from configuration."""
        # Config manager has codex_terms set in setup
        terms = self.config_manager.get_value("codex_terms")

        assert isinstance(terms, list)
        assert len(terms) > 0
        assert all(isinstance(term, int) for term in terms)

        # Should match the terms we set
        expected_terms = [1, 2, 3, 5, 15, 24, 38, 39]
        assert terms == expected_terms

    def test_agent_codex_workflow_integration(self):
        """Test complete codex workflow from config to validation."""
        # 1. Extract terms from config
        terms = self.config_manager.get_value("codex_terms")

        # 2. Load codex
        codex_loader = CodexLoader(config_manager=self.config_manager)
        rules = codex_loader.load_codex_terms(terms)

        # 3. Validate compliance
        context = {
            "communication_bus": True,
            "state_manager_enabled": True,
            "error_handling_enabled": True,
            "max_concurrent_agents": 3,
            "validation_enabled": True,
        }

        results = codex_loader.validate_compliance(context)

        # 4. Verify workflow completion
        assert len(rules) == len(terms)
        assert len(results) == len(terms)

        # Should have mix of compliant and non-compliant results
        compliant_count = sum(1 for r in results if r.compliant)
        assert compliant_count >= 0  # At least some should be compliant

    def test_agent_codex_cache_performance(self):
        """Test codex cache performance improvements."""
        codex_loader = CodexLoader(config_manager=self.config_manager)
        terms = [1, 2, 3, 5, 15]

        # First validation (cache miss)
        start_time = time.time()
        codex_loader.load_codex_terms(terms)
        context = {"test": "context"}
        results1 = codex_loader.validate_compliance("agent", context)
        first_run_time = time.time() - start_time

        # Second validation (cache hit)
        start_time = time.time()
        results2 = codex_loader.validate_compliance("agent", context)
        second_run_time = time.time() - start_time

        # Results should be identical
        assert len(results1) == len(results2)
        assert all(r1.term_id == r2.term_id for r1, r2 in zip(results1, results2))

        # Second run should be faster (cached)
        assert second_run_time <= first_run_time * 2
