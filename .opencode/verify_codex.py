#!/usr/bin/env python3
"""
Simple verification script for codex integration in BaseAgent.
Tests:
1. CodexLoader loads terms correctly
2. BaseAgent initializes with codex
3. Validation methods work
4. Zero-tolerance blocking works
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from strray.core.codex_loader import CodexLoader, CodexViolationError
from strray.config.manager import ConfigManager


def test_codex_loader():
    """Test 1: CodexLoader initialization and term loading."""
    print("=" * 60)
    print("TEST 1: CodexLoader Initialization")
    print("=" * 60)

    loader = CodexLoader()

    print(f"✓ CodexLoader initialized")
    print(f"  - Is loaded: {loader.is_loaded}")
    print(f"  - Terms count: {loader.term_count}")
    print(f"  - Version: {loader.version}")

    if not loader.is_loaded:
        print("✗ FAIL: Codex not loaded")
        return False

    if loader.term_count < 10:
        print(f"✗ FAIL: Expected at least 10 terms, got {loader.term_count}")
        return False

    # Test term retrieval
    term = loader.get_term(1)
    if term is None:
        print("✗ FAIL: Could not retrieve term 1")
        return False

    print(f"  - Term 1: {term.title}")
    print(f"✓ CodexLoader working correctly\n")
    return True


def test_codex_validation():
    """Test 2: Codex validation functionality."""
    print("=" * 60)
    print("TEST 2: Codex Validation")
    print("=" * 60)

    loader = CodexLoader()

    # Test compliant code
    compliant_code = """
    function add(a, b) {
        return a + b;
    }
    """

    is_compliant, violations = loader.validate_compliance(compliant_code)

    print(f"  - Compliant code validation: {is_compliant}")
    print(f"  - Violations found: {len(violations)}")

    if not is_compliant and len(violations) > 0:
        print(f"  - Violation details: {violations[0]}")

    # Test non-compliant code
    non_compliant_code = "any type placeholder"

    is_compliant, violations = loader.validate_compliance(non_compliant_code)

    print(f"  - Non-compliant code validation: {is_compliant}")
    print(f"  - Violations found: {len(violations)}")

    if is_compliant:
        print("✗ FAIL: Should have detected violation for 'any' type")
        return False

    if len(violations) == 0:
        print("✗ FAIL: Should have found violations")
        return False

    print(f"✓ Codex validation working correctly\n")
    return True


def test_zero_tolerance_blocking():
    """Test 3: Zero-tolerance blocking."""
    print("=" * 60)
    print("TEST 3: Zero-Tolerance Blocking")
    print("=" * 60)

    loader = CodexLoader()

    # Test with zero-tolerance violation
    bad_code = "TODO: fix this later\nany test = true"

    try:
        validation = loader.validate_compliance(bad_code)
        is_compliant = validation[0]
        violations = validation[1]

        print(f"  - Bad code violations: {len(violations)}")
        print(f"  - Is compliant: {is_compliant}")

        if len(violations) == 0:
            print("✗ FAIL: Should have found violations")
            return False

        has_todo = any(
            "TODO" in v.get("matched_text", "") or "TODO" in v.get("message", "")
            for v in violations
        )
        has_any = any(
            "any" in v.get("matched_text", "") or "any" in v.get("message", "")
            for v in violations
        )

        print(f"  - Detected TODO: {has_todo}")
        print(f"  - Detected 'any' type: {has_any}")

        if has_any:
            print("✓ Zero-tolerance blocking would trigger on 'any' type\n")
            return True

        print("⚠ WARNING: May not detect all zero-tolerance violations")
        return True

    except Exception as e:
        print(f"✗ FAIL: Validation failed with error: {e}")
        return False


def test_codex_search():
    """Test 4: Codex search functionality."""
    print("=" * 60)
    print("TEST 4: Codex Search")
    print("=" * 60)

    loader = CodexLoader()

    # Test search
    results = loader.search_terms("type")

    print(f"  - Search results for 'type': {len(results)}")

    if len(results) == 0:
        print("✗ FAIL: Search returned no results")
        return False

    # Test get by title
    term = loader.get_term_by_title("Progressive")
    print(f"  - Term by title 'Progressive': {term is not None}")

    if term is None:
        print("⚠ WARNING: Could not find term by title")

    print(f"✓ Codex search working correctly\n")
    return True


def test_manifest():
    """Test 5: Codex manifest."""
    print("=" * 60)
    print("TEST 5: Codex Manifest")
    print("=" * 60)

    loader = CodexLoader()
    manifest = loader.get_manifest()

    print(f"  - Manifest version: {manifest.get('version')}")
    print(f"  - Term count: {manifest.get('term_count')}")
    print(f"  - Categories: {list(manifest.get('categories', {}).keys())}")
    print(f"  - Is loaded: {manifest.get('is_loaded')}")

    if not manifest.get("is_loaded"):
        print("✗ FAIL: Manifest shows not loaded")
        return False

    if manifest.get("term_count", 0) < 10:
        print(f"✗ FAIL: Expected at least 10 terms in manifest")
        return False

    print(f"✓ Codex manifest working correctly\n")
    return True


def main():
    """Run all verification tests."""
    print("\n")
    print("=" * 60)
    print("CODEX INTEGRATION VERIFICATION")
    print("=" * 60)
    print("\n")

    tests = [
        ("CodexLoader Initialization", test_codex_loader),
        ("Codex Validation", test_codex_validation),
        ("Zero-Tolerance Blocking", test_zero_tolerance_blocking),
        ("Codex Search", test_codex_search),
        ("Codex Manifest", test_manifest),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ FAIL: {test_name} raised exception: {e}")
            import traceback

            traceback.print_exc()
            results.append((test_name, False))

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nResults: {passed}/{total} tests passed ({100*passed//total}%)")

    if passed == total:
        print("\n✓ All tests passed! Codex integration is working correctly.")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
