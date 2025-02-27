# Project and Environment Variables
variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "interaction-management"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "List of availability zones to use for multi-AZ deployment"
  type        = list(string)
}

variable "default_tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    "Project"   = "interaction-management"
    "ManagedBy" = "terraform"
  }
}

# VPC and Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_app_subnets" {
  description = "List of private subnet CIDR blocks for application tier"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "private_data_subnets" {
  description = "List of private subnet CIDR blocks for data tier"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets outbound traffic"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets (dev/staging environments)"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway for VPC"
  type        = bool
  default     = false
}

# Database Configuration
variable "db_engine" {
  description = "Database engine type"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.3"
}

variable "db_instance_class" {
  description = "Database instance type"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for the database"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage in GB for storage autoscaling"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "interactions"
}

variable "db_username" {
  description = "Username for the database (sensitive value, should be provided through secure means)"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database (sensitive value, should be provided through secure means)"
  type        = string
  sensitive   = true
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for database high availability"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for the database"
  type        = bool
  default     = true
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot when the database is deleted"
  type        = bool
  default     = false
}

variable "db_parameter_group_name" {
  description = "Name of the DB parameter group to associate with the database instance"
  type        = string
}

# ElastiCache Configuration
variable "elasticache_engine" {
  description = "ElastiCache engine type"
  type        = string
  default     = "redis"
}

variable "elasticache_engine_version" {
  description = "ElastiCache engine version"
  type        = string
  default     = "7.0"
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.small"
}

variable "elasticache_parameter_group_name" {
  description = "ElastiCache parameter group name"
  type        = string
  default     = "default.redis7.0"
}

variable "elasticache_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "elasticache_automatic_failover_enabled" {
  description = "Enable automatic failover for ElastiCache (only applicable for Multi-AZ)"
  type        = bool
  default     = false
}

# ECS Configuration
variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_capacity_providers" {
  description = "List of capacity providers for the ECS cluster"
  type        = list(string)
  default     = ["FARGATE", "FARGATE_SPOT"]
}

variable "frontend_container_name" {
  description = "Name of the frontend container"
  type        = string
  default     = "frontend"
}

variable "frontend_container_port" {
  description = "Port the frontend container listens on"
  type        = number
  default     = 80
}

variable "frontend_container_image" {
  description = "Docker image for the frontend container"
  type        = string
}

variable "frontend_container_cpu" {
  description = "CPU units for the frontend container (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "frontend_container_memory" {
  description = "Memory for the frontend container in MiB"
  type        = number
  default     = 512
}

variable "backend_container_name" {
  description = "Name of the backend container"
  type        = string
  default     = "backend"
}

variable "backend_container_port" {
  description = "Port the backend container listens on"
  type        = number
  default     = 5000
}

variable "backend_container_image" {
  description = "Docker image for the backend container"
  type        = string
}

variable "backend_container_cpu" {
  description = "CPU units for the backend container (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_container_memory" {
  description = "Memory for the backend container in MiB"
  type        = number
  default     = 1024
}

variable "ecs_task_execution_role_name" {
  description = "Name of the ECS task execution role"
  type        = string
}

variable "ecs_task_role_name" {
  description = "Name of the ECS task role"
  type        = string
}

# Auto-scaling Configuration
variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 2
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 2
}

variable "frontend_max_count" {
  description = "Maximum number of frontend tasks with auto-scaling"
  type        = number
  default     = 6
}

variable "backend_max_count" {
  description = "Maximum number of backend tasks with auto-scaling"
  type        = number
  default     = 6
}

variable "frontend_min_count" {
  description = "Minimum number of frontend tasks with auto-scaling"
  type        = number
  default     = 2
}

variable "backend_min_count" {
  description = "Minimum number of backend tasks with auto-scaling"
  type        = number
  default     = 2
}

variable "auto_scaling_cooldown" {
  description = "Cooldown period in seconds for auto-scaling"
  type        = number
  default     = 300
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization threshold percentage for scaling out"
  type        = number
  default     = 70
}

# Load Balancer Configuration
variable "lb_name" {
  description = "Name of the load balancer"
  type        = string
}

variable "lb_internal" {
  description = "Whether the load balancer is internal or internet-facing"
  type        = bool
  default     = false
}

variable "lb_type" {
  description = "Type of load balancer (application or network)"
  type        = string
  default     = "application"
}

variable "lb_health_check_path" {
  description = "Path for the health check endpoint"
  type        = string
  default     = "/health"
}

variable "lb_health_check_interval" {
  description = "Interval between health checks in seconds"
  type        = number
  default     = 30
}

variable "lb_health_check_timeout" {
  description = "Timeout for health checks in seconds"
  type        = number
  default     = 5
}

variable "lb_health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks required"
  type        = number
  default     = 2
}

variable "lb_health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks required"
  type        = number
  default     = 2
}

variable "lb_listener_port" {
  description = "Port for the load balancer listener"
  type        = number
  default     = 443
}

variable "lb_listener_protocol" {
  description = "Protocol for the load balancer listener"
  type        = string
  default     = "HTTPS"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS"
  type        = string
}

# S3 and CloudFront Configuration
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  type        = string
}

variable "s3_force_destroy" {
  description = "Allow the S3 bucket to be destroyed even if it contains objects"
  type        = bool
  default     = false
}

variable "cloudfront_enabled" {
  description = "Enable CloudFront distribution for static assets"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_100, PriceClass_200, PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache in seconds (1 day)"
  type        = number
  default     = 86400
}

variable "cloudfront_min_ttl" {
  description = "Minimum TTL for CloudFront cache in seconds"
  type        = number
  default     = 0
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache in seconds (1 year)"
  type        = number
  default     = 31536000
}

variable "cloudfront_allowed_methods" {
  description = "HTTP methods that CloudFront processes and forwards to the origin"
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
}

# DNS Configuration
variable "route53_zone_name" {
  description = "Route53 hosted zone name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "create_dns_record" {
  description = "Create DNS records in Route53"
  type        = bool
  default     = true
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF for the Application Load Balancer"
  type        = bool
  default     = true
}

variable "waf_default_action" {
  description = "Default action for WAF (allow or block)"
  type        = string
  default     = "allow"
}

# Monitoring Configuration
variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for monitoring"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when an alarm transitions (e.g., SNS topic ARN)"
  type        = list(string)
  default     = []
}

variable "ok_actions" {
  description = "List of ARNs to notify when an alarm transitions to OK state"
  type        = list(string)
  default     = []
}

variable "create_log_groups" {
  description = "Create CloudWatch log groups for application logging"
  type        = bool
  default     = true
}

variable "log_retention_in_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 30
}