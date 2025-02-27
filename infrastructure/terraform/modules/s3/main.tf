# S3 buckets for Interaction Management System
# - Static assets bucket for frontend files with CloudFront integration
# - Logs bucket for access logs and system logs

# Define local variables for bucket naming and common tags
locals {
  static_assets_bucket_name = "${var.project_name}-${var.environment}-static-assets"
  logs_bucket_name = "${var.project_name}-${var.environment}-logs"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Terraform   = "true"
  }
}

# Static assets bucket for frontend files
resource "aws_s3_bucket" "static_assets" {
  bucket = local.static_assets_bucket_name
  tags   = merge(local.common_tags, { Name = local.static_assets_bucket_name })
}

# Enable or disable versioning based on the variable
resource "aws_s3_bucket_versioning" "static_assets_versioning" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Disabled"
  }
}

# Configure CORS for the static assets bucket
resource "aws_s3_bucket_cors_configuration" "static_assets_cors" {
  bucket = aws_s3_bucket.static_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Enable server-side encryption for the static assets bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets_encryption" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to the static assets bucket
resource "aws_s3_bucket_public_access_block" "static_assets_public_access" {
  bucket                  = aws_s3_bucket.static_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create CloudFront Origin Access Identity for accessing the S3 bucket
resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = "Origin access identity for ${local.static_assets_bucket_name}"
}

# Add bucket policy to allow CloudFront OAI to access the bucket
resource "aws_s3_bucket_policy" "static_assets_policy" {
  bucket = aws_s3_bucket.static_assets.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "AllowCloudFrontServicePrincipal",
        Effect = "Allow",
        Principal = {
          AWS = "${aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn}"
        },
        Action = "s3:GetObject",
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })
}

# Logs bucket for access logs and system logs
resource "aws_s3_bucket" "logs" {
  bucket = local.logs_bucket_name
  tags   = merge(local.common_tags, { Name = local.logs_bucket_name })
}

# Configure lifecycle policy for log rotation
resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

# Enable server-side encryption for the logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logs_encryption" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to the logs bucket
resource "aws_s3_bucket_public_access_block" "logs_public_access" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}