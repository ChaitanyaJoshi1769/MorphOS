import { describe, it, expect, beforeEach } from "vitest";
import { AdaptiveRuntime, PrimitiveRegistry } from "../src/index";
import { Primitive, Mutation } from "@morphos/shared";

describe("AdaptiveRuntime", () => {
  let runtime: AdaptiveRuntime;

  beforeEach(() => {
    runtime = new AdaptiveRuntime();
  });

  describe("Initialization", () => {
    it("should initialize successfully", () => {
      expect(runtime).toBeDefined();
    });

    it("should have empty primitives on init", () => {
      const registry = new PrimitiveRegistry();
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe("Primitive Registration", () => {
    it("should register a primitive", () => {
      const registry = new PrimitiveRegistry();
      const primitive: Primitive = {
        id: "test-btn",
        appId: "test-app",
        name: "Test Button",
        category: "ui",
        version: "1.0.0",
        description: "A test button",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(primitive);
      expect(registry.list()).toHaveLength(1);
    });

    it("should retrieve registered primitive", () => {
      const registry = new PrimitiveRegistry();
      const primitive: Primitive = {
        id: "test-input",
        appId: "test-app",
        name: "Test Input",
        category: "ui",
        version: "1.0.0",
        description: "A test input",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(primitive);
      const retrieved = registry.get("test-input");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Test Input");
    });

    it("should filter by category", () => {
      const registry = new PrimitiveRegistry();

      const uiPrimitive: Primitive = {
        id: "ui-1",
        appId: "app",
        name: "UI Component",
        category: "ui",
        version: "1.0.0",
        description: "UI",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      const workflowPrimitive: Primitive = {
        id: "workflow-1",
        appId: "app",
        name: "Workflow Component",
        category: "workflow",
        version: "1.0.0",
        description: "Workflow",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(uiPrimitive);
      registry.register(workflowPrimitive);

      const byCategory = registry.list("app").filter((p) => p.category === "ui");
      expect(byCategory).toHaveLength(1);
      expect(byCategory[0].name).toBe("UI Component");
    });

    it("should search primitives", () => {
      const registry = new PrimitiveRegistry();

      const primitive: Primitive = {
        id: "search-test",
        appId: "app",
        name: "Searchable Component",
        category: "ui",
        version: "1.0.0",
        description: "A searchable component",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(primitive);
      const results = registry.search("searchable");
      expect(results).toHaveLength(1);
    });
  });

  describe("Categories", () => {
    it("should return available categories", () => {
      const registry = new PrimitiveRegistry();

      const primitive1: Primitive = {
        id: "p1",
        appId: "app",
        name: "P1",
        category: "ui",
        version: "1.0.0",
        description: "P1",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      const primitive2: Primitive = {
        id: "p2",
        appId: "app",
        name: "P2",
        category: "workflow",
        version: "1.0.0",
        description: "P2",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      registry.register(primitive1);
      registry.register(primitive2);

      const categories = registry.getCategories();
      expect(categories).toContain("ui");
      expect(categories).toContain("workflow");
    });
  });
});
