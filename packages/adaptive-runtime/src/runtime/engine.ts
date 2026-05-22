/**
 * Adaptive Runtime Engine
 *
 * Core execution environment for MorphOS applications. Manages:
 * - Component registration and lifecycle
 * - Real-time mutation application
 * - Event dispatching
 * - State management
 * - Rollback and versioning
 */

import {
  RuntimeApplication,
  RuntimeComponent,
  Mutation,
  MutationType,
  Primitive,
  EventHandler,
  ApplicationState,
  RuntimeEvent,
  MorphOSError,
  generateId,
  getCurrentTimestamp,
  deepMerge,
  deepClone,
} from "@morphos/shared";
import { EventEmitter } from "events";

export interface RuntimeConfig {
  appId: string;
  maxMutations?: number;
  enableAutoRollback?: boolean;
  mutationTimeout?: number;
  traceLevel?: "none" | "basic" | "detailed";
}

export class AdaptiveRuntime extends EventEmitter {
  private appId: string;
  private components: Map<string, RuntimeComponent> = new Map();
  private state: ApplicationState;
  private mutations: Map<string, Mutation> = new Map();
  private mutationHistory: string[] = [];
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private config: RuntimeConfig;
  private primitiveRegistry: Map<string, Primitive> = new Map();
  private mutationStack: string[] = [];

  constructor(config: RuntimeConfig) {
    super();
    this.appId = config.appId;
    this.config = config;
    this.state = {
      _version: "1.0.0",
      _timestamp: getCurrentTimestamp(),
      _mutations: [],
    };
  }

  /**
   * Initialize the runtime with application data
   */
  public initialize(app: RuntimeApplication): void {
    this.components = new Map(app.components.map((c) => [c.id, c]));
    this.state = deepClone(app.state);
    this.emit("runtime:initialized", {
      appId: this.appId,
      timestamp: getCurrentTimestamp(),
    });
  }

  /**
   * Register a primitive definition
   */
  public registerPrimitive(primitive: Primitive): void {
    this.primitiveRegistry.set(primitive.id, primitive);
    this.emit("primitive:registered", primitive);
  }

  /**
   * Register a component instance
   */
  public registerComponent(component: RuntimeComponent): void {
    this.components.set(component.id, component);
    this.emit("component:registered", component);
  }

  /**
   * Get a component by ID
   */
  public getComponent(id: string): RuntimeComponent | undefined {
    return this.components.get(id);
  }

  /**
   * Update component state
   */
  public updateComponentState(
    componentId: string,
    updates: Record<string, unknown>
  ): void {
    const component = this.components.get(componentId);
    if (!component) {
      throw new MorphOSError(
        "COMPONENT_NOT_FOUND",
        `Component ${componentId} not found`
      );
    }

    const oldState = deepClone(component.state);
    component.state = deepMerge(
      component.state,
      updates as Record<string, unknown>
    );

    this.emit("component:state-changed", {
      componentId,
      oldState,
      newState: component.state,
      timestamp: getCurrentTimestamp(),
    });

    this.updateApplicationState();
  }

  /**
   * Update global application state
   */
  public updateApplicationState(updates?: Record<string, unknown>): void {
    const oldState = deepClone(this.state);
    if (updates) {
      this.state = deepMerge(this.state, updates);
    } else {
      // Aggregate state from all components
      const aggregatedState: Record<string, unknown> = {};
      this.components.forEach((component) => {
        aggregatedState[component.id] = component.state;
      });
      this.state = deepMerge(this.state, aggregatedState);
    }

    this.state._timestamp = getCurrentTimestamp();

    this.emit("state:changed", {
      oldState,
      newState: this.state,
      timestamp: this.state._timestamp,
    });
  }

  /**
   * Get current application state
   */
  public getApplicationState(): ApplicationState {
    return deepClone(this.state);
  }

  /**
   * Apply a mutation to the runtime
   */
  public async applyMutation(mutation: Mutation): Promise<boolean> {
    const mutationId = mutation.id;

    try {
      // Check for circular dependencies
      if (this.mutationStack.includes(mutationId)) {
        throw new MorphOSError(
          "CIRCULAR_DEPENDENCY",
          `Circular mutation dependency detected for ${mutationId}`
        );
      }

      this.mutationStack.push(mutationId);

      // Validate mutation against policy
      await this.validateMutation(mutation);

      // Apply the mutation based on its type
      switch (mutation.type) {
        case "ui-layout":
          await this.applyUILayoutMutation(mutation);
          break;
        case "workflow-transform":
          await this.applyWorkflowMutation(mutation);
          break;
        case "middleware-injection":
          await this.applyMiddlewareInjection(mutation);
          break;
        case "component-injection":
          await this.applyComponentInjection(mutation);
          break;
        case "state-modification":
          await this.applyStateModification(mutation);
          break;
        case "event-hook":
          await this.applyEventHook(mutation);
          break;
        case "business-logic":
          await this.applyBusinessLogicMutation(mutation);
          break;
        default:
          throw new MorphOSError(
            "INVALID_MUTATION",
            `Unknown mutation type: ${mutation.type}`
          );
      }

      // Track the mutation
      this.mutations.set(mutationId, mutation);
      this.mutationHistory.push(mutationId);
      this.state._mutations.push(mutationId);

      this.emit("mutation:applied", {
        mutationId,
        type: mutation.type,
        timestamp: getCurrentTimestamp(),
      });

      return true;
    } catch (error) {
      this.emit("mutation:failed", {
        mutationId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: getCurrentTimestamp(),
      });

      if (this.config.enableAutoRollback) {
        await this.rollbackMutation(mutationId);
      }

      throw error;
    } finally {
      this.mutationStack.pop();
    }
  }

  /**
   * Roll back a mutation
   */
  public async rollbackMutation(mutationId: string): Promise<void> {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) {
      throw new MorphOSError(
        "MUTATION_NOT_FOUND",
        `Mutation ${mutationId} not found`
      );
    }

    // Remove from history
    this.mutationHistory = this.mutationHistory.filter((id) => id !== mutationId);
    this.state._mutations = this.state._mutations.filter(
      (id) => id !== mutationId
    );

    // Restore previous state (simplified - in production, we'd use event sourcing)
    // For now, we'll just mark it as rolled back
    const rollbackMutation: Mutation = {
      ...mutation,
      id: generateId("mutation"),
      type: "state-modification",
      status: "rolled-back",
      rollbackMutationId: mutationId,
    };

    this.mutations.delete(mutationId);

    this.emit("mutation:rolled-back", {
      mutationId,
      timestamp: getCurrentTimestamp(),
    });
  }

  /**
   * Dispatch an event through the runtime
   */
  public dispatchEvent(event: Omit<RuntimeEvent, "id">): void {
    const fullEvent: RuntimeEvent = {
      id: generateId("event"),
      ...event,
    };

    // Find relevant handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      if (handler.primitiveId === event.sourceComponentId || !handler.primitiveId) {
        this.executeEventHandler(handler, fullEvent);
      }
    }

    this.emit("event:dispatched", fullEvent);
  }

  /**
   * Register an event handler
   */
  public registerEventHandler(handler: EventHandler): void {
    const handlers = this.eventHandlers.get(handler.event) || [];
    handlers.push(handler);
    this.eventHandlers.set(handler.event, handlers);
  }

  /**
   * Get mutation history
   */
  public getMutationHistory(): Mutation[] {
    return this.mutationHistory
      .map((id) => this.mutations.get(id))
      .filter((m): m is Mutation => Boolean(m));
  }

  /**
   * Get active mutations
   */
  public getActiveMutations(): Mutation[] {
    return Array.from(this.mutations.values()).filter(
      (m) => m.status === "active"
    );
  }

  /**
   * Export current state as snapshot
   */
  public createSnapshot() {
    return {
      appId: this.appId,
      timestamp: getCurrentTimestamp(),
      state: this.getApplicationState(),
      components: Array.from(this.components.values()),
      mutations: this.getMutationHistory(),
      version: this.state._version,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async validateMutation(mutation: Mutation): Promise<void> {
    // Check if target exists
    const component = this.components.get(mutation.targetId);
    if (!component) {
      throw new MorphOSError(
        "INVALID_MUTATION",
        `Target component ${mutation.targetId} not found`
      );
    }

    // Additional validation rules can be added here
  }

  private async applyUILayoutMutation(mutation: Mutation): Promise<void> {
    const component = this.components.get(mutation.targetId);
    if (!component) return;

    const uiChanges = (mutation.payload as any)?.uiChanges;
    if (!uiChanges) return;

    component.props = deepMerge(component.props, uiChanges.layout || {});

    if (uiChanges.styling) {
      component.props.style = deepMerge(
        (component.props.style as Record<string, string>) || {},
        uiChanges.styling
      );
    }

    if (uiChanges.visibility !== undefined) {
      component.props.visible = uiChanges.visibility;
    }

    this.updateApplicationState();
  }

  private async applyWorkflowMutation(mutation: Mutation): Promise<void> {
    const workflowChanges = (mutation.payload as any)?.workflowChanges;
    if (!workflowChanges) return;

    const component = this.components.get(mutation.targetId);
    if (!component) return;

    component.state = deepMerge(component.state, {
      workflow: workflowChanges,
    });

    this.updateApplicationState();
  }

  private async applyMiddlewareInjection(mutation: Mutation): Promise<void> {
    // In production, this would involve sandboxed code execution
    // For now, we'll store the middleware code in state
    const middlewareCode = (mutation.payload as any)?.middlewareCode;
    if (!middlewareCode) return;

    this.state._middleware = middlewareCode;
    this.updateApplicationState();
  }

  private async applyComponentInjection(mutation: Mutation): Promise<void> {
    const component = this.components.get(mutation.targetId);
    if (!component) return;

    // Register new component
    const newComponentId = generateId("component");
    const newComponent: RuntimeComponent = {
      id: newComponentId,
      name: `Injected_${newComponentId}`,
      type: "custom",
      props: {},
      state: {},
    };

    this.registerComponent(newComponent);

    if (component.children) {
      component.children.push(newComponentId);
    } else {
      component.children = [newComponentId];
    }

    this.updateApplicationState();
  }

  private async applyStateModification(mutation: Mutation): Promise<void> {
    const component = this.components.get(mutation.targetId);
    if (!component) return;

    const stateUpdates = (mutation.payload as any)?.state || {};
    this.updateComponentState(mutation.targetId, stateUpdates);
  }

  private async applyEventHook(mutation: Mutation): Promise<void> {
    const handler: EventHandler = {
      id: generateId("handler"),
      event: (mutation.payload as any)?.eventName || "custom",
      primitiveId: mutation.targetId,
      handler: (mutation.payload as any)?.handler || "",
      priority: (mutation.payload as any)?.priority || 0,
      enabled: true,
    };

    this.registerEventHandler(handler);
  }

  private async applyBusinessLogicMutation(mutation: Mutation): Promise<void> {
    const component = this.components.get(mutation.targetId);
    if (!component) return;

    // Store business logic in component state
    component.state = deepMerge(component.state, {
      businessLogic: (mutation.payload as any)?.code,
    });

    this.updateApplicationState();
  }

  private executeEventHandler(handler: EventHandler, event: RuntimeEvent): void {
    try {
      // In production, this would execute the handler code in a sandbox
      this.emit("event:handler-executed", {
        handlerId: handler.id,
        eventId: event.id,
        timestamp: getCurrentTimestamp(),
      });
    } catch (error) {
      this.emit("event:handler-error", {
        handlerId: handler.id,
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
