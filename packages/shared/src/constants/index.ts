/**
 * MorphOS Global Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  PRIMITIVES: "/api/v1/primitives",
  MUTATIONS: "/api/v1/mutations",
  AGENTS: "/api/v1/agents",
  APPLICATIONS: "/api/v1/applications",
  USERS: "/api/v1/users",
  PERSONALIZATION: "/api/v1/personalization",
  AUDIT: "/api/v1/audit",
} as const;

// WebSocket Events
export const WS_EVENTS = {
  MUTATION_APPLIED: "mutation:applied",
  MUTATION_REVERTED: "mutation:reverted",
  STATE_CHANGED: "state:changed",
  COMPONENT_REGISTERED: "component:registered",
  AGENT_TASK_STARTED: "agent:task:started",
  AGENT_TASK_COMPLETED: "agent:task:completed",
  USER_ACTIVITY: "user:activity",
} as const;

// Mutation Types
export const MUTATION_TYPES = {
  UI_LAYOUT: "ui-layout",
  WORKFLOW_TRANSFORM: "workflow-transform",
  MIDDLEWARE_INJECTION: "middleware-injection",
  COMPONENT_INJECTION: "component-injection",
  STATE_MODIFICATION: "state-modification",
  EVENT_HOOK: "event-hook",
  BUSINESS_LOGIC: "business-logic",
} as const;

// Agent Roles
export const AGENT_ROLES = {
  PLANNER: "planner",
  ANALYZER: "analyzer",
  CODEGEN: "codegen",
  REVIEWER: "reviewer",
  OPTIMIZER: "optimizer",
  EXECUTOR: "executor",
} as const;

// Primitive Categories
export const PRIMITIVE_CATEGORIES = {
  INBOX: "inbox",
  MESSAGE: "message",
  CALENDAR: "calendar",
  TASK: "task",
  WORKFLOW: "workflow",
  APPROVAL: "approval",
  CRM_ENTITY: "crm-entity",
  DASHBOARD: "dashboard",
  FORM: "form",
  DATA_TABLE: "data-table",
  CHART: "chart",
  INTEGRATION: "integration",
} as const;

// UI Layouts
export const UI_LAYOUTS = {
  LIST: "list",
  GRID: "grid",
  KANBAN: "kanban",
  TABLE: "table",
  TIMELINE: "timeline",
  DASHBOARD: "dashboard",
  SPLIT_VIEW: "split-view",
} as const;

// Permission Levels
export const PERMISSION_LEVELS = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  POWER_USER: "power-user",
  USER: "user",
  VIEWER: "viewer",
} as const;

// Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Validation errors
  INVALID_PRIMITIVE: "ERR_INVALID_PRIMITIVE",
  INVALID_MUTATION: "ERR_INVALID_MUTATION",
  INVALID_AGENT: "ERR_INVALID_AGENT",
  VALIDATION_FAILED: "ERR_VALIDATION_FAILED",

  // Not found
  PRIMITIVE_NOT_FOUND: "ERR_PRIMITIVE_NOT_FOUND",
  MUTATION_NOT_FOUND: "ERR_MUTATION_NOT_FOUND",
  AGENT_NOT_FOUND: "ERR_AGENT_NOT_FOUND",
  APPLICATION_NOT_FOUND: "ERR_APPLICATION_NOT_FOUND",

  // Conflicts
  MUTATION_CONFLICT: "ERR_MUTATION_CONFLICT",
  CIRCULAR_DEPENDENCY: "ERR_CIRCULAR_DEPENDENCY",
  INCOMPATIBLE_VERSION: "ERR_INCOMPATIBLE_VERSION",

  // Permission/Auth
  UNAUTHORIZED: "ERR_UNAUTHORIZED",
  FORBIDDEN: "ERR_FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "ERR_INSUFFICIENT_PERMISSIONS",

  // Execution errors
  MUTATION_FAILED: "ERR_MUTATION_FAILED",
  AGENT_ERROR: "ERR_AGENT_ERROR",
  EXECUTION_TIMEOUT: "ERR_EXECUTION_TIMEOUT",
  POLICY_VIOLATION: "ERR_POLICY_VIOLATION",

  // System errors
  INTERNAL_ERROR: "ERR_INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "ERR_SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "ERR_DATABASE_ERROR",
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  MUTATION_EXECUTION: 30000,
  AGENT_TASK: 60000,
  API_REQUEST: 30000,
  WEBSOCKET_PING: 30000,
  COMPONENT_LOAD: 5000,
} as const;

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MUTATION_HISTORY_LIMIT: 1000,
  AGENT_MEMORY_SIZE: 10000,
  AUDIT_LOG_RETENTION_DAYS: 90,
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_CONCURRENT_MUTATIONS: 10,
  MAX_AGENTS_PER_APP: 50,
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_AI_AGENTS: true,
  ENABLE_COLLABORATIVE_MUTATIONS: true,
  ENABLE_MARKETPLACE: false,
  ENABLE_SELF_HEALING: false,
  ENABLE_AUTO_OPTIMIZATION: false,
  ENABLE_AUTONOMOUS_AGENTS: false,
} as const;

// Cache keys
export const CACHE_KEYS = {
  PRIMITIVES: "morphos:primitives",
  MUTATIONS: "morphos:mutations",
  AGENTS: "morphos:agents",
  USER_PROFILE: "morphos:user:",
  APP_STATE: "morphos:app:",
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  PRIMITIVES: 3600, // 1 hour
  MUTATIONS: 1800, // 30 minutes
  USER_PROFILE: 600, // 10 minutes
  APP_STATE: 300, // 5 minutes
} as const;
