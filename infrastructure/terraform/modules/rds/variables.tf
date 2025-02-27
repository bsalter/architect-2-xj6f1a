variable "identifier" {
  description = "The identifier for the RDS instance"
  type        = string
}

variable "allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 100 # Based on the infrastructure requirements (100 GB for production)
}

variable "max_allocated_storage" {
  description = "The upper limit to which Amazon RDS can automatically scale the storage of the DB instance"
  type        = number
  default     = 500 # Allow scaling up to 500 GB
}

variable "storage_type" {
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD)"
  type        = string
  default     = "gp3" # General Purpose SSD (recommended for production workloads)
}

variable "engine" {
  description = "The database engine to use"
  type        = string
  default     = "postgres" # PostgreSQL as specified in the technical requirements
}

variable "engine_version" {
  description = "The engine version to use"
  type        = string
  default     = "15.3" # As specified in the technical requirements
}

variable "instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.medium" # As specified in the infrastructure requirements (2 vCPU, 4 GB)
}

variable "db_name" {
  description = "The name of the database to create when the RDS instance is created"
  type        = string
  default     = "interactions" # Name aligned with the application's purpose
}

variable "username" {
  description = "Username for the master DB user"
  type        = string
}

variable "password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true # Mark as sensitive to prevent accidental exposure
}

variable "port" {
  description = "The port on which the DB accepts connections"
  type        = number
  default     = 5432 # Default PostgreSQL port
}

variable "vpc_id" {
  description = "The VPC ID where the RDS instance will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "A list of VPC subnet IDs to place the RDS instance in (should be private subnets)"
  type        = list(string)
}

variable "multi_az" {
  description = "Specifies if the RDS instance is multi-AZ"
  type        = bool
  default     = true # Enable Multi-AZ as specified in the infrastructure requirements
}

variable "backup_retention_period" {
  description = "The days to retain backups for"
  type        = number
  default     = 7 # At least 7 days retention for backups
}

variable "backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-05:00" # Early morning window for backups
}

variable "maintenance_window" {
  description = "The window to perform maintenance in"
  type        = string
  default     = "sun:05:00-sun:07:00" # Early Sunday morning for maintenance
}

variable "skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted"
  type        = bool
  default     = false # Don't skip final snapshot for production
}

variable "final_snapshot_identifier" {
  description = "The name of your final DB snapshot when this DB instance is deleted"
  type        = string
  default     = null
}

variable "deletion_protection" {
  description = "If the DB instance should have deletion protection enabled"
  type        = bool
  default     = true # Enable deletion protection for production
}

variable "parameter_group_name" {
  description = "Name of the DB parameter group to associate with this instance"
  type        = string
  default     = null
}

variable "option_group_name" {
  description = "Name of the DB option group to associate with this instance"
  type        = string
  default     = null
}

variable "publicly_accessible" {
  description = "Bool to control if instance is publicly accessible"
  type        = bool
  default     = false # Database should not be publicly accessible
}

variable "monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected"
  type        = number
  default     = 60 # Collect metrics every 60 seconds
}

variable "performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled"
  type        = bool
  default     = true # Enable performance insights for monitoring query performance
}

variable "performance_insights_retention_period" {
  description = "The amount of time in days to retain Performance Insights data"
  type        = number
  default     = 7 # Retain performance insights data for 7 days
}

variable "enabled_cloudwatch_logs_exports" {
  description = "List of log types to enable for exporting to CloudWatch logs"
  type        = list(string)
  default     = ["postgresql", "upgrade"] # Export PostgreSQL logs to CloudWatch
}

variable "auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically during maintenance window"
  type        = bool
  default     = true # Enable automatic minor version upgrades
}

variable "apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window"
  type        = bool
  default     = false # Apply changes during maintenance window by default
}

variable "storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  type        = bool
  default     = true # Enable storage encryption for data protection
}

variable "kms_key_id" {
  description = "The ARN for the KMS encryption key"
  type        = string
  default     = null # Use default AWS KMS key if not specified
}

variable "tags" {
  description = "A map of tags to assign to all resources"
  type        = map(string)
  default     = {}
}