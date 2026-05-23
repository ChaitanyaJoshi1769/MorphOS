import { gql } from "graphql-tag";
import axios from "axios";
import { Primitive, Mutation, AuditEntry } from "@morphos/shared";

// GraphQL Type Definitions
export const typeDefs = gql`
  # Primitive Types
  type Primitive {
    id: String!
    appId: String!
    name: String!
    category: String!
    version: String!
    description: String
    inputs: [InputField!]!
    outputs: [OutputField!]!
    state: [StateField!]!
    events: [EventDefinition!]!
    actions: [ActionDefinition!]!
    semantics: Semantics!
  }

  type InputField {
    name: String!
    type: String!
    required: Boolean!
    description: String
  }

  type OutputField {
    name: String!
    type: String!
    description: String
  }

  type StateField {
    name: String!
    type: String!
    initial: String
  }

  type EventDefinition {
    name: String!
    payload: String
  }

  type ActionDefinition {
    name: String!
    parameters: String
  }

  type Semantics {
    intent: String
    userAction: Boolean
    accessibility: String
  }

  # Mutation Types
  type Mutation {
    id: String!
    type: String!
    appId: String!
    description: String!
    target: String!
    changes: String!
    confidence: Float!
    impact: String!
    reversible: Boolean!
    estimatedCost: Float!
  }

  type MutationRequest {
    id: String!
    mutationId: String!
    appId: String!
    requestedAt: String!
    status: String!
    priority: String!
    reason: String
  }

  # Audit Types
  type AuditEntry {
    id: String!
    timestamp: String!
    userId: String!
    action: String!
    resource: String!
    resourceId: String!
    result: String!
    severity: String!
    errorMessage: String
    details: String
  }

  type AuditReport {
    generatedAt: String!
    totalEvents: Int!
    failureRate: Float!
    complianceScore: Float!
    recommendations: [String!]!
  }

  # Application Types
  type Application {
    id: String!
    name: String!
    version: String!
    description: String
    primitiveCount: Int!
    mutationCount: Int!
    status: String!
  }

  # Query Type
  type Query {
    # Primitives
    primitive(id: String!): Primitive
    primitives(appId: String, category: String, limit: Int): [Primitive!]!
    searchPrimitives(query: String!, limit: Int): [Primitive!]!
    categories: [String!]!

    # Mutations
    mutation(id: String!): Mutation
    mutations(appId: String, type: String, limit: Int): [Mutation!]!
    mutationRequests(appId: String, status: String): [MutationRequest!]!

    # Audit
    auditEntries(
      userId: String
      action: String
      startDate: String
      endDate: String
      limit: Int
    ): [AuditEntry!]!
    auditReport(startDate: String, endDate: String): AuditReport

    # Applications
    application(id: String!): Application
    applications(limit: Int): [Application!]!

    # Health
    health: String!
  }

  type Mutation {
    # Primitives
    registerPrimitive(input: PrimitiveInput!): Primitive!

    # Mutations
    createMutation(input: MutationInput!): Mutation!
    applyMutation(mutationId: String!): MutationRequest!
    rollbackMutation(mutationId: String!): MutationRequest!

    # Audit
    logAuditEntry(input: AuditEntryInput!): AuditEntry!
  }

  # Input Types
  input PrimitiveInput {
    id: String!
    appId: String!
    name: String!
    category: String!
    version: String!
    description: String
  }

  input MutationInput {
    type: String!
    appId: String!
    description: String!
    target: String!
    changes: String!
    confidence: Float!
    impact: String!
  }

  input AuditEntryInput {
    userId: String!
    action: String!
    resource: String!
    resourceId: String!
    result: String!
    severity: String!
  }
`;

// Resolvers
export const resolvers = {
  Query: {
    // Primitives
    primitive: async (_: any, { id }: { id: string }) => {
      try {
        const response = await axios.get(
          `http://localhost:3004/primitives/${id}`
        );
        return response.data.data;
      } catch (error) {
        console.error("Error fetching primitive:", error);
        return null;
      }
    },

    primitives: async (
      _: any,
      {
        appId,
        category,
        limit = 50,
      }: { appId?: string; category?: string; limit?: number }
    ) => {
      try {
        const url = new URL("http://localhost:3004/primitives");
        if (appId) url.searchParams.append("appId", appId);
        if (category) url.searchParams.append("category", category);

        const response = await axios.get(url.toString());
        return response.data.data.slice(0, limit);
      } catch (error) {
        console.error("Error fetching primitives:", error);
        return [];
      }
    },

    searchPrimitives: async (
      _: any,
      { query, limit = 50 }: { query: string; limit?: number }
    ) => {
      try {
        const response = await axios.get(
          `http://localhost:3004/primitives/search?q=${encodeURIComponent(query)}`
        );
        return response.data.data.slice(0, limit);
      } catch (error) {
        console.error("Error searching primitives:", error);
        return [];
      }
    },

    categories: async () => {
      try {
        const response = await axios.get("http://localhost:3004/categories");
        return response.data.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },

    // Mutations
    mutation: async (_: any, { id }: { id: string }) => {
      try {
        const response = await axios.get(`http://localhost:3002/mutations/${id}`);
        return response.data.data;
      } catch (error) {
        console.error("Error fetching mutation:", error);
        return null;
      }
    },

    mutations: async (
      _: any,
      {
        appId,
        type,
        limit = 50,
      }: { appId?: string; type?: string; limit?: number }
    ) => {
      try {
        const url = new URL("http://localhost:3002/mutations");
        if (appId) url.searchParams.append("appId", appId);
        if (type) url.searchParams.append("type", type);

        const response = await axios.get(url.toString());
        return response.data.data.slice(0, limit);
      } catch (error) {
        console.error("Error fetching mutations:", error);
        return [];
      }
    },

    mutationRequests: async (
      _: any,
      { appId, status }: { appId?: string; status?: string }
    ) => {
      try {
        const url = new URL("http://localhost:3002/mutations");
        if (appId) url.searchParams.append("appId", appId);
        if (status) url.searchParams.append("status", status);

        const response = await axios.get(url.toString());
        return response.data.data;
      } catch (error) {
        console.error("Error fetching mutation requests:", error);
        return [];
      }
    },

    // Health
    health: async () => {
      return "healthy";
    },
  },

  Mutation: {
    // Primitives
    registerPrimitive: async (
      _: any,
      { input }: { input: Record<string, unknown> }
    ) => {
      try {
        const response = await axios.post(
          "http://localhost:3004/primitives",
          input
        );
        return response.data.data;
      } catch (error) {
        console.error("Error registering primitive:", error);
        throw new Error("Failed to register primitive");
      }
    },

    // Mutations
    createMutation: async (
      _: any,
      { input }: { input: Record<string, unknown> }
    ) => {
      try {
        const response = await axios.post(
          "http://localhost:3002/mutations",
          input
        );
        return response.data.data;
      } catch (error) {
        console.error("Error creating mutation:", error);
        throw new Error("Failed to create mutation");
      }
    },

    applyMutation: async (_: any, { mutationId }: { mutationId: string }) => {
      try {
        const response = await axios.post(
          `http://localhost:3002/mutations/${mutationId}/apply`
        );
        return response.data.data;
      } catch (error) {
        console.error("Error applying mutation:", error);
        throw new Error("Failed to apply mutation");
      }
    },

    rollbackMutation: async (
      _: any,
      { mutationId }: { mutationId: string }
    ) => {
      try {
        const response = await axios.post(
          `http://localhost:3002/mutations/${mutationId}/rollback`
        );
        return response.data.data;
      } catch (error) {
        console.error("Error rolling back mutation:", error);
        throw new Error("Failed to rollback mutation");
      }
    },

    // Audit
    logAuditEntry: async (
      _: any,
      { input }: { input: Record<string, unknown> }
    ) => {
      // In production, this would call the audit service
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: input.userId as string,
        action: input.action as string,
        resource: input.resource as string,
        resourceId: input.resourceId as string,
        result: input.result as "success" | "failure",
        severity: input.severity as "info" | "warning" | "critical",
        details: {},
        metadata: {},
      };

      return auditEntry;
    },
  },
};
