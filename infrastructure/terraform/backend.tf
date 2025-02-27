# Backend configuration for Terraform state management
# Stores state in S3 with locking via DynamoDB for collaborative infrastructure management

terraform {
  backend "s3" {
    bucket         = "interaction-mgmt-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "interaction-mgmt-terraform-locks"
  }
}