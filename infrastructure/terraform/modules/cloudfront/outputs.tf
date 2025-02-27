# CloudFront Distribution Outputs
output "distribution_id" {
  value       = aws_cloudfront_distribution.this.id
  description = "The identifier for the CloudFront distribution"
}

output "domain_name" {
  value       = aws_cloudfront_distribution.this.domain_name
  description = "The domain name of the CloudFront distribution"
}

output "arn" {
  value       = aws_cloudfront_distribution.this.arn
  description = "The ARN (Amazon Resource Name) for the CloudFront distribution"
}

output "hosted_zone_id" {
  value       = aws_cloudfront_distribution.this.hosted_zone_id
  description = "The CloudFront distribution hosted zone ID, useful for Route53 alias records"
}

# CloudFront Policy Outputs
output "cache_policy_id" {
  value       = aws_cloudfront_cache_policy.static_assets.id
  description = "The identifier for the CloudFront cache policy for static assets"
}

output "headers_policy_id" {
  value       = aws_cloudfront_response_headers_policy.security_headers.id
  description = "The identifier for the CloudFront response headers policy"
}

output "origin_request_policy_id" {
  value       = aws_cloudfront_origin_request_policy.forward_headers.id
  description = "The identifier for the CloudFront origin request policy"
}