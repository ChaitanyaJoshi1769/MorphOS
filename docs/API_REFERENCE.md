# MorphOS API Reference

Complete API documentation for all MorphOS services.

## Base URLs

| Service | URL | GraphQL |
|---------|-----|---------|
| Mutation Service | http://localhost:3002 | N/A |
| Agent Orchestrator | http://localhost:3003 | N/A |
| Primitives Service | http://localhost:3004 | N/A |
| GraphQL Gateway | http://localhost:3005/graphql | ✅ |

## Authentication

All API endpoints require authentication via JWT bearer token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3002/mutations
```

### Get JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

## Response Format

All responses follow this format:

```typescript
{
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: object;
  };
  metadata: {
    timestamp: string;
    latency: number;
    requestId: string;
  };
}
```

## Primitives Service (Port 3004)

### List Primitives

**Request:**
```http
GET /primitives?appId=app-1&category=ui&limit=50
```

**Parameters:**
- `appId` (query, optional): Filter by application ID
- `category` (query, optional): Filter by category (ui, workflow, layout, custom)
- `limit` (query, optional): Max results (default: 50, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "btn-click",
      "appId": "app-1",
      "name": "Click Button",
      "category": "ui",
      "version": "1.0.0",
      "description": "A clickable button",
      "inputs": [
        {
          "name": "label",
          "type": "string",
          "required": true,
          "description": "Button label"
        }
      ],
      "outputs": [
        {
          "name": "clicked",
          "type": "boolean"
        }
      ],
      "state": [
        {
          "name": "isActive",
          "type": "boolean",
          "initial": false
        }
      ],
      "events": [
        {
          "name": "click",
          "payload": {
            "timestamp": "number",
            "x": "number",
            "y": "number"
          }
        }
      ],
      "actions": [
        {
          "name": "press",
          "parameters": {
            "duration": "number"
          }
        }
      ],
      "semantics": {
        "intent": "user-interaction",
        "userAction": true,
        "accessibility": "interactive"
      }
    }
  ],
  "metadata": {
    "timestamp": "2026-05-23T12:00:00Z",
    "latency": 45,
    "requestId": "req-123"
  }
}
```

### Get Primitive Details

**Request:**
```http
GET /primitives/{id}
```

**Parameters:**
- `id` (path): Primitive ID

**Response:** Single primitive object (see list response above)

### Register Primitive

**Request:**
```http
POST /primitives
Content-Type: application/json

{
  "id": "new-primitive",
  "appId": "app-1",
  "name": "New Primitive",
  "category": "ui",
  "version": "1.0.0",
  "description": "Description",
  "inputs": [],
  "outputs": [],
  "state": [],
  "events": [],
  "actions": [],
  "semantics": {}
}
```

**Response:** Created primitive object (201 Created)

### Search Primitives

**Request:**
```http
GET /primitives/search?q=button&limit=20
```

**Parameters:**
- `q` (query, required): Search query
- `limit` (query, optional): Max results (default: 50)

**Response:** Array of matching primitives

### Get Categories

**Request:**
```http
GET /categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    "ui",
    "workflow",
    "layout",
    "custom"
  ],
  "metadata": { ... }
}
```

### Health Check

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-23T12:00:00Z"
}
```

## Mutation Service (Port 3002)

### List Mutations

**Request:**
```http
GET /mutations?appId=app-1&status=pending&limit=50
```

**Parameters:**
- `appId` (query, optional): Filter by app
- `status` (query, optional): pending, approved, applied, failed
- `type` (query, optional): Filter by mutation type
- `limit` (query, optional): Max results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mut-1",
      "type": "ui-optimization",
      "appId": "app-1",
      "description": "Optimize form layout",
      "target": "form-container",
      "changes": {
        "layout": "vertical",
        "spacing": "compact"
      },
      "confidence": 0.87,
      "impact": "high",
      "reversible": true,
      "estimatedCost": 0.05,
      "status": "pending",
      "createdAt": "2026-05-23T12:00:00Z"
    }
  ],
  "metadata": { ... }
}
```

### Get Mutation Details

**Request:**
```http
GET /mutations/{id}
```

**Response:** Single mutation object

### Create Mutation

**Request:**
```http
POST /mutations
Content-Type: application/json

{
  "type": "ui-optimization",
  "appId": "app-1",
  "description": "Optimize layout",
  "target": "container",
  "changes": {
    "layout": "grid"
  },
  "confidence": 0.85,
  "impact": "medium",
  "reversible": true,
  "estimatedCost": 0.1
}
```

**Response:** Created mutation object (201 Created)

### Apply Mutation

**Request:**
```http
POST /mutations/{id}/apply
Content-Type: application/json

{
  "priority": "high",
  "approvedBy": "admin-1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mut-1",
    "status": "applied",
    "appliedAt": "2026-05-23T12:00:00Z",
    "appliedBy": "admin-1"
  },
  "metadata": { ... }
}
```

### Rollback Mutation

**Request:**
```http
POST /mutations/{id}/rollback
Content-Type: application/json

{
  "reason": "User initiated rollback"
}
```

**Response:** Rollback mutation object

### Get Mutation Suggestions

**Request:**
```http
GET /mutations/suggest?appId=app-1&limit=10
```

**Parameters:**
- `appId` (query, required): Application to analyze
- `priority` (query, optional): high, medium, low
- `limit` (query, optional): Max suggestions

**Response:** Array of suggested mutations

### Health Check

**Request:**
```http
GET /health
```

## Agent Orchestrator (Port 3003)

### Start Orchestration

**Request:**
```http
POST /orchestrate
Content-Type: application/json

{
  "appId": "app-1",
  "objective": "Improve user experience",
  "constraints": [
    "max-cost: 0.1",
    "max-time: 30000"
  ],
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orchestrationId": "orch-123",
    "appId": "app-1",
    "status": "running",
    "progress": 0.5,
    "suggestedMutations": [ ... ],
    "estimatedCompletionTime": 15000
  },
  "metadata": { ... }
}
```

### Create Agent Task

**Request:**
```http
POST /agents/{agentId}/tasks
Content-Type: application/json

{
  "appId": "app-1",
  "description": "Analyze performance metrics",
  "objective": "Find optimization opportunities",
  "constraints": ["budget: 0.2"],
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "agentId": "planner-1",
    "appId": "app-1",
    "status": "in-progress",
    "createdAt": "2026-05-23T12:00:00Z",
    "updatedAt": "2026-05-23T12:00:05Z"
  },
  "metadata": { ... }
}
```

### Get Statistics

**Request:**
```http
GET /stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAgents": 3,
    "activeAgents": 2,
    "totalTasks": 156,
    "tasksInProgress": 5,
    "tasksCompleted": 151,
    "averageTaskDuration": 5234,
    "successRate": 0.96
  },
  "metadata": { ... }
}
```

### Get Mutation Pipeline

**Request:**
```http
GET /mutations
```

**Response:** Array of mutations in the current pipeline

### Health Check

**Request:**
```http
GET /health
```

## GraphQL Gateway (Port 3005/graphql)

### Query Primitives

```graphql
query {
  primitives(category: "ui", limit: 10) {
    id
    name
    description
    inputs {
      name
      type
      required
    }
    semantics {
      intent
    }
  }
}
```

### Mutation Operations

```graphql
mutation {
  createMutation(input: {
    type: "performance"
    appId: "app-1"
    description: "Add caching"
    target: "api"
    changes: "{\"cache\": true}"
    confidence: 0.92
    impact: "high"
  }) {
    id
    status
  }
}
```

### Query Audit Logs

```graphql
query {
  auditEntries(
    userId: "admin-1"
    startDate: "2026-05-01"
    endDate: "2026-05-23"
  ) {
    id
    timestamp
    action
    resource
    result
    severity
  }
}
```

### Full Schema

See `apps/graphql-gateway/src/schema.ts` for complete GraphQL schema.

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: appId",
    "details": {
      "field": "appId"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Primitive not found"
  }
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "confidence",
          "message": "Must be between 0 and 1"
        }
      ]
    }
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting

**Headers:**
- `X-RateLimit-Limit`: Max requests per minute
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp of limit reset

**Limits:**
- Primitives API: 1000 req/min per user
- Mutation API: 100 req/min per user
- Agent API: 50 req/min per user
- GraphQL: 200 req/min per user

**Response when exceeded:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1653307200
```

## Pagination

Use `limit` and `offset` for pagination:

```bash
# Get first 50 items
GET /primitives?limit=50&offset=0

# Get next 50 items
GET /primitives?limit=50&offset=50
```

## Filtering & Sorting

**Available filters:**
- `appId`: Filter by application
- `category`: Filter by category
- `status`: Filter by status
- `type`: Filter by type
- `userId`: Filter by user

**Example:**
```bash
GET /mutations?appId=app-1&status=pending&type=ui-optimization&limit=20
```

## Versioning

API version in headers:

```bash
curl -H "API-Version: 1.0.0" http://localhost:3002/mutations
```

## Webhook Events

Webhooks for real-time updates:

```bash
POST /webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "event": "mutation.applied",
    "url": "https://your-app.com/webhooks/mutation-applied",
    "secret": "webhook_secret"
  }'
```

**Events:**
- `mutation.created`
- `mutation.applied`
- `mutation.failed`
- `primitive.registered`
- `audit.entry.created`

---

**API Consistency:** All endpoints follow REST conventions and return consistent response formats. 🚀
