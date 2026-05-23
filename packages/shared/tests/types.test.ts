import { describe, it, expect } from "vitest";
import {
  Primitive,
  Mutation,
  RuntimeApplication,
  AgentTask,
} from "../src/types/index";

describe("Shared Types", () => {
  describe("Primitive", () => {
    it("should create a valid primitive", () => {
      const primitive: Primitive = {
        id: "test-primitive",
        appId: "test-app",
        name: "Test Primitive",
        category: "ui",
        version: "1.0.0",
        description: "A test primitive",
        inputs: [{ name: "label", type: "string", required: true }],
        outputs: [{ name: "value", type: "string" }],
        state: [{ name: "active", type: "boolean", initial: false }],
        events: [{ name: "click", payload: { timestamp: "number" } }],
        actions: [{ name: "activate", parameters: {} }],
        semantics: { intent: "user-interaction" },
      };

      expect(primitive.id).toBe("test-primitive");
      expect(primitive.inputs).toHaveLength(1);
      expect(primitive.state[0].initial).toBe(false);
    });

    it("should validate primitive structure", () => {
      const primitive: Primitive = {
        id: "btn",
        appId: "app",
        name: "Button",
        category: "ui",
        version: "1.0.0",
        description: "Button component",
        inputs: [],
        outputs: [],
        state: [],
        events: [],
        actions: [],
        semantics: {},
      };

      expect(primitive.id).toBeTruthy();
      expect(primitive.category).toMatch(/^(ui|workflow|layout|custom)$/);
    });
  });

  describe("Mutation", () => {
    it("should create a valid mutation", () => {
      const mutation: Mutation = {
        id: "mut-1",
        type: "ui-optimization",
        appId: "app-1",
        description: "Optimize UI",
        target: "root",
        changes: { layout: "flex" },
        confidence: 0.85,
        impact: "high",
        reversible: true,
        estimatedCost: 0.1,
      };

      expect(mutation.confidence).toBeGreaterThan(0);
      expect(mutation.confidence).toBeLessThanOrEqual(1);
      expect(mutation.reversible).toBe(true);
    });

    it("should validate mutation impact", () => {
      const mutation: Mutation = {
        id: "mut-2",
        type: "performance",
        appId: "app-2",
        description: "Add cache",
        target: "api",
        changes: { cache: true },
        confidence: 0.92,
        impact: "high",
        reversible: true,
        estimatedCost: 0.05,
      };

      expect(["low", "medium", "high"]).toContain(mutation.impact);
    });
  });

  describe("RuntimeApplication", () => {
    it("should create a valid runtime application", () => {
      const app: RuntimeApplication = {
        id: "app-1",
        name: "Test App",
        version: "1.0.0",
        description: "Test application",
        state: { count: 0 },
        primitives: [],
        mutations: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          personalizationLevel: "basic",
        },
      };

      expect(app.primitives).toEqual([]);
      expect(app.mutations).toEqual([]);
    });
  });

  describe("AgentTask", () => {
    it("should create a valid agent task", () => {
      const task: AgentTask = {
        id: "task-1",
        agentId: "planner-1",
        appId: "app-1",
        description: "Optimize performance",
        objective: "Reduce render time",
        constraints: ["max-cost: 0.1"],
        status: "pending",
        priority: "high",
        createdAt: new Date().toISOString(),
      };

      expect(task.status).toBe("pending");
      expect(["low", "medium", "high"]).toContain(task.priority);
    });
  });
});
