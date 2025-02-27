# General Settings
variable "project_name" {
  description = "Name of the project used for resource naming and tagging"
  type        = string
  default     = "interaction-mgmt"
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod) for resource naming and configuration"
  type        = string
}

# Network Configuration
variable "vpc_id" {
  description = "ID of the VPC where ECS resources will be deployed"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs where ECS services will be deployed"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the security group attached to the Application Load Balancer"
  type        = string
}

# Load Balancer Configuration
variable "frontend_target_group_arn" {
  description = "ARN of the frontend target group for the Application Load Balancer"
  type        = string
}

variable "backend_target_group_arn" {
  description = "ARN of the backend target group for the Application Load Balancer"
  type        = string
}

# Container Images
variable "frontend_container_image" {
  description = "Docker image URI for the frontend container"
  type        = string
  default     = ""
}

variable "backend_container_image" {
  description = "Docker image URI for the backend container"
  type        = string
  default     = ""
}

# Container Configuration
variable "frontend_container_port" {
  description = "Port on which the frontend container listens"
  type        = number
  default     = 80
}

variable "backend_container_port" {
  description = "Port on which the backend container listens"
  type        = number
  default     = 5000
}

variable "environment_variables" {
  description = "Map of environment variables for the containers"
  type        = map(string)
  default     = {}
}

# Resource Allocation
variable "frontend_cpu" {
  description = "CPU units for the frontend container (1024 = 1 vCPU)"
  type        = number
  default     = 512 # 0.5 vCPU
}

variable "frontend_memory" {
  description = "Memory for the frontend container in MiB"
  type        = number
  default     = 1024 # 1 GB
}

variable "backend_cpu" {
  description = "CPU units for the backend container (1024 = 1 vCPU)"
  type        = number
  default     = 1024 # 1 vCPU
}

variable "backend_memory" {
  description = "Memory for the backend container in MiB"
  type        = number
  default     = 2048 # 2 GB
}

# Service Scaling
variable "frontend_desired_count" {
  description = "Number of frontend tasks to run"
  type        = number
  default     = 2
}

variable "backend_desired_count" {
  description = "Number of backend tasks to run"
  type        = number
  default     = 2
}

variable "frontend_min_capacity" {
  description = "Minimum number of frontend tasks for auto scaling"
  type        = number
  default     = 2
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend tasks for auto scaling"
  type        = number
  default     = 6
}

variable "backend_min_capacity" {
  description = "Minimum number of backend tasks for auto scaling"
  type        = number
  default     = 2
}

variable "backend_max_capacity" {
  description = "Maximum number of backend tasks for auto scaling"
  type        = number
  default     = 6
}

variable "cpu_threshold" {
  description = "CPU utilization percentage to trigger auto scaling"
  type        = number
  default     = 70
}

variable "autoscaling_cooldown" {
  description = "Cooldown period in seconds between scaling activities"
  type        = number
  default     = 300 # 5 minutes
}

# Deployment Configuration
variable "deployment_controller_type" {
  description = "Type of deployment controller for ECS services"
  type        = string
  default     = "ECS" # Alternative: "CODE_DEPLOY" for blue/green deployments
}

# Monitoring and Logging
variable "container_insights_enabled" {
  description = "Enable CloudWatch Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "logs_retention_days" {
  description = "Number of days to retain container logs in CloudWatch"
  type        = number
  default     = 30
}

# Security and Debugging
variable "enable_execute_command" {
  description = "Enable ECS Exec functionality for tasks (for debugging)"
  type        = bool
  default     = false
}

# IAM Configuration
variable "ecs_task_execution_role_name" {
  description = "Name for the ECS task execution IAM role"
  type        = string
  default     = "" # If empty, name will be generated based on project and environment
}

variable "ecs_task_role_name" {
  description = "Name for the ECS task IAM role"
  type        = string
  default     = "" # If empty, name will be generated based on project and environment
}