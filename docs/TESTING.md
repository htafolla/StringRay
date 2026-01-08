# Testing Guide - StrRay Framework

## Overview

The StrRay Framework implements a sophisticated testing infrastructure designed to handle large test suites with intelligent execution strategies, output management, and quarantine systems.

## ⚡ Power Scripts

### Smart Test Runner (`npm test`)
The smart test runner automatically adapts to test suite size:
- **Small suites (< 10 files)**: Standard Vitest execution
- **Medium suites (10-50 files)**: Chunked execution in groups of 10
- **Large suites (> 50 files)**: Individual file execution to prevent timeouts
- **Large chunks**: Automatic JSON output to prevent 30k character truncation

### Automatic JSON Output
For test suites over certain thresholds, results are automatically saved to JSON:
```bash
# Large suites automatically save results
npm test  # Saves to /tmp/test-results.json for suites > 50 files
```

## 🔒 Enforcement Cadence

### Agent Testing Guidelines

**When Agents Should Handle Testing:**
- ✅ **Unit Tests**: Agents can run and fix unit tests for their specific functionality
- ✅ **Integration Tests**: Agents can fix integration tests related to their domain
- ✅ **Isolated Issues**: Single failing tests that are clearly related to agent changes

**When Agents Should Defer:**
- ❌ **Large Test Suites**: Use `npm test` (smart runner) instead of manual execution
- ❌ **Complex Failures**: Multiple failing tests across domains
- ❌ **Infrastructure Issues**: Output truncation, timeouts, or execution problems

### Testing Workflow Cadence

1. **Initial Assessment**: Run `npm test` to identify failing tests
2. **Isolation Phase**: Use quarantine system for problematic tests
3. **Fix Phase**: Address isolated issues systematically
4. **Validation Phase**: Re-enable quarantined tests and validate fixes
5. **Monitoring Phase**: Monitor for regressions and flaky tests

### Quarantine-First Approach

```bash
# Step 1: Run tests and quarantine failures
npm test

# Step 2: Check quarantine status
npm run test:quarantine:list

# Step 3: Fix quarantined tests individually
# Edit and fix each quarantined test file

# Step 4: Release fixed tests
npm run test:quarantine release <filename>

# Step 5: Validate all tests pass
npm test
```

## Key Features

### 🧠 Smart Test Runner
- **Automatic batching**: Processes large test suites in optimal chunks
- **Max test rules**: Runs tests individually when suite exceeds 50 files
- **Output management**: Prevents 30k character truncation with chunked processing
- **Intelligent execution**: Adapts strategy based on test suite size

### 🚨 Test Quarantine System
- **Problem isolation**: Automatically quarantines failing tests
- **Clean execution**: Allows stable tests to run without interference
- **Targeted fixing**: Enables focused debugging of problematic tests
- **Statistics tracking**: Monitors quarantine patterns and reasons

### 📊 Execution Strategies

#### Standard Execution (< 10 files)
```bash
npm test  # Uses smart runner with standard Vitest execution
```

#### Chunked Execution (10-50 files)
```bash
npm test  # Automatically chunks into groups of 10
```

#### Individual Execution (> 50 files)
```bash
npm test  # Runs each test file individually to prevent timeouts
```

#### Direct Vitest Execution
```bash
npm run test:direct  # Bypasses smart runner for debugging
```

## Test Organization

```
src/__tests__/
├── unit/           # Unit tests (277 tests)
├── integration/    # Integration tests (234 tests)  
├── performance/    # Performance tests (25 tests)
└── quarantine/     # Quarantined problematic tests
```

## Quarantine Management

### Listing Quarantined Tests
```bash
npm run test:quarantine:list
```

### Quarantine Statistics
```bash
npm run test:quarantine:stats
```

### Manual Quarantine
```bash
node scripts/test-utils/test-quarantine.js quarantine <file-path> <reason>
```

### Release from Quarantine
```bash
node scripts/test-utils/test-quarantine.js release <file-name>
```

### Auto-Quarantine from Results
```bash
node scripts/test-utils/test-quarantine.js auto <results-file.json>
```

## Configuration

### Vitest Configuration
- **Parallel execution**: Thread pool with 4 max workers
- **Failure handling**: Stops after 5 failures to prevent resource waste
- **Timeout management**: 30s test timeout, 30s hook timeout
- **Retry logic**: 2 retry attempts for flaky tests

### Smart Runner Configuration
- **Max output size**: 25,000 characters (buffer below 30k limit)
- **Max files threshold**: 50 files (triggers individual execution)
- **Chunk size**: 10 files per chunk for batch processing

## Best Practices

### 1. Test Development
- Write tests in appropriate directories (unit/integration/performance)
- Use descriptive test names that explain the behavior being tested
- Include proper setup and teardown in beforeEach/afterEach
- Mock external dependencies appropriately

### 2. Test Execution
- Use `npm test` for normal development (smart runner)
- Use `npm run test:direct` when debugging specific issues
- Use `npm run test:unit` for fast unit test feedback
- Use quarantine system for problematic tests during development

### 3. Test Maintenance
- Regularly review quarantined tests and fix underlying issues
- Monitor test execution times and optimize slow tests
- Keep test dependencies up to date
- Review test coverage reports regularly

## Troubleshooting

### Output Truncation
If test output is truncated:
1. Use `npm run test:direct` with `--reporter=json` for full results
2. Check individual test files with the smart runner
3. Use quarantine to isolate problematic tests

### Slow Test Execution
If tests are running slowly:
1. Check for infinite loops in test code
2. Review async operations and timeouts
3. Use quarantine to isolate slow tests
4. Consider chunked execution for large suites

### Test Failures
When tests fail:
1. Use `npm run test:quarantine` to isolate failing tests
2. Run individual test files for detailed debugging
3. Check test dependencies and mocking
4. Review recent code changes that might affect tests

## Performance Metrics

### Current Test Suite
- **Total Tests**: 536
- **Unit Tests**: 277 (51%)
- **Integration Tests**: 234 (44%)
- **Performance Tests**: 25 (5%)
- **Success Rate**: 100%

### Execution Performance
- **Unit Tests**: ~6.5 seconds
- **Integration Tests**: ~45 seconds (with smart batching)
- **Performance Tests**: ~8 seconds
- **Total Suite**: ~60 seconds (with intelligent execution)

## Advanced Features

### Custom Test Runners
The smart test runner supports:
- Pattern-based test discovery
- Custom chunk sizes
- Output size monitoring
- Automatic quarantine suggestions

### CI/CD Integration
For CI/CD environments:
- Set `CI=true` for JSON output format
- Use `--reporter=json` for machine-readable results
- Leverage quarantine system for flaky test management
- Implement automatic quarantine in CI pipelines

### Monitoring and Analytics
- Test execution time tracking
- Failure pattern analysis
- Quarantine trend monitoring
- Performance regression detection

## Contributing

When adding new tests:
1. Place in appropriate directory (unit/integration/performance)
2. Follow existing naming conventions
3. Include proper mocking and cleanup
4. Test with both smart runner and direct execution
5. Update this documentation if needed

## Support

For testing issues:
1. Check quarantine status: `npm run test:quarantine:list`
2. Run individual tests: `npm run test:direct -- <test-file>`
3. Review test output: Use JSON reporter for detailed analysis
4. Check configuration: Verify vitest.config.ts settings
