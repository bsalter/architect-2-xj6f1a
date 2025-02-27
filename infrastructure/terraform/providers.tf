# Define required Terraform version and providers
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    auth0 = {
      source  = "alexkappa/auth0"
      version = "~> 0.16.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Interaction Management System"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Configure AWS Provider with us-east-1 alias for global resources
# Required for global resources like ACM certificates and CloudFront distributions
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "Interaction Management System"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Configure the Auth0 Provider
provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_client_id
  client_secret = var.auth0_client_secret
}

# Configure the Random Provider
provider "random" {
  # No specific configuration needed
}