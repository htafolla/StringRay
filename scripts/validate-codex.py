#!/usr/bin/env python3
"""
Runtime codex validation script for StrRay framework.
Validates code changes against Universal Development Codex v1.2.20.
"""

import sys
import json
import argparse
from pathlib import Path

script_dir = Path(__file__).parent
src_dir = script_dir.parent / "src"
sys.path.insert(0, str(src_dir))

from strray.core.codex_loader import CodexLoader


def validate_code(code: str, file_path: str = "<unknown>") -> dict:
    """
    Validate code against codex terms.

    Returns validation result with violations if any.
    """
    loader = CodexLoader()

    # validate_compliance returns a list of CodexComplianceResult objects
    results = loader.validate_compliance(code)

    violations = []
    is_compliant = True

    for result in results:
        if hasattr(result, "compliant") and not result.compliant:
            is_compliant = False
            violations.append(
                {
                    "term_id": getattr(result, "term_id", "unknown"),
                    "description": getattr(result, "description", "Unknown violation"),
                    "severity": getattr(result, "severity", "medium"),
                }
            )

    result = {
        "compliant": is_compliant,
        "file": file_path,
        "violations": violations,
        "violation_count": len(violations),
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="Validate code against StrRay codex")
    parser.add_argument("--code", help="Code to validate")
    parser.add_argument("--file", help="File path being modified")

    args = parser.parse_args()

    if not args.code:
        print("❌ No code provided to validate")
        sys.exit(1)

    result = validate_code(args.code, args.file or "<unknown>")

    if result["compliant"]:
        print("✅ Code is compliant with StrRay codex")
        sys.exit(0)
    else:
        print(f"❌ Code has {result['violation_count']} codex violations:")
        for violation in result["violations"]:
            print(f"  - {violation['description']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
