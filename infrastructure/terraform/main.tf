terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================================================
# VPC & Networking
# ============================================================================

resource "aws_vpc" "morphos" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "morphos-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id              = aws_vpc.morphos.id
  cidr_block          = var.public_subnet_cidr
  availability_zone   = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "morphos-public-subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.morphos.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = var.availability_zone

  tags = {
    Name = "morphos-private-subnet"
  }
}

# ============================================================================
# ECS Cluster
# ============================================================================

resource "aws_ecs_cluster" "morphos" {
  name = "morphos-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "morphos-cluster"
  }
}

# ============================================================================
# RDS Database
# ============================================================================

resource "aws_rds_cluster" "morphos" {
  cluster_identifier      = "morphos-db"
  engine                  = "aurora-postgresql"
  engine_version          = "15.2"
  database_name           = "morphos"
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.morphos.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  skip_final_snapshot     = var.environment == "dev"
  storage_encrypted       = true
  backup_retention_period = var.backup_retention_days

  tags = {
    Name = "morphos-db"
  }
}

resource "aws_rds_cluster_instance" "morphos" {
  count              = var.db_instance_count
  cluster_identifier = aws_rds_cluster.morphos.id
  instance_class     = var.db_instance_class
  engine              = aws_rds_cluster.morphos.engine
  engine_version      = aws_rds_cluster.morphos.engine_version

  tags = {
    Name = "morphos-db-instance-${count.index + 1}"
  }
}

resource "aws_db_subnet_group" "morphos" {
  name       = "morphos-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.public.id]
}

# ============================================================================
# ElastiCache Redis
# ============================================================================

resource "aws_elasticache_cluster" "morphos" {
  cluster_id           = "morphos-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "morphos-redis"
  }
}

# ============================================================================
# Security Groups
# ============================================================================

resource "aws_security_group" "db" {
  name   = "morphos-db-sg"
  vpc_id = aws_vpc.morphos.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "morphos-db-sg"
  }
}

resource "aws_security_group" "redis" {
  name   = "morphos-redis-sg"
  vpc_id = aws_vpc.morphos.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "morphos-redis-sg"
  }
}

# ============================================================================
# CloudWatch Logs
# ============================================================================

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/morphos"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "morphos-ecs-logs"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "ecs_cluster_name" {
  value = aws_ecs_cluster.morphos.name
}

output "rds_endpoint" {
  value = aws_rds_cluster.morphos.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.morphos.cache_nodes[0].address
}
