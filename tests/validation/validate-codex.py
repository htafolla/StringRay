#!/usr/bin/env python3
"""
Simple codex validation script for StrRay framework.
Basic validation without complex imports.
"""

import sys
import json
import argparse

def validate_code_simple(code: str, file_path: str = "<unknown>") -> dict:
    """
    Simple validation - just check for basic patterns
    """
    violations = []
    
    # Basic checks
    if "eval(" in code:
        violations.append({
            'term_id': 'security',
            'description': 'Use of eval() is not allowed',
            'severity': 'high'
        })
    
    if "console.log(" in code and len(code) > 50:
        violations.append({
            'term_id': 'logging',
            'description': 'Excessive console.log usage detected',
            'severity': 'medium'
        })
    
    # Always return compliant for now (simplified)
    is_compliant = len(violations) == 0
    
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

    result = validate_code_simple(args.code, args.file or "<unknown>")

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
