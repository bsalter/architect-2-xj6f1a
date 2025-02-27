# Output the ECS cluster identifiers
output "cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.this.id
}

output "cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.this.name
}

output "cluster_arn" {
  description = "The ARN of the ECS cluster"
  value       = aws_ecs_cluster.this.arn
}

# Output the security group created for ECS tasks
output "security_group_id" {
  description = "The ID of the security group created for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

# Output task definition ARNs for CI/CD deployment
output "frontend_task_definition_arn" {
  description = "The ARN of the frontend task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "backend_task_definition_arn" {
  description = "The ARN of the backend task definition"
  value       = aws_ecs_task_definition.backend.arn
}

# Output service information for external references
output "frontend_service_name" {
  description = "The name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "backend_service_name" {
  description = "The name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_arn" {
  description = "The ARN of the frontend ECS service"
  value       = aws_ecs_service.frontend.id
}

output "backend_service_arn" {
  description = "The ARN of the backend ECS service"
  value       = aws_ecs_service.backend.id
}

# Output IAM role ARNs for task execution and permissions
output "execution_role_arn" {
  description = "The ARN of the IAM role used for ECS task execution"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "task_role_arn" {
  description = "The ARN of the IAM role used by the running tasks"
  value       = aws_iam_role.ecs_task_role.arn
}

# Output CloudWatch log group names for monitoring integration
output "log_group_frontend" {
  description = "The name of the CloudWatch log group for frontend containers"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "log_group_backend" {
  description = "The name of the CloudWatch log group for backend containers"
  value       = aws_cloudwatch_log_group.backend.name
}