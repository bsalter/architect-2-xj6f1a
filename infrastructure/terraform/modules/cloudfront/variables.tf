# General configuration variables
variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment identifier (dev, staging, prod) to tag and differentiate CloudFront distributions"
}

variable "project_name" {
  type        = string
  description = "Name of the project for resource naming and tagging purposes"
}

# S3 origin configuration
variable "s3_origin_bucket" {
  type        = string
  description = "S3 bucket name that will serve as the origin for the CloudFront distribution"
}

variable "s3_origin_path" {
  type        = string
  default     = ""
  description = "Optional path in the S3 bucket where content is stored (e.g., 'static')"
}

# CloudFront distribution settings
variable "enabled" {
  type        = bool
  default     = true
  description = "Whether the CloudFront distribution is enabled or disabled"
}

variable "price_class" {
  type        = string
  default     = "PriceClass_100"
  description = "Price class for the CloudFront distribution (PriceClass_All, PriceClass_200, PriceClass_100)"
}

variable "default_root_object" {
  type        = string
  default     = "index.html"
  description = "Object that CloudFront returns when a viewer requests the root URL"
}

# Domain and SSL configuration
variable "aliases" {
  type        = list(string)
  default     = []
  description = "List of alternate domain names (CNAMEs) for the CloudFront distribution"
}

variable "acm_certificate_arn" {
  type        = string
  default     = null
  description = "ARN of ACM certificate to associate with the CloudFront distribution for HTTPS"
}

variable "minimum_protocol_version" {
  type        = string
  default     = "TLSv1.2_2021"
  description = "Minimum TLS version for the CloudFront distribution"
}

# Cache behavior settings
variable "default_ttl" {
  type        = number
  default     = 3600
  description = "Default time-to-live (in seconds) for CloudFront cache"
}

variable "min_ttl" {
  type        = number
  default     = 0
  description = "Minimum time-to-live (in seconds) for CloudFront cache"
}

variable "max_ttl" {
  type        = number
  default     = 86400
  description = "Maximum time-to-live (in seconds) for CloudFront cache"
}

# HTTP methods configuration
variable "allowed_methods" {
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
  description = "HTTP methods that CloudFront processes and forwards to the origin"
}

variable "cached_methods" {
  type        = list(string)
  default     = ["GET", "HEAD"]
  description = "HTTP methods for which CloudFront caches responses"
}

# Geographic restrictions
variable "geo_restriction_type" {
  type        = string
  default     = "none"
  description = "Method to use for geographic restrictions (none, whitelist, blacklist)"
}

variable "geo_restriction_locations" {
  type        = list(string)
  default     = []
  description = "List of country codes for which CloudFront either allows or blocks content"
}

# Tagging
variable "tags" {
  type        = map(string)
  default     = {}
  description = "Map of tags to assign to the CloudFront distribution"
}