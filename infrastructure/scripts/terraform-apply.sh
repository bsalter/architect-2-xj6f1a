#!/usr/bin/env bash
# terraform-apply.sh
# 
# This script applies Terraform configurations for deploying and 
# updating infrastructure resources across different environments 
# (development, staging, production).
#
# Version: 1.0.0
# Terraform Version: 1.5.4
# Bash Version: 4.0+
# AWS CLI Version: 2.0+ (optional)

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Return value of a pipeline is the value of the last command

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"
LOG_FILE="/tmp/terraform-apply-$(date +%Y%m%d-%H%M%S).log"

# Default values
AUTO_APPROVE=false
PLAN_ONLY=false
ENVIRONMENT=""

# Function to display usage information
usage() {
    echo "Usage: $(basename "$0") [OPTIONS] ENVIRONMENT"
    echo
    echo "Apply Terraform configurations for infrastructure deployment."
    echo
    echo "Options:"
    echo "  -h, --help        Show this help message and exit"
    echo "  -a, --auto-approve  Auto-approve the Terraform apply"
    echo "  -p, --plan-only   Generate and show the plan but do not apply"
    echo
    echo "Environment:"
    echo "  dev               Development environment"
    echo "  staging           Staging environment"
    echo "  prod              Production environment"
    echo
    echo "Examples:"
    echo "  $(basename "$0") dev                # Plan and prompt before applying to dev environment"
    echo "  $(basename "$0") -a staging         # Plan and auto-approve apply to staging environment"
    echo "  $(basename "$0") -p prod            # Only show the plan for production environment"
    echo
}

# Function to log messages with timestamp
log_message() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function to check if required tools are installed
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform >/dev/null 2>&1; then
        log_message "ERROR" "Terraform is not installed. Please install Terraform v1.5.4 or later."
        return 1
    fi
    
    terraform_version=$(terraform version -json | grep -oP '(?<="terraform_version":").*?(?=")' || echo "unknown")
    log_message "INFO" "Terraform version: $terraform_version"
    
    # Check if AWS CLI is installed (if needed)
    if [[ -z "${AWS_ACCESS_KEY_ID}" && -z "${AWS_PROFILE}" ]]; then
        if ! command -v aws >/dev/null 2>&1; then
            log_message "WARN" "AWS CLI is not installed. If AWS provider is used, you may need to install AWS CLI."
        else
            aws_version=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
            log_message "INFO" "AWS CLI version: $aws_version"
            
            # Check if AWS credentials are configured
            if ! aws sts get-caller-identity > /dev/null 2>&1; then
                log_message "WARN" "AWS credentials not configured. If AWS provider is used, please configure AWS credentials."
            fi
        fi
    fi
    
    return 0
}

# Function to initialize terraform
init_terraform() {
    local environment="$1"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    
    log_message "INFO" "Initializing Terraform in ${environment} environment..."
    
    if [[ ! -d "$env_dir" ]]; then
        log_message "ERROR" "Environment directory does not exist: $env_dir"
        return 1
    fi
    
    cd "$env_dir" || { log_message "ERROR" "Failed to change to directory: $env_dir"; return 1; }
    
    log_message "INFO" "Running terraform init..."
    if terraform init; then
        log_message "INFO" "Terraform initialization successful."
        return 0
    else
        log_message "ERROR" "Terraform initialization failed."
        return 1
    fi
}

# Function to plan terraform changes
plan_terraform() {
    local environment="$1"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    
    log_message "INFO" "Planning Terraform changes for ${environment} environment..."
    
    if [[ ! -d "$env_dir" ]]; then
        log_message "ERROR" "Environment directory does not exist: $env_dir"
        return 1
    fi
    
    cd "$env_dir" || { log_message "ERROR" "Failed to change to directory: $env_dir"; return 1; }
    
    # Check if tfvars file exists
    local tfvars_file="terraform.tfvars"
    if [[ ! -f "$tfvars_file" ]]; then
        tfvars_file="${environment}.tfvars"
        if [[ ! -f "$tfvars_file" ]]; then
            log_message "WARN" "No .tfvars file found, proceeding without one."
            tfvars_file=""
        fi
    fi
    
    # Construct the plan command
    local plan_cmd="terraform plan"
    if [[ -n "$tfvars_file" ]]; then
        plan_cmd="$plan_cmd -var-file=$tfvars_file"
    fi
    
    log_message "INFO" "Running terraform plan..."
    log_message "DEBUG" "Executing: $plan_cmd"
    
    if eval "$plan_cmd"; then
        log_message "INFO" "Terraform plan generated successfully."
        return 0
    else
        log_message "ERROR" "Terraform plan generation failed."
        return 1
    fi
}

# Function to apply terraform changes
apply_terraform() {
    local environment="$1"
    local auto_approve="$2"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    
    log_message "INFO" "Applying Terraform changes for ${environment} environment..."
    
    if [[ ! -d "$env_dir" ]]; then
        log_message "ERROR" "Environment directory does not exist: $env_dir"
        return 1
    fi
    
    cd "$env_dir" || { log_message "ERROR" "Failed to change to directory: $env_dir"; return 1; }
    
    # Check if tfvars file exists
    local tfvars_file="terraform.tfvars"
    if [[ ! -f "$tfvars_file" ]]; then
        tfvars_file="${environment}.tfvars"
        if [[ ! -f "$tfvars_file" ]]; then
            log_message "WARN" "No .tfvars file found, proceeding without one."
            tfvars_file=""
        fi
    fi
    
    # Construct the apply command
    local apply_cmd="terraform apply"
    if [[ "$auto_approve" == true ]]; then
        apply_cmd="$apply_cmd -auto-approve"
    fi
    
    if [[ -n "$tfvars_file" ]]; then
        apply_cmd="$apply_cmd -var-file=$tfvars_file"
    fi
    
    log_message "INFO" "Running terraform apply..."
    log_message "DEBUG" "Executing: $apply_cmd"
    
    if eval "$apply_cmd"; then
        log_message "INFO" "Terraform apply completed successfully."
        return 0
    else
        log_message "ERROR" "Terraform apply failed."
        return 1
    fi
}

# Main function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                return 0
                ;;
            -a|--auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            -p|--plan-only)
                PLAN_ONLY=true
                shift
                ;;
            dev|staging|prod)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                log_message "ERROR" "Unknown argument: $1"
                usage
                return 1
                ;;
        esac
    done
    
    # Check if environment is provided
    if [[ -z "$ENVIRONMENT" ]]; then
        log_message "ERROR" "Environment not specified."
        usage
        return 1
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_message "ERROR" "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod."
        usage
        return 1
    fi
    
    log_message "INFO" "Starting Terraform apply process for $ENVIRONMENT environment."
    log_message "INFO" "Logging to $LOG_FILE"
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_message "ERROR" "Prerequisites check failed. Exiting."
        return 1
    fi
    
    # Initialize Terraform
    if ! init_terraform "$ENVIRONMENT"; then
        log_message "ERROR" "Terraform initialization failed. Exiting."
        return 1
    fi
    
    # Plan only mode
    if [[ "$PLAN_ONLY" == true ]]; then
        if ! plan_terraform "$ENVIRONMENT"; then
            log_message "ERROR" "Terraform plan failed. Exiting."
            return 1
        fi
        log_message "INFO" "Plan-only mode, not applying changes."
        return 0
    fi
    
    # Generate plan and apply
    if ! plan_terraform "$ENVIRONMENT"; then
        log_message "ERROR" "Terraform plan failed. Exiting."
        return 1
    fi
    
    # Apply the plan
    if ! apply_terraform "$ENVIRONMENT" "$AUTO_APPROVE"; then
        log_message "ERROR" "Terraform apply failed. Exiting."
        return 1
    fi
    
    log_message "INFO" "Terraform apply process completed successfully for $ENVIRONMENT environment."
    return 0
}

# Ensure LOG_FILE directory exists
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Run the main function
main "$@"
exit $?