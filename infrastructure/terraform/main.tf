# Terraform configuration for Interaction Management System infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Local variables for resource naming and configuration consistency
locals {
  name_prefix = "${var.project}-${var.environment}"
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# VPC Module - Creates the network infrastructure
module "vpc" {
  source = "./modules/vpc"
  
  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_app_subnets = var.private_app_subnets
  private_data_subnets = var.private_data_subnets
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
}

# Security Groups Module - Creates security groups for application components
module "security_groups" {
  source = "./modules/security_groups"
  
  project     = var.project
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# Load Balancer Module - Creates Application Load Balancer
module "load_balancer" {
  source = "./modules/load_balancer"
  
  project             = var.project
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  security_group_id   = module.security_groups.alb_security_group_id
  certificate_arn     = var.certificate_arn
  health_check_path   = var.lb_health_check_path
}

# RDS Module - Creates PostgreSQL database
module "rds" {
  source = "./modules/rds"
  
  project               = var.project
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_data_subnet_ids
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  engine_version        = var.db_engine_version
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  multi_az              = var.db_multi_az
  backup_retention_period = var.db_backup_retention_period
}

# ElastiCache Module - Creates Redis cache
module "elasticache" {
  source = "./modules/elasticache"
  
  project               = var.project
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_data_subnet_ids
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  node_type             = var.elasticache_node_type
  num_cache_nodes       = var.elasticache_num_cache_nodes
}

# ECS Module - Creates ECS cluster, tasks, and services for container orchestration
module "ecs" {
  source = "./modules/ecs"
  
  project                  = var.project
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_app_subnet_ids
  alb_security_group_id    = module.security_groups.alb_security_group_id
  frontend_target_group_arn = module.load_balancer.frontend_target_group_arn
  backend_target_group_arn  = module.load_balancer.backend_target_group_arn
  frontend_container_image  = var.frontend_container_image
  backend_container_image   = var.backend_container_image
  
  environment_variables = {
    DB_HOST        = module.rds.endpoint
    DB_SECRET_ARN  = module.rds.secret_arn
    REDIS_HOST     = module.elasticache.endpoint
    REDIS_PORT     = module.elasticache.port
    ENVIRONMENT    = var.environment
  }
}

# S3 Module - Creates S3 bucket for static assets
module "s3" {
  source = "./modules/s3"
  
  project       = var.project
  environment   = var.environment
  bucket_name   = var.s3_bucket_name
  force_destroy = var.s3_force_destroy
}

# CloudFront Module - Sets up CloudFront CDN for static asset delivery
module "cloudfront" {
  source = "./modules/cloudfront"
  
  project           = var.project
  environment       = var.environment
  s3_bucket_domain  = module.s3.bucket_domain_name
  certificate_arn   = var.certificate_arn
  domain_name       = var.domain_name
  enabled           = var.cloudfront_enabled
}

# Route53 Module - Creates DNS records for the application
module "route53" {
  source = "./modules/route53"
  
  create_dns_record      = var.create_dns_record
  zone_name              = var.route53_zone_name
  domain_name            = var.domain_name
  alb_dns_name           = module.load_balancer.dns_name
  cloudfront_domain_name = module.cloudfront.domain_name
}

# Monitoring Module - Sets up monitoring and alerting for the infrastructure
module "monitoring" {
  source = "./modules/monitoring"
  
  project               = var.project
  environment           = var.environment
  db_instance_id        = module.rds.id
  ecs_cluster_name      = module.ecs.cluster_name
  frontend_service_name = module.ecs.frontend_service_name
  backend_service_name  = module.ecs.backend_service_name
  enable_cloudwatch_alarms = var.enable_cloudwatch_alarms
  alarm_actions        = var.alarm_actions
}