locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Get the current AWS region
data "aws_region" "current" {}

# Create the ECS Cluster
resource "aws_ecs_cluster" "this" {
  name = local.name_prefix

  setting {
    name  = "containerInsights"
    value = var.container_insights_enabled ? "enabled" : "disabled"
  }

  tags = local.common_tags
}

# Security group for ECS tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ecs-tasks-sg"
    }
  )
}

# Allow inbound traffic from ALB to Frontend Container
resource "aws_security_group_rule" "ecs_tasks_ingress_frontend" {
  type                     = "ingress"
  from_port                = var.frontend_container_port
  to_port                  = var.frontend_container_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_tasks.id
  source_security_group_id = var.alb_security_group_id
  description              = "Allow traffic from ALB to frontend container"
}

# Allow inbound traffic from ALB to Backend Container
resource "aws_security_group_rule" "ecs_tasks_ingress_backend" {
  type                     = "ingress"
  from_port                = var.backend_container_port
  to_port                  = var.backend_container_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_tasks.id
  source_security_group_id = var.alb_security_group_id
  description              = "Allow traffic from ALB to backend container"
}

# Allow all outbound traffic from ECS tasks
resource "aws_security_group_rule" "ecs_tasks_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_tasks.id
  description       = "Allow all outbound traffic"
}

# CloudWatch Log Group for frontend container
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name_prefix}-frontend"
  retention_in_days = var.logs_retention_days

  tags = local.common_tags
}

# CloudWatch Log Group for backend container
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name_prefix}-backend"
  retention_in_days = var.logs_retention_days

  tags = local.common_tags
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = var.ecs_task_execution_role_name != "" ? var.ecs_task_execution_role_name : "${local.name_prefix}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })

  tags = local.common_tags
}

# Attach the task execution role policy
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task_role" {
  name = var.ecs_task_role_name != "" ? var.ecs_task_role_name : "${local.name_prefix}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      },
    ]
  })

  tags = local.common_tags
}

# Custom policy for the ECS task role
resource "aws_iam_policy" "ecs_task_policy" {
  name        = "${local.name_prefix}-task-policy"
  description = "Policy for ECS tasks in the ${var.project_name} ${var.environment} environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-${var.environment}-*",
          "arn:aws:s3:::${var.project_name}-${var.environment}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          "arn:aws:sns:*:*:${var.project_name}-${var.environment}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "arn:aws:sqs:*:*:${var.project_name}-${var.environment}-*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Attach the custom policy to the task role
resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name_prefix}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${local.name_prefix}-frontend"
      image     = var.frontend_container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.frontend_container_port
          hostPort      = var.frontend_container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        for k, v in var.environment_variables : {
          name  = k
          value = v
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "frontend"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.frontend_container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${local.name_prefix}-backend"
      image     = var.backend_container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.backend_container_port
          hostPort      = var.backend_container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        for k, v in var.environment_variables : {
          name  = k
          value = v
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "backend"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.backend_container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

# Frontend ECS Service
resource "aws_ecs_service" "frontend" {
  name                              = "${local.name_prefix}-frontend"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.frontend.arn
  desired_count                     = var.frontend_desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 120
  enable_execute_command            = var.enable_execute_command

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.frontend_target_group_arn
    container_name   = "${local.name_prefix}-frontend"
    container_port   = var.frontend_container_port
  }

  deployment_controller {
    type = var.deployment_controller_type
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution_role_policy,
    aws_iam_role_policy_attachment.ecs_task_role_policy
  ]
}

# Backend ECS Service
resource "aws_ecs_service" "backend" {
  name                              = "${local.name_prefix}-backend"
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.backend.arn
  desired_count                     = var.backend_desired_count
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 120
  enable_execute_command            = var.enable_execute_command

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = "${local.name_prefix}-backend"
    container_port   = var.backend_container_port
  }

  deployment_controller {
    type = var.deployment_controller_type
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution_role_policy,
    aws_iam_role_policy_attachment.ecs_task_role_policy
  ]
}

# Auto Scaling for Frontend Service
resource "aws_appautoscaling_target" "frontend" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.frontend_min_capacity
  max_capacity       = var.frontend_max_capacity
}

resource "aws_appautoscaling_policy" "frontend_cpu" {
  name               = "${local.name_prefix}-frontend-cpu-scaling"
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  policy_type        = "TargetTrackingScaling"

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_threshold
    scale_in_cooldown  = var.autoscaling_cooldown
    scale_out_cooldown = var.autoscaling_cooldown
  }
}

# Auto Scaling for Backend Service
resource "aws_appautoscaling_target" "backend" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.backend_min_capacity
  max_capacity       = var.backend_max_capacity
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name_prefix}-backend-cpu-scaling"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  policy_type        = "TargetTrackingScaling"

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_threshold
    scale_in_cooldown  = var.autoscaling_cooldown
    scale_out_cooldown = var.autoscaling_cooldown
  }
}

# Outputs
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

output "security_group_id" {
  description = "The ID of the security group created for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "frontend_task_definition_arn" {
  description = "The ARN of the frontend task definition"
  value       = aws_ecs_task_definition.frontend.arn
}

output "backend_task_definition_arn" {
  description = "The ARN of the backend task definition"
  value       = aws_ecs_task_definition.backend.arn
}

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

output "execution_role_arn" {
  description = "The ARN of the task execution IAM role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "task_role_arn" {
  description = "The ARN of the task IAM role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "log_group_frontend" {
  description = "The name of the CloudWatch log group for the frontend container"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "log_group_backend" {
  description = "The name of the CloudWatch log group for the backend container"
  value       = aws_cloudwatch_log_group.backend.name
}