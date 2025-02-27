variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "The name of the project for resource naming and tagging"
  type        = string
  
  validation {
    condition     = length(var.project_name) > 0
    error_message = "Project name cannot be empty."
  }
}

variable "versioning_enabled" {
  description = "Whether to enable versioning for the static assets bucket"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "List of origins allowed to make CORS requests to the static assets bucket"
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "Number of days to retain logs in the logs bucket"
  type        = number
  default     = 90
  
  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 365
    error_message = "Log retention days must be between 1 and 365."
  }
}