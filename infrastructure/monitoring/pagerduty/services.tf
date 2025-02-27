# PagerDuty services for the Interaction Management System's alerting infrastructure
# Configures integration with CloudWatch alarms to route notifications based on severity and service type

#################################################
# PagerDuty Services by Alert Category
#################################################

# Critical infrastructure alerts (Load balancers, ECS services, system health)
resource "pagerduty_service" "critical_infrastructure" {
  name                    = "${var.environment}-critical-infrastructure"
  description             = "Service for critical infrastructure alerts requiring immediate attention"
  auto_resolve_timeout    = 14400  # 4 hours
  acknowledgement_timeout = 600    # 10 minutes
  escalation_policy       = pagerduty_escalation_policy.critical_incidents.id
  alert_creation          = "create_alerts_and_incidents"
  incident_urgency_rule {
    type    = "constant"
    urgency = "high"
  }
  alert_grouping          = "intelligent"
}

# Application error alerts (API errors, high error rates, service failures)
resource "pagerduty_service" "application_errors" {
  name                    = "${var.environment}-application-errors"
  description             = "Service for application error alerts affecting system functionality"
  auto_resolve_timeout    = 14400  # 4 hours
  acknowledgement_timeout = 1800   # 30 minutes
  escalation_policy       = pagerduty_escalation_policy.high_priority_incidents.id
  alert_creation          = "create_alerts_and_incidents"
  incident_urgency_rule {
    type    = "constant"
    urgency = "high"
  }
  alert_grouping          = "intelligent"
  alert_grouping_timeout  = 300    # 5 minutes
}

# Database alerts (Connection limits, storage capacity, query performance)
resource "pagerduty_service" "database_alerts" {
  name                    = "${var.environment}-database-alerts"
  description             = "Service for database performance and capacity alerts"
  auto_resolve_timeout    = 14400  # 4 hours
  acknowledgement_timeout = 1800   # 30 minutes
  escalation_policy       = pagerduty_escalation_policy.medium_priority_incidents.id
  alert_creation          = "create_alerts_and_incidents"
  incident_urgency_rule {
    type    = "constant"
    urgency = "low"
  }
  alert_grouping          = "intelligent"
  alert_grouping_timeout  = 600    # 10 minutes
}

# Performance alerts (Response time warnings, resource utilization)
resource "pagerduty_service" "performance_alerts" {
  name                    = "${var.environment}-performance-alerts"
  description             = "Service for performance warnings and non-critical issues"
  auto_resolve_timeout    = 14400  # 4 hours
  acknowledgement_timeout = 7200   # 2 hours
  escalation_policy       = pagerduty_escalation_policy.low_priority_incidents.id
  alert_creation          = "create_alerts_and_incidents"
  incident_urgency_rule {
    type    = "constant"
    urgency = "low"
  }
  alert_grouping          = "intelligent"
  alert_grouping_timeout  = 1800   # 30 minutes
}

#################################################
# PagerDuty Service Integrations with CloudWatch
#################################################

# Integration for critical alerts
resource "pagerduty_service_integration" "cloudwatch_critical" {
  service           = pagerduty_service.critical_infrastructure.id
  name              = "CloudWatch Integration - Critical"
  type              = "events_api_v2_inbound_integration"
  integration_key   = var.pagerduty_service_integration_key
}

# Integration for high priority alerts
resource "pagerduty_service_integration" "cloudwatch_high" {
  service           = pagerduty_service.application_errors.id
  name              = "CloudWatch Integration - High"
  type              = "events_api_v2_inbound_integration"
  integration_key   = var.pagerduty_service_integration_key
}

# Integration for medium priority alerts
resource "pagerduty_service_integration" "cloudwatch_medium" {
  service           = pagerduty_service.database_alerts.id
  name              = "CloudWatch Integration - Medium"
  type              = "events_api_v2_inbound_integration"
  integration_key   = var.pagerduty_service_integration_key
}

# Integration for low priority alerts
resource "pagerduty_service_integration" "cloudwatch_low" {
  service           = pagerduty_service.performance_alerts.id
  name              = "CloudWatch Integration - Low"
  type              = "events_api_v2_inbound_integration"
  integration_key   = var.pagerduty_service_integration_key
}

#################################################
# AWS SNS Topic Subscriptions for CloudWatch Alarms
#################################################

# Subscription for critical alerts
resource "aws_sns_topic_subscription" "pagerduty_critical" {
  topic_arn = var.aws_sns_topic_arns.critical
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_critical.integration_key}/enqueue"
}

# Subscription for high priority alerts
resource "aws_sns_topic_subscription" "pagerduty_high" {
  topic_arn = var.aws_sns_topic_arns.high
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_high.integration_key}/enqueue"
}

# Subscription for medium priority alerts
resource "aws_sns_topic_subscription" "pagerduty_medium" {
  topic_arn = var.aws_sns_topic_arns.medium
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_medium.integration_key}/enqueue"
}

# Subscription for low priority alerts
resource "aws_sns_topic_subscription" "pagerduty_low" {
  topic_arn = var.aws_sns_topic_arns.low
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/${pagerduty_service_integration.cloudwatch_low.integration_key}/enqueue"
}