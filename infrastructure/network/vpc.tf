#################################################
# VPC Configuration for Interaction Management System
# This file defines the VPC, subnets, and networking components
# required for the application's infrastructure.
#################################################

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Main VPC with DNS support
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

#################################################
# Internet Gateway for public internet access
#################################################
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

#################################################
# Subnets Configuration
# - Public subnets for load balancers and bastion hosts
# - Private app subnets for application components
# - Private data subnets for databases and caches
#################################################

# Public Subnets - Used for Load Balancers and public-facing components
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Tier        = "public"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

# Private Application Subnets - Used for application tier (ECS/EC2)
resource "aws_subnet" "private_app" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.environment}-private-app-subnet-${count.index + 1}"
    Environment = var.environment
    Tier        = "application"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

# Private Data Subnets - Used for database tier (RDS, ElastiCache)
resource "aws_subnet" "private_data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_data_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.environment}-private-data-subnet-${count.index + 1}"
    Environment = var.environment
    Tier        = "data"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

#################################################
# NAT Gateway Configuration
# Creates NAT Gateways to allow private subnets to access the internet
#################################################

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

# NAT Gateways - One per AZ for high availability
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.environment}-nat-gateway-${count.index + 1}"
    Environment = var.environment
    Terraform   = "true"
    Project     = "interaction-management-system"
  }

  # To ensure proper ordering, add an explicit dependency on the Internet Gateway
  depends_on = [aws_internet_gateway.main]
}

#################################################
# Route Tables Configuration
# - Public route table with Internet Gateway access
# - Private application route tables with NAT Gateway access
# - Private data route tables with NAT Gateway access
#################################################

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-route-table"
    Environment = var.environment
    Tier        = "public"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

# Route Tables for Private Application Subnets - One per AZ
resource "aws_route_table" "private_app" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.environment}-private-app-route-table-${count.index + 1}"
    Environment = var.environment
    Tier        = "application"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

# Route Tables for Private Data Subnets - One per AZ
resource "aws_route_table" "private_data" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.environment}-private-data-route-table-${count.index + 1}"
    Environment = var.environment
    Tier        = "data"
    Terraform   = "true"
    Project     = "interaction-management-system"
  }
}

#################################################
# Route Table Associations
# Associates subnets with the appropriate route tables
#################################################

# Associate Public Subnets to Public Route Table
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate Private Application Subnets to Private Application Route Tables
resource "aws_route_table_association" "private_app" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Associate Private Data Subnets to Private Data Route Tables
resource "aws_route_table_association" "private_data" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private_data[count.index].id
  route_table_id = aws_route_table.private_data[count.index].id
}

#################################################
# Outputs
# Exports resource IDs for use in other modules
#################################################

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "private_app_subnet_ids" {
  value       = aws_subnet.private_app[*].id
  description = "List of private application subnet IDs"
}

output "private_data_subnet_ids" {
  value       = aws_subnet.private_data[*].id
  description = "List of private data subnet IDs"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.main.id
  description = "ID of the Internet Gateway"
}

output "nat_gateway_ids" {
  value       = aws_nat_gateway.main[*].id
  description = "List of NAT Gateway IDs"
}