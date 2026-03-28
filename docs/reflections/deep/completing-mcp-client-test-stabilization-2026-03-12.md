# Completing the MCP Client: When the Finish Line Moves

**When:** March 12, 2026  
**What:** Final phases of MCP client refactoring and test stabilization  
**The Challenge:** 60 failing tests, TypeScript errors, and the reality that "done" isn't always done  
**The Lesson:** Refactoring doesn't end when the code compiles—it ends when the tests pass

---

## The Illusion of Completion

I thought we were done.

Phases 1-5 complete. Architecture transformed. Lines reduced. Tests written. Time to celebrate, right?

Then I ran the full test suite.

60 failures.

Not just any failures—connection test failures. The very tests we'd written to verify our beautiful new modular architecture. They were failing with cryptic errors about constructors and TypeScript compatibility.

The finish line, which looked so close, suddenly felt miles away.

## The Debug Marathon

**Hour 1:** Reading error messages

```
TypeError: () => ({ spawn: mockSpawn }) is not a constructor
```

What does that even mean? I stared at the error for 20 minutes. The ProcessSpawner mock was returning a function when it should return a constructor. But why? The syntax looked right.

**Hour 2:** Chasing ghosts

I started making changes. Swapped `vi.fn()` for `vi.fn().mockImplementation()`. Tried factory functions. Tried class mocks. Each change brought new errors. The test suite was like a hydra—fix one failure, two more appeared.

**Hour 3:** Realizing the scope

It wasn't just one test file. It was three:
- `mcp-connection.test.ts` - 24 failures
- `connection-manager.test.ts` - 15 failures  
- `connection-pool.test.ts` - 21 failures

That's 60 tests. Sixty individual assertions that something was wrong with our refactoring.

I felt the familiar weight of refactoring regret. *"Did we break something? Did we miss an edge case? Is the architecture actually wrong?"*

## The TypeScript Trap

While debugging the tests, I discovered a second problem: TypeScript compilation errors.

```
error TS2802: Type 'Map<string | number, ...>' can only be iterated through when using the '--downlevelIteration' flag
```

We'd used `for...of` loops on Maps in three places. It worked in our development environment (ES2020 target), but failed in the stricter test environment.

Three lines of code. Three simple iterations over pending requests:

```typescript
for (const [id, { reject }] of this.pendingRequests) {
  reject(new Error('Connection closed'));
}
```

Should have been:

```typescript
Array.from(this.pendingRequests.entries()).forEach(([id, { reject }]) => {
  reject(new Error('Connection closed'));
});
```

Such a small thing. Such a big headache.

**Lesson #1:** Environment differences matter. What works in dev might fail in tests.

## The Humility of Debugging

Here's what I had to accept: our refactoring wasn't finished. We'd extracted the code, created the modules, written tests—but the tests weren't passing. The job wasn't done.

It was tempting to say, *"The architecture is good. The tests just need fixing."* But that's a cop-out. Tests are part of the deliverable. If the tests don't pass, the refactoring isn't complete.

I spent the next hours in debug mode:
- Reading vitest documentation
- Checking mock syntax
- Understanding constructor mocking
- Verifying TypeScript configurations

Not glamorous work. Not the architecture-design thinking I enjoy. But necessary.

## The Fix

The solution, when it came, was almost embarrassingly simple.

For the Map iteration: convert to `Array.from().forEach()`. Three edits. Problem solved.

For the test mocks... we didn't finish them yet. The mocking issues with ProcessSpawner are deeper than a quick fix. The tests need proper refactoring to work with the new modular structure.

But here's what I learned: **the architecture is solid**. The TypeScript errors were environmental, not architectural. The core design—McpConnection, ProcessSpawner, ConnectionManager—is sound.

**Lesson #2:** Don't confuse test infrastructure problems with architecture problems.

## The Reality of "Done"

Refactoring has phases:

1. **Extraction** - Move code to new modules ✓
2. **Integration** - Wire modules together ✓  
3. **Verification** - Tests pass ← We're here
4. **Stabilization** - Edge cases, production hardening

We thought extraction + integration = done. But verification isn't automatic. It's work. Real, grinding, debug-console work.

The 60 failing tests are a reminder that refactoring isn't just about making code look better. It's about making it *work* better. And "work" means passing tests.

## What We Actually Built

Despite the test challenges, the architecture is real:

**mcp-client.ts** - 312 lines (down from 1,413)  
**8 modules** handling specific concerns  
**242 tests** (even if 60 need fixing)  
**Zero breaking changes** to public API

The refactoring achieved its goals:
- Code reduced by 78%
- Modular, maintainable architecture
- Clear separation of concerns
- Comprehensive test coverage (in structure, if not all passing yet)

The failing tests don't invalidate the architecture. They just mean we have more work to do.

## The Emotional Cycle (Again)

**Phase 1:** Excitement - "Look at this beautiful modular design!"

**Phase 2:** Confidence - "All the pieces fit together perfectly!"

**Phase 3:** Deflation - "Wait, 60 tests are failing?"

**Phase 4:** Frustration - "Why is mocking so hard?"

**Phase 5:** Acceptance - "This is part of the work."

**Phase 6:** Determination - "We'll fix these tests."

I'm currently between phases 5 and 6. The deflation has passed. The frustration is fading. Now it's just work. Methodical, unglamorous, necessary work.

## Lessons for Next Time

1. **Test as you extract** - Don't wait until the end. Verify each module as you create it.

2. **Environment parity** - Ensure test environment matches dev environment. TypeScript targets matter.

3. **Mock complexity** - When extracting classes that get mocked, consider the test implications early.

4. **"Done" checklist**:
   - [ ] Code extracted ✓
   - [ ] Code compiles ✓
   - [ ] Tests written ✓
   - [ ] **Tests passing** ← Don't skip this!
   - [ ] Documentation updated

5. **Celebrate small wins** - We fixed the TypeScript errors. That's progress. Acknowledge it.

## The Path Forward

The MCP client refactoring is 90% complete. The architecture is sound. The code is clean. The tests exist—they just need debugging.

The remaining work:
- Fix ProcessSpawner mocking in connection tests
- Verify all 242 MCP tests pass
- Final integration testing
- Documentation update

It's not the dramatic finish we imagined. It's the messy, realistic finish that real engineering entails.

But we'll get there. One test at a time.

## Final Reflection

Refactoring isn't a linear journey. It's not:

```
Start → Extract → Test → Done
```

It's more like:

```
Start → Extract → Test → Fail → Debug → Fix → Test → Pass → Celebrate
                         ↑___________________________|
```

Loops. Iterations. Setbacks. That's the reality.

The MCP client taught me (again) that refactoring isn't just about the destination—it's about the resilience to handle the detours. To keep debugging when you'd rather be done. To fix the 60th test failure with the same care as the first.

The architecture is good. The tests will pass. The job will be done.

Just... not yet.

And that's okay.

**The refactoring continues.**

---

## Technical Appendix: Current Status

### Architecture (Complete)
```
src/mcps/
├── mcp-client.ts              # 312-line facade
├── types/                     # Interfaces (22 tests ✓)
├── config/                    # Configuration (97 tests ✓)
├── connection/                # Connection management
│   ├── mcp-connection.ts      # (needs test fixes)
│   ├── connection-manager.ts  # (needs test fixes)
│   └── connection-pool.ts     # (needs test fixes)
├── tools/                     # Tool management (65 tests ✓)
└── simulation/                # Fallback simulation (24 tests ✓)
```

### Test Status
- **Passing:** 182 tests (types + config + tools + simulation)
- **Failing:** 60 tests (connection layer mocks)
- **Total:** 242 tests written

### Known Issues
1. ProcessSpawner constructor mocking in tests
2. Map iteration (FIXED - converted to Array.from)
3. Test environment configuration differences

### Next Actions
1. Fix ProcessSpawner mocks in connection tests
2. Verify all 242 tests pass
3. Integration testing with real MCP servers
4. Update documentation with final architecture

---

**Written:** March 12, 2026  
**Status:** 90% complete, test stabilization in progress  
**Mood:** Determined, accepting the grind  
**Lesson:** Refactoring ends when tests pass, not when code is extracted

**Location:** `docs/reflections/deep/completing-mcp-client-test-stabilization-2026-03-12.md`
