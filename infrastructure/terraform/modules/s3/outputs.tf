# Outputs for the S3 module to expose bucket and CloudFront OAI information

# Static assets bucket outputs
output "static_assets_bucket_id" {
  description = "The ID of the S3 bucket for static web assets"
  value       = aws_s3_bucket.static_assets.id
}

output "static_assets_bucket_arn" {
  description = "The ARN of the S3 bucket for static web assets"
  value       = aws_s3_bucket.static_assets.arn
}

output "static_assets_bucket_domain_name" {
  description = "The domain name of the S3 bucket for static web assets"
  value       = aws_s3_bucket.static_assets.bucket_domain_name
}

output "static_assets_bucket_regional_domain_name" {
  description = "The regional domain name of the S3 bucket for static web assets"
  value       = aws_s3_bucket.static_assets.bucket_regional_domain_name
}

# Logs bucket outputs
output "logs_bucket_id" {
  description = "The ID of the S3 bucket for storing logs"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "The ARN of the S3 bucket for storing logs"
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_domain_name" {
  description = "The domain name of the S3 bucket for storing logs"
  value       = aws_s3_bucket.logs.bucket_domain_name
}

# CloudFront Origin Access Identity outputs
output "cloudfront_origin_access_identity_path" {
  description = "The CloudFront Origin Access Identity path for the S3 bucket policy"
  value       = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
}

output "cloudfront_origin_access_identity_iam_arn" {
  description = "The IAM ARN of the CloudFront Origin Access Identity for the S3 bucket policy"
  value       = aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn
}