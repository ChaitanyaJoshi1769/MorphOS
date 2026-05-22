/**
 * Component Manager
 *
 * Manages the lifecycle of runtime components.
 * Components are instances of primitives in the running application.
 */

import {
  RuntimeComponent,
  Primitive,
  MorphOSError,
  generateId,
} from "@morphos/shared";
import { EventEmitter } from "events";

export class ComponentManager extends EventEmitter {
  private components: Map<string, RuntimeComponent> = new Map();
  private componentsByPrimitive: Map<string, Set<string>> = new Map();
  private parentChildRelationships: Map<string, Set<string>> = new Map();

  /**
   * Register a component instance
   */
  public register(component: RuntimeComponent): void {
    if (this.components.has(component.id)) {
      throw new MorphOSError(
        "COMPONENT_EXISTS",
        `Component ${component.id} already exists`
      );
    }

    this.components.set(component.id, component);

    // Track by primitive
    if (component.primitiveId) {
      const primitiveComponents =
        this.componentsByPrimitive.get(component.primitiveId) || new Set();
      primitiveComponents.add(component.id);
      this.componentsByPrimitive.set(component.primitiveId, primitiveComponents);
    }

    // Track parent-child relationships
    if (component.children) {
      const children = this.parentChildRelationships.get(component.id) || new Set();
      component.children.forEach((childId) => children.add(childId));
      this.parentChildRelationships.set(component.id, children);
    }

    this.emit("component:registered", component);
  }

  /**
   * Get a component
   */
  public get(id: string): RuntimeComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Update component props
   */
  public updateProps(
    id: string,
    props: Record<string, unknown>
  ): RuntimeComponent {
    const component = this.components.get(id);
    if (!component) {
      throw new MorphOSError(
        "COMPONENT_NOT_FOUND",
        `Component ${id} not found`
      );
    }

    component.props = { ...component.props, ...props };
    this.emit("component:props-updated", component);
    return component;
  }

  /**
   * Update component state
   */
  public updateState(
    id: string,
    state: Record<string, unknown>
  ): RuntimeComponent {
    const component = this.components.get(id);
    if (!component) {
      throw new MorphOSError(
        "COMPONENT_NOT_FOUND",
        `Component ${id} not found`
      );
    }

    component.state = { ...component.state, ...state };
    this.emit("component:state-updated", component);
    return component;
  }

  /**
   * Get all components for a primitive
   */
  public getByPrimitive(primitiveId: string): RuntimeComponent[] {
    const componentIds = this.componentsByPrimitive.get(primitiveId) || new Set();
    return Array.from(componentIds)
      .map((id) => this.components.get(id))
      .filter((c): c is RuntimeComponent => Boolean(c));
  }

  /**
   * Get component tree (all descendants)
   */
  public getTree(rootId: string): RuntimeComponent[] {
    const result: RuntimeComponent[] = [];
    const visited = new Set<string>();
    this.traverseTree(rootId, result, visited);
    return result;
  }

  /**
   * Add a child component
   */
  public addChild(parentId: string, childId: string): void {
    const parent = this.components.get(parentId);
    if (!parent) {
      throw new MorphOSError(
        "COMPONENT_NOT_FOUND",
        `Parent component ${parentId} not found`
      );
    }

    if (!parent.children) {
      parent.children = [];
    }
    if (!parent.children.includes(childId)) {
      parent.children.push(childId);
    }

    // Track relationship
    const children = this.parentChildRelationships.get(parentId) || new Set();
    children.add(childId);
    this.parentChildRelationships.set(parentId, children);

    this.emit("component:child-added", { parentId, childId });
  }

  /**
   * Remove a child component
   */
  public removeChild(parentId: string, childId: string): void {
    const parent = this.components.get(parentId);
    if (!parent || !parent.children) {
      return;
    }

    parent.children = parent.children.filter((id) => id !== childId);

    const children = this.parentChildRelationships.get(parentId) || new Set();
    children.delete(childId);

    this.emit("component:child-removed", { parentId, childId });
  }

  /**
   * Remove a component and all descendants
   */
  public remove(id: string): void {
    const component = this.components.get(id);
    if (!component) {
      return;
    }

    // Remove all children
    if (component.children) {
      for (const childId of component.children) {
        this.remove(childId);
      }
    }

    // Remove component
    this.components.delete(id);

    // Clean up indexes
    if (component.primitiveId) {
      const primitiveComponents =
        this.componentsByPrimitive.get(component.primitiveId) || new Set();
      primitiveComponents.delete(id);
    }

    this.parentChildRelationships.delete(id);

    this.emit("component:removed", component);
  }

  /**
   * Get all components
   */
  public getAll(): RuntimeComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Count components
   */
  public count(): number {
    return this.components.size;
  }

  /**
   * Count components of a specific type
   */
  public countByType(type: RuntimeComponent["type"]): number {
    return Array.from(this.components.values()).filter((c) => c.type === type)
      .length;
  }

  /**
   * Get all leaf components (no children)
   */
  public getLeaves(): RuntimeComponent[] {
    return Array.from(this.components.values()).filter(
      (c) => !c.children || c.children.length === 0
    );
  }

  /**
   * Get component depth (0 for root)
   */
  public getDepth(id: string, memo = new Map<string, number>()): number {
    if (memo.has(id)) return memo.get(id)!;

    let maxDepth = 0;
    const component = this.components.get(id);
    if (component && component.children) {
      for (const childId of component.children) {
        const childDepth = this.getDepth(childId, memo);
        maxDepth = Math.max(maxDepth, childDepth + 1);
      }
    }

    memo.set(id, maxDepth);
    return maxDepth;
  }

  /**
   * Export components as JSON
   */
  public export(): RuntimeComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Import components from JSON
   */
  public import(components: RuntimeComponent[]): void {
    for (const component of components) {
      if (!this.components.has(component.id)) {
        this.register(component);
      }
    }
  }

  /**
   * Validate component structure
   */
  public validate(component: RuntimeComponent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!component.id) errors.push("Component must have an id");
    if (!component.name) errors.push("Component must have a name");
    if (!component.type) errors.push("Component must have a type");

    // Check for circular references
    if (component.children) {
      const visited = new Set<string>();
      for (const childId of component.children) {
        if (!this.isValidChild(component.id, childId, visited)) {
          errors.push(`Circular reference detected with child ${childId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private traverseTree(
    id: string,
    result: RuntimeComponent[],
    visited: Set<string>
  ): void {
    if (visited.has(id)) return;
    visited.add(id);

    const component = this.components.get(id);
    if (!component) return;

    result.push(component);

    if (component.children) {
      for (const childId of component.children) {
        this.traverseTree(childId, result, visited);
      }
    }
  }

  private isValidChild(
    parentId: string,
    childId: string,
    visited: Set<string>
  ): boolean {
    if (visited.has(childId)) return false;
    if (parentId === childId) return false;

    visited.add(childId);

    const child = this.components.get(childId);
    if (!child || !child.children) return true;

    for (const grandchildId of child.children) {
      if (!this.isValidChild(childId, grandchildId, visited)) {
        return false;
      }
    }

    return true;
  }
}
