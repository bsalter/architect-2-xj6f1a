# Environment Configuration
environment         = "staging"
aws_region          = "us-east-1"
project_name        = "interaction-management"

# Network Configuration
vpc_cidr                 = "10.1.0.0/16"
public_subnet_cidrs      = ["10.1.0.0/24", "10.1.1.0/24", "10.1.2.0/24"]
private_app_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
private_data_subnet_cidrs = ["10.1.20.0/24", "10.1.21.0/24", "10.1.22.0/24"]
availability_zones       = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database Configuration
db_instance_type          = "db.t3.medium"
db_storage_size           = 50
db_multi_az               = true
db_backup_retention_period = 7

# Cache Configuration
cache_node_type           = "cache.t3.small"
cache_num_nodes           = 2

# Container/ECS Configuration
container_cpu             = 1024
container_memory          = 2048
min_capacity              = 2
max_capacity              = 4

# Security and Domain Configuration
enable_https              = true
domain_name               = "staging-interactions.example.com"
certificate_arn           = "arn:aws:acm:us-east-1:123456789012:certificate/abcd1234-ef56-gh78-ij90-klmnopqrstuv"

# Static Assets and CDN
static_assets_bucket      = "staging-interactions-assets"
enable_cloudfront         = true
enable_waf                = true

# Resource Tagging
tags = {
  Environment = "staging"
  Project = "InteractionManagement"
  ManagedBy = "Terraform"
}