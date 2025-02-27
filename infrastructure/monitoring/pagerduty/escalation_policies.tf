# Configure required provider for PagerDuty
terraform {
  required_providers {
    pagerduty = {
      source  = "pagerduty/pagerduty"
      version = "~> 2.0"
    }
  }
}

# Escalation Policy for Critical severity incidents
# Requires immediate response (15 minutes)
resource "pagerduty_escalation_policy" "critical_policy" {
  name        = "Interaction Management - Critical"
  description = "Escalation policy for critical incidents requiring immediate response (15 minutes)"
  num_loops   = 3
  teams       = [var.sre_team_id]

  rule {
    escalation_delay_in_minutes = 5
    
    target {
      type = "user_reference"
      id   = var.on_call_team_ids
    }
  }

  rule {
    escalation_delay_in_minutes = 10
    
    target {
      type = "user_reference"
      id   = var.team_lead_id
    }
  }

  rule {
    escalation_delay_in_minutes = 15
    
    target {
      type = "user_reference"
      id   = var.engineering_manager_id
    }
  }
}

# Escalation Policy for High severity incidents
# Requires prompt attention (30 minutes)
resource "pagerduty_escalation_policy" "high_policy" {
  name        = "Interaction Management - High"
  description = "Escalation policy for high severity incidents requiring response within 30 minutes"
  num_loops   = 2
  teams       = [var.sre_team_id]

  rule {
    escalation_delay_in_minutes = 15
    
    target {
      type = "user_reference"
      id   = var.on_call_team_ids
    }
  }

  rule {
    escalation_delay_in_minutes = 30
    
    target {
      type = "user_reference"
      id   = var.team_lead_id
    }
  }
}

# Escalation Policy for Medium severity incidents
# Can be addressed during business hours (2 hours)
resource "pagerduty_escalation_policy" "medium_policy" {
  name        = "Interaction Management - Medium"
  description = "Escalation policy for medium severity incidents requiring response within 2 hours"
  num_loops   = 1
  teams       = [var.dev_team_id]

  rule {
    escalation_delay_in_minutes = 120
    
    target {
      type = "user_reference"
      id   = var.developer_team_ids
    }
  }

  rule {
    escalation_delay_in_minutes = 180
    
    target {
      type = "user_reference"
      id   = var.team_lead_id
    }
  }
}

# Escalation Policy for Low severity incidents
# Can be handled during next business day
resource "pagerduty_escalation_policy" "low_policy" {
  name        = "Interaction Management - Low"
  description = "Escalation policy for low severity incidents for next business day review"
  num_loops   = 0
  teams       = [var.dev_team_id]

  rule {
    escalation_delay_in_minutes = 480
    
    target {
      type = "user_reference"
      id   = var.developer_team_ids
    }
  }
}