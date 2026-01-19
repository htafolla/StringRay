# Credible UI - Project Context for AI Agents

## Project Overview

Credible is a decentralized crowdfunding and token distribution platform built on Sui blockchain. It provides a React frontend application that interfaces with Sui Move smart contracts to enable trustless, accountable crowdfunding with innovative features like all-or-nothing funding, token vesting, and exit mechanisms.

The platform protects both investors and founders through smart contract-enforced mechanisms, allowing investors to exit their investments if projects don't deliver while ensuring founders receive funding gradually as they meet milestones.

- Specification: @SPEC.md

## Development Principles (StrRay Framework Integration)

This project integrates with **StringRay AI v1.1.0**, which implements **Universal Development Codex v1.2.25** for systematic error prevention and code quality assurance.

### Default AI Model

**Primary model**: `opencode/grok-code` (Grok Code Fast 1)

All AI agents and coding tasks should use `opencode/grok-code` by default for this project.

### Active Codex Terms

The StrRay framework automatically loads and enforces **all 43 codex terms** from Universal Development Codex v1.2.25:

**Core Principles (Terms 1-10)**: Progressive Prod-Ready Code, No Stubs/Patches, Minimal Complexity, Surgical Fixes, Batched Introspection, 90% Error Prevention, Infinite Loop Prevention, Shared Global State, Single Source of Truth

**Extended Terms (Terms 11-20)**: Type Safety First, No Magic Numbers, Error Boundaries, Component Isolation, State Immutability, Lazy Loading, Memoization, Event Delegation, Debouncing, Throttling

**Architecture Terms (Terms 21-30)**: Separation of Concerns, Single Responsibility, Open/Closed Principle, Liskov Substitution, Interface Segregation, Dependency Inversion, SOLID Principles, Clean Architecture, Microservices Pattern, Event Sourcing

**Advanced Terms (Terms 31-43)**: Security by Design, Input Validation, Output Sanitization, Proper Error Handling, Logging Standards, Metrics Collection, Monitoring Alerts, Health Checks, Rate Limiting, Caching Strategy, Code Review Standards, Functionality Retention, Deployment Safety

### Enforcement Mechanism

The framework enforces codex compliance through three mechanisms:

1. **Automatic Codex Injection** (`.opencode/plugin/strray-codex-injection.ts`):
   - Injects all 43 codex terms into agent system prompts on session start
   - Ensures codex context is available to all AI agents
   - Runs automatically via oh-my-opencode plugin system

2. **Runtime Validation** (`.opencode/scripts/validate-codex.py`):
   - Validates all code changes (write, edit, multiedit) before execution
   - Blocks violations using Python codex_loader module
   - Provides detailed violation reports with term IDs and messages
   - Exit code 1 indicates non-compliant code

3. **Session Initialization** (`.opencode/init.sh`):
   - Runs framework initialization scripts on session start
   - Loads automation hooks, MCP skills, and agent configurations
   - Performs initial compliance checks

These principles are enforced automatically and should guide all development decisions.

---

## Architecture & Technologies

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain Integration**: Sui Blockchain via `@mysten/sui.js` and `@mysten/dapp-kit`
- **State Management**: React hooks, TanStack Query for data fetching
- **UI Components**: Radix UI primitives, shadcn/ui, Lucide React icons
- **Form Handling**: React Hook Form with Zod validation
- **GraphQL**: Apollo Client for data management
- **Database**: Supabase (via Lovable Cloud)
- **Responsive Design**: Tailwind CSS with mobile-first approach

## Key Features

### For Investors

- **All-or-Nothing Funding**: Automatic refunds if minimum goals aren't met
- **Exit Mechanism**: Ability to exit investments at any time during vesting with graduated fees
- **100% Refund Guarantee**: During funding phase if goals aren't reached
- **Gradual Token Claims**: Receive tokens gradually as they vest
- **Transparency**: All funding activities tracked on-chain

### For Founders

- **Token Vesting**: Gradual unlocking of tokens and funding as milestones are met
- **Curated Vetting**: Projects can apply for BTCFi incentives with committee review
- **Flexible Exit Options**: Various mechanisms for project completion
- **Secure Fund Management**: Funds held in smart contracts with automated distribution

### Platform Features

- **Pod Creation**: Founders create "pods" representing funding campaigns
- **Grace Period**: Fixed period after funding with reduced exit fees
- **Investor Protection**: Smart contract-enforced refunds for failed campaigns
- **Vesting Schedules**: Linear vesting to protect against token dumps

## Project Structure

```
src/
├── components/         # React components (UI elements, forms, etc.)
│   ├── ui/              # Reusable UI primitives
│   ├── create-pod/       # Feature-specific components
│   └── ErrorBoundary.tsx
├── hooks/              # Custom React hooks
│   ├── usePodActions.ts
│   └── useCurrencyPrices.ts
├── lib/                # Utility functions and business logic
│   ├── num.ts           # Number formatting utilities
│   ├── token-calculations.ts
│   └── currency-config.ts
├── pages/              # Route components
├── contexts/           # React Context providers
├── types/              # TypeScript type definitions
└── __tests__/          # Test utilities and helpers
```

## Building and Running

### Prerequisites

- bun (package manager, as indicated by bun.lockb file)

### Installation & Development

```bash
# Install dependencies
bun install

# Start development server (Vite + hot reload)
bun run dev
```

### Production Build

```bash
# Production build with compression
bun run build

# Preview production build locally
bun run preview
```

### Code Quality Commands

```bash
# Run ESLint
bun run lint

# Format with Prettier
bun run format
```

### Testing Commands

```bash
# Unit Tests (Vitest)
bun run test:unit              # Run all unit tests
bun run test:unit:watch        # Watch mode
bun run test:unit:coverage     # Coverage report

# E2E Tests (Playwright)
npx playwright test             # Run all E2E tests
npx playwright test --ui        # Run with UI
```

### Environment Variables

The project uses environment variables for Sui network configuration:

```
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0xd5bec708e04626b31e8f953ef1f6d6d5b79b4a837446a450633b004183233d5c
VITE_GLOBAL_SETTINGS_ID=0xa74d6d2d7cab3cec42cfad85e3211d183372701ed29b13962144a8e0e050ad45
```

## Sui Blockchain Integration

The application interacts with Sui smart contracts through Transaction Blocks for actions like investing in pods, creating funding campaigns, and claiming vested tokens.

## Development Conventions

### Imports and Exports

```typescript
// ✅ CORRECT: Path aliases, named imports, type imports separate
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatTokenAmount } from "@/lib/num";
import type { PodMetadata } from "@/types/pod";

// ❌ INCORRECT: Default imports, relative paths
import React from "react";
import Badge from "../../../components/ui/badge";
```

### TypeScript Types

```typescript
// ✅ CORRECT: Interface for objects, type for unions/primitives
interface PodMetadata {
  id: string;
  name: string;
  status: number;
}

type CurrencyType = "SUI" | "USDC" | "ETH";
```

### Component Structure

```typescript
// ✅ CORRECT: Props interface, early returns, error boundaries
interface InvestmentCardProps {
  podId: string;
  amount: number;
  onInvest: (amount: number) => void;
}

export const InvestmentCard = ({
  podId,
  amount,
  onInvest
}: InvestmentCardProps) => {
  if (!podId) return null; // Early return for invalid props

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AmountDisplay amount={amount} />
          <InvestButton onClick={() => onInvest(amount)} />
        </div>
      </CardContent>
    </Card>
  );
};
```

### Hook Patterns

```typescript
// ✅ CORRECT: Custom hooks with proper naming and error handling
export const usePodTokenPriceCalculation = ({
  podMetadata,
  tokenDecimals,
}: UsePodTokenPriceCalculationProps): TokenPriceCalculationResult => {
  return useMemo(() => {
    try {
      if (!podMetadata) return { tokenPrice: 0, isValid: false };

      const result = calculateHumanPrice(
        rawDivisor,
        rawMultiplier,
        baseDecimals,
        tokenDecimals,
      );

      return { tokenPrice: result, isValid: true };
    } catch (error) {
      console.error("Token price calculation failed:", error);
      return { tokenPrice: 0, isValid: false };
    }
  }, [podMetadata, tokenDecimals]);
};
```

### Error Handling

```typescript
// ✅ CORRECT: Try-catch with specific error types
try {
  const result = await executeTransaction(transaction);
  toast.success("Transaction successful");
  return result;
} catch (error) {
  if (error instanceof WalletError) {
    toast.error("Wallet connection failed");
  } else if (error instanceof ValidationError) {
    toast.error("Invalid transaction data");
  } else {
    toast.error("Transaction failed");
    console.error("Unexpected error:", error);
  }
  throw error; // Re-throw for caller handling
}
```

### Testing Patterns

```typescript
// ✅ CORRECT: Vitest with proper mocking and assertions
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("usePodTokenPriceCalculation", () => {
  const mockPodMetadata = {
    id: "test-pod",
    currency: "SUI",
    _raw_divisor: 1000000,
    _raw_multiplier: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when no podMetadata provided", () => {
    const { result } = renderHook(() =>
      usePodTokenPriceCalculation({
        podMetadata: undefined,
        tokenDecimals: 9,
      }),
    );

    expect(result.current.tokenPrice).toBe(0);
    expect(result.current.isValid).toBe(false);
  });

  it("should calculate token price correctly", () => {
    vi.mocked(calculateHumanPrice).mockReturnValue(0.01);

    const { result } = renderHook(() =>
      usePodTokenPriceCalculation({
        podMetadata: mockPodMetadata,
        tokenDecimals: 9,
      }),
    );

    expect(calculateHumanPrice).toHaveBeenCalledWith(1000000, 1, 9, 9);
    expect(result.current.tokenPrice).toBe(0.01);
  });
});
```

## File Organization & Naming

### Naming Conventions

```typescript
// Components: PascalCase
InvestmentCard.tsx;
PodCountdown.tsx;
TransactionHistory.tsx;

// Hooks: camelCase with 'use' prefix
usePodActions.ts;
useCurrencyPrices.ts;
useErrorRecovery.ts;

// Utilities: camelCase
formatTokenAmount.ts;
calculateHumanPrice.ts;
getCurrencyDecimals.ts;

// Types: PascalCase with descriptive names
interface PodMetadata {
  id: string;
  name: string;
}

type CurrencyType = "SUI" | "USDC";
```

### File Naming

```typescript
// Files: kebab-case
pod - validation.ts;
token - calculations.ts;
currency - config.ts;
```

## Key System Parameters

Based on specification:

- Maximum immediate unlock: 10% of funds for founders
- Minimum vesting duration: 3 months
- Maximum vesting duration: 24 months
- Subscription period: 7-30 days
- Grace period: 3 days with 0.8% exit fee
- Setup fee: 5 SUI for pod creators
- Cliff duration: 0 to 2 years

## Testing Strategy

### Test Categories

- **Unit Tests**: Component and hook testing with Vitest
- **Integration Tests**: API and component interaction testing
- **E2E Tests**: Full user journey testing with Playwright
- **Performance Tests**: Bundle analysis and runtime performance

### Test Organization

```
__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/               # End-to-end tests
```

## Performance Optimization

### Bundle Analysis

- **Tool**: Webpack Bundle Analyzer
- **Target**: Main bundle < 2MB (gzipped < 700KB)
- **Monitoring**: Automated bundle size checks

### Code Splitting

- **Strategy**: Route-based and component-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Caching**: Service worker for static asset caching

## Security Considerations

### Input Validation

- **Client-side**: Form validation with error messages
- **Server-side**: API input sanitization and validation
- **Blockchain**: Transaction validation and signature verification

### Authentication

- **Wallet Integration**: Sui wallet connection and verification
- **Session Management**: Secure session handling and timeouts
- **API Security**: Rate limiting and request validation

## Special Notes

### Contract Field Name Typo

The smart contract contains a typo in `InvestorRecord` struct where the field is named `investmnet` instead of `investment`. This is maintained throughout the codebase for consistency with the deployed contract.

### Network Mismatch Handling

Since Sui wallets cannot be programmatically switched by dApps, the application implements a network mismatch detector that warns users when their wallet network doesn't match the selected dApp network and provides instructions for manual switching.

## Framework Thresholds

The StrRay framework enforces these quality thresholds:

- **Bundle Size**: < 2MB (gzipped < 700KB)
- **Test Coverage**: > 85%
- **Code Duplication**: < 5%
- **Error Rate**: < 10%

## Troubleshooting

### Common Issues

- **Build Failures**: Check TypeScript errors and missing dependencies
- **Test Failures**: Verify test setup and mocking configuration
- **Performance Issues**: Check bundle size and lazy loading implementation

### Debug Tools

- **Browser DevTools**: Network, console, and performance monitoring
- **React DevTools**: Component tree and state inspection
- **Vitest UI**: Interactive test debugging and coverage analysis

---

_This document serves as the knowledge base for AI agents and human contributors working on Credible UI._

### Development Server

```bash
bun run dev          # Start development server (Vite + hot reload)
bun run build        # Production build with compression
bun run build:dev    # Development build for debugging
bun run preview      # Preview production build locally
```

### Code Quality

```bash
bun run lint         # Run ESLint on all files
bun run format       # Format code with Prettier
bun run format:all   # Format all files including ignored ones
```

### Testing Commands

```bash
# Unit Tests (Vitest)
bun run test:unit              # Run all unit tests once
bun run test:unit:watch        # Run unit tests in watch mode
bun run test:unit:debug        # Run unit tests with verbose output
bun run test:unit:coverage     # Run unit tests with coverage report
bun run test:unit:ui           # Run unit tests with UI interface

# Individual Test Files
bun run test:unit -- src/hooks/__tests__/usePodTokenPriceCalculation.test.ts
bun run test:unit -- src/components/__tests__/PodCountdown.test.tsx

# E2E Tests (Playwright)
npx playwright test             # Run all E2E tests
npx playwright test --ui        # Run E2E tests with UI
npx playwright test e2e/create-pod.spec.ts  # Run specific E2E test

# All Tests
bun run test:all               # Run unit + E2E tests
bun run test:smoke             # Run smoke tests
```

### Single Test Execution

```bash
# Run a specific test file
bun run test:unit -- src/hooks/usePodTokenPriceCalculation.test.ts

# Run tests for a specific component/hook
bun run test:unit -- src/components/PodCountdown.tsx
bun run test:unit -- src/hooks/usePodActions.ts

# Run tests matching a pattern
bun run test:unit -- --grep "should handle edge cases"
```

## Code Style Guidelines

### Imports and Exports

```typescript
// ✅ CORRECT: Path aliases, named imports, type imports separate
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatTokenAmount } from "@/lib/num";
import type { PodMetadata } from "@/types/pod";

// ❌ INCORRECT: Default imports, relative paths
import React from "react";
import Badge from "../../../components/ui/badge";
```

### TypeScript Types

```typescript
// ✅ CORRECT: Interface for objects, type for unions/primitives
interface PodMetadata {
  id: string;
  name: string;
  status: number;
}

type CurrencyType = "SUI" | "USDC" | "ETH";

// ✅ CORRECT: Descriptive type names
type TokenPriceCalculationResult = {
  tokenPrice: number;
  isValid: boolean;
};

// ❌ INCORRECT: any types, generic names
interface Data {
  // Too generic
  value: any; // Never use any
}
```

### Component Structure

```typescript
// ✅ CORRECT: Props interface, early returns, error boundaries
interface InvestmentCardProps {
  podId: string;
  amount: number;
  onInvest: (amount: number) => void;
}

export const InvestmentCard = ({
  podId,
  amount,
  onInvest
}: InvestmentCardProps) => {
  if (!podId) return null; // Early return for invalid props

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AmountDisplay amount={amount} />
          <InvestButton onClick={() => onInvest(amount)} />
        </div>
      </CardContent>
    </Card>
  );
};
```

### Hook Patterns

```typescript
// ✅ CORRECT: Custom hooks with proper naming and error handling
export const usePodTokenPriceCalculation = ({
  podMetadata,
  tokenDecimals,
}: UsePodTokenPriceCalculationProps): TokenPriceCalculationResult => {
  return useMemo(() => {
    try {
      if (!podMetadata) return { tokenPrice: 0, isValid: false };

      const result = calculateHumanPrice(
        rawDivisor,
        rawMultiplier,
        baseDecimals,
        tokenDecimals,
      );

      return { tokenPrice: result, isValid: true };
    } catch (error) {
      console.error("Token price calculation failed:", error);
      return { tokenPrice: 0, isValid: false };
    }
  }, [podMetadata, tokenDecimals]);
};
```

### Error Handling

```typescript
// ✅ CORRECT: Try-catch with specific error types
try {
  const result = await executeTransaction(transaction);
  toast.success("Transaction successful");
  return result;
} catch (error) {
  if (error instanceof WalletError) {
    toast.error("Wallet connection failed");
  } else if (error instanceof ValidationError) {
    toast.error("Invalid transaction data");
  } else {
    toast.error("Transaction failed");
    console.error("Unexpected error:", error);
  }
  throw error; // Re-throw for caller handling
}

// ✅ CORRECT: React error boundaries
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Component error:", error, errorInfo);
    // Report to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Testing Patterns

```typescript
// ✅ CORRECT: Vitest with proper mocking and assertions
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("usePodTokenPriceCalculation", () => {
  const mockPodMetadata = {
    id: "test-pod",
    currency: "SUI",
    _raw_divisor: 1000000,
    _raw_multiplier: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when no podMetadata provided", () => {
    const { result } = renderHook(() =>
      usePodTokenPriceCalculation({
        podMetadata: undefined,
        tokenDecimals: 9,
      }),
    );

    expect(result.current.tokenPrice).toBe(0);
    expect(result.current.isValid).toBe(false);
  });

  it("should calculate token price correctly", () => {
    vi.mocked(calculateHumanPrice).mockReturnValue(0.01);

    const { result } = renderHook(() =>
      usePodTokenPriceCalculation({
        podMetadata: mockPodMetadata,
        tokenDecimals: 9,
      }),
    );

    expect(calculateHumanPrice).toHaveBeenCalledWith(1000000, 1, 9, 9);
    expect(result.current.tokenPrice).toBe(0.01);
  });
});
```

## File Organization & Naming

### Directory Structure

```
src/
├── components/           # UI components (PascalCase filenames)
│   ├── ui/              # Reusable UI primitives
│   ├── create-pod/      # Feature-specific components
│   └── ErrorBoundary.tsx
├── hooks/               # Custom React hooks (camelCase with use prefix)
│   ├── usePodActions.ts
│   └── useCurrencyPrices.ts
├── lib/                 # Utility functions and business logic
│   ├── num.ts          # Number formatting utilities
│   ├── token-calculations.ts
│   └── currency-config.ts
├── pages/               # Route components
├── contexts/            # React contexts
├── types/               # TypeScript type definitions
└── __tests__/           # Test utilities and helpers
```

### Naming Conventions

```typescript
// Components: PascalCase
InvestmentCard.tsx;
PodCountdown.tsx;
TransactionHistory.tsx;

// Hooks: camelCase with 'use' prefix
usePodActions.ts;
useCurrencyPrices.ts;
useErrorRecovery.ts;

// Utilities: camelCase
formatTokenAmount.ts;
calculateHumanPrice.ts;
getCurrencyDecimals.ts;

// Types: PascalCase with descriptive names
interface PodMetadata {
  id: string;
  name: string;
}

type CurrencyType = "SUI" | "USDC";
type TokenPriceResult = {
  price: number;
  valid: boolean;
};

// Files: kebab-case
pod - validation.ts;
token - calculations.ts;
currency - config.ts;
```

### Import Organization

```typescript
// Group imports by type and source
import { useState, useEffect } from "react"; // React imports
import { Badge, Button } from "@/components/ui"; // UI components
import { formatTokenAmount } from "@/lib/num"; // Utilities
import type { PodMetadata } from "@/types/pod"; // Type imports

// Separate type imports
import type { CurrencyType, TokenPriceResult } from "@/types";
```

## Agent Roles & Responsibilities

### Code Guardian

- **Purpose**: Syntax validation and basic security checks
- **Tools**: ESLint, TypeScript compiler, security linters
- **Output**: Error reports with line numbers and fix suggestions

### Architecture Sentinel

- **Purpose**: Structural integrity and design pattern validation
- **Tools**: Dependency analysis, circular import detection, architectural rules
- **Output**: Architecture compliance reports and refactoring suggestions

### Test Validator

- **Purpose**: Test coverage and quality assessment
- **Tools**: Vitest, Playwright, coverage analysis
- **Output**: Test quality metrics and gap identification

### Error Preventer

- **Purpose**: Runtime error detection and prevention
- **Tools**: Static analysis, type checking, runtime monitoring
- **Output**: Error prevention recommendations and fixes

## AI Agent Integration

### oh-my-opencode Framework Agents

The project uses 8 specialized oh-my-opencode agents:

- **enforcer**: Code quality enforcement and security checks
- **architect**: System design and architectural decisions
- **orchestrator**: Multi-agent coordination and task management
- **bug-triage-specialist**: Issue classification and prioritization
- **code-reviewer**: Code review and improvement suggestions
- **security-auditor**: Security vulnerability detection
- **refactorer**: Code refactoring and optimization
- **test-architect**: Test strategy and coverage planning

### MCP Server Tools

The framework provides 14 MCP (Model Context Protocol) servers that extend agent capabilities. Use these specialized tools by referencing them in prompts:

#### Core MCP Servers:

- **orchestrator**: Complex task coordination and delegation
- **enhanced-orchestrator**: Multi-agent orchestration with monitoring
- **enforcer**: Rule enforcement and quality validation

#### Knowledge Skills (11 specialized servers):

- **code-review**: Automated code analysis and best practices (`use code-review`)
- **api-design**: RESTful API design and validation (`use api-design`)
- **testing-strategy**: Test planning and coverage optimization (`use testing-strategy`)
- **performance-optimization**: Bottleneck detection and fixes (`use performance-optimization`)
- **security-audit**: Vulnerability scanning and compliance (`use security-audit`)
- **architecture-patterns**: Design pattern recognition (`use architecture-patterns`)
- **git-workflow**: Branching strategy optimization (`use git-workflow`)
- **project-analysis**: Codebase complexity analysis (`use project-analysis`)
- **ui-ux-design**: Interface design validation (`use ui-ux-design`)
- **refactoring-strategies**: Code improvement recommendations (`use refactoring-strategies`)
- **testing-best-practices**: Testing methodology guidance (`use testing-best-practices`)

#### Usage Examples:

```
Analyze this codebase for security vulnerabilities. use security-audit
Design a REST API for user management. use api-design
Review this code for best practices. use code-review
Optimize this function for performance. use performance-optimization
```

### Agent Communication

- Agents communicate through MCP (Model Context Protocol) servers
- Shared context maintained via session management
- Background agent execution for parallel processing
- Real-time validation and feedback loops

- **enforcer**: Code quality enforcement and security checks
- **architect**: System design and architectural decisions
- **orchestrator**: Multi-agent coordination and task management
- **bug-triage-specialist**: Issue classification and prioritization
- **code-reviewer**: Code review and improvement suggestions
- **security-auditor**: Security vulnerability detection
- **refactorer**: Code refactoring and optimization
- **test-architect**: Test strategy and coverage planning

### Agent Communication

- Agents communicate through MCP (Model Context Protocol) servers
- Shared context maintained via session management
- Background agent execution for parallel processing
- Real-time validation and feedback loops

## Testing Strategy

### Test Categories

- **Unit Tests**: Component and hook testing with Vitest
- **Integration Tests**: API and component interaction testing
- **E2E Tests**: Full user journey testing with Playwright
- **Performance Tests**: Bundle analysis and runtime performance

### Test Organization

```
__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/               # End-to-end tests
└── performance/       # Performance tests
```

## Performance Optimization

### Bundle Analysis

- **Tool**: Webpack Bundle Analyzer
- **Target**: Main bundle < 2MB (gzipped < 700KB)
- **Monitoring**: Automated bundle size checks

### Code Splitting

- **Strategy**: Route-based and component-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Caching**: Service worker for static asset caching

## Security Considerations

### Input Validation

- **Client-side**: Form validation with error messages
- **Server-side**: API input sanitization and validation
- **Blockchain**: Transaction validation and signature verification

### Authentication

- **Wallet Integration**: Sui wallet connection and verification
- **Session Management**: Secure session handling and timeouts
- **API Security**: Rate limiting and request validation

## Deployment Pipeline

### Build Process

1. **Linting**: ESLint and TypeScript checks
2. **Testing**: Full test suite execution
3. **Build**: Vite production build with compression
4. **Analysis**: Bundle size and performance analysis

### Environments

- **Development**: Hot reload, full debugging, local API
- **Staging**: Production build, staging API, performance monitoring
- **Production**: Optimized build, production API, error tracking

## Error Handling

### Client-side Errors

- **UI Feedback**: User-friendly error messages
- **Logging**: Error reporting to monitoring service
- **Recovery**: Graceful degradation and retry mechanisms

### API Errors

- **Status Codes**: Proper HTTP status code responses
- **Error Messages**: Descriptive error information
- **Fallbacks**: Default values and alternative flows

## Contributing Guidelines

### Code Reviews

- **Automated Checks**: oh-my-opencode framework validation
- **Manual Review**: Architecture and code quality assessment
- **Testing**: All changes must include appropriate tests

### Documentation

- **Code Comments**: JSDoc for public APIs
- **README Updates**: Feature documentation and usage examples
- **Changelog**: Version-specific change documentation

## Troubleshooting

### Common Issues

- **Build Failures**: Check TypeScript errors and missing dependencies
- **Test Failures**: Verify test setup and mocking configuration
- **Performance Issues**: Check bundle size and lazy loading implementation

### Debug Tools

- **Browser DevTools**: Network, console, and performance monitoring
- **React DevTools**: Component tree and state inspection
- **Vitest UI**: Interactive test debugging and coverage analysis

---

_This document serves as the knowledge base for AI agents and human contributors working on Credible UI._
