# StringRay Framework - Getting Started Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ (check with `node --version`)
- oh-my-opencode installed and running

### Installation
```bash
# Create a new project or use existing
mkdir my-stringray-project
cd my-stringray-project
npm init -y

# Install StringRay Framework
npm install strray-ai

# Run postinstall setup (REQUIRED)
node node_modules/strray-ai/scripts/postinstall.cjs
```

### First Usage
```bash
# The framework is now ready! Use @agent commands:
@orchestrator analyze this codebase structure
@enforcer check for code quality issues
@architect design a user authentication system
```

## 📚 Framework Overview

### What is StringRay?
StringRay is an AI-powered development framework that provides:
- **8 Specialized Agents** for different development tasks
- **99.6% Error Prevention** through systematic validation
- **Automatic Task Routing** based on complexity analysis
- **Enterprise-Grade Quality** with production-ready code generation

### Core Concepts
- **Agents**: Specialized AI assistants for specific development tasks
- **Codex**: Universal Development Codex with 59 mandatory rules
- **Complexity Analysis**: Automatic task routing based on difficulty
- **Post-Processor**: Automated validation and fixes

## 🤖 Available Agents

### Orchestrator (@orchestrator)
**Role**: Multi-agent workflow coordination
**Best For**: Complex multi-step tasks, team coordination
```bash
@orchestrator refactor the entire user management module
@orchestrator implement end-to-end testing strategy
@orchestrator coordinate database schema migration
```

### Enforcer (@enforcer)
**Role**: Code quality and error prevention
**Best For**: Quality checks, security validation, compliance
```bash
@enforcer analyze this code for security vulnerabilities
@enforcer validate API endpoints for OWASP compliance
@enforcer check for performance bottlenecks
```

### Architect (@architect)
**Role**: System design and technical decisions
**Best For**: Architecture planning, technical specifications
```bash
@architect design microservices architecture for e-commerce
@architect plan database schema for multi-tenant application
@architect design API gateway with rate limiting
```

### Code Reviewer (@code-reviewer)
**Role**: Code quality assessment and standards validation
**Best For**: Pull request reviews, code improvement suggestions
```bash
@code-reviewer review this React component for best practices
@code-reviewer analyze this database query for optimization
@code-reviewer check this test suite for coverage gaps
```

### Security Auditor (@security-auditor)
**Role**: Security vulnerability detection and compliance
**Best For**: Security assessments, compliance checking
```bash
@security-auditor scan for SQL injection vulnerabilities
@security-auditor check authentication implementation
@security-auditor validate GDPR compliance
```

### Refactorer (@refactorer)
**Role**: Code consolidation and technical debt elimination
**Best For**: Code cleanup, refactoring, optimization
```bash
@refactorer consolidate duplicate code in these files
@refactorer optimize database queries for performance
@refactorer extract reusable components from this module
```

### Test Architect (@test-architect)
**Role**: Testing strategy and coverage optimization
**Best For**: Test planning, coverage analysis, quality assurance
```bash
@test-architect design integration tests for payment system
@test-architect create performance test suite
@test-architect analyze test coverage gaps
```

### Librarian (@librarian)
**Role**: Codebase exploration and documentation
**Best For**: Code understanding, documentation, knowledge discovery
```bash
@librarian analyze codebase structure and patterns
@librarian document API endpoints
@librarian find all database models
```

## 🛠️ Development Workflow

### Daily Development
1. **Write Code**: Develop features as usual
2. **Quality Checks**: Run enforcer validation
   ```bash
   @enforcer validate current changes
   ```
3. **Testing**: Ensure comprehensive test coverage
   ```bash
   @test-architect review test coverage
   ```
4. **Commit**: Framework validates automatically

### Complex Tasks
1. **Plan**: Use orchestrator for complex requirements
   ```bash
   @orchestrator plan implementation of user dashboard
   ```
2. **Design**: Get architectural guidance
   ```bash
   @architect design component hierarchy
   ```
3. **Implement**: Build with quality checks
   ```bash
   @code-reviewer review implementation approach
   ```

### Code Review Process
1. **Automated Review**: Framework checks automatically
2. **Manual Review**: Use code-reviewer agent
   ```bash
   @code-reviewer review pull request changes
   ```
3. **Security Audit**: Final security validation
   ```bash
   @security-auditor validate production readiness
   ```

## 🔧 Configuration

### Basic Configuration
Create `.stringray/config.json` in your project root:
```json
{
  "enabled": true,
  "maxConcurrentAgents": 5,
  "codexEnforcement": true,
  "skillsLazyLoading": true
}
```

### oh-my-opencode Integration
The framework automatically configures oh-my-opencode agents:
```json
{
  "model_routing": {
    "orchestrator": "opencode/grok-code",
    "enforcer": "opencode/grok-code",
    "architect": "opencode/grok-code"
  }
}
```

## 📊 Quality Assurance

### Automated Checks
- **Codex Compliance**: 59 mandatory rules enforced
- **Test Coverage**: 85%+ behavioral coverage required
- **Security Scanning**: Automated vulnerability detection
- **Performance Budgets**: Bundle size and response time limits

### Manual Quality Gates
```bash
# Security audit
@security-auditor perform comprehensive security audit

# Performance review
@enforcer check performance budgets

# Architecture review
@architect validate system design decisions
```

## 🐛 Troubleshooting

### Common Issues

#### Agent Commands Not Working
```bash
# Check oh-my-opencode status
opencode --version

# Verify framework installation
node node_modules/strray-ai/scripts/postinstall.cjs
```

#### Codex Validation Errors
```bash
# Check current codex status
@enforcer show codex compliance status

# Disable strict mode temporarily
{
  "codexEnforcement": false
}
```

#### Performance Issues
```bash
# Run performance analysis
@enforcer analyze performance bottlenecks

# Check system resources
@enforcer validate system health
```

### Getting Help
```bash
# Framework capabilities
@orchestrator show available capabilities

# Agent-specific help
@enforcer explain enforcer capabilities

# System status
@orchestrator check framework health
```

## 📈 Advanced Usage

### Multi-Agent Coordination
```bash
# Complex refactoring with multiple agents
@orchestrator coordinate full system refactoring

# Security-first development
@security-auditor design secure authentication
@architect implement security patterns
@code-reviewer validate security implementation
```

### CI/CD Integration
```bash
# Automated quality gates
@enforcer validate ci/cd pipeline
@test-architect ensure test automation
@security-auditor check deployment security
```

### Enterprise Workflows
```bash
# Large-scale system changes
@orchestrator plan system migration
@architect design migration strategy
@refactorer implement migration scripts
@test-architect validate migration testing
```

## 🎯 Best Practices

### Code Quality
- Always run enforcer checks before commits
- Maintain 85%+ test coverage
- Follow codex compliance rules
- Use architect for design decisions

### Security First
- Run security audits regularly
- Validate input sanitization
- Check authentication/authorization
- Monitor for vulnerabilities

### Performance Optimization
- Regular performance budget checks
- Optimize bundle sizes
- Monitor response times
- Profile resource usage

### Team Collaboration
- Use orchestrator for complex tasks
- Document architectural decisions
- Share code review feedback
- Maintain consistent standards

## 📚 Resources

### Documentation
- [Framework Architecture](./README_STRRAY_INTEGRATION.md)
- [Agent Capabilities](./docs/agents/)
- [Codex Compliance](./.strray/codex.json)
- [API Reference](./api/API_REFERENCE.md)

### Community & Support
- [GitHub Issues](https://github.com/htafolla/stringray/issues)
- [Framework Health Checks](./scripts/test:comprehensive)
- [Performance Monitoring](./scripts/performance-report.js)

---

**Ready to build production-ready code with AI assistance? Get started with `npm install strray-ai`!** 🚀</content>
<parameter name="filePath">GETTING_STARTED_GUIDE.md