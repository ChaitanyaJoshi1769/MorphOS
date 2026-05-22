/**
 * TypeScript Decorators for Primitive Definition
 *
 * Allows defining primitives using decorators for a cleaner syntax.
 */

import { Primitive, generateId, getCurrentTimestamp } from "@morphos/shared";

export interface PrimitiveMetadata {
  name: string;
  category: string;
  description: string;
  appId: string;
  version?: string;
  semantics?: {
    purpose: string;
    capabilities: string[];
    constraints?: string[];
  };
}

const primitiveMetadataKey = Symbol("morphos:primitive");

/**
 * Decorator to mark a class as a primitive
 */
export function Primitive(metadata: PrimitiveMetadata) {
  return function (target: any) {
    Reflect.defineMetadata(primitiveMetadataKey, metadata, target);
    return target;
  };
}

/**
 * Decorator to mark a method as an action
 */
export function Action(description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata = Reflect.getOwnMetadata(primitiveMetadataKey, target.constructor) || {};
    if (!metadata.actions) {
      metadata.actions = [];
    }
    metadata.actions.push({
      name: propertyKey,
      description,
    });
    Reflect.defineMetadata(primitiveMetadataKey, metadata, target.constructor);
    return descriptor;
  };
}

/**
 * Decorator to mark a method as an event emitter
 */
export function Event(name: string, description: string) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getOwnMetadata(primitiveMetadataKey, target.constructor) || {};
    if (!metadata.events) {
      metadata.events = [];
    }
    metadata.events.push({
      name,
      description,
    });
    Reflect.defineMetadata(primitiveMetadataKey, metadata, target.constructor);
  };
}

/**
 * Extract primitive definition from decorated class
 */
export function extractPrimitiveDefinition(target: any): Primitive {
  const metadata = Reflect.getMetadata(primitiveMetadataKey, target);
  if (!metadata) {
    throw new Error(`Class ${target.name} is not decorated with @Primitive`);
  }

  const now = getCurrentTimestamp();

  return {
    id: generateId("prim"),
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    version: metadata.version || "1.0.0",
    appId: metadata.appId,
    inputSchema: {},
    outputSchema: {},
    stateSchema: {},
    events: metadata.events || [],
    actions: metadata.actions || [],
    semantics: metadata.semantics || {
      purpose: metadata.description,
      capabilities: [],
      constraints: [],
      examples: [],
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Register a decorated primitive class
 */
export function registerPrimitive(target: any): Primitive {
  return extractPrimitiveDefinition(target);
}
