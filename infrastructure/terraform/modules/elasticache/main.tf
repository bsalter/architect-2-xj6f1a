# ElastiCache Redis Module for Interaction Management System
# AWS provider version: hashicorp/aws ~> 4.0

resource "aws_elasticache_subnet_group" "this" {
  name        = "${var.name_prefix}-elasticache-subnet-group"
  description = "Subnet group for ElastiCache instances"
  subnet_ids  = var.subnet_ids
}

resource "aws_elasticache_parameter_group" "this" {
  name        = "${var.name_prefix}-redis-params"
  family      = "redis7"
  description = "ElastiCache parameter group for Redis 7.0.12"
  
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id          = "${var.name_prefix}-cache-cluster"
  description                   = "ElastiCache Redis cluster for the Interaction Management System"
  node_type                     = var.cache_node_type
  port                          = 6379
  parameter_group_name          = aws_elasticache_parameter_group.this.name
  subnet_group_name             = aws_elasticache_subnet_group.this.name
  security_group_ids            = var.security_group_ids
  engine_version                = "7.0.12"
  automatic_failover_enabled    = var.enable_multi_az
  multi_az_enabled              = var.enable_multi_az
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  num_cache_clusters            = var.num_cache_clusters
  maintenance_window            = var.maintenance_window
  snapshot_window               = var.snapshot_window
  snapshot_retention_limit      = var.snapshot_retention_limit
  notification_topic_arn        = var.notification_topic_arn
  
  tags = {
    Name        = "${var.name_prefix}-cache-cluster"
    Environment = var.environment
    Service     = "interaction-management-system"
    ManagedBy   = "terraform"
    Purpose     = "Cache frequently accessed data including user sessions and search results"
  }

  lifecycle {
    prevent_destroy = true
  }
}