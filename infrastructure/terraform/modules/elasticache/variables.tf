variable "name" {
  description = "Name for the ElastiCache Redis cluster"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where ElastiCache will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ElastiCache subnet group"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs to associate with the ElastiCache cluster"
  type        = list(string)
  default     = []
}

variable "node_type" {
  description = "ElastiCache instance type for the nodes"
  type        = string
  default     = "cache.t3.small"  # As specified in the technical requirements
}

variable "engine_version" {
  description = "Version number of the Redis engine"
  type        = string
  default     = "7.0.12"  # As specified in the technical requirements
}

variable "port" {
  description = "Port on which the Redis server accepts connections"
  type        = number
  default     = 6379
}

variable "num_cache_nodes" {
  description = "Number of cache nodes in the cluster"
  type        = number
  default     = 1
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ deployment for the ElastiCache cluster"
  type        = bool
  default     = true  # Based on high availability requirements
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover for Redis cluster"
  type        = bool
  default     = true  # Based on high availability requirements
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest for the Redis cluster"
  type        = bool
  default     = true  # Security best practice
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit for the Redis cluster"
  type        = bool
  default     = true  # Security best practice
}

variable "auth_token" {
  description = "Password for Redis AUTH (optional). If provided, transit_encryption_enabled must be true."
  type        = string
  default     = null
  sensitive   = true
}

variable "parameter_group_name" {
  description = "Name of the parameter group to associate with this cache cluster"
  type        = string
  default     = null
}

variable "snapshot_retention_limit" {
  description = "Number of days for which ElastiCache will retain automatic cache cluster snapshots"
  type        = number
  default     = 7
}

variable "apply_immediately" {
  description = "Whether changes should be applied immediately or during the next maintenance window"
  type        = bool
  default     = false
}

variable "maintenance_window" {
  description = "Weekly time range during which system maintenance can occur"
  type        = string
  default     = "sun:03:00-sun:04:00"  # Common default for maintenance window
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

variable "memory_size" {
  description = "Initial memory size for Redis in GB"
  type        = number
  default     = 2  # Based on the technical specification's scaling considerations
}