terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudfront_origin_request_policy" "forward_headers" {
  name    = "${local.name_prefix}-origin-request-policy"
  comment = "Policy for forwarding necessary headers to S3 origin"
  
  cookies_config {
    cookie_behavior = "none"
  }
  
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
    }
  }
  
  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_cache_policy" "static_assets" {
  name    = "${local.name_prefix}-cache-policy"
  comment = "Cache policy for static web assets"
  
  default_ttl = var.default_ttl
  max_ttl     = var.max_ttl
  min_ttl     = var.min_ttl
  
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    
    headers_config {
      header_behavior = "none"
    }
    
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v"]
      }
    }
    
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${local.name_prefix}-security-headers-policy"
  comment = "Security headers policy for static web assets"
  
  security_headers_config {
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    referrer_policy {
      referrer_policy = "same-origin"
      override        = true
    }
    
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    
    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' *.amazonaws.com;"
      override                = true
    }
  }
  
  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=${var.default_ttl}"
      override = true
    }
  }
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = var.enabled
  is_ipv6_enabled     = var.is_ipv6_enabled
  comment             = "${local.name_prefix} static assets distribution"
  default_root_object = var.default_root_object
  price_class         = var.price_class
  wait_for_deployment = var.wait_for_deployment
  
  logging_config {
    include_cookies = false
    bucket          = var.logs_bucket_domain_name
    prefix          = "cloudfront/"
  }
  
  aliases = var.domain_aliases
  
  origin {
    domain_name = var.s3_bucket_domain_name
    origin_id   = "S3-${var.project_name}-${var.environment}"
    origin_path = var.origin_path
    
    s3_origin_config {
      origin_access_identity = var.cloudfront_origin_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = var.allowed_methods
    cached_methods   = var.cached_methods
    target_origin_id = "S3-${var.project_name}-${var.environment}"
    compress         = var.compress
    
    viewer_protocol_policy = var.viewer_protocol_policy
    
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.forward_headers.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }
  
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  
  restrictions {
    geo_restriction {
      restriction_type = var.restriction_type
      locations        = var.restriction_locations
    }
  }
  
  viewer_certificate {
    acm_certificate_arn            = var.acm_certificate_arn != null ? var.acm_certificate_arn : ""
    ssl_support_method             = var.acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != null ? "TLSv1.2_2021" : "TLSv1"
    cloudfront_default_certificate = var.acm_certificate_arn == null
  }
  
  tags = merge(local.tags, var.tags)
}