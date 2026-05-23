# Contributing to MorphOS

Thank you for your interest in contributing to MorphOS! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. Discrimination, harassment, and hostile behavior are not tolerated.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8.15.4+
- Git 2.0+
- Docker (optional, for containerized development)

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/ChaitanyaJoshi1769/MorphOS.git
cd MorphOS

# Install dependencies
pnpm install

# Run tests to verify setup
pnpm test

# Start development servers
pnpm dev
```

## Development Workflow

### 1. Create a Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch (use descriptive names)
git checkout -b feature/add-caching-layer
# or
git checkout -b fix/mutation-validation-bug
# or
git checkout -b docs/update-api-reference
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test improvements
- `perf/` - Performance improvements

### 2. Make Changes

```bash
# Edit files as needed

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Fix any issues
pnpm lint -- --fix
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add request caching to mutation service

- Implement Redis-backed caching layer
- Add cache TTL configuration
- Add cache invalidation on mutations
- Improve API response time by 40%

Fixes #123"
```

**Commit message format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `perf` - Performance
- `ci` - CI/CD changes
- `chore` - Maintenance

### 4. Push & Create PR

```bash
# Push branch
git push origin feature/add-caching-layer

# Create pull request
# GitHub will show prompt, or use:
gh pr create --title "Add caching layer to mutation service" \
  --body "Implements request caching for improved performance"
```

**PR title format:**
```
[Type] Brief description

Good: Add caching layer to mutation service
Bad: fix stuff
Bad: Update
```

## Code Standards

### TypeScript

- Strict mode enabled (`strict: true`)
- No `any` types
- Explicit return types on functions
- Comprehensive type definitions

```typescript
// ✅ Good
async function createMutation(
  input: MutationInput,
  userId: string
): Promise<Mutation> {
  // implementation
}

// ❌ Bad
async function createMutation(input: any, userId: any): any {
  // implementation
}
```

### Error Handling

```typescript
// ✅ Good
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed:", error);
  return { success: false, error: error.message };
}

// ❌ Bad
try {
  return await operation();
} catch (error) {
  // silently fail
}
```

### Naming Conventions

- Variables/functions: `camelCase`
- Classes/types: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_leadingUnderscore`

```typescript
// ✅ Good
class MutationEngine {
  private _registry: Map<string, Mutation>;
  
  async applyMutation(mutation: Mutation): Promise<void> {
    // implementation
  }
}

const MAX_RETRIES = 3;

// ❌ Bad
class mutation_engine {
  registry: any;
  
  apply_mutation(m: any) {
    // implementation
  }
}
```

## Testing Requirements

All PRs must include tests:

```typescript
// ✅ Good - Includes test
describe("MutationEngine", () => {
  it("should apply mutations correctly", () => {
    const engine = new MutationEngine();
    const mutation = createTestMutation();
    
    const result = engine.apply(mutation);
    
    expect(result.success).toBe(true);
  });
});

// ❌ Bad - No test
export function applyMutation(mutation: Mutation): void {
  // implementation
}
```

### Coverage Requirements

- Minimum 80% line coverage
- Minimum 80% function coverage
- Minimum 75% branch coverage
- Minimum 80% statement coverage

Run coverage reports:
```bash
pnpm test -- --coverage
```

## Documentation

### Code Comments

```typescript
// ✅ Good - Explains why, not what
/**
 * Apply mutations using a priority queue to handle
 * high-impact changes first, preventing conflicts
 */
async function applyMutations(mutations: Mutation[]): Promise<void> {
  const queue = new PriorityQueue(mutations, by => -by.impact);
  // implementation
}

// ❌ Bad - Obvious what code does
// Loop through mutations
for (const mutation of mutations) {
  // apply mutation
}
```

### README Updates

- Update README.md if adding new features
- Include usage examples
- Document breaking changes

### API Documentation

- Document all public endpoints
- Include request/response examples
- Document error cases

## Performance Considerations

- Consider memory usage for large datasets
- Add benchmarks for critical paths
- Profile before optimizing
- Document performance trade-offs

```typescript
// ✅ Good - Considers performance
function searchPrimitives(query: string): Primitive[] {
  // Uses indexed search for O(log n) lookup
  return this._index.search(query);
}

// ❌ Bad - O(n) search
function searchPrimitives(query: string): Primitive[] {
  return this._primitives.filter(p => p.name.includes(query));
}
```

## Security Guidelines

- Never commit secrets or credentials
- Validate all user input
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines
- Use security headers

```typescript
// ✅ Good - Input validation
function registerPrimitive(input: unknown): Primitive {
  const validated = PrimitiveSchema.parse(input);
  return this._registry.register(validated);
}

// ❌ Bad - No validation
function registerPrimitive(input: any): Primitive {
  return this._registry.register(input);
}
```

## Review Process

### Before Submitting PR

- [ ] Tests pass: `pnpm test`
- [ ] Linting passes: `pnpm lint`
- [ ] Type checking passes: `pnpm type-check`
- [ ] Coverage meets requirement: `pnpm test -- --coverage`
- [ ] Documentation updated
- [ ] Commit messages follow format
- [ ] No breaking changes (or documented)

### During Review

- Respond to feedback promptly
- Ask for clarification if needed
- Make requested changes
- Re-request review after changes

### After Approval

- Ensure CI/CD passes
- Merge when ready
- Close related issues

## Issue Guidelines

### Reporting Bugs

```markdown
**Describe the bug:**
Clear description of what happened

**Steps to reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected behavior:**
What should happen

**Actual behavior:**
What actually happens

**Environment:**
- OS: [e.g., macOS 13.0]
- Node: [e.g., 20.0]
- Version: [e.g., 1.0.0]

**Logs/Screenshots:**
Include relevant logs or screenshots
```

### Feature Requests

```markdown
**Description:**
Clear description of desired feature

**Motivation:**
Why is this needed

**Proposed implementation:**
How you'd implement it (optional)

**Alternatives:**
Other approaches considered
```

## Release Process

Releases follow semantic versioning:

- `MAJOR` - Breaking changes
- `MINOR` - New features (backward compatible)
- `PATCH` - Bug fixes

Releases are automated via GitHub Actions on tags.

## Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Security:** Email security@morphos.dev
- **Documentation:** Check docs/ folder

## Resources

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Testing Guide](./docs/TESTING.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to MorphOS!** We appreciate your efforts to make the platform better. 🙏
