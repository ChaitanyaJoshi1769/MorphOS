# MorphOS Architecture

Complete architectural overview of the MorphOS adaptive software platform.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                         │
│  Dashboard | Applications | Primitives | Mutations | Agents      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─────────────────────┬──────────────────┬──────────────────┐
             │                     │                  │                  │
         ┌───▼───┐          ┌──────▼──────┐     ┌────▼─────┐   ┌──────▼──────┐
         │Agent  │          │  Mutation   │     │Primitives│   │  Enterprise │
         │Orch.  │          │  Service    │     │ Service  │   │   Services  │
         │3003   │          │   3002      │     │   3004   │   │   (Phase 4) │
         └───┬───┘          └──────┬──────┘     └────┬─────┘   └──────┬──────┘
             │                     │                  │                  │
             ├─────────────────────┴──────────────────┴──────────────────┘
             │
        ┌────▼────────────────────────────────────────────┐
        │                 Core Packages                     │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Shared Types (@morphos/shared)         │   │
        │  │  - Primitive, Mutation, Agent, etc.     │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Adaptive Runtime                        │   │
        │  │  - Engine, Registry, Mutations, Events   │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Primitive SDK (@morphos/primitive-sdk)  │   │
        │  │  - Fluent builder, decorators            │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Mutation Core                           │   │
        │  │  - AST analyzer, Code generator          │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Agent Core (@morphos/agent-core)       │   │
        │  │  - PlannerAgent, CodegenAgent, Orch.     │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Personalization Engine                  │   │
        │  │  - Memory, Learning, Recommendations     │   │
        │  └──────────────────────────────────────────┘   │
        │                                                  │
        │  Phase 4 Enterprise:                            │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Enterprise Audit                        │   │
        │  │  - Logging, Compliance, Reports          │   │
        │  └──────────────────────────────────────────┘   │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Self-Optimizer                          │   │
        │  │  - Perf Analysis, Auto-Optimization      │   │
        │  └──────────────────────────────────────────┘   │
        │  ┌──────────────────────────────────────────┐   │
        │  │  Cross-Platform Runtime                  │   │
        │  │  - Web, Mobile, Desktop, Server, IoT     │   │
        │  └──────────────────────────────────────────┘   │
        └────┬────────────────────────────────────────────┘
             │
        ┌────▼──────────────────────────┐
        │  Infrastructure & Services    │
        │  ┌──────────────────────────┐ │
        │  │  Database (RDS Aurora)   │ │
        │  │  - PostgreSQL 15.2       │ │
        │  └──────────────────────────┘ │
        │  ┌──────────────────────────┐ │
        │  │  Cache (ElastiCache)     │ │
        │  │  - Redis 7.0             │ │
        │  └──────────────────────────┘ │
        │  ┌──────────────────────────┐ │
        │  │  Container Orchestration │ │
        │  │  - ECS / Kubernetes      │ │
        │  └──────────────────────────┘ │
        │  ┌──────────────────────────┐ │
        │  │  IaC (Terraform)         │ │
        │  │  - AWS Infrastructure    │ │
        │  └──────────────────────────┘ │
        └───────────────────────────────┘
```

## Layered Architecture

### Layer 1: Presentation (Frontend)

**Technology**: Next.js 15, React 19, TypeScript, Tailwind CSS

**Components**:
- Dashboard with real-time metrics
- Application manager
- Primitive registry
- Mutation control panel
- Agent orchestrator UI
- Personalization settings
- Runtime explorer
- Enterprise marketplace

**State Management**:
- React Query for server state
- React Context for UI state
- Suspense for async operations

### Layer 2: API Services (Backend)

**Technology**: Express.js, TypeScript, REST APIs

**Services**:

1. **Mutation Service** (Port 3002)
   - Mutation CRUD operations
   - Mutation validation and analysis
   - Apply/rollback operations
   - Suggestion generation

2. **Agent Orchestrator** (Port 3003)
   - Multi-agent orchestration
   - Task management
   - Mutation pipeline coordination
   - Statistics and monitoring

3. **Primitives Service** (Port 3004)
   - Primitive registration
   - Discovery and search
   - Category management
   - Validation

4. **Enterprise Services** (Phase 4)
   - Audit logging API
   - Compliance management
   - Optimization endpoints
   - Analytics and reporting

### Layer 3: Core Engine (Packages)

**Shared Types** (`@morphos/shared`)
```typescript
- Primitive, Mutation, Agent
- RuntimeApplication, Component
- MutationRequest, AuditEntry
- UserProfile, UserMemory
```

**Adaptive Runtime** (`@morphos/adaptive-runtime`)
```typescript
- AdaptiveRuntime: Main execution engine
- PrimitiveRegistry: Capability discovery
- MutationEngine: Semantic mutations
- ComponentManager: Component lifecycle
- EventBus: Event-driven architecture
```

**Mutation Core** (`@morphos/mutation-core`)
```typescript
- ASTAnalyzer: Code semantic analysis
- CodeGenerator: Mutation code generation
- MutationValidator: Safety validation
- DependencyAnalyzer: Dependency tracking
```

**Agent Core** (`@morphos/agent-core`)
```typescript
- BaseAgent: Abstract agent base
- PlannerAgent: Goal decomposition
- CodegenAgent: Code generation
- AgentOrchestrator: Multi-agent coordination
```

**Personalization Engine** (`@morphos/personalization-engine`)
```typescript
- PersonalizationStore: User memory management
- PersonalizationLearner: Pattern analysis
- Memory types: Episodic, Semantic, Procedural
- Recommendation engine
```

**Enterprise Audit** (`@morphos/enterprise-audit`)
```typescript
- AuditLogger: Audit trail management
- ComplianceEngine: Policy enforcement
- Report generation
- Retention management
```

**Self-Optimizer** (`@morphos/self-optimizer`)
```typescript
- SystemOptimizer: Performance analysis
- AdaptiveOptimizer: Learning system
- Metrics collection
- Auto-optimization
```

**Cross-Platform Runtime** (`@morphos/cross-platform-runtime`)
```typescript
- Platform adapters (Web, Mobile, Desktop, Server, IoT)
- Capability detection
- Native module integration
- Platform-specific mutations
```

### Layer 4: Data & Infrastructure

**Database** (RDS Aurora PostgreSQL)
```sql
- Applications table
- Primitives table
- Mutations table
- Audit logs table
- Users & sessions table
- Personalization data table
```

**Cache** (ElastiCache Redis)
```
- Application state cache
- Mutation suggestions cache
- User session cache
- Performance metrics cache
- Primitive registry cache
```

**Container Orchestration**
```
- ECS for AWS
- Kubernetes for hybrid/on-prem
- Docker for local development
```

**Infrastructure as Code** (Terraform)
```
- VPC & networking
- ECS cluster
- RDS Aurora cluster
- ElastiCache Redis
- CloudWatch logging
- Security groups
```

## Data Flow

### Mutation Request Flow

```
1. User requests mutation via Dashboard
   ↓
2. Frontend sends request to Mutation Service
   ↓
3. Mutation Service validates request
   ↓
4. Agent Orchestrator analyzes impact
   ↓
5. CodegenAgent generates mutation code
   ↓
6. Mutation stored in database
   ↓
7. Audit entry created
   ↓
8. Dashboard updated with status
   ↓
9. User approves/rejects
   ↓
10. If approved: Apply mutation via AdaptiveRuntime
    ↓
11. Monitor results with Self-Optimizer
    ↓
12. Record in Personalization Engine
    ↓
13. Update audit trail
```

### Self-Optimization Flow

```
1. System collects performance metrics
   ↓
2. SystemOptimizer analyzes trends
   ↓
3. Generate optimization suggestions
   ↓
4. Evaluate confidence and impact
   ↓
5. If confidence > threshold: auto-apply
   ↓
6. Monitor results
   ↓
7. AdaptiveOptimizer learns outcomes
   ↓
8. Update performance baseline
   ↓
9. Log in audit trail
```

### Personalization Flow

```
1. User interacts with application
   ↓
2. Record episodic memory (events)
   ↓
3. Extract semantic knowledge (preferences)
   ↓
4. Learn procedural patterns (workflows)
   ↓
5. PersonalizationLearner analyzes behavior
   ↓
6. Generate recommendations
   ↓
7. Suggest mutations based on patterns
   ↓
8. Track recommendation outcomes
```

## Component Interactions

### Primitive Registration

```
Primitive Definition
    ↓
PrimitiveBuilder creates specification
    ↓
Primitives Service validates
    ↓
PrimitiveRegistry stores
    ↓
EventBus notifies subscribers
    ↓
Dashboard updates catalog
```

### Mutation Application

```
Mutation Request
    ↓
MutationEngine validates
    ↓
Dependency analyzer checks impacts
    ↓
AdaptiveRuntime applies changes
    ↓
ComponentManager updates states
    ↓
EventBus emits change events
    ↓
Personalization Engine records
    ↓
AuditLogger logs action
    ↓
Metrics recorded for optimization
```

## Scalability Considerations

### Horizontal Scaling

**Stateless Services**:
- Mutation Service (can scale 3+)
- Agent Orchestrator (can scale 2+)
- Primitives Service (can scale 2+)

**Load Balancing**:
- Round-robin for REST APIs
- Redis for session state
- RDS for consistency

### Vertical Scaling

**Database**:
- Read replicas for queries
- Connection pooling
- Query optimization

**Cache**:
- Redis cluster for high availability
- Multi-node configuration

## Security Architecture

### Authentication & Authorization

```
Client → JWT Token → Backend
         ↓
    Token Validation
         ↓
    RBAC Check (Role-Based Access Control)
         ↓
    Rate Limiting
         ↓
    Audit Logging
```

### Data Security

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Secrets management (AWS Secrets Manager)
- API key rotation

### Compliance

- Audit logging of all actions
- Compliance policy enforcement
- Data retention policies
- Privacy controls

## High Availability

### Redundancy

- Multi-AZ RDS deployment
- Redis failover support
- Service replicas
- Load balancing

### Disaster Recovery

- Automated backups
- Point-in-time recovery
- Cross-region replication (optional)
- Runbooks for failover

## Monitoring & Observability

### Application Metrics

- Request latency
- Error rates
- Mutation success rate
- Compliance score

### Infrastructure Metrics

- CPU, memory, network
- Database connections
- Cache hit rates
- Container health

### Logs

- Application logs (CloudWatch)
- Audit logs (database)
- Access logs (ALB/ingress)
- Error tracking

## Deployment Topologies

### Development (Docker Compose)

```
Single machine running:
- Frontend (next dev)
- Mutation Service
- Agent Orchestrator
- Primitives Service
- PostgreSQL
- Redis
```

### Staging (Kubernetes)

```
K8s cluster with:
- Frontend deployment (2 replicas)
- Service deployments (2-3 replicas each)
- StatefulSet for PostgreSQL
- StatefulSet for Redis
- Ingress controller
- PVC for persistent storage
```

### Production (AWS + Kubernetes)

```
EKS cluster in private VPC:
- Frontend deployment (3+ replicas)
- Service deployments (3+ replicas)
- RDS Aurora cluster
- ElastiCache Redis cluster
- Application Load Balancer
- CloudFront CDN
- CloudWatch monitoring
- VPC endpoints for private access
```

## Extension Points

### Custom Primitives

Extend via PrimitiveBuilder:
```typescript
const customPrimitive = PrimitiveBuilder
  .id("custom-primitive")
  .name("Custom Name")
  // ... configuration
  .build();
```

### Custom Mutations

Extend via CodeGenerator:
```typescript
const customMutation = codeGenerator.generateCustomMutation(
  target,
  changes,
  metadata
);
```

### Custom Agents

Extend BaseAgent:
```typescript
class CustomAgent extends BaseAgent {
  async executeTask(task: AgentTask) {
    // Custom implementation
  }
}
```

### Custom Platforms

Add platform adapter:
```typescript
class CustomPlatformAdapter implements PlatformAdapter {
  // Implement required methods
}
runtime.registerAdapter(new CustomPlatformAdapter());
```

## Performance Characteristics

| Operation | Latency | Throughput |
|-----------|---------|-----------|
| Mutation Apply | <100ms | 1000 req/s |
| Primitive Discovery | <50ms | 5000 req/s |
| Compliance Check | <200ms | 500 req/s |
| Optimization Suggest | <500ms | 100 req/s |
| Audit Log | <10ms | 10000 req/s |

## API Rate Limits

- Mutation API: 100 req/min per user
- Primitive API: 1000 req/min per user
- Agent API: 50 req/min per user
- Audit API: 500 req/min per admin

## Technology Stack Summary

**Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
**Backend**: Express.js, TypeScript, Node.js 20
**Database**: PostgreSQL 15.2 (Aurora)
**Cache**: Redis 7.0
**Containers**: Docker, Kubernetes
**IaC**: Terraform
**Monitoring**: CloudWatch, Prometheus
**Logging**: CloudWatch Logs, ELK
**CI/CD**: GitHub Actions, GitOps

---

For detailed information on specific components, see:
- [Primitives Guide](./PRIMITIVES.md)
- [Mutations Guide](./MUTATIONS.md)
- [Agent System Guide](./AGENTS.md)
- [Phase 4 Enterprise](./PHASE_4_ENTERPRISE.md)
