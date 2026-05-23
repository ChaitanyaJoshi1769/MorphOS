import { describe, it, expect, beforeEach, vi } from "vitest";
import { PluginManager, IPlugin, PluginMetadata, PluginConfig } from "../src/plugin";
import { Mutation, RuntimeApplication } from "@morphos/shared";

// Mock plugin for testing
class MockPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: "mock-plugin",
    name: "Mock Plugin",
    version: "1.0.0",
    author: "Test Author",
    description: "A mock plugin for testing",
    license: "MIT",
    keywords: ["test", "mock"],
    capabilities: ["custom-mutations"],
    minMorphOSVersion: "1.0.0",
    dependencies: {},
    publishedAt: new Date(),
    lastUpdated: new Date(),
  };

  config: PluginConfig = {
    enabled: true,
    settings: {},
  };

  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}

  validateMutation = vi.fn(async () => ({ valid: true, errors: [] }));
  getMutationTypes = vi.fn(() => [
    {
      type: "custom-optimization",
      displayName: "Custom Optimization",
      description: "Plugin-provided optimization",
      category: "custom" as const,
      riskLevel: "low" as const,
      requiredCapabilities: [],
      parameterSchema: {},
      examples: [],
    },
  ]);
  getPrimitives = vi.fn(() => [
    {
      id: "custom-primitive",
      appId: "test",
      name: "Custom Primitive",
      category: "custom",
      version: "1.0.0",
      description: "Test primitive",
      inputs: [],
      outputs: [],
      state: [],
      events: [],
      actions: [],
      semantics: {},
    },
  ]);
  suggestMutations = vi.fn(async () => []);
  onBeforeMutation = vi.fn(async () => {});
  onAfterMutation = vi.fn(async () => {});
  onMutationFailure = vi.fn(async () => {});
}

describe("PluginManager", () => {
  let manager: PluginManager;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    manager = new PluginManager();
    mockPlugin = new MockPlugin();
  });

  describe("Plugin registration", () => {
    it("should register a valid plugin", async () => {
      const result = await manager.registerPlugin(mockPlugin);

      expect(result.success).toBe(true);
      expect(result.message).toContain("registered successfully");
      expect(manager.getPlugin("mock-plugin")).toBe(mockPlugin);
    });

    it("should reject plugin without id", async () => {
      const invalidPlugin: IPlugin = {
        ...mockPlugin,
        metadata: { ...mockPlugin.metadata, id: "" },
      };

      const result = await manager.registerPlugin(invalidPlugin);

      expect(result.success).toBe(false);
      expect(result.message).toContain("id");
    });

    it("should reject duplicate plugin registration", async () => {
      await manager.registerPlugin(mockPlugin);
      const result = await manager.registerPlugin(mockPlugin);

      expect(result.success).toBe(false);
      expect(result.message).toContain("already registered");
    });

    it("should handle initialization errors", async () => {
      mockPlugin.initialize = vi.fn(async () => {
        throw new Error("Init failed");
      });

      const result = await manager.registerPlugin(mockPlugin);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to register");
    });
  });

  describe("Plugin lifecycle", () => {
    it("should enable disabled plugin", async () => {
      mockPlugin.config.enabled = false;
      await manager.registerPlugin(mockPlugin);

      const result = await manager.enablePlugin("mock-plugin");

      expect(result.success).toBe(true);
      expect(mockPlugin.config.enabled).toBe(true);
    });

    it("should disable enabled plugin", async () => {
      await manager.registerPlugin(mockPlugin);

      const result = await manager.disablePlugin("mock-plugin");

      expect(result.success).toBe(true);
      expect(mockPlugin.config.enabled).toBe(false);
    });

    it("should uninstall plugin", async () => {
      await manager.registerPlugin(mockPlugin);

      const result = await manager.uninstallPlugin("mock-plugin");

      expect(result.success).toBe(true);
      expect(manager.getPlugin("mock-plugin")).toBeUndefined();
    });

    it("should handle uninstall errors", async () => {
      mockPlugin.shutdown = vi.fn(async () => {
        throw new Error("Shutdown failed");
      });
      await manager.registerPlugin(mockPlugin);

      const result = await manager.uninstallPlugin("mock-plugin");

      expect(result.success).toBe(false);
    });
  });

  describe("Plugin querying", () => {
    it("should return all plugins", async () => {
      const plugin1 = mockPlugin;
      const plugin2 = new MockPlugin();
      plugin2.metadata.id = "plugin-2";

      await manager.registerPlugin(plugin1);
      await manager.registerPlugin(plugin2);

      const plugins = manager.getPlugins();

      expect(plugins).toHaveLength(2);
    });

    it("should filter plugins by state", async () => {
      const plugin1 = mockPlugin;
      const plugin2 = new MockPlugin();
      plugin2.metadata.id = "plugin-2";
      plugin2.config.enabled = false;

      await manager.registerPlugin(plugin1);
      await manager.registerPlugin(plugin2);

      const enabledPlugins = manager.getPlugins("enabled");

      expect(enabledPlugins).toHaveLength(1);
      expect(enabledPlugins[0].metadata.id).toBe("mock-plugin");
    });

    it("should get enabled plugins only", async () => {
      const plugin1 = mockPlugin;
      const plugin2 = new MockPlugin();
      plugin2.metadata.id = "plugin-2";

      await manager.registerPlugin(plugin1);
      await manager.registerPlugin(plugin2);
      await manager.disablePlugin("plugin-2");

      const enabled = manager.getEnabledPlugins();

      expect(enabled).toHaveLength(1);
      expect(enabled[0].metadata.id).toBe("mock-plugin");
    });

    it("should get plugin by id", async () => {
      await manager.registerPlugin(mockPlugin);

      const retrieved = manager.getPlugin("mock-plugin");

      expect(retrieved).toBe(mockPlugin);
    });
  });

  describe("Custom mutation types", () => {
    it("should register custom mutation types", async () => {
      await manager.registerPlugin(mockPlugin);

      const types = manager.getCustomMutationTypes();

      expect(types).toHaveLength(1);
      expect(types[0].type).toBe("custom-optimization");
    });

    it("should register types from multiple plugins", async () => {
      const plugin2 = new MockPlugin();
      plugin2.metadata.id = "plugin-2";
      const customType = {
        type: "plugin-2-optimization",
        displayName: "Plugin 2 Optimization",
        description: "Test",
        category: "custom" as const,
        riskLevel: "low" as const,
        requiredCapabilities: [],
        parameterSchema: {},
        examples: [],
      };
      plugin2.getMutationTypes = vi.fn(() => [customType]);

      await manager.registerPlugin(mockPlugin);
      await manager.registerPlugin(plugin2);

      const types = manager.getCustomMutationTypes();

      expect(types).toHaveLength(2);
    });
  });

  describe("Custom primitives", () => {
    it("should register custom primitives", async () => {
      await manager.registerPlugin(mockPlugin);

      const primitives = manager.getCustomPrimitives();

      expect(primitives).toHaveLength(1);
      expect(primitives[0].id).toBe("custom-primitive");
    });

    it("should register primitives from multiple plugins", async () => {
      const plugin2 = new MockPlugin();
      plugin2.metadata.id = "plugin-2";
      const customPrim = {
        id: "plugin-2-primitive",
        appId: "test",
        name: "Plugin 2 Primitive",
        category: "custom",
        version: "1.0.0",
        description: "Test",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };
      plugin2.getPrimitives = vi.fn(() => [customPrim]);

      await manager.registerPlugin(mockPlugin);
      await manager.registerPlugin(plugin2);

      const primitives = manager.getCustomPrimitives();

      expect(primitives).toHaveLength(2);
    });
  });

  describe("Mutation validation", () => {
    it("should validate mutations through all plugins", async () => {
      await manager.registerPlugin(mockPlugin);

      const mutation: Mutation = {
        id: "test",
        type: "ui",
        appId: "app",
        description: "Test",
        target: "root",
        changes: {},
        confidence: 0.8,
        impact: "low",
        reversible: true,
        estimatedCost: 0.1,
      };

      const result = await manager.validateMutation(mutation);

      expect(result.valid).toBe(true);
      expect(mockPlugin.validateMutation).toHaveBeenCalledWith(mutation);
    });

    it("should collect errors from plugins", async () => {
      mockPlugin.validateMutation = vi.fn(async () => ({
        valid: false,
        errors: ["Validation failed"],
      }));
      await manager.registerPlugin(mockPlugin);

      const mutation: Mutation = {
        id: "test",
        type: "ui",
        appId: "app",
        description: "Test",
        target: "root",
        changes: {},
        confidence: 0.8,
        impact: "low",
        reversible: true,
        estimatedCost: 0.1,
      };

      const result = await manager.validateMutation(mutation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Validation failed");
    });
  });

  describe("Mutation suggestions", () => {
    it("should get suggestions from all plugins", async () => {
      const suggestion: Mutation = {
        id: "suggested",
        type: "optimization",
        appId: "app",
        description: "Suggested by plugin",
        target: "root",
        changes: {},
        confidence: 0.9,
        impact: "high",
        reversible: true,
        estimatedCost: 0.2,
      };

      mockPlugin.suggestMutations = vi.fn(async () => [suggestion]);
      await manager.registerPlugin(mockPlugin);

      const app: RuntimeApplication = {
        id: "app",
        name: "Test",
        version: "1.0.0",
        description: "Test app",
        state: {},
        primitives: [],
        mutations: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          personalizationLevel: "basic",
        },
      };

      const suggestions = await manager.suggestMutations(app);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].id).toBe("suggested");
    });
  });

  describe("Mutation lifecycle hooks", () => {
    it("should execute before-mutation hooks", async () => {
      await manager.registerPlugin(mockPlugin);

      const mutation: Mutation = {
        id: "test",
        type: "ui",
        appId: "app",
        description: "Test",
        target: "root",
        changes: {},
        confidence: 0.8,
        impact: "low",
        reversible: true,
        estimatedCost: 0.1,
      };

      const app: RuntimeApplication = {
        id: "app",
        name: "Test",
        version: "1.0.0",
        description: "Test app",
        state: {},
        primitives: [],
        mutations: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          personalizationLevel: "basic",
        },
      };

      await manager.executeBeforeMutationHooks(mutation, app);

      expect(mockPlugin.onBeforeMutation).toHaveBeenCalledWith(mutation, app);
    });

    it("should execute after-mutation hooks", async () => {
      await manager.registerPlugin(mockPlugin);

      const mutation: Mutation = {
        id: "test",
        type: "ui",
        appId: "app",
        description: "Test",
        target: "root",
        changes: {},
        confidence: 0.8,
        impact: "low",
        reversible: true,
        estimatedCost: 0.1,
      };

      const app: RuntimeApplication = {
        id: "app",
        name: "Test",
        version: "1.0.0",
        description: "Test app",
        state: {},
        primitives: [],
        mutations: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          personalizationLevel: "basic",
        },
      };

      await manager.executeAfterMutationHooks(mutation, app);

      expect(mockPlugin.onAfterMutation).toHaveBeenCalledWith(mutation, app);
    });

    it("should execute failure hooks", async () => {
      await manager.registerPlugin(mockPlugin);

      const mutation: Mutation = {
        id: "test",
        type: "ui",
        appId: "app",
        description: "Test",
        target: "root",
        changes: {},
        confidence: 0.8,
        impact: "low",
        reversible: true,
        estimatedCost: 0.1,
      };

      const error = new Error("Test error");
      await manager.executeFailureHooks(mutation, error);

      expect(mockPlugin.onMutationFailure).toHaveBeenCalledWith(mutation, error);
    });
  });

  describe("Health checks", () => {
    it("should check health of all plugins", async () => {
      mockPlugin.healthCheck = vi.fn(async () => ({
        healthy: true,
        message: "All good",
      }));
      await manager.registerPlugin(mockPlugin);

      const results = await manager.healthCheckPlugins();

      expect(results["mock-plugin"]).toBeDefined();
      expect(results["mock-plugin"].healthy).toBe(true);
    });

    it("should get metrics from all plugins", async () => {
      mockPlugin.getMetrics = vi.fn(async () => ({
        mutationsProcessed: 100,
        suggestionsGenerated: 50,
      }));
      await manager.registerPlugin(mockPlugin);

      const metrics = await manager.getPluginMetrics();

      expect(metrics["mock-plugin"]).toBeDefined();
      expect(metrics["mock-plugin"].mutationsProcessed).toBe(100);
    });
  });
});
