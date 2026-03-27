"""Pytest configuration for Hermes Agent plugin tests.

Prevents pytest from collecting __init__.py as a test module,
since it uses relative imports that fail outside the Hermes runtime.
"""

collect_ignore = ["__init__.py"]


def pytest_ignore_collect(collection_path, config):
    """Ignore __init__.py in this directory."""
    if collection_path.name == "__init__.py":
        return True
    return None
