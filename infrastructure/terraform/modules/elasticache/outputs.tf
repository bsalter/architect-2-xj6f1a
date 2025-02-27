output "elasticache_cluster_id" {
  description = "The identifier of the ElastiCache Redis cluster for reference in other resources"
  value       = aws_elasticache_replication_group.redis.id
}

output "elasticache_primary_endpoint" {
  description = "The connection endpoint address of the Redis primary node for application connections"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "elasticache_reader_endpoint" {
  description = "The reader endpoint for the Redis cluster when using a replication group for read operations"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "elasticache_port" {
  description = "The port number on which the Redis cluster accepts connections (default: 6379)"
  value       = aws_elasticache_replication_group.redis.port
}

output "elasticache_engine_version" {
  description = "The Redis engine version used by the ElastiCache cluster (7.0.12)"
  value       = aws_elasticache_replication_group.redis.engine_version
}

output "elasticache_node_type" {
  description = "The node type used for the ElastiCache cluster (cache.t3.small)"
  value       = aws_elasticache_replication_group.redis.node_type
}

output "elasticache_num_cache_nodes" {
  description = "The number of cache nodes in the ElastiCache cluster"
  value       = aws_elasticache_replication_group.redis.number_cache_clusters
}

output "elasticache_security_group_id" {
  description = "The ID of the security group associated with the ElastiCache cluster"
  value       = aws_security_group.redis.id
}

output "elasticache_subnet_group_name" {
  description = "The name of the subnet group where the ElastiCache cluster is deployed"
  value       = aws_elasticache_subnet_group.redis.name
}

output "elasticache_parameter_group_name" {
  description = "The name of the parameter group used by the ElastiCache cluster"
  value       = aws_elasticache_parameter_group.redis.name
}

output "elasticache_multi_az_enabled" {
  description = "Indicates whether the ElastiCache cluster is configured for Multi-AZ deployment"
  value       = aws_elasticache_replication_group.redis.multi_az_enabled
}

output "elasticache_automatic_failover_enabled" {
  description = "Indicates whether automatic failover is enabled for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.automatic_failover_enabled
}

output "elasticache_at_rest_encryption_enabled" {
  description = "Indicates whether encryption at rest is enabled for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.at_rest_encryption_enabled
}

output "elasticache_transit_encryption_enabled" {
  description = "Indicates whether encryption in transit is enabled for the Redis cluster"
  value       = aws_elasticache_replication_group.redis.transit_encryption_enabled
}

output "elasticache_maintenance_window" {
  description = "The weekly time range during which maintenance can occur on the ElastiCache cluster"
  value       = aws_elasticache_replication_group.redis.maintenance_window
}

output "elasticache_connection_string" {
  description = "The Redis connection string for application configuration, including host and port"
  value       = "${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
}

output "elasticache_auth_token_secret_arn" {
  description = "The ARN of the AWS Secrets Manager secret containing the Redis AUTH token, if applicable"
  value       = var.auth_token_secret_arn != "" ? var.auth_token_secret_arn : null
}