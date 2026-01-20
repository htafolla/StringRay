# oh-my-opencode Framework - Setup and Installation Guide

## Overview

The oh-my-opencode framework can be installed through multiple methods depending on your development environment and requirements. This guide covers all installation options and initial configuration.

## System Requirements

### Minimum Requirements

- **Operating System**: Linux, macOS, or Windows (WSL)
- **Node.js**: Version 16.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space for framework and dependencies
- **Network**: Internet connection for tool downloads and updates

### Recommended Requirements

- **Operating System**: Linux or macOS
- **Node.js**: Version 18.0 or higher (LTS)
- **Memory**: 16GB RAM or higher
- **Storage**: 2GB free space
- **Network**: High-speed internet connection

## Installation Methods

### Method 1: NPM Installation (Recommended)

#### Global Installation

```bash
# Install oh-my-opencode globally
npm install -g @strray/framework

# Verify installation
strray --version
```

#### Project-specific Installation

```bash
# Install as project dependency
npm install --save-dev @strray/framework

# Add to package.json scripts
{
  "scripts": {
    "strray": "strray"
  }
}
```

### Method 2: Yarn Installation

```bash
# Global installation
yarn global add @strray/framework

# Project installation
yarn add --dev @strray/framework
```

### Method 3: PNPM Installation

```bash
# Global installation
pnpm add -g @strray/framework

# Project installation
pnpm add -D @strray/framework
```

### Method 4: Docker Installation

```bash
# Pull official Docker image
docker pull strray/framework:latest

# Run oh-my-opencode in container
docker run -it --rm \
  -v $(pwd):/workspace \
  strray/framework:latest
```

### Method 5: Source Installation (Development)

```bash
# Clone repository
git clone https://github.com/strray/framework.git
cd framework

# Install dependencies
npm install

# Build framework
npm run build

# Link globally (optional)
npm link
```

## Initial Configuration

### Automatic Setup

```bash
# Initialize new project with oh-my-opencode
strray init my-project

# This creates:
# - .strray/ directory with configuration
# - Basic project structure
# - Default agent configurations
```

### Manual Configuration

Create `.strray/config.json` in your project root:

```json
{
  "framework": {
    "version": "1.1.1",
    "codex": "v1.1.1"
  },
  "agents": {
    "architect": {
      "enabled": true,
      "triggers": ["design", "architecture"],
      "permissions": ["read", "write", "bash"]
    },
    "codegen": {
      "enabled": true,
      "triggers": ["generate", "create"],
      "permissions": ["read", "write"]
    }
  },
  "tools": {
    "timeout": 120000,
    "parallel": true,
    "security": "strict"
  },
  "logging": {
    "level": "info",
    "file": ".strray/logs/framework.log"
  }
}
```

## Environment Setup

### Environment Variables

Create `.env` file in project root:

```bash
# oh-my-opencode Configuration
STRRAY_ENV=development
STRRAY_LOG_LEVEL=info
STRRAY_CACHE_DIR=.strray/cache

# Tool API Keys (optional)
GITHUB_TOKEN=your_github_token
SLACK_WEBHOOK_URL=your_slack_webhook
DATADOG_API_KEY=your_datadog_key

# Development Settings
NODE_ENV=development
DEBUG=strray:*
```

### IDE Integration

#### VS Code Setup

1. Install recommended extensions:
   - oh-my-opencode Framework Support
   - TypeScript IntelliSense
   - Prettier Formatter

2. Configure workspace settings (`.vscode/settings.json`):

```json
{
  "strray.enable": true,
  "strray.configPath": ".strray/config.json",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### Other IDEs

- **WebStorm/IntelliJ**: Install oh-my-opencode plugin from marketplace
- **Sublime Text**: Use Package Control to install oh-my-opencode package
- **Vim/Neovim**: Add oh-my-opencode language server configuration

## Project Initialization

### New Project Setup

```bash
# Create new directory
mkdir my-strray-project
cd my-strray-project

# Initialize with oh-my-opencode
strray init

# Install dependencies
npm install

# Start development
strray dev
```

### Existing Project Integration

```bash
# Navigate to existing project
cd existing-project

# Initialize oh-my-opencode (non-destructive)
strray init --existing

# This adds:
# - .strray/ configuration directory
# - strray.config.js configuration file
# - Integration with existing package.json
```

## Agent Configuration

### Default Agent Setup

oh-my-opencode comes with pre-configured agents:

```bash
# List available agents
strray agent list

# Enable specific agents
strray agent enable architect
strray agent enable codegen
strray agent enable testing

# Configure agent permissions
strray config set agents.architect.permissions "read,write,bash,analyze"
```

### Custom Agent Development

Create custom agents in `.strray/agents/`:

```javascript
// .strray/agents/custom-agent.js
module.exports = {
  name: "custom-agent",
  description: "Custom development agent",
  triggers: ["custom", "special"],
  capabilities: ["read", "write"],

  async execute(task, context) {
    // Custom agent logic
    return result;
  },
};
```

## Tool Integration Setup

### Required Tools

oh-my-opencode automatically detects and configures required tools:

```bash
# Check tool availability
strray diagnose tools

# Install missing tools
strray tools install git
strray tools install node
```

### Optional Tools

```bash
# Install additional tools
strray tools install docker
strray tools install kubernetes
strray tools install aws-cli
```

## Security Configuration

### Access Control

```bash
# Set framework security level
strray config set security.level strict

# Configure tool permissions
strray config set tools.permissions.read-only false
strray config set tools.permissions.network true
```

### API Key Management

```bash
# Set API keys securely
strray secrets set github.token
strray secrets set slack.webhook

# List configured secrets
strray secrets list
```

## Testing Installation

### Basic Functionality Test

```bash
# Test framework installation
strray --version

# Test agent functionality
strray agent status

# Test tool integration
strray diagnose
```

### Comprehensive Test Suite

```bash
# Run full test suite
strray test all

# Test specific components
strray test agents
strray test tools
strray test integration
```

## Troubleshooting Installation

### Common Issues

#### Permission Errors

```bash
# Fix npm permission issues
sudo chown -R $(whoami) ~/.npm
npm config set prefix ~/.npm-global

# Or use nvm for Node.js management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v1.1.1/install.sh | bash
nvm install node
```

#### Path Issues

```bash
# Add oh-my-opencode to PATH
export PATH="$HOME/.npm-global/bin:$PATH"

# Add to shell profile
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Dependency Conflicts

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

```bash
# Show help information
strray --help

# Show command-specific help
strray init --help
strray agent --help

# Generate diagnostic report
strray diagnose --report > diagnostic-report.txt
```

## Upgrade and Maintenance

### Framework Updates

```bash
# Check for updates
strray update check

# Update framework
strray update framework

# Update agents
strray update agents
```

### Configuration Migration

```bash
# Backup current configuration
strray config backup

# Migrate configuration
strray config migrate

# Validate new configuration
strray config validate
```

## Next Steps

After successful installation:

1. **Explore Documentation**: Read `../../AGENTS_GUIDELINES.md`, `../README.md`, and `../architecture/CONCEPTUAL_ARCHITECTURE.md`
2. **Run Examples**: Try the example projects in `examples/` directory
3. **Join Community**: Visit the oh-my-opencode community forum for support
4. **Contribute**: Report issues or contribute to the framework

For additional help, see `TROUBLESHOOTING.md` or visit the [oh-my-opencode Documentation](https://opencode.ai).
