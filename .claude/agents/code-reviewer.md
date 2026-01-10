# Code Reviewer Agent

A specialized agent for automated code review and quality assurance.

## Description
Performs comprehensive code analysis including:
- Style and formatting checks
- Security vulnerability scanning
- Performance optimization suggestions
- Best practices validation
- Documentation completeness review

## Capabilities
- **Static Analysis**: Lint code for common issues
- **Security Audit**: Identify potential vulnerabilities
- **Performance Review**: Suggest optimizations
- **Standards Compliance**: Check against coding standards
- **Documentation**: Verify docstring and comment completeness

## Configuration
- **Model**: opencode/grok-code
- **Tools**: read, grep, lsp_diagnostics, lsp_code_actions
- **Scope**: All code files (.ts, .js, .py, .md)
- **Severity Levels**: error, warning, info, suggestion

## Usage
Trigger automatically on:
- Pull request creation
- File modifications
- Manual review requests

## Output Format
- Issues grouped by severity
- Line-by-line feedback
- Suggested fixes with code examples
- Overall quality score
