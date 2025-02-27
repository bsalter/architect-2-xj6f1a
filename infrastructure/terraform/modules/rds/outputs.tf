# RDS PostgreSQL Module Outputs
# These outputs expose database connection and configuration details for the Interaction Management System

# Basic instance information
output "db_instance_id" {
  description = "The identifier of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgresql.id
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance in format 'hostname:port'"
  value       = aws_db_instance.postgresql.endpoint
}

output "db_instance_address" {
  description = "The hostname of the RDS instance for connection string building"
  value       = aws_db_instance.postgresql.address
}

output "db_instance_port" {
  description = "The port on which the PostgreSQL database accepts connections"
  value       = aws_db_instance.postgresql.port
}

output "db_instance_name" {
  description = "The name of the PostgreSQL database created within the RDS instance"
  value       = aws_db_instance.postgresql.name
}

# Security and networking
output "db_security_group_id" {
  description = "The security group ID controlling network access to the RDS instance"
  value       = aws_security_group.postgresql.id
}

output "db_subnet_group_name" {
  description = "The name of the DB subnet group defining which subnets the database can use"
  value       = aws_db_subnet_group.postgresql.name
}

output "db_parameter_group_name" {
  description = "The name of the DB parameter group with PostgreSQL configuration settings"
  value       = aws_db_parameter_group.postgresql.name
}

# Authentication details
output "db_username" {
  description = "The master username for the PostgreSQL database"
  value       = aws_db_instance.postgresql.username
  sensitive   = true
}

output "db_password_secret_arn" {
  description = "The ARN of the AWS Secrets Manager secret storing the database password"
  value       = aws_secretsmanager_secret.db_password.arn
}

# Connection string for application configuration
output "db_connection_string" {
  description = "The PostgreSQL connection string without credentials for SQLAlchemy configuration"
  value       = "postgresql://${aws_db_instance.postgresql.address}:${aws_db_instance.postgresql.port}/${aws_db_instance.postgresql.name}"
}

# High availability and backup configuration
output "db_multi_az" {
  description = "Whether the RDS instance is configured for Multi-AZ deployment for high availability"
  value       = aws_db_instance.postgresql.multi_az
}

output "db_backup_retention_period" {
  description = "The number of days for which automated backups are retained"
  value       = aws_db_instance.postgresql.backup_retention_period
}

output "db_backup_window" {
  description = "The daily time range during which automated backups are created"
  value       = aws_db_instance.postgresql.backup_window
}

output "db_maintenance_window" {
  description = "The weekly time range during which system maintenance can occur"
  value       = aws_db_instance.postgresql.maintenance_window
}

# Read replica information
output "db_read_replica_endpoints" {
  description = "List of endpoints for read replicas to be used for search and finder operations"
  value       = length(aws_db_instance.read_replica) > 0 ? [for replica in aws_db_instance.read_replica : replica.endpoint] : []
}

output "db_read_replica_ids" {
  description = "List of identifiers for the read replica instances"
  value       = length(aws_db_instance.read_replica) > 0 ? [for replica in aws_db_instance.read_replica : replica.id] : []
}

# Monitoring and logging
output "db_monitoring_role_arn" {
  description = "The ARN of the IAM role used for enhanced monitoring of the RDS instance"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

output "db_cloudwatch_log_groups" {
  description = "List of CloudWatch Log Groups where database logs are published"
  value       = [for log_type in aws_cloudwatch_log_group.postgresql : log_type.name]
}

output "db_performance_insights_enabled" {
  description = "Whether Performance Insights is enabled for database performance monitoring"
  value       = aws_db_instance.postgresql.performance_insights_enabled
}

# Recovery options
output "db_latest_restorable_time" {
  description = "The latest time to which the database can be restored with point-in-time recovery"
  value       = aws_db_instance.postgresql.latest_restorable_time
}

output "db_snapshot_identifier" {
  description = "The identifier of the latest DB snapshot created for backup purposes"
  value       = length(aws_db_snapshot.postgresql_backup) > 0 ? aws_db_snapshot.postgresql_backup[0].id : null
}

# Connection and performance metrics
output "db_max_connections" {
  description = "The maximum number of database connections allowed, useful for configuring PgBouncer"
  value       = local.max_connections
}

# Storage information
output "db_allocated_storage" {
  description = "The amount of storage allocated to the database instance in gibibytes"
  value       = aws_db_instance.postgresql.allocated_storage
}

output "db_storage_type" {
  description = "The storage type used by the database instance (e.g., gp2, io1)"
  value       = aws_db_instance.postgresql.storage_type
}

# Version information
output "db_engine_version" {
  description = "The version of PostgreSQL used by the database instance"
  value       = aws_db_instance.postgresql.engine_version
}