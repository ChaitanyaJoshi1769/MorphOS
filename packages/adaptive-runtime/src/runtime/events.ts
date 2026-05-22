/**
 * Event Bus
 *
 * Central event management system for the runtime.
 * Handles event dispatch, subscription, and lifecycle.
 */

import { RuntimeEvent, EventHandler, generateId } from "@morphos/shared";
import { EventEmitter } from "events";

export interface EventListener {
  (event: RuntimeEvent): void | Promise<void>;
}

export class EventBus extends EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: RuntimeEvent[] = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to an event type
   */
  public on(event: string, listener: EventListener): void {
    const listeners = this.listeners.get(event) || new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    this.emit("subscription:added", { event, listenerCount: listeners.size });
  }

  /**
   * Subscribe to an event type once
   */
  public once(event: string, listener: EventListener): void {
    const wrappedListener = async (e: RuntimeEvent) => {
      await listener(e);
      this.off(event, wrappedListener);
    };
    this.on(event, wrappedListener);
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, listener: EventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
      this.emit("subscription:removed", { event, listenerCount: listeners.size });
    }
  }

  /**
   * Dispatch an event
   */
  public async emit(event: RuntimeEvent): Promise<void> {
    event.processed = false;

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type) || new Set();
    const wildCardListeners = this.listeners.get("*") || new Set();

    const allListeners = new Set([...listeners, ...wildCardListeners]);

    for (const listener of allListeners) {
      try {
        await Promise.resolve(listener(event));
      } catch (error) {
        this.emit({
          id: generateId("event"),
          timestamp: new Date().toISOString(),
          type: "error",
          sourceComponentId: "event-bus",
          payload: {
            error: error instanceof Error ? error.message : String(error),
            originalEvent: event.id,
          },
          processed: false,
        });
      }
    }

    event.processed = true;
    this.emit("event:processed", event);
  }

  /**
   * Get event history
   */
  public getHistory(
    type?: string,
    limit = 100
  ): RuntimeEvent[] {
    let history = this.eventHistory;
    if (type) {
      history = history.filter((e) => e.type === type);
    }
    return history.slice(-limit);
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count for an event type
   */
  public getListenerCount(event: string): number {
    const listeners = this.listeners.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all subscribed event types
   */
  public getSubscribedEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Batch emit multiple events
   */
  public async emitBatch(events: RuntimeEvent[]): Promise<void> {
    for (const event of events) {
      await this.emit(event);
    }
  }

  /**
   * Create an event filter
   */
  public createFilter(predicate: (event: RuntimeEvent) => boolean): EventListener {
    return (event: RuntimeEvent) => {
      if (predicate(event)) {
        this.emit(event);
      }
    };
  }

  /**
   * Create an event transformer
   */
  public createTransformer(
    transform: (event: RuntimeEvent) => RuntimeEvent
  ): EventListener {
    return (event: RuntimeEvent) => {
      const transformed = transform(event);
      this.emit(transformed);
    };
  }

  /**
   * Create a debounced event listener
   */
  public createDebouncedListener(
    listener: EventListener,
    delay = 300
  ): EventListener {
    let timeout: NodeJS.Timeout;
    return (event: RuntimeEvent) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => listener(event), delay);
    };
  }

  /**
   * Create a throttled event listener
   */
  public createThrottledListener(
    listener: EventListener,
    limit = 1000
  ): EventListener {
    let lastRun = 0;
    return (event: RuntimeEvent) => {
      const now = Date.now();
      if (now - lastRun >= limit) {
        listener(event);
        lastRun = now;
      }
    };
  }

  /**
   * Get statistics about event dispatch
   */
  public getStats(): {
    totalEvents: number;
    uniqueEventTypes: number;
    listenersByEvent: Record<string, number>;
  } {
    const listenersByEvent: Record<string, number> = {};
    this.listeners.forEach((listeners, event) => {
      listenersByEvent[event] = listeners.size;
    });

    const eventTypes = new Set(this.eventHistory.map((e) => e.type));

    return {
      totalEvents: this.eventHistory.length,
      uniqueEventTypes: eventTypes.size,
      listenersByEvent,
    };
  }
}
