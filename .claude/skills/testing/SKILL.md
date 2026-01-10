# Testing Skill

## Overview
Comprehensive testing skill that automates test generation, execution, and analysis for multiple testing frameworks.

## Features
- **Test Generation**: AI-powered test case creation
- **Coverage Analysis**: Detailed coverage reporting
- **Performance Testing**: Load and stress testing
- **Integration Testing**: End-to-end test automation
- **Test Maintenance**: Automatic test updates

## Supported Frameworks
- **Unit Testing**: Jest, Vitest, Mocha, Jasmine
- **Integration**: Cypress, Playwright, Selenium
- **API Testing**: Postman, REST Assured, Supertest
- **Performance**: k6, Artillery, JMeter

## Implementation

### Architecture
```
Testing Skill
├── Generator Engine
│   ├── AI Test Creator
│   ├── Template System
│   └── Code Analyzer
├── Execution Engine
│   ├── Test Runner
│   ├── Parallel Execution
│   └── Result Collector
├── Analysis Engine
│   ├── Coverage Analyzer
│   ├── Performance Metrics
│   └── Quality Scorer
└── Reporting System
    ├── HTML Reports
    ├── JSON Export
    └── CI Integration
```

### Configuration
```json
{
  "frameworks": {
    "unit": "jest",
    "integration": "playwright",
    "api": "supertest"
  },
  "coverage": {
    "threshold": 85,
    "exclude": ["**/node_modules/**", "**/*.config.js"]
  },
  "performance": {
    "duration": "30s",
    "vus": 100,
    "thresholds": {
      "http_req_duration": ["p(95)<500"]
    }
  }
}
```

### Test Types Generated
- **Unit Tests**: Function/component level testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: User journey testing
- **API Tests**: Endpoint validation
- **Performance Tests**: Load testing scenarios

### Quality Metrics
- **Coverage**: Line, branch, function coverage
- **Performance**: Response times, throughput
- **Reliability**: Flakiness detection
- **Maintainability**: Test complexity analysis

## Usage

### Generate Tests
```bash
/test-generate --file=src/component.ts --type=unit
```

### Run Test Suite
```bash
/test-run --suite=all --parallel=4
```

### Coverage Report
```bash
/test-coverage --format=html --threshold=85
```

### Performance Test
```bash
/test-performance --scenario=login-flow --vus=50
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npx testing-skill --ci --coverage --performance
```

### GitLab CI
```yaml
test:
  script:
    - npx testing-skill --gitlab --coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Dependencies
- Node.js 18+
- Testing frameworks (Jest, Playwright, etc.)
- Coverage tools (nyc, istanbul)
- Performance tools (k6, artillery)

## Best Practices
- **Test Isolation**: Each test independent
- **Descriptive Names**: Clear test naming
- **DRY Principle**: Avoid test duplication
- **Fast Feedback**: Quick test execution
- **Realistic Data**: Use representative test data
