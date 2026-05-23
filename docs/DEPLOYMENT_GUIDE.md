# MorphOS Deployment Guide

Complete guide for deploying MorphOS across different environments.

## Environment Setup

### Prerequisites

- **Node.js:** 20.0+
- **pnpm:** 8.15.4+
- **Docker:** 24.0+
- **Docker Compose:** 2.0+
- **Kubernetes:** 1.24+ (for K8s deployments)
- **Terraform:** 1.0+ (for AWS deployments)
- **Git:** 2.0+

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Node
NODE_ENV=production
DEBUG=false

# Ports
PORT=3000
MUTATION_SERVICE_PORT=3002
AGENT_ORCHESTRATOR_PORT=3003
PRIMITIVES_SERVICE_PORT=3004
GRAPHQL_GATEWAY_PORT=3005

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/morphos
DB_HOST=localhost
DB_PORT=5432
DB_USER=morphos
DB_PASSWORD=secure_password
DB_NAME=morphos

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your_super_secret_jwt_key
API_KEY_PREFIX=morphos_

# Observability
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-key@sentry.io/project
```

## Local Development Deployment

### Option 1: Direct Node (Recommended for Development)

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Start all services in dev mode
pnpm dev
```

**Services available:**
- Frontend: http://localhost:3000
- Mutation API: http://localhost:3002
- Agent Orchestrator: http://localhost:3003
- Primitives API: http://localhost:3004
- GraphQL Gateway: http://localhost:3005

### Option 2: Docker Compose (Full Stack)

```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down

# Clean up volumes
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

**Services:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- All microservices as above

## Staging Deployment

### Kubernetes (Recommended for Staging)

```bash
# Create namespace
kubectl create namespace morphos-staging

# Apply manifests
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/*.yaml -n morphos-staging

# Verify deployments
kubectl get deployments -n morphos-staging

# Check service endpoints
kubectl get services -n morphos-staging

# View logs
kubectl logs -n morphos-staging -l app=mutation-service -f

# Port forward for local testing
kubectl port-forward -n morphos-staging svc/mutation-service 3002:3002
```

### Scaling Services

```bash
# Scale mutation service to 3 replicas
kubectl scale deployment mutation-service --replicas=3 -n morphos-staging

# Monitor scaling
kubectl get pods -n morphos-staging -w

# Monitor resource usage
kubectl top nodes
kubectl top pods -n morphos-staging
```

### Rolling Updates

```bash
# Update deployment image
kubectl set image deployment/mutation-service \
  mutation-service=morphos:mutation-service-v1.1.0 \
  -n morphos-staging

# Monitor rollout
kubectl rollout status deployment/mutation-service -n morphos-staging

# Rollback if needed
kubectl rollout undo deployment/mutation-service -n morphos-staging
```

## Production Deployment

### AWS with Terraform

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Plan deployment
terraform plan -var-file=terraform.tfvars.prod

# Apply configuration
terraform apply -var-file=terraform.tfvars.prod

# Verify resources
terraform output
```

**What Terraform Creates:**
- VPC with public/private subnets
- ECS cluster
- Aurora PostgreSQL database (multi-AZ)
- ElastiCache Redis cluster
- Application Load Balancer
- CloudWatch monitoring
- CloudWatch logs

### Terraform Configuration

Create `terraform.tfvars.prod`:

```hcl
aws_region              = "us-east-1"
environment             = "production"
vpc_cidr                = "10.0.0.0/16"
public_subnet_cidr      = "10.0.1.0/24"
private_subnet_cidr     = "10.0.2.0/24"
db_username             = "admin"
db_password             = "strong_password_here"
db_instance_count       = 2
db_instance_class       = "db.r5.large"
redis_node_type         = "cache.r5.large"
backup_retention_days   = 30
log_retention_days      = 30
```

### ECS Deployment

```bash
# Push Docker images to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t morphos:web-latest -f infrastructure/docker/Dockerfile.web .
docker tag morphos:web-latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/morphos:web-latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/morphos:web-latest

# Update ECS service
aws ecs update-service \
  --cluster morphos-cluster \
  --service mutation-service \
  --force-new-deployment
```

## Health Checks & Monitoring

### Verify All Services

```bash
# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Check database
psql -h localhost -U morphos -d morphos -c "SELECT 1"

# Check Redis
redis-cli -h localhost ping
```

### CloudWatch Monitoring

```bash
# View logs
aws logs tail /ecs/morphos --follow

# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name morphos-error-rate \
  --metric-name ErrorRate \
  --namespace MorphOS \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold

# View dashboards
open https://console.aws.amazon.com/cloudwatch
```

## Continuous Deployment

### GitHub Actions

CI/CD pipeline runs automatically on:
- Push to main/develop
- Pull requests
- Manual trigger

**Pipeline includes:**
1. Lint & type check
2. Run tests
3. Build packages
4. Security scan
5. Build Docker images
6. Deploy to staging (main push)

### Manual Deployment

```bash
# Deploy to staging
git push origin feature-branch
# Waits for CI to pass, then auto-deploys to staging

# Deploy to production
git checkout main
git merge feature-branch
git push origin main
# CI tests, then deployment automation starts
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Automated daily backups (configured in Terraform)
terraform output rds_endpoint

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier morphos-db \
  --db-snapshot-identifier morphos-backup-$(date +%s)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier morphos-db-restore \
  --db-snapshot-identifier morphos-backup-1234567890
```

### RDS Backup Configuration

```hcl
# In terraform/variables.tf
backup_retention_period = 30  # days
skip_final_snapshot     = false
```

## Scaling Considerations

### Auto-Scaling

```bash
# Create auto-scaling group for ECS
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/morphos-cluster/mutation-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Database Scaling

```bash
# Upgrade RDS instance
aws rds modify-db-instance \
  --db-instance-identifier morphos-db \
  --db-instance-class db.r5.xlarge \
  --apply-immediately
```

### Caching Strategy

Redis auto-scaling:
```bash
# Modify cache nodes
aws elasticache modify-cache-cluster \
  --cache-cluster-id morphos-redis \
  --num-cache-nodes 3 \
  --apply-immediately
```

## Security & Compliance

### Enable Encryption

```hcl
# In Terraform
storage_encrypted = true
kms_key_id = aws_kms_key.morphos.arn
```

### Network Security

```bash
# Restrict security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id sg-yyyyy
```

### SSL/TLS Certificates

```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name morphos.example.com \
  --domain-name "*.morphos.example.com" \
  --validation-method DNS
```

## Troubleshooting

### Check Service Status

```bash
# Kubernetes
kubectl describe pod <pod-name> -n morphos
kubectl logs <pod-name> -n morphos
kubectl get events -n morphos

# ECS
aws ecs describe-services --cluster morphos-cluster --services mutation-service
aws ecs describe-task-definition --task-definition mutation-service
```

### Database Issues

```bash
# Check connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM pg_stat_activity;"

# Restart PostgreSQL
kubectl delete pod <postgres-pod> -n morphos
```

### Memory/CPU Issues

```bash
# Monitor resource usage
kubectl top nodes
kubectl top pods -n morphos

# Increase limits
kubectl patch deployment mutation-service -n morphos \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"mutation-service","resources":{"limits":{"cpu":"1","memory":"512Mi"}}}]}}}}'
```

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/mutation-service -n morphos

# Rollback to previous version
kubectl rollout undo deployment/mutation-service -n morphos

# Rollback to specific revision
kubectl rollout undo deployment/mutation-service -n morphos --to-revision=2
```

### ECS Rollback

```bash
# Update service with previous task definition
aws ecs update-service \
  --cluster morphos-cluster \
  --service mutation-service \
  --task-definition mutation-service:1 \
  --force-new-deployment
```

### Database Rollback

```bash
# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier morphos-db-restore \
  --db-snapshot-identifier morphos-backup-1234567890
```

## Performance Tuning

### PostgreSQL Tuning

```bash
# Connection pooling
PGBOUNCER_POOL_MODE=transaction
PGBOUNCER_MAX_CLIENT_CONN=1000

# Query optimization
VACUUM ANALYZE
```

### Redis Tuning

```bash
# Memory management
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

## Monitoring & Alerts

### Key Metrics to Monitor

- Request latency (p50, p95, p99)
- Error rate
- Database connections
- Cache hit rate
- Memory usage
- CPU usage
- Deployment frequency

### CloudWatch Dashboards

Create dashboard in AWS Console:
- Request metrics
- Error rate
- Database performance
- Cache performance
- System resources

## Maintenance Windows

### Scheduled Maintenance

```bash
# Database maintenance (Wednesday 2am)
0 2 * * 3 aws rds modify-db-instance --db-instance-identifier morphos-db

# Cache maintenance (Monthly)
0 3 1 * * aws elasticache modify-cache-cluster --cache-cluster-id morphos-redis
```

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security scan passed
- [ ] Code review approved
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Alert rules set
- [ ] Rollback procedure tested
- [ ] Team notified
- [ ] Deployment window scheduled
- [ ] Runbook documented

## Support & Resources

- AWS Documentation: https://docs.aws.amazon.com
- Kubernetes Docs: https://kubernetes.io/docs
- Terraform Registry: https://registry.terraform.io
- MorphOS Issues: https://github.com/ChaitanyaJoshi1769/MorphOS/issues

---

**Proper deployment ensures reliability, scalability, and security.** Deploy with confidence! 🚀
