# outputs.tf
# 
# This file defines the outputs from the Terraform infrastructure deployment
# for the Interaction Management System. These outputs expose key resource
# information such as endpoint URLs, resource identifiers, and connection
# details that are needed for application deployment, CI/CD integration,
# and operational monitoring.

# Network Infrastructure
output "vpc_id" {
  description = "ID of the VPC containing all application resources"
  value       = aws_vpc.main.id
}

output "public_subnets" {
  description = "List of public subnet IDs used for load balancers and public-facing components"
  value       = aws_subnet.public[*].id
}

output "private_subnets" {
  description = "List of private subnet IDs used for application and data tier resources"
  value       = aws_subnet.private[*].id
}

# Application Access Points
output "load_balancer_dns" {
  description = "DNS name of the application load balancer for API access"
  value       = aws_lb.api.dns_name
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name for accessing static frontend assets"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

# Database Resources
output "database_endpoint" {
  description = "PostgreSQL RDS database endpoint for application connections"
  value       = aws_db_instance.postgres.endpoint
}

output "database_name" {
  description = "Name of the application database within the RDS instance"
  value       = aws_db_instance.postgres.db_name
}

# Cache Resources
output "elasticache_endpoint" {
  description = "Redis ElastiCache endpoint for application cache connections"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

# Container Orchestration
output "ecs_cluster_name" {
  description = "Name of the ECS cluster hosting application containers"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service running application containers"
  value       = aws_ecs_service.api.name
}

# Storage Resources
output "s3_bucket_name" {
  description = "Name of the S3 bucket storing static assets (frontend resources)"
  value       = aws_s3_bucket.frontend.bucket
}

# Environment Information
output "environment" {
  description = "Deployment environment identifier (development, staging, or production)"
  value       = var.environment
}