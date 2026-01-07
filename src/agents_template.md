# Universal Development Codex v1.2.20

**Version**: 1.2.22
**Last Updated**: 2026-01-06
**Purpose**: Systematic error prevention and production-ready development framework

## Overview

This codex defines the 30+ mandatory terms that guide AI-assisted development under the StrRay Framework. Every agent loads this codex during initialization and validates all actions against these terms to achieve 99.6% error prevention.

## Critical Codex Terms for Enforcement

### Core Terms (1-10)

#### 1. Progressive Prod-Ready Code

All code must be production-ready from the first commit. No placeholder, stub, or incomplete implementations. Every function, class, and module must be fully functional and ready for deployment.

#### 2. No Patches/Boiler/Stubs/Bridge Code

Prohibit:

- Temporary patches that are "meant to be fixed later"
- Boilerplate code that serves no real purpose
- Stub implementations that don't function
- Bridge code that creates unnecessary abstractions

All code must have clear, permanent purpose and complete implementation.

#### 3. Do Not Over-Engineer the Solution

Solutions should be:

- Simple and direct
- Focused on the actual problem
- Free of unnecessary abstractions
- Maintainable and understandable
- Minimal complexity for the required functionality

#### 4. Fit for Purpose and Prod-Level Code

Every piece of code must:

- Solve the specific problem it was created for
- Meet production standards (error handling, logging, monitoring)
- Be maintainable by other developers
- Follow established patterns in the codebase
- Include appropriate tests

#### 5. Surgical Fixes Where Needed

Apply precise, targeted fixes:

- Fix the root cause, not symptoms
- Make minimal changes to resolve the issue
- Avoid refactoring unrelated code
- Preserve existing functionality
- Document the fix clearly

#### 6. Batched Introspection Cycles

Group introspection and analysis into intentional cycles:

- Review code in batches, not line-by-line
- Combine related improvements
- Avoid micro-optimizations during development
- Schedule dedicated refactoring sessions
- Focus on meaningful architectural improvements

#### 7. Resolve All Errors (90% Runtime Prevention)

Zero-tolerance for unresolved errors:

- All errors must be resolved before proceeding
- No `console.log` debugging or ignored errors
- Systematic error handling with proper recovery
- Error prevention through type safety and validation
- 90% of runtime errors prevented through systematic checks

#### 8. Prevent Infinite Loops

Guarantee termination in all iterative processes:

- All loops must have clear termination conditions
- Recursive functions must have base cases
- Event loops must have exit strategies
- Async operations must have timeout mechanisms
- All indefinite iteration patterns must be prohibited

#### 9. Use Shared Global State Where Possible

Prefer shared state over duplicated state:

- Single source of truth for data
- Centralized state management
- Avoid prop-drilling or passing data through multiple layers
- Use React Context, Redux, or similar patterns appropriately
- Reduce state duplication and synchronization issues

#### 10. Single Source of Truth

Maintain one authoritative source for each piece of information:

- Configuration stored in one place
- Data models defined once
- API contracts specified in a single location
- Documentation references the actual code
- Avoid duplication and contradictory information

### Extended Terms (11-20)

#### 11. Type Safety First

- Never use `any`, `@ts-ignore`, or `@ts-expect-error`
- Leverage TypeScript's type system fully
- Use discriminated unions for complex state
- Prefer type inference over explicit types when appropriate
- Type errors are blocking issues

#### 12. Early Returns and Guard Clauses

- Validate inputs at function boundaries
- Return early for invalid conditions
- Reduce nesting with guard clauses
- Keep the happy path at the top level
- Improve readability and reduce cognitive load

#### 13. Error Boundaries and Graceful Degradation

- Wrap components in error boundaries
- Provide fallback UI when components fail
- Implement circuit breakers for external dependencies
- Log errors for debugging without crashing
- Maintain user experience during failures

#### 14. Immutability Where Possible

- Prefer `const` over `let`
- Use immutable data structures
- Avoid mutating function parameters
- Use spread operator or array methods instead of mutation
- Predictable state changes are easier to debug

#### 15. Separation of Concerns

- Keep UI separate from business logic
- Separate data fetching from rendering
- Isolate side effects (API calls, logging)
- Clear boundaries between layers (UI, logic, data)
- Each component/module has one responsibility

#### 16. DRY - Don't Repeat Yourself

- Extract repeated logic into reusable functions
- Use composition over inheritance
- Create shared utilities for common operations
- Avoid copy-pasting code
- Maintain consistency through shared code

#### 17. YAGNI - You Aren't Gonna Need It

- Don't implement features that aren't needed now
- Avoid "just in case" code
- Build for current requirements, not hypothetical ones
- Defer optimization until there's a measurable problem
- Keep codebase lean and focused

#### 18. Meaningful Naming

- Variables, functions, and classes should be self-documenting
- Avoid abbreviations unless widely understood
- Use verbs for functions (calculatePrice, fetchUserData)
- Use nouns for classes (UserService, PriceCalculator)
- Boolean variables should be clear (isLoading, hasError)

#### 19. Small, Focused Functions

- Each function should do one thing well
- Keep functions under 20-30 lines when possible
- Reduce complexity by breaking down large functions
- Pure functions are easier to test and understand
- Side effects should be explicit and isolated

#### 20. Consistent Code Style

- Follow existing patterns in the codebase
- Use linters and formatters (ESLint, Prettier)
- Maintain consistent formatting throughout
- Follow language idioms (TypeScript best practices)
- Code should read like it was written by one person

### Architecture Terms (21-30)

#### 21. Dependency Injection

- Pass dependencies as parameters
- Avoid hardcoded dependencies
- Make code testable by injecting mocks
- Use inversion of control containers when beneficial
- Reduce coupling between components

#### 22. Interface Segregation

- Define specific, focused interfaces
- Avoid god interfaces with too many methods
- Clients shouldn't depend on methods they don't use
- Split large interfaces into smaller, specific ones
- Improve testability and flexibility

#### 23. Open/Closed Principle

- Open for extension, closed for modification
- Use polymorphism to add new behavior
- Avoid changing existing code when adding features
- Plugin and extension patterns
- Maintain stability while enabling growth

#### 24. Single Responsibility Principle

- Each class/module should have one reason to change
- Separate concerns into different modules
- Keep functions focused on one task
- Reduce coupling between components
- Make code easier to test and maintain

#### 25. Code Rot Prevention

- Monitor code consolidation (>70% consolidation threshold)
- Refactor code that has grown organically
- Remove unused code and dependencies
- Update deprecated APIs and patterns
- Maintain code quality over time

#### 26. Test Coverage >85%

- Maintain 85%+ behavioral test coverage
- Focus on behavior, not implementation details
- Integration tests for critical paths
- Unit tests for pure functions and utilities
- E2E tests for user workflows

#### 27. Fast Feedback Loops

- Provide immediate validation feedback
- Show loading states for async operations
- Real-time error messages for forms
- Clear success confirmation after actions
- Reduce user uncertainty

#### 28. Performance Budget Enforcement

- Bundle size <2MB (gzipped <700KB)
- First Contentful Paint <2s
- Time to Interactive <5s
- Lazy load non-critical components
- Optimize images and assets

#### 29. Security by Design

- Validate all inputs (client and server)
- Sanitize data before rendering
- Use HTTPS for all requests
- Implement rate limiting
- Never expose sensitive data in client code

#### 30. Accessibility First

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- WCAG 2.1 AA compliance

### Advanced Terms (31-43)

#### 31. Async/Await Over Callbacks

- Use async/await for asynchronous code
- Avoid callback hell
- Proper error handling with try/catch
- Parallel async operations with Promise.all
- Sequential async operations when dependencies exist

#### 32. Proper Error Handling

- Never ignore errors (no empty catch blocks)
- Provide context in error messages
- Log errors for debugging
- Inform users of actionable errors
- Implement retry logic for transient failures

#### 33. Logging and Monitoring

- Log important events and errors
- Use structured logging (JSON)
- Monitor performance metrics
- Set up error tracking (Sentry, LogRocket)
- Production debugging visibility

#### 34. Documentation Updates

- Update README when adding features
- Document API endpoints and contracts
- Include inline comments for complex logic
- Keep architecture diagrams current
- Document breaking changes

#### 35. Version Control Best Practices

- Atomic commits (one logical change per commit)
- Descriptive commit messages
- Use feature branches
- Pull requests for code review
- Maintain clean git history

#### 36. Continuous Integration

- Automated testing on every commit
- Linting and formatting checks
- Build verification
- Deploy previews for review
- Fast feedback on quality

#### 37. Configuration Management

- Environment variables for secrets
- Config files for environment-specific settings
- Never commit secrets to version control
- Validate configuration on startup
- Default values with overrides

#### 38. Functionality Retention

- Preserve existing functionality when refactoring
- Regression testing before changes
- 99.7% functionality retention rate
- Migration paths for breaking changes
- Backward compatibility when possible

#### 39. Gradual Refactoring

- Refactor in small, testable steps
- Maintain working code throughout
- Each refactoring improves specific aspect
- Don't rewrite entire systems at once
- Continuous improvement mindset

#### 40. Modular Design

- Clear module boundaries
- Low coupling, high cohesion
- Reusable components
- Pluggable architecture
- Easy to test individual modules

#### 41. State Management Patterns

- Choose appropriate state management (Context API, Redux, Zustand)
- Keep state as close to where it's used as possible
- Minimize global state
- Derive computed state from base state
- Normalize complex state

#### 42. Code Review Standards

- At least one reviewer for all changes
- Focus on correctness, not style
- Verify tests are added/updated
- Check documentation updates
- Maintain quality standards

#### 43. Deployment Safety

- Zero-downtime deployments
- Feature flags for risky changes
- Rollback capability for quick recovery
- Monitor deployments closely
- Gradual rollout to production

#### 44. Infrastructure as Code Validation

All infrastructure and configuration files must be validated before deployment:

- YAML/JSON syntax validation for CI/CD workflows
- Configuration file linting and formatting
- Automated validation in pre-commit hooks
- Schema validation for configuration files
- No manual YAML debugging - validate early and often

#### 45. Test Execution Optimization

Test execution must be optimized for speed and reliability:

- Run unit tests with multiple workers (minimum 4 threads)
- Run E2E tests with parallel workers (minimum 4 workers)
- Implement chunked output processing for large test results
- Stop execution if 5+ tests fail (triage threshold)
- Use sub-agents for handling large test outputs (>30k characters)

## Interweaves (Cross-Cutting Concerns)

### Error Prevention Interweave

Apply systematic error prevention throughout:

- Input validation at boundaries
- Type safety enforcement
- Error boundary placement
- Circuit breaker patterns
- Graceful degradation strategies

### Performance Interweave

Performance considerations in all code:

- Bundle size monitoring
- Render optimization
- Network request optimization
- Lazy loading strategies
- Caching strategies

### Security Interweave

Security in every layer:

- Input validation and sanitization
- Authentication and authorization
- Data encryption in transit and at rest
- Secure storage of secrets
- OWASP Top 10 compliance

## Introspection Lenses

### Code Quality Lens

View code through quality metrics:

- Cyclomatic complexity
- Code duplication
- Test coverage
- Type safety
- Documentation completeness

### Maintainability Lens

Assess long-term maintainability:

- Naming clarity
- Modularity
- Coupling and cohesion
- Documentation quality
- Test comprehensiveness

### Performance Lens

Evaluate performance characteristics:

- Bundle size impact
- Rendering performance
- Memory usage
- Network efficiency
- Algorithmic complexity

## Principles

### SOLID Principles

- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### DRY Principles

- Don't Repeat Yourself
- Every piece of knowledge has one representation
- Extract repeated logic
- Reduce duplication

### KISS Principles

- Keep It Simple, Stupid
- Simple solutions are better
- Avoid unnecessary complexity
- Clear over clever

## Anti-Patterns to Avoid

### Code Anti-Patterns

- Spaghetti code (unstructured, tangled logic)
- Lasagna code (too many layers)
- Ravioli code (too many small objects)
- Magic numbers and strings
- God classes and objects

### Architecture Anti-Patterns

- Tight coupling between components
- Circular dependencies
- Golden hammer (one tool for everything)
- Reinventing the wheel
- Premature optimization

### Process Anti-Patterns

- Cowboy coding (no process)
- Analysis paralysis (over-planning)
- Cargo cult programming (copying without understanding)
- Resume-driven development (over-engineering for resume)
- Not invented here syndrome

## Validation Criteria

### Code Completeness

- [ ] All functions have implementations
- [ ] No TODO comments in production code
- [ ] All error paths are handled
- [ ] Edge cases are covered
- [ ] Logging is appropriate

### Code Quality

- [ ] Linter passes without errors
- [ ] TypeScript compilation succeeds
- [ ] Tests pass (unit, integration, E2E)
- [ ] Bundle size within limits
- [ ] Performance meets targets

### Code Safety

- [ ] No security vulnerabilities
- [ ] No type errors or `any` usage
- [ ] Input validation on all inputs
- [ ] Error handling in all async operations
- [ ] Proper secrets management

## Framework Alignment

### oh-my-opencode v2.12.0 Compliance

- Schema-compliant configuration
- MCP integration compatible
- Agent capability structure
- Session management aligned
- Tool orchestration supported

### StrRay Framework v1.0.0

- Codex-loaded agent initialization
- 90%+ error prevention operational
- Zero-tolerance policies enforced
- Progressive escalation active
- Bundle size limits enforced

---

**Codex Compliance**: All agents must validate actions against these terms before proceeding. Violations trigger escalation and block commits until resolved.

**Error Prevention Target**: 99.6% (systematic runtime error prevention through zero-tolerance policies and comprehensive validation).

**Version Management**: This codex is the single source of truth. Updates propagate to all agents automatically through context loading mechanism.
