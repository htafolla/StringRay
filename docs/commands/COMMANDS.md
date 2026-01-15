# StrRay Framework - Command Reference and Usage Guide

**Version**: **Last Updated**: 2026-01-05 | **Framework**: StrRay v2.4.0

## Overview

StrRay provides a comprehensive command-line interface for framework operations, agent management, and development workflow automation.

## Core Commands

### Framework Management

#### `strray init`

Initialize a new StrRay project with default configuration.

```bash
strray init [project-name]
```

**Options**:

- `--template <type>`: Project template (react, node, python)
- `--codex-version <version>`: Codex framework version
- `--skip-git`: Skip git repository initialization

#### `strray config`

Manage framework configuration settings.

```bash
strray config [get|set|list] [key] [value]
```

**Examples**:

```bash
strray config get framework.version
strray config set agents.architect.enabled true
strray config list
```

### Agent Operations

#### `strray agent`

Manage and interact with framework agents.

```bash
strray agent <command> [options]
```

**Commands**:

- `list`: List all available agents
- `status`: Show agent status and health
- `enable <agent>`: Enable specific agent
- `disable <agent>`: Disable specific agent
- `run <agent> <task>`: Execute task with specific agent

**Examples**:

```bash
strray agent list
strray agent status architect
strray agent run architect "design new authentication system"
```

#### `strray task`

Execute development tasks using appropriate agents.

```bash
strray task <description> [options]
```

**Options**:

- `--agent <name>`: Force specific agent
- `--async`: Run task asynchronously
- `--priority <level>`: Set task priority (low, normal, high)

### Development Workflow

#### `strray build`

Build the project using framework-optimized build process.

```bash
strray build [target]
```

**Targets**:

- `production`: Production build
- `development`: Development build
- `test`: Test build

#### `strray test`

Run comprehensive test suite with framework integration.

```bash
strray test [suite] [options]
```

**Suites**:

- `unit`: Unit tests only
- `integration`: Integration tests only
- `e2e`: End-to-end tests only
- `all`: Complete test suite

**Options**:

- `--coverage`: Generate coverage report
- `--watch`: Watch mode for continuous testing
- `--parallel`: Run tests in parallel

#### `strray lint`

Lint code using framework standards.

```bash
strray lint [files...]
```

**Options**:

- `--fix`: Auto-fix linting issues
- `--strict`: Use strict linting rules

### Analysis and Diagnostics

#### `strray analyze`

Analyze codebase for architectural issues and improvements.

```bash
strray analyze [scope] [options]
```

**Scopes**:

- `architecture`: Architecture analysis
- `dependencies`: Dependency analysis
- `performance`: Performance analysis
- `security`: Security analysis

#### `strray diagnose`

Diagnose framework and project issues.

```bash
strray diagnose [component]
```

**Components**:

- `agents`: Agent health check
- `tools`: Tool availability check
- `config`: Configuration validation
- `project`: Project structure validation

### Documentation

#### `strray docs`

Generate and manage project documentation.

```bash
strray docs <command> [options]
```

**Commands**:

- `generate`: Generate documentation from code
- `serve`: Serve documentation locally
- `publish`: Publish documentation
- `validate`: Validate documentation completeness

### Integration Commands

#### `strray integrate`

Integrate third-party services and tools.

```bash
strray integrate <service> [options]
```

**Supported Services**:

- `github`: GitHub integration
- `slack`: Slack notifications
- `datadog`: Monitoring integration
- `sentry`: Error tracking

#### `strray deploy`

Deploy application using framework deployment pipeline.

```bash
strray deploy <environment> [options]
```

**Environments**:

- `staging`: Staging deployment
- `production`: Production deployment
- `preview`: Preview deployment

## Command Reference Table

| Command            | Description               | Category      |
| ------------------ | ------------------------- | ------------- |
| `strray init`      | Initialize new project    | Framework     |
| `strray config`    | Manage configuration      | Framework     |
| `strray agent`     | Agent management          | Agents        |
| `strray task`      | Execute development tasks | Workflow      |
| `strray build`     | Build project             | Development   |
| `strray test`      | Run tests                 | Testing       |
| `strray lint`      | Code linting              | Quality       |
| `strray analyze`   | Code analysis             | Analysis      |
| `strray diagnose`  | Issue diagnosis           | Diagnostics   |
| `strray docs`      | Documentation management  | Documentation |
| `strray integrate` | Third-party integration   | Integration   |
| `strray deploy`    | Application deployment    | Deployment    |

## Advanced Usage

### Batch Operations

Execute multiple commands in sequence:

```bash
strray task "analyze architecture" && strray task "generate tests" && strray build
```

### Pipeline Integration

StrRay commands integrate with CI/CD pipelines:

```yaml
# .github/workflows/ci.yml
- name: Run StrRay Analysis
  run: strray analyze architecture --ci

- name: Generate Tests
  run: strray task "create comprehensive test suite"

- name: Build and Deploy
  run: strray build production && strray deploy staging
```

### Custom Scripts

Create custom command scripts in `strray/scripts/`:

```bash
#!/bin/bash
# strray/scripts/custom-build.sh
strray lint --fix
strray test all --coverage
strray build production
```

## Troubleshooting

See `TROUBLESHOOTING.md` for command-specific issues and solutions.
