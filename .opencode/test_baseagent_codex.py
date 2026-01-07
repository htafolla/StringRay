#!/usr/bin/env python3
"""
Test BaseAgent codex integration.
Verifies that BaseAgent loads and uses codex correctly.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from strray.core.agent import BaseAgent
from strray.config.manager import ConfigManager


def test_baseagent_codex():
    """Test BaseAgent with codex integration."""
    print("=" * 60)
    print("BASEAGENT CODEX INTEGRATION TEST")
    print("=" * 60)

    config = ConfigManager()

    try:
        agent = BaseAgent("test_agent", config)

        print(f"✓ BaseAgent initialized")
        print(f"  - Codex enabled: {agent.codex_enabled}")
        print(f"  - Codex available: {agent.codex_available}")
        print(f"  - Codex loader loaded: {agent.codex_loader.is_loaded}")
        print(f"  - Codex term count: {agent.codex_loader.term_count}")

        if not agent.codex_available:
            print("✗ FAIL: Codex not available in BaseAgent")
            return False

        if agent.codex_loader.term_count < 30:
            print(f"✗ FAIL: Expected 30+ terms, got {agent.codex_loader.term_count}")
            return False

        term = agent.get_codex_term(1)
        if term is None:
            print("✗ FAIL: get_codex_term(1) returned None")
            return False

        print(f"✓ get_codex_term(1): {term['title']}")

        results = agent.search_codex("type")
        if len(results) == 0:
            print("✗ FAIL: search_codex('type') returned no results")
            return False

        print(f"✓ search_codex('type'): found {len(results)} terms")

        validation = agent.validate_codex_compliance("any test = true")

        if not validation["compliant"]:
            print(f"✓ validate_codex_compliance: detected {validation['violations_count']} violations")

        if validation["compliant"]:
            print("✗ FAIL: validate_codex_compliance should detect violations")
            return False

        if validation["violations_count"] == 0:
            print("✗ FAIL: validate_codex_compliance found no violations")
            return False

        manifest = agent.codex_manifest
        if manifest is None:
            print("✗ FAIL: codex_manifest is None")
            return False

        print(f"✓ codex_manifest: version={manifest['version']}, terms={manifest['term_count']}")

        print(f"\n✓ All BaseAgent codex integration tests passed!")
        return True

    except Exception as e:
        print(f"✗ FAIL: Exception during test: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run BaseAgent codex integration test."""
    result = test_baseagent_codex()

    if result:
        print("\n✓ BaseAgent codex integration is working correctly.")
        return 0
    else:
        print("\n✗ BaseAgent codex integration tests failed.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
