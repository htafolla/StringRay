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

    is_compliant, violations = loader.validate_compliance(code)

    result = {
        "compliant": is_compliant,
        "file": file_path,
        "violations": violations,
        "violation_count": len(violations),
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="Validate code against StrRay codex")
    parser.add_argument("--code", type=str, help="Code to validate")
    parser.add_argument("--file", type=str, help="File path being modified")

    args = parser.parse_args()

    if not args.code:
        print(json.dumps({"error": "No code provided"}))
        sys.exit(1)

    result = validate_code(args.code, args.file or "<unknown>")
    print(json.dumps(result, indent=2))

    if not result["compliant"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
