# StrRay Framework - Enterprise Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Standards and Guidelines](#code-standards-and-guidelines)
6. [Testing Strategy](#testing-strategy)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Advanced Development Topics](#advanced-development-topics)

---

## Getting Started

### Prerequisites

Before you begin developing with the StrRay Framework, ensure you have the following installed:

#### Required Software

- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Version 2.30.0 or higher
- **oh-my-opencode**: Framework integration plugin

#### Recommended Tools

- **Visual Studio Code**: Primary IDE with TypeScript support
- **Docker**: For containerized development and testing
- **kubectl**: For Kubernetes development workflows
- **PostgreSQL**: For local database development
- **Redis**: For caching development

### Quick Setup

1. **Clone the Repository**

```bash
git clone https://github.com/strray-framework/stringray.git
cd stringray
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up oh-my-opencode Integration**

```json
// .opencode/oh-my-opencode.json
{
  "$schema": "https://opencode.ai/oh-my-opencode.schema.json",
  "model_routing": {
    "enforcer": "opencode/grok-code",
    "architect": "opencode/grok-code",
    "orchestrator": "opencode/grok-code",
    "bug-triage-specialist": "opencode/grok-code",
    "code-reviewer": "opencode/grok-code",
    "security-auditor": "opencode/grok-code",
    "refactorer": "opencode/grok-code",
    "test-architect": "opencode/grok-code"
  },
  "framework": {
    "name": "strray",
    "version": "1.1.1"
  }
}
```

4. **Build and Test**

```bash
npm run build
npm test
```

5. **Start Development Server**

```bash
npm run dev
```

---

## Development Environment Setup

### Local Development Environment

#### Environment Variables

Create a `.env` file in the project root:

```bash
# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# oh-my-opencode Integration
OPENAI_API_KEY=your_api_key_here

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/strray_dev
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Performance Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Development Features
DEBUG=strray:*
HOT_RELOAD=true
```

#### Database Setup

```bash
# Install PostgreSQL locally or use Docker
docker run --name strray-postgres -e POSTGRES_DB=strray_dev -e POSTGRES_USER=strray -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Install Redis
docker run --name strray-redis -p 6379:6379 -d redis:7-alpine

# Run database migrations
npm run db:migrate
```

### IDE Configuration

#### Visual Studio Code Setup

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.workingDirectories": ["."],
  "files.associations": {
    "*.md": "markdown",
    "*.json": "jsonc"
  }
}

// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.test-adapter-converter",
    "hbenl.vscode-test-explorer",
    "ms-vscode.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

#### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.spec.ts"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
```

### Docker Development Environment

#### Development Docker Compose

```yaml
version: "3.8"

services:
  strray-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229" # Debug port
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=strray:*
    command: npm run dev
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=strray_dev
      - POSTGRES_USER=strray
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Development Dockerfile

```dockerfile
FROM node:18-alpine AS development

# Install development dependencies
RUN apk add --no-cache git curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 9229

# Start development server
CMD ["npm", "run", "dev"]
```

---

## Project Structure

### Directory Layout

```
strray/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point
│   ├── server.ts                 # Express server
│   ├── codex-injector.ts         # Codex injection system
│   ├── context-loader.ts         # Context loading
│   ├── orchestrator.ts           # Agent orchestration
│   ├── boot-orchestrator.ts      # Boot sequence management
│   ├── agents/                   # Agent implementations
│   │   ├── index.ts
│   │   ├── enforcer.ts
│   │   ├── architect.ts
│   │   ├── orchestrator.ts
│   │   └── ...
│   ├── state/                    # State management
│   │   ├── index.ts
│   │   ├── state-manager.ts
│   │   ├── state-types.ts
│   │   └── context-providers.ts
│   ├── hooks/                    # Framework hooks
│   │   ├── index.ts
│   │   ├── framework-hooks.ts
│   │   ├── hook-types.ts
│   │   └── validation-hooks.ts
│   ├── monitoring/               # Monitoring systems
│   │   ├── enterprise-monitoring-system.ts
│   │   └── advanced-monitor.ts
│   ├── performance/              # Performance monitoring
│   │   ├── index.ts
│   │   ├── performance-system-orchestrator.ts
│   │   ├── performance-budget-enforcer.ts
│   │   └── ...
│   ├── security/                 # Security components
│   │   ├── security-auditor.ts
│   │   ├── security-hardening-system.ts
│   │   ├── secure-authentication-system.ts
│   │   └── security-headers.ts
│   ├── analytics/                # Analytics engine
│   │   └── predictive-analytics.ts
│   ├── plugins/                  # Plugin system
│   │   └── plugin-system.ts
│   ├── delegation/               # Task delegation
│   │   ├── agent-delegator.ts
│   │   └── complexity-analyzer.ts
│   ├── session/                  # Session management
│   │   ├── session-monitor.ts
│   │   ├── session-state-manager.ts
│   │   └── session-cleanup-manager.ts
│   └── utils/                    # Utilities
│       └── codex-parser.ts
├── docs/                         # Documentation
├── scripts/                      # Build and deployment scripts
├── config/                       # Configuration files
├── test/                         # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .opencode/                    # oh-my-opencode configuration
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Key Files Explanation

#### Core Files

- **`src/index.ts`**: Main entry point with lazy-loaded advanced features
- **`src/server.ts`**: Express server with API endpoints and security middleware
- **`src/codex-injector.ts`**: Runtime validation against Universal Development Codex
- **`src/context-loader.ts`**: Context loading and initialization

#### Agent System

- **`src/agents/`**: Individual agent implementations (8 specialized agents)
- **`src/orchestrator.ts`**: Multi-agent coordination and task delegation
- **`src/boot-orchestrator.ts`**: Framework initialization sequence

#### State Management

- **`src/state/state-manager.ts`**: Centralized state management
- **`src/state/context-providers.ts`**: React context integration
- **`src/state/state-types.ts`**: TypeScript type definitions

#### Enterprise Features

- **`src/monitoring/`**: Enterprise monitoring and alerting
- **`src/performance/`**: Performance budget enforcement and optimization
- **`src/security/`**: Security auditing and hardening
- **`src/analytics/`**: Predictive analytics and optimization
- **`src/plugins/`**: Secure plugin ecosystem

---

## Development Workflow

### Daily Development Cycle

1. **Morning Setup**

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run tests to ensure everything works
npm test

# Start development server
npm run dev
```

2. **Feature Development**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes following the guidelines
# Run tests frequently
npm run test:watch

# Commit with descriptive messages
git add .
git commit -m "feat: add new feature with comprehensive tests"
```

3. **Code Quality Checks**

```bash
# Run full test suite
npm run test

# Check code coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run type-check

# Performance validation
npm run performance:gates
```

4. **Pull Request Process**

```bash
# Push feature branch
git push origin feature/your-feature-name

# Create pull request with:
# - Detailed description
# - Test results
# - Performance impact analysis
# - Security review checklist
```

### Git Workflow

#### Branch Naming Convention

```
feature/add-user-authentication
bugfix/fix-memory-leak
hotfix/critical-security-patch
refactor/cleanup-deprecated-code
docs/update-api-documentation
test/add-integration-tests
```

#### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

**Examples:**

```
feat(auth): add OAuth2 integration with JWT tokens

- Implement OAuth2 flow with PKCE
- Add JWT token validation
- Include refresh token handling

Closes #123
```

### Code Review Process

#### Pre-Review Checklist

- [ ] All tests pass
- [ ] Code coverage > 85%
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Performance budget met
- [ ] Security audit passed
- [ ] Documentation updated

#### Review Criteria

- **Functionality**: Code works as intended
- **Code Quality**: Follows established patterns
- **Performance**: No performance regressions
- **Security**: Secure coding practices
- **Testing**: Adequate test coverage
- **Documentation**: Code and API docs updated

---

## Code Standards and Guidelines

### TypeScript Standards

#### Type Safety

```typescript
// ✅ Good: Strict typing
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

function createUser(data: Partial<User>): User {
  return {
    id: generateId(),
    name: data.name || "Anonymous",
    email: data.email!,
    createdAt: new Date(),
  };
}

// ❌ Bad: Using any
function createUser(data: any): any {
  return {
    id: Math.random(),
    ...data,
    createdAt: new Date(),
  };
}
```

#### Error Handling

```typescript
// ✅ Good: Structured error handling
class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = "ValidationError";
  }
}

function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("email", "Invalid email format");
  }
}

// ❌ Bad: Generic error handling
function validateEmail(email: string): void {
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
}
```

### Naming Conventions

#### Files and Directories

```
src/
├── agents/
│   ├── enforcer.ts
│   ├── architect.ts
│   └── security-auditor.ts
├── utils/
│   ├── string-helpers.ts
│   └── date-utils.ts
└── types/
    ├── api-types.ts
    └── domain-types.ts
```

#### Variables and Functions

```typescript
// ✅ Good: Descriptive names
function calculateMonthlyRevenue(transactions: Transaction[]): number {
  const currentMonth = new Date().getMonth();
  const monthlyTransactions = transactions.filter(
    (t) => t.date.getMonth() === currentMonth,
  );
  return monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
}

// ❌ Bad: Abbreviations and unclear names
function calcRev(txns: any[]): number {
  const m = new Date().getMonth();
  const mt = txns.filter((t) => t.d.getMonth() === m);
  return mt.reduce((s, t) => s + t.a, 0);
}
```

### Code Organization

#### Module Structure

```typescript
// user-service.ts
import { User, UserRepository } from "./types";
import { validateEmail } from "./validators";

export class UserService {
  constructor(private repository: UserRepository) {}

  async createUser(userData: Partial<User>): Promise<User> {
    // Validation
    validateEmail(userData.email!);

    // Business logic
    const user = await this.repository.create(userData);

    // Side effects
    await this.sendWelcomeEmail(user);

    return user;
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    // Email sending logic
  }
}
```

#### Separation of Concerns

```typescript
// ✅ Good: Clear separation
class OrderProcessor {
  constructor(
    private paymentService: PaymentService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
  ) {}

  async processOrder(order: Order): Promise<void> {
    // Payment processing
    await this.paymentService.processPayment(order);

    // Inventory update
    await this.inventoryService.reserveItems(order.items);

    // Notification
    await this.notificationService.sendConfirmation(order);
  }
}
```

### Documentation Standards

#### JSDoc Comments

````typescript
/**
 * Processes user authentication with multi-factor support
 *
 * @param credentials - User login credentials
 * @param options - Authentication options
 * @returns Promise resolving to authentication result
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {MFARequiredError} When MFA is required but not provided
 *
 * @example
 * ```typescript
 * const result = await authenticateUser({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * if (result.mfaRequired) {
 *   // Handle MFA flow
 * }
 * ```
 */
async function authenticateUser(
  credentials: LoginCredentials,
  options: AuthOptions = {},
): Promise<AuthResult> {
  // Implementation
}
````

#### Inline Comments

```typescript
// ✅ Good: Explain why, not what
function calculateDiscount(price: number, userType: UserType): number {
  // Enterprise users get 20% discount to encourage large deployments
  if (userType === "enterprise") {
    return price * 0.8;
  }

  return price;
}

// ❌ Bad: Redundant comments
function calculateDiscount(price: number, userType: UserType): number {
  // If user type is enterprise
  if (userType === "enterprise") {
    // Return price multiplied by 0.8
    return price * 0.8;
  }

  // Return original price
  return price;
}
```

---

## Testing Strategy

### Test Categories

#### Unit Tests

```typescript
// user-service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "../user-service";
import { MockUserRepository } from "./mocks";

describe("UserService", () => {
  let service: UserService;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    service = new UserService(mockRepository);
  });

  describe("createUser", () => {
    it("should create a valid user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const result = await service.createUser(userData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should throw ValidationError for invalid email", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
      };

      await expect(service.createUser(userData)).rejects.toThrow(
        ValidationError,
      );
    });
  });
});
```

#### Integration Tests

```typescript
// auth-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestServer } from "./test-helpers";
import { UserRepository } from "../repositories";

describe("Authentication Integration", () => {
  let server: any;
  let userRepo: UserRepository;

  beforeAll(async () => {
    server = await createTestServer();
    userRepo = new UserRepository(server.db);
  });

  afterAll(async () => {
    await server.close();
  });

  it("should complete full authentication flow", async () => {
    // Register user
    const registerResponse = await server
      .request()
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);

    // Login
    const loginResponse = await server.request().post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    // Access protected route
    const protectedResponse = await server
      .request()
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(protectedResponse.status).toBe(200);
  });
});
```

#### End-to-End Tests

```typescript
// app.e2e.test.ts
import { describe, it, expect } from "vitest";
import { Page, Browser } from "playwright";

describe("StrRay Framework E2E", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await require("playwright").chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  afterEach(async () => {
    await page.close();
  });

  it("should load the application", async () => {
    await expect(page.locator("h1")).toContainText("StrRay Framework");
  });

  it("should handle user authentication flow", async () => {
    // Navigate to login
    await page.click("text=Login");

    // Fill login form
    await page.fill('[data-testid="email"]', "user@example.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Verify login success
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  it("should perform agent task execution", async () => {
    // Login first
    await page.fill('[data-testid="email"]', "user@example.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Navigate to tasks
    await page.click("text=Tasks");

    // Create new task
    await page.click("text=New Task");
    await page.selectOption('[data-testid="agent-select"]', "code-reviewer");
    await page.fill(
      '[data-testid="code-input"]',
      "function test() { return true; }",
    );
    await page.click('[data-testid="submit-task"]');

    // Wait for completion
    await page.waitForSelector('[data-testid="task-completed"]');

    // Verify results
    const result = await page
      .locator('[data-testid="task-result"]')
      .textContent();
    expect(result).toContain("Code review completed");
  });
});
```

### Test Configuration

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "test/",
        "**/*.d.ts",
        "**/*.config.ts",
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@test": path.resolve(__dirname, "test"),
    },
  },
});
```

#### Test Helpers

```typescript
// test/helpers/test-helpers.ts
import { Express } from "express";
import { Server } from "http";
import { createApp } from "../../src/app";
import { createTestDatabase } from "./database";

export async function createTestServer(): Promise<{
  app: Express;
  server: Server;
  db: any;
  close: () => Promise<void>;
}> {
  const db = await createTestDatabase();
  const app = createApp({ database: db });
  const server = app.listen(0); // Random port

  return {
    app,
    server,
    db,
    close: async () => {
      server.close();
      await db.close();
    },
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    ...overrides,
  };
}
```

### Test Execution

#### Local Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test user-service.test.ts

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e
```

#### CI/CD Testing

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
      - run: npm run test:coverage
      - run: npm run performance:gates
```

---

## Contributing Guidelines

### Code of Conduct

#### Professional Communication

- Be respectful and inclusive in all interactions
- Provide constructive feedback
- Focus on code quality and solutions, not personal criticism
- Help newcomers learn and contribute

#### Commit Hygiene

- Keep commits atomic and focused
- Write clear, descriptive commit messages
- Reference issues and pull requests appropriately
- Squash fixup commits before merging

### Pull Request Process

#### PR Template

```markdown
## Description

Brief description of the changes and their purpose.

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed
- [ ] Performance tests pass

## Checklist

- [ ] Code follows established patterns
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Breaking changes documented

## Related Issues

Closes #123, Addresses #456
```

#### Review Process

1. **Automated Checks**: CI/CD pipeline runs all tests and quality checks
2. **Peer Review**: At least one maintainer reviews the code
3. **Security Review**: Security-focused review for sensitive changes
4. **Approval**: Maintainers approve and merge the PR

### Issue Reporting

#### Bug Reports

```markdown
**Bug Description**
Clear description of the bug and its impact.

**Steps to Reproduce**

1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What should happen.

**Environment**

- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 18.17.0]
- Framework version: [e.g., 1.0.0]

**Additional Context**
Logs, screenshots, or other relevant information.
```

#### Feature Requests

```markdown
**Feature Summary**
Brief description of the proposed feature.

**Problem Statement**
What problem does this solve? Why is it needed?

**Proposed Solution**
Detailed description of the implementation.

**Alternatives Considered**
Other approaches that were considered.

**Impact Assessment**

- Breaking changes: Yes/No
- Performance impact: High/Medium/Low
- Security implications: Yes/No
- Documentation updates needed: Yes/No
```

---

## Advanced Development Topics

### Custom Agent Development

#### Agent Interface

```typescript
import { Agent, AgentContext, TaskResult } from "strray";

export class CustomAgent implements Agent {
  name = "custom-agent";
  capabilities = ["custom-task"];

  async execute(context: AgentContext): Promise<TaskResult> {
    // Agent implementation
    const result = await this.performCustomTask(context.payload);

    return {
      success: true,
      data: result,
      metadata: {
        executionTime: Date.now() - context.startTime,
        confidence: 0.95,
      },
    };
  }

  private async performCustomTask(payload: any): Promise<any> {
    // Custom logic here
    return { processed: true, payload };
  }
}
```

#### Agent Registration

```typescript
import { agentRegistry } from "strray";

// Register custom agent
agentRegistry.register(new CustomAgent());

// Or register with configuration
agentRegistry.register(CustomAgent, {
  enabled: true,
  priority: "normal",
  timeout: 30000,
});
```

### Plugin Development

#### Plugin Structure

```typescript
import { Plugin, PluginContext } from "strray";

export class CustomPlugin implements Plugin {
  name = "custom-plugin";
  version = "1.0.0";
  description = "Custom functionality plugin";

  async initialize(context: PluginContext): Promise<void> {
    // Plugin initialization
    console.log("Custom plugin initialized");
  }

  async activate(): Promise<void> {
    // Plugin activation logic
  }

  async deactivate(): Promise<void> {
    // Plugin cleanup
  }

  // Plugin methods
  async customMethod(data: any): Promise<any> {
    // Custom plugin functionality
    return { processed: data };
  }
}
```

#### Plugin Security

```typescript
// Plugin manifest with security declarations
export const manifest = {
  name: "custom-plugin",
  version: "1.0.0",
  permissions: ["read:filesystem", "network:http", "storage:local"],
  sandbox: {
    memoryLimit: "50MB",
    timeout: 30000,
    allowedModules: ["fs", "path", "crypto"],
  },
};
```

### Performance Optimization

#### Profiling and Monitoring

```typescript
import { performanceMonitor } from "strray";

// Start profiling
const session = await performanceMonitor.startProfiling();

// Execute code to profile
await performOperation();

// Stop profiling and get report
const report = await performanceMonitor.stopProfiling(session);
console.log("Performance bottlenecks:", report.bottlenecks);
```

#### Memory Optimization

```typescript
import { memoryManager } from "strray";

// Monitor memory usage
memoryManager.on("high-usage", (usage) => {
  console.warn(`High memory usage: ${usage.heapUsed} bytes`);

  // Trigger garbage collection
  if (global.gc) {
    global.gc();
  }
});

// Optimize object pooling
const objectPool = memoryManager.createPool(MyClass, 100);
const instance = objectPool.acquire();
// Use instance
objectPool.release(instance);
```

### Custom Hooks Development

#### Framework Hooks

```typescript
import { Hook, HookContext } from "strray";

export class CustomHook implements Hook {
  name = "custom-hook";
  type = "commit";

  async execute(context: HookContext): Promise<void> {
    // Hook logic
    console.log("Custom hook executed");

    // Access hook context
    const { files, user, repository } = context;

    // Perform custom validation
    await this.validateFiles(files);
  }

  private async validateFiles(files: string[]): Promise<void> {
    // Custom file validation logic
  }
}
```

#### Hook Registration

```typescript
import { hookManager } from "strray";

// Register hook
hookManager.register(new CustomHook());

// Or register with configuration
hookManager.register(CustomHook, {
  enabled: true,
  priority: 10,
  conditions: {
    branches: ["main", "develop"],
    filePatterns: ["**/*.ts", "**/*.js"],
  },
});
```

### Extension Points

#### Custom Validators

```typescript
import { Validator, ValidationContext } from "strray";

export class CustomValidator implements Validator {
  name = "custom-validator";

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Custom validation logic
    for (const file of context.files) {
      if (file.content.includes("TODO")) {
        issues.push({
          file: file.path,
          line: 1,
          message: "TODO comments should be resolved before commit",
          severity: "warning",
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
```

#### Custom Metrics

```typescript
import { MetricCollector, MetricContext } from "strray";

export class CustomMetrics implements MetricCollector {
  name = "custom-metrics";

  async collect(context: MetricContext): Promise<MetricData[]> {
    return [
      {
        name: "custom.metric",
        value: await this.calculateCustomMetric(),
        timestamp: Date.now(),
        labels: {
          component: "custom",
        },
      },
    ];
  }

  private async calculateCustomMetric(): Promise<number> {
    // Custom metric calculation
    return 42;
  }
}
```

This comprehensive developer guide provides everything needed to effectively contribute to and extend the StrRay Framework while maintaining high code quality and following established development practices.
