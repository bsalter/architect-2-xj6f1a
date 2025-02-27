# AWS Backup Vault Configuration for Interaction Management System
# This defines the backup storage infrastructure with appropriate encryption,
# retention policies, and access controls.

# Local variables for resource naming and configuration
locals {
  # Use the provided SNS topic ARN if it exists, otherwise use our created one
  notification_topic_arn = var.backup_notifications_topic_arn != null ? var.backup_notifications_topic_arn : aws_sns_topic.backup_notifications.arn
}

# KMS key for encrypting backup data
resource "aws_kms_key" "backup_key" {
  description             = "KMS key for AWS Backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name        = "backup-encryption-key"
    Environment = var.environment
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
}

# Alias for the backup KMS key
resource "aws_kms_alias" "backup_key_alias" {
  name          = "alias/backup-key-${var.environment}"
  target_key_id = aws_kms_key.backup_key.key_id
}

# SNS topic for backup notifications
resource "aws_sns_topic" "backup_notifications" {
  name = "backup-notifications-${var.environment}"
  
  tags = {
    Name        = "backup-notifications"
    Environment = var.environment
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
}

# Email subscription for backup notifications
resource "aws_sns_topic_subscription" "backup_notifications_email" {
  topic_arn = aws_sns_topic.backup_notifications.arn
  protocol  = "email"
  endpoint  = var.backup_notification_email
}

# Primary backup vault for storing backups
resource "aws_backup_vault" "main_vault" {
  name        = "interaction-system-${var.environment}-main-vault"
  kms_key_arn = aws_kms_key.backup_key.arn
  notification_event_topics = [local.notification_topic_arn]
  
  tags = {
    Name        = "interaction-system-${var.environment}-main-vault"
    Environment = var.environment
    Application = "InteractionManagementSystem"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    prevent_destroy = true
  }
}

# Disaster recovery backup vault for cross-region replication
resource "aws_backup_vault" "dr_vault" {
  name        = "interaction-system-${var.environment}-dr-vault"
  kms_key_arn = aws_kms_key.backup_key.arn
  notification_event_topics = [local.notification_topic_arn]
  
  tags = {
    Name        = "interaction-system-${var.environment}-dr-vault"
    Environment = var.environment
    Application = "InteractionManagementSystem"
    Purpose     = "DisasterRecovery"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    prevent_destroy = true
  }
}

# IAM policy document for backup vault access
data "aws_iam_policy_document" "backup_vault_policy" {
  statement {
    sid    = "BackupVaultAccessPolicy"
    effect = "Allow"
    
    actions = [
      "backup:DescribeBackupVault",
      "backup:DeleteBackupVault",
      "backup:PutBackupVaultAccessPolicy",
      "backup:DeleteBackupVaultAccessPolicy",
      "backup:GetBackupVaultAccessPolicy",
      "backup:StartBackupJob",
      "backup:GetBackupVaultNotifications",
      "backup:PutBackupVaultNotifications",
      "backup:DeleteBackupVaultNotifications"
    ]
    
    resources = [
      aws_backup_vault.main_vault.arn,
      aws_backup_vault.dr_vault.arn
    ]
    
    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

# IAM policy for the main backup vault
resource "aws_backup_vault_policy" "main_vault_policy" {
  backup_vault_name = aws_backup_vault.main_vault.name
  policy            = data.aws_iam_policy_document.backup_vault_policy.json
}

# IAM policy for the DR backup vault
resource "aws_backup_vault_policy" "dr_vault_policy" {
  backup_vault_name = aws_backup_vault.dr_vault.name
  policy            = data.aws_iam_policy_document.backup_vault_policy.json
}

# Vault lock configuration for the main backup vault
resource "aws_backup_vault_lock_configuration" "main_vault_lock" {
  backup_vault_name   = aws_backup_vault.main_vault.name
  min_retention_days  = 7
  max_retention_days  = 30
  changeable_for_days = 3
}

# Vault lock configuration for the DR backup vault
resource "aws_backup_vault_lock_configuration" "dr_vault_lock" {
  backup_vault_name   = aws_backup_vault.dr_vault.name
  min_retention_days  = 7
  max_retention_days  = 90  # Longer retention for DR vault
  changeable_for_days = 3
}

# Variables
variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
}

variable "backup_notification_email" {
  description = "Email address to receive backup notifications"
  type        = string
}

variable "backup_notifications_topic_arn" {
  description = "ARN of the SNS topic for backup notifications"
  type        = string
  default     = null
}

# Outputs
output "main_vault_arn" {
  description = "ARN of the main backup vault"
  value       = aws_backup_vault.main_vault.arn
}

output "dr_vault_arn" {
  description = "ARN of the DR backup vault"
  value       = aws_backup_vault.dr_vault.arn
}

output "backup_notifications_topic_arn" {
  description = "ARN of the SNS topic for backup notifications"
  value       = aws_sns_topic.backup_notifications.arn
}