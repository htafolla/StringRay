# StrRay Python Backend

The StrRay framework includes a Python backend located in `src/strray/` with the following components:

- **Core Agents**: Async agent coordination and state management
- **Configuration**: Dynamic model routing and settings management
- **AI Services**: Interface to various AI providers
- **Performance Monitoring**: Metrics collection and analysis
- **Security**: Input validation and access control
- **Orchestration**: Async delegation, progress persistence, conflict resolution

## Requirements

Install Python dependencies:

```bash
pip install -r src/requirements.txt
```

## Usage

The Python backend is automatically integrated with the framework agents and provides the underlying AI coordination capabilities.

## Architecture

```
.opencode/src/strray/
├── core/
│   ├── agent.py          # BaseAgent class with async capabilities
│   ├── context_loader.py # Context loading utilities
│   └── orchestration.py  # Advanced coordination systems
├── config/
│   └── manager.py        # Configuration management
├── ai/
│   └── service.py        # AI service interfaces
├── performance/
│   └── monitor.py        # Performance monitoring
└── security.py           # Security utilities
```

## Integration with oh-my-opencode

The Python backend integrates seamlessly with the oh-my-opencode framework through:

- **MCP Servers**: Model Context Protocol for agent communication
- **Configuration Bridge**: Shared configuration management
- **Command Interface**: Shell script integration points
- **Logging Integration**: Automatic logging to REFACTORING_LOG.md
