# StringRay Framework - Test Classification Guide

## Test Types & Framework Usage Classification

### 🔴 REAL FRAMEWORK TESTS (Call Actual Framework Components)
These tests validate actual framework behavior and should be used for final validation.

#### E2E Integration Tests
- **`src/__tests__/integration/e2e-framework-integration.test.ts`**
  - Calls real: BootOrchestrator, StringRayOrchestrator, AgentDelegator, ProcessorManager, StringRayStateManager
  - Validates: Complete framework initialization and orchestration
  - Usage: Final framework validation before releases

- **`src/__tests__/integration/orchestration-e2e.test.ts`**
  - Calls real: Multi-agent orchestration with task delegation
  - Validates: End-to-end agent coordination workflows
  - Usage: Validate agent communication and task routing

#### Post-Processor Integration Tests
- **`src/__tests__/integration/postprocessor-integration.test.ts`**
  - Calls real: PostProcessor with monitoring and escalation engines
  - Validates: CI/CD pipeline integration and automated fixes
  - Usage: Validate deployment automation and error recovery

- **`src/__tests__/integration/commit-batching-enforcement-integration.test.ts`**
  - Calls real: Commit validation and architectural compliance
  - Validates: Git hook integration and code quality enforcement
  - Usage: Validate pre-commit validation and blocking

#### Framework Enforcement Tests
- **`src/__tests__/framework-enforcement-integration.test.ts`**
  - Calls real: Codex injection hooks and rule enforcement
  - Validates: Plugin hook system and codex compliance
  - Usage: Validate real plugin behavior in oh-my-opencode

### 🟡 MOCK-BASED UNIT TESTS (Use Mocks for Isolation)
These tests validate individual components in isolation using mocks.

#### Unit Tests (Mock-Based)
- **`src/__tests__/unit/codex-injector.test.ts`**
  - Mock: Plugin hook behavior (avoids ES6 import conflicts)
  - Tests: Codex injection logic and enforcement rules
  - Usage: Validate hook contracts without real plugin loading

- **`src/__tests__/unit/orchestrator.test.ts`**
  - Mock: Agent delegation and MCP server calls
  - Tests: Orchestration logic and task dependency resolution
  - Usage: Validate orchestration algorithms

- **`src/__tests__/unit/processor-activation.test.ts`**
  - Mock: Processor execution and hook triggering
  - Tests: Processor lifecycle and activation logic
  - Usage: Validate processor management

#### Agent Unit Tests (Mock-Based)
- **`src/__tests__/agents/*.test.ts`** (All agent unit tests)
  - Mock: MCP servers, framework logger, external dependencies
  - Tests: Agent-specific logic and configuration
  - Usage: Validate agent behavior in isolation

#### Integration Tests (Mock-Based)
- **`src/__tests__/integration/oh-my-opencode-integration.test.ts`**
  - Mock: oh-my-opencode environment and plugin loading
  - Tests: Plugin integration contracts and hook triggering
  - Usage: Validate plugin interfaces without real oh-my-opencode

- **`src/__tests__/integration/codex-enforcement.test.ts`**
  - Mock: Framework components, focus on codex rules
  - Tests: Rule enforcement and violation detection
  - Usage: Validate codex compliance logic

### 🟢 HYBRID TESTS (Mix Real + Mock Components)
These tests use some real components with mocked dependencies.

#### Session Management Tests
- **`src/__tests__/integration/session-*.test.ts`** (All session tests)
  - Real: Session coordination and state management
  - Mock: External dependencies and monitoring
  - Tests: Session lifecycle and cross-session operations
  - Usage: Validate session system with controlled environment

#### Performance Tests
- **`src/__tests__/performance/*.test.ts`**
  - Real: Performance measurement and benchmarking
  - Mock: External services and network calls
  - Tests: Performance regression detection
  - Usage: Validate performance characteristics

## Test Execution Strategy

### Development Workflow
1. **Unit Tests** (Mock-based) - Run during development for fast feedback
2. **Integration Tests** (Mock-based) - Validate component interactions
3. **E2E Tests** (Real framework) - Final validation before commits
4. **Performance Tests** (Hybrid) - Regression detection and optimization

### CI/CD Pipeline
1. **Unit + Integration** (Mock-based) - Fast feedback, <2 minutes
2. **E2E Framework** (Real) - Comprehensive validation, <5 minutes
3. **Performance Regression** (Hybrid) - Performance validation, <3 minutes

### Auto-Commit Threshold
- **Unit Tests**: Must pass (fast feedback)
- **Integration Tests**: Must pass (component validation)
- **E2E Tests**: Must pass (real framework validation)
- **Performance Tests**: Must pass regression thresholds

## Test Maintenance Guidelines

### When to Use Real Framework Tests
- Validating complete workflows end-to-end
- Testing integration points between components
- Validating plugin behavior in real environment
- Performance and scalability testing

### When to Use Mock-Based Tests
- Testing individual component logic
- Fast feedback during development
- Isolating component behavior
- Testing error conditions and edge cases

### Test Reliability Classification
- **🔴 Critical**: Real framework E2E tests (must pass for releases)
- **🟡 Important**: Mock-based integration tests (must pass for commits)
- **🟢 Supporting**: Unit tests with mocks (should pass for development)

## Framework Test Status Summary

- **Total Tests**: 64 test files
- **Real Framework Tests**: 6 files (E2E validation)
- **Mock-Based Tests**: 52 files (Component isolation)
- **Hybrid Tests**: 6 files (Performance/session validation)
- **Test Coverage**: 85%+ behavioral coverage required
- **Execution Time**: ~5-10 minutes for full suite</content>
<parameter name="filePath">TEST_CLASSIFICATION_GUIDE.md