# Demo Application

A comprehensive demonstration of MorphOS platform capabilities including primitives, mutations, personalization, and runtime management.

## Features

This demo application showcases:

- **Primitive Definition & Registration**: Creating typed, composable application capabilities
- **Discovery & Filtering**: Finding primitives by category, name, or full-text search
- **Runtime Management**: Managing application state, lifecycle, and components
- **Personalization**: Recording and leveraging user memory (episodic, semantic, procedural)
- **Mutation Suggestions**: Intelligent suggestions for UI, performance, and accessibility improvements
- **State Management**: Application state updates and event emission

## Getting Started

### Installation

```bash
pnpm install
```

### Running the Demo

```bash
# Development mode with auto-reload
pnpm dev

# Build TypeScript
pnpm build

# Run compiled application
pnpm start
```

## Demo Structure

### Demo 1: Primitives

The demo registers three core primitives:

- **Click Button**: Interactive button primitive with click handlers
- **Text Input**: Text input field with validation and change handlers
- **Form Container**: Form wrapper for organizing and managing multiple inputs

Each primitive includes:
- Input/output specifications
- State declarations
- Event definitions
- Actions and handlers
- Semantic metadata for smart recommendations

### Demo 2: Discovery

Shows how to:
- List all primitives for an application
- Filter primitives by category
- Search primitives by query string
- Get available categories

### Demo 3: Runtime Application

Demonstrates:
- Application registration with MorphOS runtime
- Component hierarchy management
- Initial state setup
- Metadata tracking

### Demo 4: Personalization

Records three types of user memory:

1. **Episodic**: Specific events (form submissions, interactions)
2. **Semantic**: General knowledge (preferences, settings)
3. **Procedural**: How-tos and skill sequences (workflows)

### Demo 5: State Updates

Shows:
- Application state mutations
- Component state changes
- Data propagation

### Demo 6: Mutation Suggestions

Displays 15+ example mutations across categories:
- **UI Optimization**: Layout, spacing, themes
- **Performance**: Debouncing, lazy loading, memoization
- **Accessibility**: ARIA labels, keyboard navigation, focus indicators
- **Workflow**: Multi-step forms, auto-save
- **Behavioral**: Conditional fields, suggestions
- **Validation**: Email, custom rules

### Demo 7: Lifecycle

Tracks application lifecycle state:
- Initialization time
- Component count
- Mutation count
- Personalization level
- Current status

## Example Mutations

The `examples.mutations.ts` file contains 15+ production-ready mutation examples:

### UI Mutations
- Form to modal transformation
- Mobile-optimized spacing
- Dark mode support

### Performance Mutations
- Input field debouncing
- Lazy form loading
- Component memoization

### Accessibility Mutations
- ARIA labels and roles
- Keyboard navigation
- Enhanced focus indicators

### Workflow Mutations
- Multi-step form wizard
- Auto-save functionality

### Behavioral Mutations
- Conditional field visibility
- Smart field suggestions

### Validation Mutations
- Email validation
- Custom validation rules

## Output

Running the demo produces:

```
🚀 MorphOS Demo Application
============================

📦 Demo 1: Defining and Registering Primitives
✅ Registered 3 primitives:
   - Click Button (btn-click)
   - Text Input (text-input)
   - Form Container (form-container)

🔍 Demo 2: Discovering and Filtering Primitives
Found 2 UI primitives:
   - Click Button: A clickable button primitive
   - Text Input: A text input field

🎯 Demo 3: Runtime Application Registration
Application registered: Demo Application
...

[... more demos ...]

📊 Demo Summary
===============

✨ MorphOS Demo Completed Successfully!

Key Metrics:
   - Primitives: 3
   - Categories: 2
   - User Memory Records: 3
   - Mutation Suggestions: 15+

Demonstrated Features:
   ✓ Primitive Definition and Registration
   ✓ Discovery and Filtering
   ✓ Runtime Application Management
   ✓ Personalization and Memory Systems
   ✓ State Management
   ✓ Intelligent Mutation Suggestions
   ✓ Application Lifecycle Management
```

## Integration Points

The demo integrates with:
- `@morphos/adaptive-runtime` - Core runtime engine
- `@morphos/primitive-sdk` - Primitive builder
- `@morphos/agent-core` - Agent orchestration
- `@morphos/personalization-engine` - Memory and learning systems
- `@morphos/shared` - Type definitions

## Extending the Demo

### Adding New Primitives

```typescript
const customPrimitive: Primitive = {
  id: "custom-id",
  appId: "demo-app",
  name: "Custom Primitive",
  category: "custom",
  version: "1.0.0",
  description: "A custom primitive",
  inputs: [],
  outputs: [],
  state: [],
  events: [],
  actions: [],
  semantics: {},
};

registry.register(customPrimitive);
```

### Adding New Mutations

Create mutations in `examples.mutations.ts` and they'll be available in the mutation suggestions.

### Recording User Memory

```typescript
await personalization.recordEpisode(userId, {
  timestamp: new Date().toISOString(),
  type: "custom-event",
  details: { /* ... */ },
});
```

## Next Steps

- Explore the [Primitives Service](../primitives-service) for API integration
- Check the [Agent Orchestrator](../agent-orchestrator) for autonomous mutations
- Review [Mutation Service](../mutation-service) for mutation execution
- Examine core packages in [packages/](../../packages)

## License

MorphOS - Adaptive Software Platform
