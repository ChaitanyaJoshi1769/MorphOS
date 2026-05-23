# MorphOS Plugin Development Guide

Build powerful extensions for MorphOS with the plugin system. This guide walks you through creating, testing, and distributing plugins.

## Table of Contents

1. [Plugin Basics](#plugin-basics)
2. [Creating Your First Plugin](#creating-your-first-plugin)
3. [Plugin Lifecycle](#plugin-lifecycle)
4. [Mutation Integration](#mutation-integration)
5. [Custom Primitives](#custom-primitives)
6. [Hooks and Events](#hooks-and-events)
7. [Testing Plugins](#testing-plugins)
8. [Distribution](#distribution)

## Plugin Basics

### What is a Plugin?

A MorphOS plugin is a TypeScript module that extends the platform by:

- Providing custom mutation types
- Registering new primitives
- Validating mutations
- Suggesting optimizations
- Monitoring system state
- Integrating with external services

### Plugin Interface

Every plugin must implement the `IPlugin` interface:

```typescript
interface IPlugin {
  metadata: PluginMetadata;
  config: PluginConfig;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Optional hooks
  validateMutation?(mutation: Mutation): Promise<{valid: boolean; errors: string[]}>;
  getMutationTypes?(): CustomMutationType[];
  getPrimitives?(): Primitive[];
  suggestMutations?(app: RuntimeApplication): Promise<Mutation[]>;
  onBeforeMutation?(mutation: Mutation, app: RuntimeApplication): Promise<void>;
  onAfterMutation?(mutation: Mutation, app: RuntimeApplication): Promise<void>;
  onMutationFailure?(mutation: Mutation, error: Error): Promise<void>;
  healthCheck?(): Promise<{healthy: boolean; message?: string}>;
  getMetrics?(): Promise<Record<string, unknown>>;
}
```

### Plugin Metadata

Define your plugin's identity and capabilities:

```typescript
const metadata: PluginMetadata = {
  id: "my-company-awesome-plugin",
  name: "Awesome Plugin",
  version: "1.0.0",
  author: "Your Name",
  description: "Does awesome things with MorphOS",
  license: "MIT",
  homepage: "https://github.com/yourname/morphos-awesome-plugin",
  repository: "https://github.com/yourname/morphos-awesome-plugin",
  keywords: ["awesome", "mutations", "optimization"],
  capabilities: ["custom-mutations", "analytics"],
  minMorphOSVersion: "1.0.0",
  dependencies: {
    "some-library": "^1.0.0",
  },
  publishedAt: new Date(),
  lastUpdated: new Date(),
};
```

### Plugin Configuration

Control plugin behavior:

```typescript
const config: PluginConfig = {
  enabled: true,
  settings: {
    customSetting: "value",
    timeout: 5000,
  },
  allowedApps: ["app-1", "app-2"], // Restrict to specific apps
  requiresApproval: true, // Require admin approval for mutations
  rateLimit: {
    mutationsPerHour: 100,
    maxConcurrent: 5,
  },
};
```

## Creating Your First Plugin

### Step 1: Set Up Project

```bash
mkdir morphos-my-plugin
cd morphos-my-plugin

npm init -y
npm install @morphos/plugin-system @morphos/shared
npm install --save-dev typescript @types/node
```

### Step 2: Create Plugin Class

```typescript
// src/my-plugin.ts
import {
  IPlugin,
  PluginMetadata,
  PluginConfig,
} from "@morphos/plugin-system";
import { Mutation, RuntimeApplication } from "@morphos/shared";

export class MyPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    author: "You",
    description: "My awesome plugin",
    license: "MIT",
    keywords: [],
    capabilities: [],
    minMorphOSVersion: "1.0.0",
    dependencies: {},
    publishedAt: new Date(),
    lastUpdated: new Date(),
  };

  config: PluginConfig = {
    enabled: true,
    settings: {},
  };

  async initialize(): Promise<void> {
    console.log("Plugin initialized!");
  }

  async shutdown(): Promise<void> {
    console.log("Plugin shutdown!");
  }

  async suggestMutations(app: RuntimeApplication): Promise<Mutation[]> {
    return [
      {
        id: "my-mutation",
        type: "custom",
        appId: app.id,
        description: "My custom mutation",
        target: "root",
        changes: { myChange: true },
        confidence: 0.9,
        impact: "medium",
        reversible: true,
        estimatedCost: 0.1,
      },
    ];
  }
}

export function createMyPlugin(): MyPlugin {
  return new MyPlugin();
}
```

### Step 3: Register Plugin

```typescript
import { PluginManager } from "@morphos/plugin-system";
import { createMyPlugin } from "./my-plugin";

const manager = new PluginManager();
const plugin = createMyPlugin();

const result = await manager.registerPlugin(plugin);
console.log(result);
```

## Plugin Lifecycle

### Initialization Phase

```typescript
async initialize(): Promise<void> {
  // 1. Validate plugin dependencies
  // 2. Connect to external services
  // 3. Load configuration
  // 4. Set up database tables
  // 5. Register event listeners
  
  console.log("Plugin initialized");
}
```

### Running Phase

Your plugin can:

- Validate mutations through hooks
- Suggest mutations
- Monitor system state
- Track metrics

### Shutdown Phase

```typescript
async shutdown(): Promise<void> {
  // 1. Close database connections
  // 2. Unregister event listeners
  // 3. Clean up temporary files
  // 4. Save state
  
  console.log("Plugin shutdown");
}
```

## Mutation Integration

### Custom Mutation Types

Define new mutation types your plugin provides:

```typescript
getMutationTypes(): CustomMutationType[] {
  return [
    {
      type: "ai-optimization",
      displayName: "AI-Powered Optimization",
      description: "Uses AI to suggest optimizations",
      category: "custom",
      riskLevel: "medium",
      requiredCapabilities: ["ai-models"],
      parameterSchema: {
        model: {
          type: "string",
          enum: ["gpt-4", "gpt-3.5"],
        },
        temperature: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },
      },
      examples: [
        {
          name: "Code optimization",
          description: "Optimize code using GPT-4",
          parameters: {
            model: "gpt-4",
            temperature: 0.7,
          },
        },
      ],
    },
  ];
}
```

### Mutation Validation

Validate mutations before application:

```typescript
async validateMutation(mutation: Mutation): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate custom fields
  if (mutation.type === "ai-optimization") {
    if (!mutation.changes || !mutation.changes.model) {
      errors.push("AI optimization requires a model parameter");
    }

    // Check compatibility
    if (mutation.impact === "high" && mutation.confidence < 0.8) {
      errors.push("High-impact mutations require confidence >= 0.8");
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Mutation Suggestions

Suggest mutations based on app analysis:

```typescript
async suggestMutations(app: RuntimeApplication): Promise<Mutation[]> {
  const suggestions: Mutation[] = [];

  // Analyze app and suggest improvements
  if (app.primitives.length > 20) {
    suggestions.push({
      id: `optimize-${app.id}`,
      type: "ai-optimization",
      appId: app.id,
      description: "Large app could benefit from AI optimization",
      target: "root",
      changes: {
        model: "gpt-4",
        temperature: 0.7,
      },
      confidence: 0.85,
      impact: "high",
      reversible: true,
      estimatedCost: 0.25,
    });
  }

  return suggestions;
}
```

## Custom Primitives

Register new primitives that your plugin provides:

```typescript
getPrimitives(): Primitive[] {
  return [
    {
      id: "ai-component",
      appId: "built-in",
      name: "AI Component",
      category: "custom",
      version: "1.0.0",
      description: "AI-powered component",
      inputs: [
        {
          name: "prompt",
          type: "string",
          required: true,
          description: "Prompt for AI",
        },
      ],
      outputs: [
        {
          name: "result",
          type: "string",
        },
      ],
      state: [
        {
          name: "loading",
          type: "boolean",
          initial: false,
        },
      ],
      events: [
        {
          name: "responseGenerated",
          payload: {
            response: "string",
            timestamp: "number",
          },
        },
      ],
      actions: [
        {
          name: "generate",
          parameters: {
            prompt: "string",
          },
        },
      ],
      semantics: {
        intent: "ai-generation",
      },
    },
  ];
}
```

## Hooks and Events

### Before Mutation Hook

Execute code before a mutation is applied:

```typescript
async onBeforeMutation(
  mutation: Mutation,
  app: RuntimeApplication
): Promise<void> {
  console.log(`Applying mutation: ${mutation.id}`);

  // 1. Perform pre-checks
  // 2. Backup current state
  // 3. Notify users
  // 4. Lock resources

  if (mutation.impact === "high") {
    // Extra precautions for high-impact mutations
    await this.backupAppState(app.id);
    await this.notifyUsers(app.id, `Important change: ${mutation.description}`);
  }
}
```

### After Mutation Hook

Execute code after successful mutation:

```typescript
async onAfterMutation(
  mutation: Mutation,
  app: RuntimeApplication
): Promise<void> {
  console.log(`Mutation applied successfully: ${mutation.id}`);

  // 1. Verify changes
  // 2. Update metrics
  // 3. Notify users
  // 4. Trigger analytics

  await this.verifyMutationSuccess(mutation);
  await this.updateMetrics(mutation, "success");
  await this.trackAnalytics("mutation_applied", { mutation: mutation.id });
}
```

### Failure Hook

Handle mutation failures:

```typescript
async onMutationFailure(mutation: Mutation, error: Error): Promise<void> {
  console.error(`Mutation failed: ${mutation.id}`, error);

  // 1. Log error
  // 2. Alert administrators
  // 3. Trigger rollback
  // 4. Update metrics

  await this.logError(mutation.id, error);
  await this.alertAdmins(`Mutation failed: ${error.message}`);
  await this.updateMetrics(mutation, "failure");
}
```

## Testing Plugins

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MyPlugin } from "./my-plugin";

describe("MyPlugin", () => {
  let plugin: MyPlugin;

  beforeEach(() => {
    plugin = new MyPlugin();
  });

  it("should initialize successfully", async () => {
    await plugin.initialize();
    expect(plugin.config.enabled).toBe(true);
  });

  it("should suggest mutations", async () => {
    const app = {
      id: "test-app",
      name: "Test",
      version: "1.0.0",
      description: "Test app",
      state: {},
      primitives: Array(25).fill(null), // 25 primitives
      mutations: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        personalizationLevel: "basic",
      },
    };

    const suggestions = await plugin.suggestMutations(app);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("should validate mutations", async () => {
    const mutation = {
      id: "test",
      type: "custom",
      appId: "app",
      description: "Test",
      target: "root",
      changes: {},
      confidence: 0.9,
      impact: "medium" as const,
      reversible: true,
      estimatedCost: 0.1,
    };

    const result = await plugin.validateMutation(mutation);
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { PluginManager } from "@morphos/plugin-system";
import { MyPlugin } from "./my-plugin";

describe("MyPlugin Integration", () => {
  it("should work with PluginManager", async () => {
    const manager = new PluginManager();
    const plugin = new MyPlugin();

    const result = await manager.registerPlugin(plugin);
    expect(result.success).toBe(true);

    const retrieved = manager.getPlugin(plugin.metadata.id);
    expect(retrieved).toBe(plugin);

    await manager.uninstallPlugin(plugin.metadata.id);
  });
});
```

## Distribution

### Package for NPM

Create `package.json`:

```json
{
  "name": "@mycompany/morphos-my-plugin",
  "version": "1.0.0",
  "description": "My awesome MorphOS plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "peerDependencies": {
    "@morphos/plugin-system": "^1.0.0",
    "@morphos/shared": "^1.0.0"
  },
  "keywords": [
    "morphos",
    "plugin",
    "mutations"
  ]
}
```

### Publish to NPM

```bash
# Build
npm run build

# Test
npm test

# Publish
npm publish
```

### Document Your Plugin

Create `README.md`:

```markdown
# My Awesome Plugin

Description of what your plugin does.

## Installation

```bash
npm install @mycompany/morphos-my-plugin
```

## Usage

```typescript
import { PluginManager } from "@morphos/plugin-system";
import { createMyPlugin } from "@mycompany/morphos-my-plugin";

const manager = new PluginManager();
const plugin = createMyPlugin();
await manager.registerPlugin(plugin);
```

## Configuration

Describe how to configure your plugin.

## Features

- Feature 1
- Feature 2
- Feature 3

## License

MIT
```

## Best Practices

### 1. Validate Early, Validate Often

```typescript
async validateMutation(mutation: Mutation): Promise<{valid: boolean; errors: string[]}> {
  const errors: string[] = [];

  // Check required fields
  if (!mutation.changes) {
    errors.push("Mutation must have changes");
  }

  // Check business logic
  if (mutation.confidence < 0.5) {
    errors.push("Confidence must be >= 0.5");
  }

  return { valid: errors.length === 0, errors };
}
```

### 2. Provide Clear Explanations

```typescript
async suggestMutations(app: RuntimeApplication): Promise<Mutation[]> {
  return [{
    id: "suggestion-1",
    type: "optimization",
    appId: app.id,
    description: "Add Redis caching to API endpoints to reduce database load",
    // ... more fields
  }];
}
```

### 3. Handle Errors Gracefully

```typescript
async onBeforeMutation(
  mutation: Mutation,
  app: RuntimeApplication
): Promise<void> {
  try {
    await this.validateResources(app);
  } catch (error) {
    console.error("Resource validation failed:", error);
    throw new Error("Cannot apply mutation: insufficient resources");
  }
}
```

### 4. Monitor and Metrics

```typescript
async getMetrics(): Promise<Record<string, unknown>> {
  return {
    suggestionsGenerated: this.stats.suggestions,
    mutationsValidated: this.stats.validated,
    validationErrors: this.stats.errors,
    averageExecutionTime: this.stats.avgTime,
  };
}
```

### 5. Security

- Never expose secrets in plugin code
- Validate all inputs
- Use HTTPS for external calls
- Implement rate limiting
- Log security-relevant events

## Example Plugins

See `examples/plugins/` for complete example plugins:

- `example-performance-plugin.ts` - Performance optimization
- More plugins coming soon!

## Support

- Documentation: https://morphos.dev/plugins
- GitHub Issues: https://github.com/ChaitanyaJoshi1769/MorphOS/issues
- Community: https://discord.gg/morphos

---

**Happy plugin development! 🎉**
