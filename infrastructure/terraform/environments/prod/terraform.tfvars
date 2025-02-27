# General configuration
environment = "prod"
aws_region = "us-east-1"
project = "interaction-management"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
default_tags = {
  Environment = "production"
  Project = "InteractionManagement"
  ManagedBy = "Terraform"
}

# Networking configuration
vpc_cidr = "10.0.0.0/16"
public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_app_subnets = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
private_data_subnets = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
enable_nat_gateway = true
single_nat_gateway = false
enable_vpn_gateway = false

# Database configuration
db_engine = "postgres"
db_engine_version = "15.3"
db_instance_class = "db.t3.medium"
db_allocated_storage = 100
db_max_allocated_storage = 500
db_name = "interactions"
db_multi_az = true
db_backup_retention_period = 30
db_deletion_protection = true
db_skip_final_snapshot = false

# ElastiCache configuration
elasticache_engine = "redis"
elasticache_engine_version = "7.0"
elasticache_node_type = "cache.t3.small"
elasticache_parameter_group_name = "default.redis7.0"
elasticache_num_cache_nodes = 2
elasticache_automatic_failover_enabled = true

# ECS configuration
ecs_cluster_name = "interaction-management-prod"
ecs_capacity_providers = ["FARGATE"]

# Frontend container configuration
frontend_container_name = "frontend"
frontend_container_port = 80
frontend_container_image = "interaction-management-frontend:latest"
frontend_container_cpu = 1024
frontend_container_memory = 2048
frontend_desired_count = 4
frontend_max_count = 6
frontend_min_count = 2

# Backend container configuration
backend_container_name = "backend"
backend_container_port = 5000
backend_container_image = "interaction-management-backend:latest"
backend_container_cpu = 1024
backend_container_memory = 2048
backend_desired_count = 4
backend_max_count = 6
backend_min_count = 2

# IAM roles
ecs_task_execution_role_name = "interaction-management-task-execution-role"
ecs_task_role_name = "interaction-management-task-role"

# Auto-scaling configuration
auto_scaling_cooldown = 300
cpu_utilization_threshold = 70

# Load balancer configuration
lb_name = "interaction-management-prod"
lb_internal = false
lb_type = "application"
lb_health_check_path = "/health"
lb_health_check_interval = 30
lb_health_check_timeout = 5
lb_health_check_healthy_threshold = 2
lb_health_check_unhealthy_threshold = 2
lb_listener_port = 443
lb_listener_protocol = "HTTPS"
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abcd1234-ef56-gh78-ij90-klmnopqrstuv"

# S3 and CloudFront configuration
s3_bucket_name = "interaction-management-assets-prod"
s3_force_destroy = false
cloudfront_enabled = true
cloudfront_price_class = "PriceClass_100"
cloudfront_default_ttl = 86400
cloudfront_min_ttl = 0
cloudfront_max_ttl = 31536000
cloudfront_allowed_methods = ["GET", "HEAD", "OPTIONS"]

# DNS configuration
route53_zone_name = "example.com"
domain_name = "interactions.example.com"
create_dns_record = true

# Security configuration
enable_waf = true
waf_default_action = "allow"

# Monitoring and alerting
enable_cloudwatch_alarms = true
alarm_actions = ["arn:aws:sns:us-east-1:123456789012:interaction-management-alerts"]
ok_actions = ["arn:aws:sns:us-east-1:123456789012:interaction-management-alerts"]
create_log_groups = true
log_retention_in_days = 90