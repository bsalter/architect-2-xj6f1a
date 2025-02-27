# Defines AWS security groups for controlling network access between different tiers of the Interaction Management System
# AWS provider version ~> 4.0 should be configured elsewhere in the project

variable "project_name" {
  type        = string
  description = "Name of the project, used for resource naming"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where security groups will be created"
}

variable "container_port" {
  type        = number
  description = "Port number that the container application listens on"
}

variable "admin_cidr_blocks" {
  type        = list(string)
  description = "List of CIDR blocks allowed to access management resources"
  default     = []
}

# Security group for the Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for the Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from Internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from Internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Security group for the Web/API services
resource "aws_security_group" "web_api" {
  name        = "${var.project_name}-${var.environment}-web-api-sg"
  description = "Security group for the Web/API services"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Container port access from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-web-api-sg"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Security group for the PostgreSQL database
resource "aws_security_group" "database" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "Security group for the PostgreSQL database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_api.id]
    description     = "PostgreSQL access from Web/API services"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-sg"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Security group for the Redis cache
resource "aws_security_group" "cache" {
  name        = "${var.project_name}-${var.environment}-cache-sg"
  description = "Security group for the Redis cache"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.web_api.id]
    description     = "Redis access from Web/API services"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cache-sg"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Security group for management access (bastion hosts)
# Only created if admin_cidr_blocks is not empty
resource "aws_security_group" "management" {
  count       = length(var.admin_cidr_blocks) > 0 ? 1 : 0
  name        = "${var.project_name}-${var.environment}-mgmt-sg"
  description = "Security group for management access"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
    description = "SSH access from admin IPs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-mgmt-sg"
    Environment = var.environment
    Terraform   = "true"
  }
}

# Outputs - expose security group IDs for use in other modules
output "alb_security_group_id" {
  value       = aws_security_group.alb.id
  description = "ID of the ALB security group"
}

output "web_api_security_group_id" {
  value       = aws_security_group.web_api.id
  description = "ID of the Web/API security group"
}

output "database_security_group_id" {
  value       = aws_security_group.database.id
  description = "ID of the database security group"
}

output "cache_security_group_id" {
  value       = aws_security_group.cache.id
  description = "ID of the cache security group"
}

output "management_security_group_id" {
  value       = length(var.admin_cidr_blocks) > 0 ? aws_security_group.management[0].id : null
  description = "ID of the management security group (if created)"
}