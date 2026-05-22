# MorphOS Getting Started Guide

Welcome to MorphOS, an AI-native adaptive software platform that learns and improves applications autonomously.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Core Concepts](#core-concepts)
4. [Running the Platform](#running-the-platform)
5. [Building Your First Adaptive App](#building-your-first-adaptive-app)
6. [Next Steps](#next-steps)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose (for services)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/ChaitanyaJoshi1769/MorphOS.git
cd MorphOS

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- Mutation Service: http://localhost:3002
- Agent Orchestrator: http://localhost:3003
- Primitives Service: http://localhost:3004

## Architecture Overview

MorphOS is built on four layers:

### Layer 1: Adaptive Runtime
The core engine that applies mutations to applications:
- Component management and state tracking
- Mutation execution and rollback
- Event-driven architecture
- Real-time updates

### Layer 2: Primitives
Typed, composable application capabilities:
- UI components (buttons, inputs, forms)
- Workflow components
- Layout components
- Custom business logic

### Layer 3: Agents
Autonomous multi-agent system:
- **Planner Agent**: Analyzes applications and suggests mutations
- **Codegen Agent**: Generates mutation code
- **Agent Orchestrator**: Coordinates multi-agent workflows

### Layer 4: Personalization
Memory and learning systems:
- Episodic memory (user events)
- Semantic memory (preferences)
- Procedural memory (workflows)
- Behavior analysis and recommendations

## Core Concepts

### Primitives

Primitives are typed, composable application capabilities with semantic metadata.

```typescript
const buttonPrimitive: Primitive = {
  id: "btn-click",
  name: "Click Button",
  category: "ui",
  version: "1.0.0",
  inputs: [{ name: "label", type: "string" }],
  outputs: [{ name: "clicked", type: "boolean" }],
  state: [{ name: "isPressed", type: "boolean" }],
  events: [{ name: "click", payload: { timestamp: "number" } }],
  actions: [{ name: "press", parameters: { duration: "number" } }],
  semantics: { intent: "user-interaction" },
};
```

### Mutations

Mutations are safe, semantic-aware code transformations with rollback support.

```typescript
const mutation: Mutation = {
  id: "mut-1",
  type: "ui-optimization",
  appId: "my-app",
  description: "Optimize form layout",
  target: "form-container",
  changes: { layout: "vertical", spacing: "compact" },
  confidence: 0.87,
  impact: "high",
  reversible: true,
};
```

### Runtime Application

Applications managed by MorphOS:

```typescript
const app: RuntimeApplication = {
  id: "my-app",
  name: "My Application",
  version: "1.0.0",
  state: { /* application state */ },
  primitives: [ /* registered primitives */ ],
  mutations: [ /* applied mutations */ ],
};
```

### User Memory

Three types of user memory for personalization:

1. **Episodic**: Specific events
   ```typescript
   await personalization.recordEpisode(userId, {
     timestamp: new Date().toISOString(),
     type: "form-submission",
     details: { formId: "contact-form" },
   });
   ```

2. **Semantic**: General knowledge
   ```typescript
   await personalization.recordSemantic(userId, {
     topic: "form-preferences",
     value: { preferredLayout: "vertical" },
   });
   ```

3. **Procedural**: Workflows and skills
   ```typescript
   await personalization.recordProcedure(userId, {
     name: "fill-contact-form",
     steps: [ /* step definitions */ ],
   });
   ```

## Running the Platform

### Development Mode

```bash
# Start all services
pnpm dev

# Or start individual services
pnpm dev --filter @morphos/web
pnpm dev --filter @morphos/mutation-service
pnpm dev --filter @morphos/agent-orchestrator
```

### Docker Compose

```bash
# Start all services with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

### Kubernetes

```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/

# View deployments
kubectl get deployments -n morphos
```

### AWS with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Apply configuration
terraform apply -var-file=terraform.tfvars

# View outputs
terraform output
```

## Building Your First Adaptive App

### Step 1: Define Primitives

```typescript
import { PrimitiveBuilder } from "@morphos/primitive-sdk";

const myPrimitive = PrimitiveBuilder
  .id("my-button")
  .name("My Button")
  .category("ui")
  .description("A custom button primitive")
  .inputs([{ name: "label", type: "string", required: true }])
  .outputs([{ name: "clicked", type: "boolean" }])
  .state([{ name: "active", type: "boolean", initial: false }])
  .event("click", { timestamp: "number" })
  .action("press", { duration: "number" })
  .semantics({ intent: "user-interaction" })
  .build();
```

### Step 2: Register with Primitives Service

```bash
curl -X POST http://localhost:3004/primitives \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-button",
    "name": "My Button",
    "category": "ui",
    ...
  }'
```

### Step 3: Create Runtime Application

```typescript
const app: RuntimeApplication = {
  id: "my-adaptive-app",
  name: "My Adaptive App",
  version: "1.0.0",
  state: {},
  primitives: [
    { id: "btn-1", primitiveId: "my-button", props: { label: "Click Me" } }
  ],
  mutations: [],
};
```

### Step 4: Request Mutations

```bash
curl -X POST http://localhost:3003/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "my-adaptive-app",
    "objective": "Improve user experience",
    "constraints": ["max-cost: 0.1"]
  }'
```

### Step 5: Review and Apply

```bash
# Get suggested mutations
curl http://localhost:3002/mutations?appId=my-adaptive-app

# Apply a mutation
curl -X POST http://localhost:3002/mutations/:mutationId/apply \
  -H "Content-Type: application/json"
```

### Step 6: Monitor with Personalization

```bash
# Record user behavior
curl -X POST http://localhost:3000/api/personalization/record \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "type": "episode",
    "data": { /* user event */ }
  }'

# Get recommendations
curl http://localhost:3000/api/personalization/recommendations?userId=user-123
```

## API Endpoints

### Primitives Service (Port 3004)

- `GET /primitives` - List primitives
- `GET /primitives/:id` - Get primitive details
- `POST /primitives` - Register primitive
- `GET /primitives/search?q=query` - Search primitives
- `GET /categories` - Get all categories
- `GET /health` - Health check

### Mutation Service (Port 3002)

- `GET /mutations` - List mutations
- `GET /mutations/:id` - Get mutation details
- `POST /mutations` - Create mutation
- `POST /mutations/:id/apply` - Apply mutation
- `POST /mutations/:id/rollback` - Rollback mutation
- `GET /mutations/suggest?appId=app-id` - Get suggestions
- `GET /health` - Health check

### Agent Orchestrator (Port 3003)

- `POST /orchestrate` - Start orchestration
- `POST /agents/:agentId/tasks` - Create task
- `GET /stats` - Get statistics
- `GET /mutations` - Get mutation pipeline
- `GET /health` - Health check

### Frontend (Port 3000)

- Dashboard overview
- Application management
- Mutation control panel
- Agent monitoring
- Personalization settings
- Runtime explorer
- Marketplace

## Project Structure

```
MorphOS/
├── packages/              # Core packages
│   ├── shared/           # Type definitions
│   ├── adaptive-runtime/ # Runtime engine
│   ├── primitive-sdk/    # Primitive builder
│   ├── mutation-core/    # Mutation engine
│   ├── agent-core/       # Agent system
│   └── personalization-engine/ # Memory & learning
├── apps/                 # Applications
│   ├── web/             # Next.js frontend
│   ├── mutation-service/ # Mutation API
│   ├── agent-orchestrator/ # Agent API
│   ├── primitives-service/ # Primitives API
│   └── demo-app/        # Demo application
├── infrastructure/       # DevOps
│   ├── docker/          # Docker configs
│   ├── kubernetes/      # K8s manifests
│   └── terraform/       # AWS infrastructure
└── docs/                # Documentation
```

## Next Steps

1. **Run the Demo**: Start with the [demo application](../apps/demo-app)
2. **Explore APIs**: Test endpoints with curl or Postman
3. **Build an Adapter**: Integrate MorphOS into your application
4. **Create Primitives**: Define custom application capabilities
5. **Monitor**: Use the dashboard to track mutations and personalization

## Learning Resources

- [Primitives Guide](./PRIMITIVES.md)
- [Mutations Guide](./MUTATIONS.md)
- [Agent System Guide](./AGENTS.md)
- [Personalization Guide](./PERSONALIZATION.md)
- [API Reference](./API.md)
- [Architecture Deep Dive](./ARCHITECTURE.md)

## Support

- GitHub Issues: https://github.com/ChaitanyaJoshi1769/MorphOS/issues
- Documentation: https://github.com/ChaitanyaJoshi1769/MorphOS/docs
- Discussions: https://github.com/ChaitanyaJoshi1769/MorphOS/discussions

## License

MorphOS - Adaptive Software Platform

Built with ❤️ by Chaitanya Joshi
