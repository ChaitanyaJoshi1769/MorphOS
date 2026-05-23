# MorphOS Testing Guide

Comprehensive testing strategy for MorphOS including unit tests, integration tests, and end-to-end testing.

## Overview

MorphOS uses **Vitest** for fast, concurrent testing with excellent TypeScript support.

### Testing Stack
- **Vitest**: Unit and integration testing framework
- **Coverage**: @vitest/coverage-v8 for code coverage
- **Type Safety**: Full TypeScript support
- **Parallel Execution**: Fast feedback loops

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Package
```bash
pnpm test --filter @morphos/shared
pnpm test --filter @morphos/adaptive-runtime
```

### Watch Mode
```bash
pnpm test -- --watch
```

### Coverage Report
```bash
pnpm test -- --coverage
```

### Specific Test File
```bash
pnpm test -- packages/shared/tests/types.test.ts
```

## Test Structure

### Unit Tests

Located in `packages/*/tests/` and `apps/*/tests/`

```
packages/
├── shared/
│   └── tests/
│       ├── types.test.ts          # Type definitions
│       ├── validators.test.ts      # Validation logic
│       └── helpers.test.ts         # Helper functions
├── adaptive-runtime/
│   └── tests/
│       ├── runtime.test.ts         # Core runtime
│       ├── registry.test.ts        # Primitive registry
│       ├── mutations.test.ts       # Mutation engine
│       └── events.test.ts          # Event system
```

### Test Patterns

#### Basic Unit Test
```typescript
import { describe, it, expect } from "vitest";

describe("Feature", () => {
  it("should do something", () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

#### With Setup/Teardown
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Component", () => {
  let component: MyComponent;

  beforeEach(() => {
    component = new MyComponent();
  });

  afterEach(() => {
    component.cleanup();
  });

  it("should initialize", () => {
    expect(component).toBeDefined();
  });
});
```

#### Testing Async Code
```typescript
import { describe, it, expect } from "vitest";

describe("Async Operations", () => {
  it("should handle promises", async () => {
    const result = await myAsyncFunction();
    expect(result).toBeTruthy();
  });
});
```

## Writing Tests for Each Package

### Shared Types Tests
- Validate type structure
- Test type constraints
- Verify enums and unions
- Check default values

### Adaptive Runtime Tests
- Runtime initialization
- Primitive registration/retrieval
- Mutation application
- Component lifecycle
- Event emission

### Mutation Core Tests
- AST analysis
- Code generation
- Safety validation
- Dependency detection

### Agent Core Tests
- Agent initialization
- Task creation/execution
- Agent orchestration
- Memory management

### Enterprise Audit Tests
- Audit logging
- Policy enforcement
- Report generation
- Data retention

## Coverage Requirements

**Target Coverage Thresholds:**
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

View coverage:
```bash
pnpm test -- --coverage
open coverage/index.html  # View HTML report
```

## Integration Tests

Integration tests verify interactions between packages:

```typescript
describe("Runtime Integration", () => {
  it("should apply mutation to primitives", async () => {
    const runtime = new AdaptiveRuntime();
    const registry = new PrimitiveRegistry();

    // Register primitive
    registry.register(testPrimitive);

    // Apply mutation
    const mutation = createTestMutation();
    await runtime.applyMutation(mutation);

    // Verify result
    expect(runtime.getMutations()).toHaveLength(1);
  });
});
```

## E2E Testing

End-to-end tests verify complete workflows:

### API E2E Tests
```bash
# Test mutation service flow
curl -X POST http://localhost:3002/mutations \
  -H "Content-Type: application/json" \
  -d '{"appId":"test","description":"test"}'

# Verify applied
curl http://localhost:3002/mutations
```

### Dashboard E2E Tests
- Use Playwright or Cypress (optional)
- Test user workflows
- Verify API integration
- Validate UI interactions

## Performance Testing

Monitor performance with benchmark tests:

```typescript
import { describe, it, bench } from "vitest";

describe("Performance", () => {
  bench("should register 1000 primitives", () => {
    const registry = new PrimitiveRegistry();
    for (let i = 0; i < 1000; i++) {
      registry.register(createPrimitive(i));
    }
  });
});
```

Run benchmarks:
```bash
pnpm test -- --bench
```

## Continuous Integration

GitHub Actions workflows in `.github/workflows/ci.yml`:

1. **Lint** - Check code style
2. **Type Check** - Verify TypeScript
3. **Test** - Run test suite
4. **Build** - Build packages
5. **Security Scan** - Audit dependencies
6. **Docker Build** - Build containers

All steps must pass before merge to main.

## Debugging Tests

### Verbose Output
```bash
pnpm test -- --reporter=verbose
```

### Debug Single Test
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run path/to/test.ts
```

### Watch Specific File
```bash
pnpm test -- --watch path/to/test.ts
```

## Best Practices

### ✅ Do
- Write tests for all public APIs
- Test both happy path and error cases
- Use descriptive test names
- Keep tests focused and isolated
- Use fixtures for common setup
- Test edge cases and boundaries
- Maintain test independence

### ❌ Don't
- Test implementation details
- Create interdependent tests
- Use hardcoded values (except expected)
- Test third-party libraries
- Skip flaky tests without investigation
- Test too many things in one test

## Test Examples

### Testing a Service
```typescript
describe("MutationService", () => {
  it("should validate mutation before creation", () => {
    const invalidMutation = { /* missing required fields */ };
    expect(() => service.create(invalidMutation)).toThrow();
  });

  it("should store and retrieve mutations", () => {
    const mutation = createValidMutation();
    service.create(mutation);
    const retrieved = service.get(mutation.id);
    expect(retrieved).toEqual(mutation);
  });
});
```

### Testing Async Operations
```typescript
describe("PrimitiveRegistry", () => {
  it("should search primitives asynchronously", async () => {
    registry.register(primitive1);
    registry.register(primitive2);

    const results = await registry.searchAsync("keyword");
    expect(results).toHaveLength(1);
  });
});
```

### Testing Error Handling
```typescript
describe("Error Handling", () => {
  it("should handle invalid input", () => {
    expect(() => validatePrimitive(null)).toThrow("Invalid primitive");
  });

  it("should provide helpful error messages", () => {
    try {
      validatePrimitive({});
    } catch (error) {
      expect(error.message).toContain("required");
    }
  });
});
```

## Continuous Coverage Monitoring

Coverage reports are uploaded to Codecov after each test run.

View at: https://codecov.io/gh/ChaitanyaJoshi1769/MorphOS

## Test Maintenance

- Review failing tests in CI immediately
- Update tests when requirements change
- Refactor duplicate test code
- Keep dependencies up to date
- Monitor coverage trends

## Contributing Tests

When submitting PRs:
1. Add tests for new features
2. Update tests for modified code
3. Ensure all tests pass locally
4. Maintain or improve coverage
5. Follow existing test patterns

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Best Practices](https://testing-library.com)
- [Jest Matchers (Vitest compatible)](https://vitest.dev/api/expect.html)

---

**Testing is quality assurance.** Well-tested code is reliable code.
