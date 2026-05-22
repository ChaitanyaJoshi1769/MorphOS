/**
 * Primitive Builder
 *
 * Fluent API for defining and registering primitives.
 * Applications use this to expose their capabilities to MorphOS.
 */

import {
  Primitive,
  PrimitiveEvent,
  PrimitiveAction,
  generateId,
  getCurrentTimestamp,
} from "@morphos/shared";

export class PrimitiveBuilder {
  private primitive: Partial<Primitive> = {};

  /**
   * Create a new primitive builder
   */
  static create(): PrimitiveBuilder {
    return new PrimitiveBuilder();
  }

  /**
   * Set primitive ID
   */
  public id(id: string): this {
    this.primitive.id = id;
    return this;
  }

  /**
   * Set primitive name
   */
  public name(name: string): this {
    this.primitive.name = name;
    return this;
  }

  /**
   * Set primitive description
   */
  public description(description: string): this {
    this.primitive.description = description;
    return this;
  }

  /**
   * Set primitive category
   */
  public category(category: string): this {
    this.primitive.category = category;
    return this;
  }

  /**
   * Set primitive version
   */
  public version(version: string): this {
    this.primitive.version = version;
    return this;
  }

  /**
   * Set app ID
   */
  public appId(appId: string): this {
    this.primitive.appId = appId;
    return this;
  }

  /**
   * Set input schema
   */
  public inputs(schema: Record<string, unknown>): this {
    this.primitive.inputSchema = schema;
    return this;
  }

  /**
   * Set output schema
   */
  public outputs(schema: Record<string, unknown>): this {
    this.primitive.outputSchema = schema;
    return this;
  }

  /**
   * Set state schema
   */
  public state(schema: Record<string, unknown>): this {
    this.primitive.stateSchema = schema;
    return this;
  }

  /**
   * Add an event
   */
  public event(name: string, description: string, payload: Record<string, unknown>): this {
    if (!this.primitive.events) {
      this.primitive.events = [];
    }
    this.primitive.events.push({
      name,
      description,
      payload,
    });
    return this;
  }

  /**
   * Add an action
   */
  public action(
    name: string,
    description: string,
    parameters: Record<string, unknown>,
    returnType: Record<string, unknown>
  ): this {
    if (!this.primitive.actions) {
      this.primitive.actions = [];
    }
    this.primitive.actions.push({
      name,
      description,
      parameters,
      returnType,
    });
    return this;
  }

  /**
   * Set semantics
   */
  public semantics(options: {
    purpose: string;
    capabilities: string[];
    constraints?: string[];
    examples?: Record<string, unknown>[];
  }): this {
    this.primitive.semantics = {
      purpose: options.purpose,
      capabilities: options.capabilities,
      constraints: options.constraints || [],
      examples: options.examples || [],
    };
    return this;
  }

  /**
   * Set UI hints
   */
  public uiHints(hints: {
    defaultLayout?: "list" | "grid" | "kanban" | "table" | "timeline";
    colorScheme?: string;
    iconUrl?: string;
    previewComponent?: string;
  }): this {
    this.primitive.uiHints = hints;
    return this;
  }

  /**
   * Build the primitive
   */
  public build(): Primitive {
    const now = getCurrentTimestamp();

    const primitive: Primitive = {
      id: this.primitive.id || generateId("prim"),
      name: this.primitive.name || "Untitled",
      description: this.primitive.description || "",
      category: this.primitive.category || "custom",
      version: this.primitive.version || "1.0.0",
      appId: this.primitive.appId || "",
      inputSchema: this.primitive.inputSchema || {},
      outputSchema: this.primitive.outputSchema || {},
      stateSchema: this.primitive.stateSchema || {},
      events: this.primitive.events || [],
      actions: this.primitive.actions || [],
      semantics: this.primitive.semantics || {
        purpose: "",
        capabilities: [],
        constraints: [],
        examples: [],
      },
      uiHints: this.primitive.uiHints || {
        defaultLayout: "list",
      },
      createdAt: now,
      updatedAt: now,
    };

    return primitive;
  }
}

/**
 * Helper to create a primitive fluently
 */
export function createPrimitive(callback: (builder: PrimitiveBuilder) => void): Primitive {
  const builder = PrimitiveBuilder.create();
  callback(builder);
  return builder.build();
}
