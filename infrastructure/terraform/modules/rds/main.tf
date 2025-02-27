# RDS module for PostgreSQL database provisioning for the Interaction Management System
# AWS Provider version: hashicorp/aws ~> 4.0

# Local values for naming conventions and computed values
locals {
  # Naming conventions using project and environment
  name_prefix = var.name_prefix != "" ? var.name_prefix : "${var.project}-${var.environment}"
  
  # Optimized PostgreSQL parameters for Interaction Management System
  postgres_parameters = {
    "log_connections"           = "1"
    "log_disconnections"        = "1"
    "log_lock_waits"            = "1"
    "log_min_duration_statement" = "500"  # Log queries taking more than 500ms
    "log_statement"             = "ddl"   # Log all data definition statements
    "shared_buffers"            = "{DBInstanceClassMemory/4}"  # 25% of instance memory
    "work_mem"                  = "16384" # 16MB for complex operations
    "max_connections"           = var.environment == "production" ? "200" : "100"
    "random_page_cost"          = "1.1"   # Optimized for SSD storage
  }

  # Default instance settings based on environment
  instance_class = var.instance_class != "" ? var.instance_class : (
    var.environment == "production" ? "db.t3.medium" : "db.t3.small"
  )
  
  # Enable Multi-AZ for production by default
  multi_az = var.multi_az != null ? var.multi_az : (
    var.environment == "production" ? true : false
  )
  
  # Enable deletion protection for production by default
  deletion_protection = var.deletion_protection != null ? var.deletion_protection : (
    var.environment == "production" ? true : false
  )
  
  # Use provided password or generate a random one
  db_password = var.password != "" ? var.password : random_password.db_password[0].result
  
  # Common tags for all resources
  tags = merge(
    var.tags,
    {
      "Project"     = var.project
      "Environment" = var.environment
      "Module"      = "rds"
      "Terraform"   = "true"
    }
  )
}

#-----------------------------------------------------------
# DB Subnet Group
#-----------------------------------------------------------
resource "aws_db_subnet_group" "this" {
  name        = "${local.name_prefix}-db-subnet-group"
  description = "Subnet group for ${var.project} ${var.environment} PostgreSQL instance"
  subnet_ids  = var.subnet_ids
  tags        = local.tags
}

#-----------------------------------------------------------
# Security Group for RDS
#-----------------------------------------------------------
resource "aws_security_group" "this" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for ${var.project} ${var.environment} PostgreSQL instance"
  vpc_id      = var.vpc_id
  tags        = local.tags
}

# Ingress rule - allow access from application security group to PostgreSQL port
resource "aws_security_group_rule" "ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.app_security_group_id
  security_group_id        = aws_security_group.this.id
  description              = "Allow PostgreSQL access from application servers"
}

# Egress rule - allow all outbound traffic
resource "aws_security_group_rule" "egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
  description       = "Allow all outbound traffic"
}

#-----------------------------------------------------------
# DB Parameter Group for PostgreSQL optimization
#-----------------------------------------------------------
resource "aws_db_parameter_group" "this" {
  count = var.parameter_group_name == "" ? 1 : 0
  
  name        = "${local.name_prefix}-postgres15-params"
  family      = "postgres15"
  description = "Parameter group for ${var.project} ${var.environment} PostgreSQL instance"
  
  dynamic "parameter" {
    for_each = local.postgres_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }
  
  tags = local.tags
}

#-----------------------------------------------------------
# Random Password Generation (when not explicitly provided)
#-----------------------------------------------------------
resource "random_password" "db_password" {
  count = var.password == "" ? 1 : 0
  
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

#-----------------------------------------------------------
# AWS Secrets Manager for DB Credentials
#-----------------------------------------------------------
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.name_prefix}-db-credentials"
  description = "PostgreSQL credentials for ${var.project} ${var.environment}"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.username
    password = local.db_password
    engine   = "postgres"
    host     = aws_db_instance.this.address
    port     = aws_db_instance.this.port
    dbname   = var.db_name
  })
  
  # Use depends_on to ensure the DB instance is created first
  depends_on = [aws_db_instance.this]
}

#-----------------------------------------------------------
# RDS PostgreSQL Instance
#-----------------------------------------------------------
resource "aws_db_instance" "this" {
  identifier = "${local.name_prefix}-postgres"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.3"  # Specific version required by the Interaction Management System
  
  # Instance configuration
  instance_class = local.instance_class
  
  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id            = var.kms_key_id
  
  # Database configuration
  db_name  = var.db_name
  username = var.username
  password = local.db_password
  
  # Network & security configuration
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  publicly_accessible    = false
  multi_az               = local.multi_az
  
  # Parameter & option groups
  parameter_group_name = var.parameter_group_name != "" ? var.parameter_group_name : aws_db_parameter_group.this[0].name
  
  # Backup & maintenance configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  copy_tags_to_snapshot   = true
  
  # Deletion protection
  deletion_protection = local.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.name_prefix}-postgres-final-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  
  # Monitoring & logging configuration
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn             = var.monitoring_role_arn
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports
  
  # Update configuration
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately          = var.apply_immediately
  
  # Tags
  tags = local.tags
}

#-----------------------------------------------------------
# CloudWatch Alarms for Database Monitoring
#-----------------------------------------------------------

# CPU Utilization High Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-database-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS database CPU utilization"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
}

# Free Storage Space Low Alarm
resource "aws_cloudwatch_metric_alarm" "free_storage_space_low" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-database-free-storage-space-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.allocated_storage * 1024 * 1024 * 1024 * 0.1 # 10% of allocated storage
  alarm_description   = "This metric monitors RDS database free storage space"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
}

# Freeable Memory Low Alarm
resource "aws_cloudwatch_metric_alarm" "freeable_memory_low" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-database-freeable-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 256 * 1024 * 1024 # 256MB
  alarm_description   = "This metric monitors RDS database freeable memory"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
}

# Database Connections High Alarm
resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = (var.environment == "production" ? 160 : 80) # 80% of max connections
  alarm_description   = "This metric monitors RDS database connection count"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
}

#-----------------------------------------------------------
# Outputs
#-----------------------------------------------------------
output "db_instance" {
  description = "The RDS instance"
  value       = aws_db_instance.this
}

output "db_instance_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.this.address
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.this.port
}

output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.this.id
}

output "db_subnet_group_id" {
  description = "The DB subnet group ID"
  value       = aws_db_subnet_group.this.id
}

output "security_group_id" {
  description = "The security group ID"
  value       = aws_security_group.this.id
}

output "db_credentials_secret_arn" {
  description = "The ARN of the Secrets Manager secret storing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}