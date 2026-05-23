import { describe, it, expect, beforeEach } from "vitest";
import { AdaptiveRuntime, PrimitiveRegistry, MutationEngine } from "../src/index";
import { Primitive, Mutation, RuntimeApplication } from "@morphos/shared";

describe("Adaptive Runtime Integration Tests", () => {
  let runtime: AdaptiveRuntime;
  let registry: PrimitiveRegistry;
  let mutationEngine: MutationEngine;

  beforeEach(() => {
    runtime = new AdaptiveRuntime();
    registry = new PrimitiveRegistry();
    mutationEngine = new MutationEngine();
  });

  describe("End-to-end Primitive and Mutation Flow", () => {
    it("should register primitive, create app, and apply mutation", async () => {
      // 1. Register a primitive
      const primitive: Primitive = {
        id: "button-component",
        appId: "test-app",
        name: "Button",
        category: "ui",
        version: "1.0.0",
        description: "Clickable button",
        inputs: [{ name: "label", type: "string", required: true }],
        outputs: [{ name: "clicked", type: "boolean" }],
        state: [{ name: "isActive", type: "boolean", initial: false }],
        events: [{ name: "click", payload: { timestamp: "number" } }],
        actions: [{ name: "activate", parameters: {} }],
        semantics: { intent: "user-interaction" },
      };

      registry.register(primitive);
      expect(registry.list()).toHaveLength(1);

      // 2. Create an application with the primitive
      const app: RuntimeApplication = {
        id: "test-app",
        name: "Test App",
        version: "1.0.0",
        description: "Integration test app",
        state: { buttonCount: 1 },
        primitives: [
          {
            id: "btn-1",
            primitiveId: "button-component",
            props: { label: "Click Me" },
            state: { isActive: false },
          },
        ],
        mutations: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          personalizationLevel: "basic",
        },
      };

      expect(app.primitives).toHaveLength(1);
      expect(app.primitives[0].primitiveId).toBe("button-component");

      // 3. Create and validate a mutation
      const mutation: Mutation = {
        id: "mut-activate-button",
        type: "ui-enhancement",
        appId: "test-app",
        description: "Make button always active",
        target: "button-component",
        changes: { initialActive: true },
        confidence: 0.92,
        impact: "low",
        reversible: true,
        estimatedCost: 0.01,
      };

      const validation = mutationEngine.validate(mutation);
      expect(validation.valid).toBe(true);

      // 4. Simulate mutation application
      app.mutations.push(mutation);
      expect(app.mutations).toHaveLength(1);
      expect(app.mutations[0].confidence).toBeGreaterThan(0.9);
    });

    it("should handle multiple primitives and mutations", async () => {
      // Register multiple primitives
      const primitives: Primitive[] = [
        {
          id: "button",
          appId: "app",
          name: "Button",
          category: "ui",
          version: "1.0.0",
          description: "Button",
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        },
        {
          id: "input",
          appId: "app",
          name: "Input",
          category: "ui",
          version: "1.0.0",
          description: "Input",
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        },
        {
          id: "form",
          appId: "app",
          name: "Form",
          category: "layout",
          version: "1.0.0",
          description: "Form",
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        },
      ];

      primitives.forEach((p) => registry.register(p));
      expect(registry.list()).toHaveLength(3);

      // Create multiple mutations
      const mutations: Mutation[] = [
        {
          id: "mut-1",
          type: "ui",
          appId: "app",
          description: "Optimize button",
          target: "button",
          changes: { memoized: true },
          confidence: 0.85,
          impact: "low",
          reversible: true,
          estimatedCost: 0.02,
        },
        {
          id: "mut-2",
          type: "performance",
          appId: "app",
          description: "Add input debounce",
          target: "input",
          changes: { debounce: 300 },
          confidence: 0.92,
          impact: "medium",
          reversible: true,
          estimatedCost: 0.05,
        },
        {
          id: "mut-3",
          type: "validation",
          appId: "app",
          description: "Add form validation",
          target: "form",
          changes: { validate: true },
          confidence: 0.95,
          impact: "high",
          reversible: true,
          estimatedCost: 0.1,
        },
      ];

      // All mutations should be valid
      mutations.forEach((m) => {
        const validation = mutationEngine.validate(m);
        expect(validation.valid).toBe(true);
      });

      expect(mutations).toHaveLength(3);
    });

    it("should manage primitive discovery and filtering", () => {
      // Register primitives with different categories
      const categories = ["ui", "workflow", "layout", "custom"];

      categories.forEach((category, index) => {
        registry.register({
          id: `prim-${index}`,
          appId: "app",
          name: `Primitive ${index}`,
          category: category,
          version: "1.0.0",
          description: `Primitive in ${category}`,
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        });
      });

      expect(registry.getCategories()).toHaveLength(4);

      // Filter by category
      const uiPrimitives = registry.list("app").filter((p) => p.category === "ui");
      expect(uiPrimitives).toHaveLength(1);

      const workflowPrimitives = registry
        .list("app")
        .filter((p) => p.category === "workflow");
      expect(workflowPrimitives).toHaveLength(1);
    });

    it("should track mutation dependencies", async () => {
      // Register related primitives
      const primitives = [
        {
          id: "cache-layer",
          appId: "app",
          name: "Cache",
          category: "infrastructure",
          version: "1.0.0",
          description: "Cache layer",
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        },
        {
          id: "api-client",
          appId: "app",
          name: "API Client",
          category: "integration",
          version: "1.0.0",
          description: "API client",
          inputs: [],
          outputs: [],
          state: [],
          events: [],
          actions: [],
          semantics: {},
        },
      ];

      primitives.forEach((p) => registry.register(p));

      // Create mutation that depends on cache
      const mutation: Mutation = {
        id: "mut-enable-caching",
        type: "performance",
        appId: "app",
        description: "Enable API response caching",
        target: "api-client",
        changes: { useCache: true, cacheLayer: "cache-layer" },
        confidence: 0.88,
        impact: "high",
        reversible: true,
        estimatedCost: 0.1,
      };

      const validation = mutationEngine.validate(mutation);
      expect(validation.valid).toBe(true);

      // Analyze dependencies
      const deps = mutationEngine.analyzeDependencies(mutation);
      expect(deps).toContain("cache-layer");
    });

    it("should prevent circular dependencies", async () => {
      const mutation1: Mutation = {
        id: "mut-1",
        type: "logic",
        appId: "app",
        description: "Mutation 1",
        target: "target-a",
        changes: { ref: "mut-2" }, // References mutation 2
        confidence: 0.85,
        impact: "medium",
        reversible: true,
        estimatedCost: 0.1,
      };

      const mutation2: Mutation = {
        id: "mut-2",
        type: "logic",
        appId: "app",
        description: "Mutation 2",
        target: "target-b",
        changes: { ref: "mut-1" }, // References mutation 1 (circular)
        confidence: 0.85,
        impact: "medium",
        reversible: true,
        estimatedCost: 0.1,
      };

      // Check circular dependency detection
      const hasCycle = mutationEngine.hasCircularDependency([mutation1, mutation2]);
      expect(hasCycle).toBe(true);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing primitives gracefully", () => {
      const nonexistent = registry.get("does-not-exist");
      expect(nonexistent).toBeUndefined();
    });

    it("should handle empty search results", () => {
      const results = registry.search("nonexistent-keyword");
      expect(results).toHaveLength(0);
    });

    it("should validate mutation structure", () => {
      const invalidMutation: any = {
        id: "mut-1",
        // Missing required fields
      };

      expect(() => mutationEngine.validate(invalidMutation)).not.toThrow();
      const result = mutationEngine.validate(invalidMutation);
      expect(result.valid).toBe(false);
    });

    it("should handle duplicate primitive registration", () => {
      const primitive: Primitive = {
        id: "dup",
        appId: "app",
        name: "Duplicate",
        category: "ui",
        version: "1.0.0",
        description: "Test",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(primitive);
      expect(registry.list()).toHaveLength(1);

      // Register again - should update or be idempotent
      registry.register(primitive);
      expect(registry.list()).toHaveLength(1); // Not duplicated
    });

    it("should maintain data integrity with concurrent operations", async () => {
      const promises = [];

      // Simulate concurrent registrations
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(
            registry.register({
              id: `prim-${i}`,
              appId: "app",
              name: `Prim ${i}`,
              category: "ui",
              version: "1.0.0",
              description: `Primitive ${i}`,
              inputs: [],
              outputs: [],
              state: [],
              events: [],
              actions: [],
              semantics: {},
            })
          )
        );
      }

      await Promise.all(promises);
      expect(registry.list()).toHaveLength(10);
    });
  });
});
