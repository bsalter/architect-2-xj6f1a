# AWS Backup Plans for the Interaction Management System
# This configuration establishes comprehensive backup strategies including
# hourly, daily, and weekly backups with appropriate retention periods and
# disaster recovery capabilities.

# -----------------------------------------------------
# Database Backup Plan
# Implements frequent backups for critical database resources
# with cross-region disaster recovery copies
# -----------------------------------------------------
resource "aws_backup_plan" "database_backup_plan" {
  name = "interaction-system-database-backup-plan"

  # Hourly backups with 3-day retention for point-in-time recovery
  rule {
    name                = "hourly_backup_rule"
    target_vault_name   = "${aws_backup_vault.main_vault.name}"
    schedule            = "cron(0 * * * ? *)"  # Every hour
    start_window        = 60                   # 60 minutes to start backup
    completion_window   = 120                  # 2 hours to complete
    
    lifecycle {
      delete_after = 3  # Keep hourly backups for 3 days
    }
    
    recovery_point_tags = {
      Frequency   = "Hourly"
      Application = "InteractionManagementSystem"
    }
  }

  # Daily backups with 30-day retention and cross-region copy
  rule {
    name                = "daily_backup_rule"
    target_vault_name   = "${aws_backup_vault.main_vault.name}"
    schedule            = "cron(0 0 * * ? *)"  # Daily at midnight
    start_window        = 60                   # 60 minutes to start backup
    completion_window   = 180                  # 3 hours to complete
    
    lifecycle {
      delete_after = 30  # Keep daily backups for 30 days
    }
    
    recovery_point_tags = {
      Frequency   = "Daily"
      Application = "InteractionManagementSystem"
    }
    
    # Cross-region copy for disaster recovery
    copy_action {
      destination_vault_arn = "${aws_backup_vault.dr_vault.arn}"
      
      lifecycle {
        delete_after = 30  # Keep cross-region copies for 30 days
      }
    }
  }
  
  # Weekly backups with 90-day retention and cross-region copy
  # Used for verification and longer-term retention
  rule {
    name                = "weekly_backup_rule"
    target_vault_name   = "${aws_backup_vault.main_vault.name}"
    schedule            = "cron(0 0 ? * SUN *)"  # Weekly on Sunday
    start_window        = 60                     # 60 minutes to start backup
    completion_window   = 360                    # 6 hours to complete
    
    lifecycle {
      delete_after = 90  # Keep weekly backups for 90 days
    }
    
    recovery_point_tags = {
      Frequency   = "Weekly"
      Application = "InteractionManagementSystem"
    }
    
    # Cross-region copy for disaster recovery
    copy_action {
      destination_vault_arn = "${aws_backup_vault.dr_vault.arn}"
      
      lifecycle {
        delete_after = 90  # Keep cross-region copies for 90 days
      }
    }
  }
  
  # Advanced settings specific to RDS
  advanced_backup_setting {
    resource_type = "RDS"
    backup_options = {
      WindowsVSS = "disabled"
    }
  }
  
  tags = {
    Environment = "${var.environment}"
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------
# Application Backup Plan
# Less frequent backups for application resources 
# -----------------------------------------------------
resource "aws_backup_plan" "application_backup_plan" {
  name = "interaction-system-application-backup-plan"

  # Daily backups with 30-day retention
  rule {
    name                = "daily_backup_rule"
    target_vault_name   = "${aws_backup_vault.main_vault.name}"
    schedule            = "cron(0 2 * * ? *)"  # Daily at 2 AM
    start_window        = 60                   # 60 minutes to start backup
    completion_window   = 180                  # 3 hours to complete
    
    lifecycle {
      delete_after = 30  # Keep daily backups for 30 days
    }
    
    recovery_point_tags = {
      Frequency   = "Daily"
      Application = "InteractionManagementSystem"
    }
  }
  
  tags = {
    Environment = "${var.environment}"
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------
# Backup Selections
# Define which resources get backed up under each plan
# -----------------------------------------------------
resource "aws_backup_selection" "database_backup_selection" {
  name          = "database-resources"
  iam_role_arn  = aws_iam_role.backup_role.arn
  plan_id       = aws_backup_plan.database_backup_plan.id
  
  # Select resources tagged with Backup=Database
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "Database"
  }
  
  # Explicitly include RDS instances
  resources = [
    var.rds_arn
  ]
}

resource "aws_backup_selection" "application_backup_selection" {
  name          = "application-resources"
  iam_role_arn  = aws_iam_role.backup_role.arn
  plan_id       = aws_backup_plan.application_backup_plan.id
  
  # Select resources tagged with Backup=Application
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "Application"
  }
}

# -----------------------------------------------------
# IAM Role for AWS Backup
# Required for AWS Backup to access resources
# -----------------------------------------------------
resource "aws_iam_role" "backup_role" {
  name = "aws-backup-service-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Effect = "Allow"
        Sid    = ""
      }
    ]
  })
  
  # Attach AWS-managed policies for backup and restore permissions
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  ]
  
  tags = {
    Environment = "${var.environment}"
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------
# AWS Backup Region Settings
# Configure which AWS resource types can be backed up
# -----------------------------------------------------
resource "aws_backup_region_settings" "main_region_settings" {
  resource_type_opt_in_preference = {
    "Aurora"          = true
    "DocumentDB"      = false
    "DynamoDB"        = false
    "EBS"             = true
    "EC2"             = true
    "EFS"             = false
    "FSx"             = false
    "Neptune"         = false
    "RDS"             = true
    "Storage Gateway" = false
    "VirtualMachine"  = false
  }
  
  resource_type_management_preference = {
    "DynamoDB" = false
    "EFS"      = false
  }
}

# -----------------------------------------------------
# CloudWatch Events for Backup Monitoring
# Monitor backup job status and send notifications
# -----------------------------------------------------
resource "aws_cloudwatch_event_rule" "backup_event_rule" {
  name        = "aws-backup-job-events"
  description = "Captures AWS Backup job events"
  
  event_pattern = jsonencode({
    source      = ["aws.backup"]
    "detail-type" = ["AWS Backup Job State Change"]
  })
}

resource "aws_cloudwatch_event_target" "backup_event_target" {
  rule      = aws_cloudwatch_event_rule.backup_event_rule.name
  target_id = "backup-job-alerts"
  arn       = var.sns_topic_arn
}

# -----------------------------------------------------
# Required Variables
# -----------------------------------------------------
variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
}

variable "rds_arn" {
  description = "ARN of the RDS database to back up"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for backup notifications"
  type        = string
}