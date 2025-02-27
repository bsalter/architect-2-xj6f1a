# Load Balancer module - main.tf
# Implements an AWS Application Load Balancer for the Interaction Management System

# Define local variables for common usage
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  tags = merge(
    {
      Name        = "${local.name_prefix}-alb"
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# Security Group for the Load Balancer
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for the ${local.name_prefix} Application Load Balancer"
  vpc_id      = var.vpc_id
  
  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-alb-sg"
    }
  )
}

# Allow HTTP inbound traffic
resource "aws_security_group_rule" "alb_http_ingress" {
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidr_blocks
  description       = "Allow HTTP inbound traffic"
}

# Allow HTTPS inbound traffic if HTTPS is enabled
resource "aws_security_group_rule" "alb_https_ingress" {
  count             = var.enable_https ? 1 : 0
  type              = "ingress"
  security_group_id = aws_security_group.alb.id
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidr_blocks
  description       = "Allow HTTPS inbound traffic"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "alb_egress" {
  type              = "egress"
  security_group_id = aws_security_group.alb.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
}

# Application Load Balancer
resource "aws_lb" "this" {
  name               = "${local.name_prefix}-alb"
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnets
  
  enable_deletion_protection = var.enable_deletion_protection
  
  dynamic "access_logs" {
    for_each = var.access_logs_enabled && var.access_logs_bucket != null ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }
  
  idle_timeout               = var.idle_timeout
  drop_invalid_header_fields = true
  
  tags = local.tags
}

# Target Group for Frontend Service
resource "aws_lb_target_group" "frontend" {
  name        = "${local.name_prefix}-frontend-tg"
  vpc_id      = var.vpc_id
  port        = var.frontend_port
  protocol    = "HTTP"
  target_type = "ip"
  
  health_check {
    path                = var.frontend_health_check_path
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }
  
  deregistration_delay = var.deregistration_delay
  
  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-frontend-tg"
    }
  )
  
  lifecycle {
    create_before_destroy = true
  }
}

# Target Group for Backend Service
resource "aws_lb_target_group" "backend" {
  name        = "${local.name_prefix}-backend-tg"
  vpc_id      = var.vpc_id
  port        = var.backend_port
  protocol    = "HTTP"
  target_type = "ip"
  
  health_check {
    path                = var.backend_health_check_path
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    matcher             = "200"
  }
  
  deregistration_delay = var.deregistration_delay
  
  tags = merge(
    local.tags,
    {
      Name = "${local.name_prefix}-backend-tg"
    }
  )
  
  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = var.enable_https ? "redirect" : "forward"
    
    dynamic "redirect" {
      for_each = var.enable_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    
    dynamic "forward" {
      for_each = var.enable_https ? [] : [1]
      content {
        target_group {
          arn = aws_lb_target_group.frontend.arn
        }
      }
    }
  }
}

# HTTPS Listener (if enabled)
resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0
  
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn
  
  default_action {
    type = "forward"
    
    forward {
      target_group {
        arn = aws_lb_target_group.frontend.arn
      }
    }
  }
}

# API Path Routing to Backend Service (for HTTP if HTTPS not enabled)
resource "aws_lb_listener_rule" "api_http" {
  count = var.enable_https ? 0 : 1
  
  listener_arn = aws_lb_listener.http.arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = [var.api_path_pattern]
    }
  }
}

# API Path Routing to Backend Service (for HTTPS if enabled)
resource "aws_lb_listener_rule" "api_https" {
  count = var.enable_https ? 1 : 0
  
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  
  condition {
    path_pattern {
      values = [var.api_path_pattern]
    }
  }
}

# WAF Web ACL Association (if enabled)
resource "aws_wafv2_web_acl_association" "this" {
  count = var.waf_enabled && var.waf_web_acl_arn != null ? 1 : 0
  
  resource_arn = aws_lb.this.arn
  web_acl_arn  = var.waf_web_acl_arn
}

# Output the load balancer ID
output "alb_id" {
  description = "ID of the Application Load Balancer"
  value       = aws_lb.this.id
}

# Output the load balancer ARN
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

# Output the load balancer DNS name
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.this.dns_name
}

# Output the load balancer zone ID
output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.this.zone_id
}

# Output the frontend target group ARN
output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

# Output the backend target group ARN
output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

# Output the security group ID for the ALB
output "alb_security_group_id" {
  description = "ID of the security group attached to the ALB"
  value       = aws_security_group.alb.id
}

# Output HTTP listener ARN
output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

# Output HTTPS listener ARN (if enabled)
output "https_listener_arn" {
  description = "ARN of the HTTPS listener (if enabled)"
  value       = var.enable_https ? aws_lb_listener.https[0].arn : null
}