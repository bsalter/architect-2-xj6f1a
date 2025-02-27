# General configuration variables
variable "project_name" {
  description = "Name of the project to use in resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

# Network configuration variables
variable "vpc_id" {
  description = "ID of the VPC where the load balancer will be deployed"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet IDs for the load balancer, spanning multiple availability zones"
  type        = list(string)
}

variable "internal" {
  description = "Whether the load balancer is internal or internet-facing"
  type        = bool
  default     = false
}

# Load balancer configuration variables
variable "enable_deletion_protection" {
  description = "Whether to enable deletion protection for the load balancer"
  type        = bool
  default     = true
}

variable "access_logs_enabled" {
  description = "Whether to enable access logs for the load balancer"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket name for storing load balancer access logs"
  type        = string
  default     = null
}

variable "access_logs_prefix" {
  description = "S3 bucket prefix for load balancer access logs"
  type        = string
  default     = "logs/alb"
}

variable "idle_timeout" {
  description = "Idle timeout value in seconds for the load balancer connections"
  type        = number
  default     = 60
}

# SSL/TLS configuration variables
variable "enable_https" {
  description = "Whether to enable HTTPS listener on the load balancer"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS listener"
  type        = string
  default     = null
}

variable "ssl_policy" {
  description = "SSL policy to use for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

# Security configuration variables
variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the load balancer"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Target group configuration variables
variable "frontend_port" {
  description = "Port for the frontend target group"
  type        = number
  default     = 3000
}

variable "backend_port" {
  description = "Port for the backend target group"
  type        = number
  default     = 5000
}

# Health check configuration variables
variable "frontend_health_check_path" {
  description = "Path for frontend health checks"
  type        = string
  default     = "/health"
}

variable "backend_health_check_path" {
  description = "Path for backend health checks"
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Interval between health checks in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Timeout for health checks in seconds"
  type        = number
  default     = 5
}

variable "health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks to mark a target as healthy"
  type        = number
  default     = 3
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks to mark a target as unhealthy"
  type        = number
  default     = 3
}

variable "deregistration_delay" {
  description = "Time in seconds to wait before deregistering a target"
  type        = number
  default     = 300
}

# Routing configuration variables
variable "api_path_pattern" {
  description = "Path pattern for routing API requests to the backend service"
  type        = string
  default     = "/api/*"
}

# WAF configuration variables
variable "waf_enabled" {
  description = "Whether to enable WAF for the load balancer"
  type        = bool
  default     = false
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL to associate with the load balancer"
  type        = string
  default     = null
}

# Additional configuration variables
variable "tags" {
  description = "Additional tags to add to all resources"
  type        = map(string)
  default     = {}
}