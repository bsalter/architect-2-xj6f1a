# Output definitions for the AWS Application Load Balancer module
# These outputs enable integration with other Terraform modules and resources

output "alb_id" {
  description = "The ID of the Application Load Balancer"
  value       = aws_lb.this.id
}

output "alb_arn" {
  description = "The ARN (Amazon Resource Name) of the Application Load Balancer, used for WAF association and CloudWatch alarms"
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer for client access and DNS record configuration"
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the Application Load Balancer, used for Route53 alias records"
  value       = aws_lb.this.zone_id
}

output "frontend_target_group_arn" {
  description = "The ARN of the frontend target group for ECS service registration"
  value       = aws_lb_target_group.frontend.arn
}

output "backend_target_group_arn" {
  description = "The ARN of the backend target group for ECS service registration"
  value       = aws_lb_target_group.backend.arn
}

output "alb_security_group_id" {
  description = "The ID of the security group attached to the ALB, used for configuring ingress rules to backend services"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "The ARN of the HTTP listener, used for creating additional listener rules"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener if enabled, or null if HTTPS is not enabled"
  value       = var.enable_https ? aws_lb_listener.https[0].arn : null
}