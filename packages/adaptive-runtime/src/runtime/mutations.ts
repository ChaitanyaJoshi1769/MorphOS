/**
 * Mutation Engine
 *
 * Responsible for analyzing, validating, executing, and reverting mutations.
 * Core to MorphOS's adaptive capability.
 */

import {
  Mutation,
  MutationType,
  MorphOSError,
  generateId,
  getCurrentTimestamp,
} from "@morphos/shared";
import { EventEmitter } from "events";

export interface MutationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MutationEngine extends EventEmitter {
  private mutations: Map<string, Mutation> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  /**
   * Create a new mutation
   */
  public createMutation(
    appId: string,
    userId: string,
    type: MutationType,
    targetId: string,
    description: string,
    payload: any
  ): Mutation {
    const mutation: Mutation = {
      id: generateId("mutation"),
      type,
      appId,
      userId,
      targetId,
      description,
      payload,
      targetVersion: "1.0.0",
      status: "draft",
      impact: {
        affectedPrimitives: [],
        estimatedPerformanceChange: 0,
        estimatedUXImprovement: 0,
        estimatedRiskLevel: "low",
      },
      testIds: [],
      tags: [],
      metadata: {},
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    this.mutations.set(mutation.id, mutation);
    this.emit("mutation:created", mutation);

    return mutation;
  }

  /**
   * Validate a mutation
   */
  public validate(mutation: Mutation): MutationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!mutation.id) errors.push("Mutation must have an id");
    if (!mutation.appId) errors.push("Mutation must have an appId");
    if (!mutation.userId) errors.push("Mutation must have a userId");
    if (!mutation.targetId) errors.push("Mutation must have a targetId");
    if (!mutation.type) errors.push("Mutation must have a type");

    // Type-specific validation
    switch (mutation.type) {
      case "ui-layout":
        if (!mutation.payload?.uiChanges) {
          errors.push("UI layout mutation must have uiChanges in payload");
        }
        break;
      case "workflow-transform":
        if (!mutation.payload?.workflowChanges) {
          errors.push("Workflow mutation must have workflowChanges in payload");
        }
        break;
      case "middleware-injection":
        if (!mutation.payload?.middlewareCode) {
          warnings.push("Middleware injection should include code");
        }
        break;
      case "business-logic":
        if (!mutation.payload?.code) {
          warnings.push("Business logic mutation should include code");
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Analyze mutation dependencies
   */
  public analyzeDependencies(mutation: Mutation): Set<string> {
    if (!this.dependencyGraph.has(mutation.id)) {
      this.dependencyGraph.set(mutation.id, new Set());
    }

    const dependencies = this.dependencyGraph.get(mutation.id)!;

    // Extract dependencies from mutation code/payload
    if (mutation.payload?.code) {
      const codeDependencies = this.extractCodeDependencies(mutation.payload.code);
      codeDependencies.forEach((dep) => dependencies.add(dep));
    }

    // Extract dependencies from referenced components
    if (mutation.payload?.astTransformation?.selector) {
      dependencies.add(mutation.targetId);
    }

    return dependencies;
  }

  /**
   * Check for circular dependencies
   */
  public hasCircularDependency(mutation: Mutation): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    return this.dfs(mutation.id, visited, recursionStack);
  }

  /**
   * Get mutation impact
   */
  public analyzeImpact(mutation: Mutation): Mutation["impact"] {
    const impact: Mutation["impact"] = {
      affectedPrimitives: [],
      estimatedPerformanceChange: 0,
      estimatedUXImprovement: 0,
      estimatedRiskLevel: "low",
    };

    // Analyze based on mutation type
    switch (mutation.type) {
      case "ui-layout":
        impact.estimatedUXImprovement = 15;
        impact.estimatedRiskLevel = "low";
        break;
      case "middleware-injection":
        impact.estimatedPerformanceChange = -5;
        impact.estimatedRiskLevel = "high";
        break;
      case "business-logic":
        impact.estimatedRiskLevel = "high";
        break;
      case "workflow-transform":
        impact.estimatedUXImprovement = 25;
        impact.estimatedRiskLevel = "medium";
        break;
    }

    return impact;
  }

  /**
   * Get a mutation
   */
  public get(id: string): Mutation | undefined {
    return this.mutations.get(id);
  }

  /**
   * Update mutation status
   */
  public updateStatus(
    id: string,
    status: Mutation["status"]
  ): Mutation {
    const mutation = this.mutations.get(id);
    if (!mutation) {
      throw new MorphOSError(
        "MUTATION_NOT_FOUND",
        `Mutation ${id} not found`
      );
    }

    mutation.status = status;
    mutation.updatedAt = getCurrentTimestamp();

    if (status === "active") {
      mutation.activatedAt = getCurrentTimestamp();
    } else if (status === "rolled-back") {
      mutation.rolledBackAt = getCurrentTimestamp();
    }

    this.emit("mutation:status-changed", mutation);
    return mutation;
  }

  /**
   * Mark mutation as verified
   */
  public verify(id: string, verifiedBy: string): Mutation {
    const mutation = this.mutations.get(id);
    if (!mutation) {
      throw new MorphOSError(
        "MUTATION_NOT_FOUND",
        `Mutation ${id} not found`
      );
    }

    mutation.verifiedBy = verifiedBy;
    mutation.updatedAt = getCurrentTimestamp();

    this.emit("mutation:verified", mutation);
    return mutation;
  }

  /**
   * Create a rollback mutation
   */
  public createRollback(originalMutationId: string, userId: string): Mutation {
    const original = this.mutations.get(originalMutationId);
    if (!original) {
      throw new MorphOSError(
        "MUTATION_NOT_FOUND",
        `Mutation ${originalMutationId} not found`
      );
    }

    const rollback: Mutation = {
      id: generateId("mutation"),
      type: "state-modification",
      appId: original.appId,
      userId,
      targetId: original.targetId,
      description: `Rollback of ${originalMutationId}`,
      payload: {
        type: "state-modification",
      },
      targetVersion: original.targetVersion,
      status: "draft",
      impact: {
        affectedPrimitives: [],
        estimatedPerformanceChange: 0,
        estimatedUXImprovement: 0,
        estimatedRiskLevel: "low",
      },
      testIds: [],
      rollbackMutationId: originalMutationId,
      tags: ["rollback"],
      metadata: {},
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    this.mutations.set(rollback.id, rollback);
    return rollback;
  }

  /**
   * Export mutations for sharing/backup
   */
  public export(appId?: string): Mutation[] {
    if (appId) {
      return Array.from(this.mutations.values()).filter(
        (m) => m.appId === appId
      );
    }
    return Array.from(this.mutations.values());
  }

  /**
   * Get mutations by status
   */
  public getByStatus(status: Mutation["status"]): Mutation[] {
    return Array.from(this.mutations.values()).filter((m) => m.status === status);
  }

  /**
   * Get mutations for an app
   */
  public getForApp(appId: string): Mutation[] {
    return Array.from(this.mutations.values()).filter((m) => m.appId === appId);
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private dfs(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const dependencies = this.dependencyGraph.get(nodeId) || new Set();
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        if (this.dfs(dep, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(dep)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  private extractCodeDependencies(code: string): string[] {
    const dependencies: string[] = [];

    // Simple regex-based extraction
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(code))) {
      dependencies.push(match[1]);
    }
    while ((match = requireRegex.exec(code))) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }
}
