# Environment and project information
environment           = "dev"
project_name          = "interaction-management"
aws_region            = "us-east-1"

# VPC and network configuration
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.3.0/24", "10.0.4.0/24"]
availability_zones    = ["us-east-1a", "us-east-1b"]

# Database configuration - RDS PostgreSQL
db_instance_class         = "db.t3.medium"  # 2 vCPU, 4 GB RAM
db_allocated_storage      = 20              # 20 GB SSD as per dev requirements
db_multi_az               = false           # Single AZ for dev environment
db_backup_retention_period = 7              # 7 days of backups

# Cache configuration - Redis ElastiCache
cache_node_type      = "cache.t3.small"     # Small instance for dev
cache_nodes          = 1                    # Single node for dev

# Container configuration - ECS/Fargate
container_cpu        = "256"                # 0.25 vCPU
container_memory     = "512"                # 0.5 GB RAM
container_desired_count = 2                 # 2 containers for dev
container_max_count  = 4                    # Scale up to 4 containers
enable_autoscaling   = true
autoscaling_cpu_threshold = 70              # Scale when CPU > 70%

# Storage configuration - S3
app_bucket_name      = "dev-interaction-management-app"

# CDN and domain configuration
enable_cdn           = true
domain_name          = "dev.example.com"
ssl_certificate_arn  = "arn:aws:acm:us-east-1:123456789012:certificate/example-dev"

# Resource tagging
tags = {
  "Environment" = "Development"
  "Project"     = "InteractionManagement"
  "Owner"       = "DevTeam"
}