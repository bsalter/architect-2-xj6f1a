# nacls.tf
# Defines AWS Network Access Control Lists (NACLs) for controlling traffic at the subnet level
# within the Interaction Management System VPC. Implements stateless firewall rules that add
# an additional layer of security beyond security groups.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Local values for common NACL rule parameters
locals {
  # Common CIDR blocks
  all_traffic_cidr = "0.0.0.0/0"

  # Common port ranges
  http_port        = 80
  https_port       = 443
  postgresql_port  = 5432
  redis_port       = 6379
  app_port         = 8080
  ephemeral_start  = 1024
  ephemeral_end    = 65535

  # Rule numbering scheme
  rule_base_ingress = 100
  rule_base_egress  = 100
}

# Network ACL for public subnets controlling traffic to/from internet-facing resources
resource "aws_network_acl" "public_nacl" {
  vpc_id     = var.vpc_id
  subnet_ids = var.public_subnet_ids

  tags = {
    Name        = "${var.environment}-public-nacl"
    Environment = var.environment
    Project     = "interaction-management-system"
  }
}

# NACL rule that allows HTTP traffic from anywhere to public subnets
resource "aws_network_acl_rule" "public_ingress_http" {
  network_acl_id = aws_network_acl.public_nacl.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.all_traffic_cidr
  from_port      = local.http_port
  to_port        = local.http_port
}

# NACL rule that allows HTTPS traffic from anywhere to public subnets
resource "aws_network_acl_rule" "public_ingress_https" {
  network_acl_id = aws_network_acl.public_nacl.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.all_traffic_cidr
  from_port      = local.https_port
  to_port        = local.https_port
}

# NACL rule that allows HTTP responses from public subnets
resource "aws_network_acl_rule" "public_egress_http" {
  network_acl_id = aws_network_acl.public_nacl.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.all_traffic_cidr
  from_port      = local.http_port
  to_port        = local.http_port
}

# NACL rule that allows outbound traffic to ephemeral ports
resource "aws_network_acl_rule" "public_egress_ephemeral" {
  network_acl_id = aws_network_acl.public_nacl.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.all_traffic_cidr
  from_port      = local.ephemeral_start
  to_port        = local.ephemeral_end
}

# Network ACL for application tier subnets controlling traffic to/from application resources
resource "aws_network_acl" "app_nacl" {
  vpc_id     = var.vpc_id
  subnet_ids = var.app_subnet_ids

  tags = {
    Name        = "${var.environment}-app-nacl"
    Environment = var.environment
    Project     = "interaction-management-system"
  }
}

# NACL rule that allows traffic from load balancer to application tier
resource "aws_network_acl_rule" "app_ingress_lb" {
  count = length(var.public_subnet_cidr_blocks)
  
  network_acl_id = aws_network_acl.app_nacl.id
  rule_number    = 100 + count.index
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.public_subnet_cidr_blocks[count.index]
  from_port      = local.app_port
  to_port        = local.app_port
}

# NACL rule that allows database traffic from application to data tier
resource "aws_network_acl_rule" "app_egress_db" {
  count = length(var.data_subnet_cidr_blocks)
  
  network_acl_id = aws_network_acl.app_nacl.id
  rule_number    = 110 + count.index
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.data_subnet_cidr_blocks[count.index]
  from_port      = local.postgresql_port
  to_port        = local.postgresql_port
}

# Network ACL for data tier subnets controlling traffic to/from database resources
resource "aws_network_acl" "data_nacl" {
  vpc_id     = var.vpc_id
  subnet_ids = var.data_subnet_ids

  tags = {
    Name        = "${var.environment}-data-nacl"
    Environment = var.environment
    Project     = "interaction-management-system"
  }
}

# NACL rule that allows PostgreSQL traffic from application tier to database
resource "aws_network_acl_rule" "data_ingress_postgres" {
  count = length(var.app_subnet_cidr_blocks)
  
  network_acl_id = aws_network_acl.data_nacl.id
  rule_number    = 100 + count.index
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.app_subnet_cidr_blocks[count.index]
  from_port      = local.postgresql_port
  to_port        = local.postgresql_port
}

# NACL rule that allows Redis traffic from application tier to ElastiCache
resource "aws_network_acl_rule" "data_ingress_redis" {
  count = length(var.app_subnet_cidr_blocks)
  
  network_acl_id = aws_network_acl.data_nacl.id
  rule_number    = 110 + count.index * 10
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.app_subnet_cidr_blocks[count.index]
  from_port      = local.redis_port
  to_port        = local.redis_port
}

# NACL rule that allows return traffic from data tier to application tier ephemeral ports
resource "aws_network_acl_rule" "data_egress_ephemeral" {
  count = length(var.app_subnet_cidr_blocks)
  
  network_acl_id = aws_network_acl.data_nacl.id
  rule_number    = 200 + count.index
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.app_subnet_cidr_blocks[count.index]
  from_port      = local.ephemeral_start
  to_port        = local.ephemeral_end
}