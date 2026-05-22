/**
 * Primitive Registry
 *
 * Manages the registry of all available primitives in the runtime.
 * Primitives are the contract between applications and MorphOS.
 */

import {
  Primitive,
  PrimitiveRegistry as IPrimitiveRegistry,
  MorphOSError,
  generateId,
} from "@morphos/shared";
import { EventEmitter } from "events";

export class PrimitiveRegistry extends EventEmitter implements IPrimitiveRegistry {
  private primitives: Map<string, Primitive> = new Map();
  private byCategory: Map<string, Primitive[]> = new Map();
  private byApp: Map<string, Primitive[]> = new Map();

  /**
   * Register a new primitive
   */
  public register(primitive: Primitive): void {
    if (this.primitives.has(primitive.id)) {
      throw new MorphOSError(
        "PRIMITIVE_EXISTS",
        `Primitive ${primitive.id} already exists`
      );
    }

    this.primitives.set(primitive.id, primitive);

    // Index by category
    const categoryPrimitives = this.byCategory.get(primitive.category) || [];
    categoryPrimitives.push(primitive);
    this.byCategory.set(primitive.category, categoryPrimitives);

    // Index by app
    const appPrimitives = this.byApp.get(primitive.appId) || [];
    appPrimitives.push(primitive);
    this.byApp.set(primitive.appId, appPrimitives);

    this.emit("primitive:registered", primitive);
  }

  /**
   * Get a primitive by ID
   */
  public get(id: string): Primitive | undefined {
    return this.primitives.get(id);
  }

  /**
   * List all primitives, optionally filtered by app
   */
  public list(appId?: string): Primitive[] {
    if (appId) {
      return this.byApp.get(appId) || [];
    }
    return Array.from(this.primitives.values());
  }

  /**
   * Search primitives by name or description
   */
  public search(query: string): Primitive[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.primitives.values()).filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get primitives by category
   */
  public getByCategory(category: string): Primitive[] {
    return this.byCategory.get(category) || [];
  }

  /**
   * Get all categories
   */
  public getCategories(): string[] {
    return Array.from(this.byCategory.keys());
  }

  /**
   * Update a primitive
   */
  public update(id: string, updates: Partial<Primitive>): Primitive {
    const primitive = this.primitives.get(id);
    if (!primitive) {
      throw new MorphOSError(
        "PRIMITIVE_NOT_FOUND",
        `Primitive ${id} not found`
      );
    }

    const updated: Primitive = {
      ...primitive,
      ...updates,
      id: primitive.id, // Don't allow ID changes
      appId: primitive.appId, // Don't allow app changes
      updatedAt: new Date().toISOString(),
    };

    this.primitives.set(id, updated);
    this.emit("primitive:updated", updated);
    return updated;
  }

  /**
   * Remove a primitive
   */
  public remove(id: string): void {
    const primitive = this.primitives.get(id);
    if (!primitive) {
      throw new MorphOSError(
        "PRIMITIVE_NOT_FOUND",
        `Primitive ${id} not found`
      );
    }

    this.primitives.delete(id);

    // Remove from category index
    const categoryPrimitives = this.byCategory.get(primitive.category) || [];
    this.byCategory.set(
      primitive.category,
      categoryPrimitives.filter((p) => p.id !== id)
    );

    // Remove from app index
    const appPrimitives = this.byApp.get(primitive.appId) || [];
    this.byApp.set(
      primitive.appId,
      appPrimitives.filter((p) => p.id !== id)
    );

    this.emit("primitive:removed", primitive);
  }

  /**
   * Validate a primitive definition
   */
  public validate(primitive: Primitive): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!primitive.id) errors.push("Primitive must have an id");
    if (!primitive.name) errors.push("Primitive must have a name");
    if (!primitive.description) errors.push("Primitive must have a description");
    if (!primitive.category) errors.push("Primitive must have a category");
    if (!primitive.version) errors.push("Primitive must have a version");
    if (!primitive.appId) errors.push("Primitive must have an appId");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export all primitives as JSON (for backup/sharing)
   */
  public export(): Primitive[] {
    return Array.from(this.primitives.values());
  }

  /**
   * Import primitives from JSON
   */
  public import(primitives: Primitive[]): void {
    for (const primitive of primitives) {
      const validation = this.validate(primitive);
      if (!validation.valid) {
        throw new MorphOSError(
          "INVALID_PRIMITIVE",
          `Invalid primitive ${primitive.id}: ${validation.errors.join(", ")}`
        );
      }
      if (!this.primitives.has(primitive.id)) {
        this.register(primitive);
      }
    }
  }
}
