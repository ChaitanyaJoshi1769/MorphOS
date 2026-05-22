/**
 * MorphOS Core Type Definitions
 *
 * This module defines the fundamental types and interfaces for the entire MorphOS platform.
 * These types are used across all services: frontend, backend, agents, and runtime.
 */

// ============================================================================
// PRIMITIVES: The core abstraction layer for applications
// ============================================================================

/**
 * A Primitive is a composable, reusable unit of application functionality.
 * Primitives are the contract between applications and the MorphOS runtime.
 */
export interface Primitive {
  /** Unique identifier for the primitive */
  id: string;

  /** Human-readable name */
  name: string;

  /** Detailed description of what this primitive does */
  description: string;

  /** Semantic category (e.g., "inbox", "calendar", "workflow") */
  category: string;

  /** Version of this primitive definition */
  version: string;

  /** Application that owns this primitive */
  appId: string;

  /** Primitive input schema (JSON Schema) */
  inputSchema: Record<string, unknown>;

  /** Primitive output schema (JSON Schema) */
  outputSchema: Record<string, unknown>;

  /** State schema for this primitive */
  stateSchema: Record<string, unknown>;

  /** Events this primitive can emit */
  events: PrimitiveEvent[];

  /** Actions this primitive supports */
  actions: PrimitiveAction[];

  /** Semantic metadata for AI understanding */
  semantics: {
    purpose: string;
    capabilities: string[];
    constraints: string[];
    examples: Record<string, unknown>[];
  };

  /** UI configuration hints */
  uiHints?: {
    defaultLayout?: "list" | "grid" | "kanban" | "table" | "timeline";
    colorScheme?: string;
    iconUrl?: string;
    previewComponent?: string;
  };

  /** Creation timestamp */
  createdAt: string;

  /** Last modification timestamp */
  updatedAt: string;
}

export interface PrimitiveEvent {
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface PrimitiveAction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  returnType: Record<string, unknown>;
}

export interface PrimitiveRegistry {
  primitives: Map<string, Primitive>;
  register(primitive: Primitive): void;
  get(id: string): Primitive | undefined;
  list(appId?: string): Primitive[];
  search(query: string): Primitive[];
}

// ============================================================================
// MUTATIONS: Runtime modifications to applications
// ============================================================================

export type MutationType =
  | "ui-layout"
  | "workflow-transform"
  | "middleware-injection"
  | "component-injection"
  | "state-modification"
  | "event-hook"
  | "business-logic";

export interface Mutation {
  /** Unique identifier */
  id: string;

  /** Type of mutation */
  type: MutationType;

  /** Application this mutation targets */
  appId: string;

  /** User who created this mutation */
  userId: string;

  /** Target primitive or component */
  targetId: string;

  /** Semantic description of what this mutation does */
  description: string;

  /** The actual mutation code/configuration */
  payload: MutationPayload;

  /** Version this mutation is applied to */
  targetVersion: string;

  /** Status of this mutation */
  status: "draft" | "testing" | "active" | "rolled-back" | "archived";

  /** Impact analysis */
  impact: {
    affectedPrimitives: string[];
    estimatedPerformanceChange: number; // -100 to +100
    estimatedUXImprovement: number; // -100 to +100
    estimatedRiskLevel: "low" | "medium" | "high";
  };

  /** Who verified this mutation */
  verifiedBy?: string;

  /** Associated tests */
  testIds: string[];

  /** Rollback information */
  rollbackMutationId?: string;

  /** Creation and modification timestamps */
  createdAt: string;
  activatedAt?: string;
  rolledBackAt?: string;
  updatedAt: string;

  /** Tags for organization */
  tags: string[];

  /** Metadata */
  metadata: Record<string, unknown>;
}

export interface MutationPayload {
  type: MutationType;
  // For UI mutations
  uiChanges?: {
    componentId: string;
    layout?: Record<string, unknown>;
    styling?: Record<string, string>;
    visibility?: boolean;
    reordering?: string[];
  };
  // For workflow mutations
  workflowChanges?: {
    stepId: string;
    newLogic?: string;
    parameterBindings?: Record<string, unknown>;
    skipCondition?: string;
  };
  // For middleware injections
  middlewareCode?: string;
  // For general code changes
  astTransformation?: {
    selector: string;
    transformation: string;
  };
  // Raw code if needed
  code?: string;
}

export interface MutationHistory {
  appId: string;
  mutations: Mutation[];
  currentVersion: string;
  versions: MutationVersion[];
}

export interface MutationVersion {
  versionId: string;
  mutations: string[]; // mutation IDs
  timestamp: string;
  summary: string;
}

// ============================================================================
// AI AGENTS: Multi-agent system for runtime modifications
// ============================================================================

export type AgentRole =
  | "planner"
  | "analyzer"
  | "codegen"
  | "reviewer"
  | "optimizer"
  | "executor";

export type AgentModel =
  | "claude-opus"
  | "claude-sonnet"
  | "claude-haiku"
  | "gpt-4"
  | "gemini-pro"
  | "deepseek";

export interface Agent {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Agent's primary role */
  role: AgentRole;

  /** AI model used */
  model: AgentModel;

  /** System prompt/instructions */
  systemPrompt: string;

  /** Tools this agent can use */
  tools: AgentTool[];

  /** Memory/context for this agent */
  memory: AgentMemory;

  /** Performance metrics */
  metrics: {
    totalTasksCompleted: number;
    successRate: number; // 0-1
    averageLatency: number; // ms
    lastActiveAt: string;
  };

  /** Whether this agent is enabled */
  enabled: boolean;

  /** Creation timestamp */
  createdAt: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentMemory {
  episodic: EpisodicalMemory[]; // Task histories
  semantic: SemanticMemory[]; // Learned patterns
  procedural: ProceduralMemory[]; // How to do things
}

export interface EpisodicalMemory {
  taskId: string;
  timestamp: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  success: boolean;
  latency: number;
}

export interface SemanticMemory {
  pattern: string;
  frequency: number;
  lastSeen: string;
  associatedPatterns: string[];
}

export interface ProceduralMemory {
  procedure: string;
  steps: string[];
  successRate: number;
  preferredParameters: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  appId: string;
  description: string;
  objective: string;
  constraints: string[];
  status: "pending" | "in-progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  deadline?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: MutationRequest[];
  error?: string;
}

export interface MutationRequest {
  description: string;
  suggestedMutation: Partial<Mutation>;
  reasoning: string;
  estimatedImpact: string;
  requiresApproval: boolean;
}

// ============================================================================
// RUNTIME: Core runtime execution model
// ============================================================================

export interface RuntimeApplication {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "active" | "paused" | "error";

  // Component registry
  components: RuntimeComponent[];

  // State management
  state: ApplicationState;

  // Active mutations
  activeMutations: string[]; // mutation IDs

  // Event system
  eventHandlers: EventHandler[];

  // Performance metrics
  metrics: {
    renderTime: number;
    memoryUsage: number;
    activeUsers: number;
    eventsPerSecond: number;
  };

  // Observability
  observability: {
    enabled: boolean;
    traceLevel: "none" | "basic" | "detailed" | "comprehensive";
    logLevel: "error" | "warn" | "info" | "debug";
  };

  createdAt: string;
  updatedAt: string;
}

export interface RuntimeComponent {
  id: string;
  name: string;
  type: "primitive" | "composite" | "custom";
  primitiveId?: string;
  children?: string[]; // component IDs
  props: Record<string, unknown>;
  state: Record<string, unknown>;
}

export interface ApplicationState {
  [key: string]: unknown;
  _version: string;
  _timestamp: string;
  _mutations: string[];
}

export interface EventHandler {
  id: string;
  event: string;
  primitiveId: string;
  handler: string; // code or mutation ID
  priority: number;
  enabled: boolean;
}

export interface RuntimeEvent {
  id: string;
  timestamp: string;
  type: string;
  sourceComponentId: string;
  payload: Record<string, unknown>;
  processed: boolean;
}

// ============================================================================
// PERSONALIZATION: User-specific adaptations
// ============================================================================

export interface UserProfile {
  userId: string;
  email: string;
  name: string;

  // Behavioral data
  behavior: UserBehavior;

  // Preferences
  preferences: UserPreferences;

  // Personalized mutations
  personalMutations: string[]; // mutation IDs

  // Learning embeddings
  workflowEmbedding?: number[];
  preferenceEmbedding?: number[];

  createdAt: string;
  updatedAt: string;
}

export interface UserBehavior {
  dailyActiveTime: number; // minutes
  preferredTools: string[];
  workflowPatterns: WorkflowPattern[];
  clickPatterns: ClickPattern[];
  searchQueries: string[];
  commonTasks: TaskPattern[];
}

export interface WorkflowPattern {
  pattern: string;
  frequency: number;
  avgDuration: number;
  efficiency: number;
}

export interface ClickPattern {
  componentId: string;
  frequency: number;
  avgTimeToClick: number;
}

export interface TaskPattern {
  task: string;
  frequency: number;
  averageSteps: number;
  preferredSequence: string[];
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  compactMode: boolean;
  defaultLayout: string;
  enableAIAssistance: boolean;
  autoApplyMutations: boolean;
  notificationLevel: "none" | "important" | "all";
  privacyMode: "strict" | "normal" | "permissive";
}

export interface PersonalizationMemory {
  userId: string;

  // Memory types
  episodic: PersonalizationEpisode[];
  semantic: PersonalizationSemantic[];
  procedural: PersonalizationProcedure[];

  // Index for retrieval
  index: Map<string, string[]>;
}

export interface PersonalizationEpisode {
  timestamp: string;
  action: string;
  context: Record<string, unknown>;
  outcome: "successful" | "failed" | "partial";
}

export interface PersonalizationSemantic {
  concept: string;
  meaning: string;
  frequency: number;
  relatedConcepts: string[];
}

export interface PersonalizationProcedure {
  procedure: string;
  steps: string[];
  successRate: number;
  shortcutAvailable: boolean;
}

// ============================================================================
// VERSION CONTROL: Mutation versioning & history
// ============================================================================

export interface MutationCommit {
  id: string;
  appId: string;
  parentId?: string;
  mutations: string[]; // mutation IDs
  author: string;
  message: string;
  timestamp: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface MutationBranch {
  name: string;
  headCommitId: string;
  createdAt: string;
  createdBy: string;
  isDefault: boolean;
}

// ============================================================================
// API & PROTOCOL
// ============================================================================

export interface ApiRequest<T = unknown> {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  body?: T;
  headers: Record<string, string>;
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    timestamp: string;
    latency: number;
    requestId: string;
  };
}

// ============================================================================
// SECURITY & POLICY
// ============================================================================

export type PermissionLevel =
  | "admin"
  | "developer"
  | "power-user"
  | "user"
  | "viewer";

export interface AccessControl {
  userId: string;
  resourceId: string;
  resourceType: "app" | "primitive" | "mutation" | "agent";
  permission: PermissionLevel;
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string;
}

export interface MutationPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enabled: boolean;
}

export interface PolicyRule {
  condition: string; // predicate
  action: "allow" | "deny" | "require-approval";
  priority: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resourceId: string;
  resourceType: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// ERRORS & VALIDATION
// ============================================================================

export class MorphOSError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MorphOSError";
  }
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
