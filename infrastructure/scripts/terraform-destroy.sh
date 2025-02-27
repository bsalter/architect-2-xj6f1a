#!/usr/bin/env bash
# terraform-destroy.sh - A script to safely destroy Terraform-managed infrastructure resources
# with appropriate safeguards and confirmation steps.
#
# terraform v1.5.4 - Destroy Infrastructure as Code resources
# bash v4.0+ - Script execution environment
# aws-cli v2.0+ - Authentication with AWS (optional, may use AWS credentials from environment)

# Set strict error handling
set -eo pipefail

# Global variables
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
TERRAFORM_DIR=${SCRIPT_DIR}/../terraform
LOG_FILE=/tmp/terraform-destroy-$(date +%Y%m%d-%H%M%S).log

# Function to display usage information
usage() {
    echo "Usage: $(basename $0) [OPTIONS] ENVIRONMENT"
    echo
    echo "A script to safely destroy Terraform-managed infrastructure resources."
    echo "This script is DESTRUCTIVE and will remove all resources defined in Terraform."
    echo
    echo "ENVIRONMENT: Required. One of: dev, staging, prod"
    echo
    echo "Options:"
    echo "  -h, --help                 Display this help message"
    echo "  -p, --plan-only            Only show destruction plan without executing it"
    echo "  -a, --auto-approve         Skip interactive approval of destruction (USE WITH CAUTION)"
    echo "  -v, --verbose              Enable verbose logging"
    echo
    echo "Examples:"
    echo "  $(basename $0) dev                 # Destroy development environment with confirmation"
    echo "  $(basename $0) --plan-only staging # Show what would be destroyed in staging"
    echo "  $(basename $0) --auto-approve dev  # Destroy development without confirmation prompt"
    echo
    echo "WARNING: This script will DESTROY infrastructure resources. Use with caution!"
    echo "         Always run with --plan-only first to review what will be destroyed."
}

# Function to log messages with timestamp both to stdout and log file
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local formatted_message="[${timestamp}] [${level}] ${message}"
    
    # Always log to file
    echo "${formatted_message}" >> "${LOG_FILE}"
    
    # For terminal output, respect verbosity for INFO level
    if [ "${level}" != "INFO" ] || [ "${verbose}" = true ]; then
        echo "${formatted_message}"
    fi
}

# Function to check if required tools are installed
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_message "ERROR" "Terraform is not installed. Please install Terraform v1.5.4 or later."
        return 1
    fi
    
    local terraform_version=$(terraform version -json | grep -o '"terraform_version": "[^"]*"' | cut -d'"' -f4)
    log_message "INFO" "Terraform version: ${terraform_version}"
    
    # Check if AWS CLI is installed (if AWS authentication is needed)
    if ! command -v aws &> /dev/null; then
        log_message "WARNING" "AWS CLI is not installed. Some operations might fail if AWS credentials are required."
    else
        local aws_version=$(aws --version 2>&1 | awk '{print $1}' | cut -d'/' -f2)
        log_message "INFO" "AWS CLI version: ${aws_version}"
        
        # Check if AWS credentials are configured
        if ! aws sts get-caller-identity &> /dev/null; then
            log_message "WARNING" "AWS credentials are not configured or invalid."
        else
            log_message "INFO" "AWS credentials are properly configured."
        fi
    fi
    
    log_message "INFO" "Prerequisites check completed."
    return 0
}

# Function to initialize Terraform in the specified environment directory
init_terraform() {
    local environment="$1"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    
    log_message "INFO" "Initializing Terraform in ${env_dir}..."
    
    if [ ! -d "${env_dir}" ]; then
        log_message "ERROR" "Environment directory does not exist: ${env_dir}"
        return 1
    fi
    
    cd "${env_dir}"
    if terraform init; then
        log_message "INFO" "Terraform initialization successful."
        return 0
    else
        log_message "ERROR" "Terraform initialization failed."
        return 1
    fi
}

# Function to creates a backup of the state file before destruction
create_backup() {
    local environment="$1"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    local backup_dir="${SCRIPT_DIR}/../backups/terraform-state"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="${backup_dir}/${environment}-terraform-state-${timestamp}.backup"
    
    log_message "INFO" "Creating backup of Terraform state before destruction..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "${backup_dir}"
    
    # Copy the state file if it exists
    if [ -f "${env_dir}/terraform.tfstate" ]; then
        cp "${env_dir}/terraform.tfstate" "${backup_file}"
        log_message "INFO" "State backup created: ${backup_file}"
    else
        log_message "WARNING" "No local state file found. You may be using remote state storage."
        
        # Try to get remote state
        cd "${env_dir}"
        terraform state pull > "${backup_file}" 2>/dev/null || {
            log_message "WARNING" "Could not pull remote state. Backup may be incomplete."
            touch "${backup_file}.empty"
        }
    fi
    
    echo "${backup_file}"
}

# Function to generate and display a destroy plan for Terraform
plan_destroy() {
    local environment="$1"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    local var_file=""
    
    # Check if there's a variable file for this environment
    if [ -f "${env_dir}/terraform.tfvars" ]; then
        var_file="-var-file=terraform.tfvars"
    elif [ -f "${env_dir}/${environment}.tfvars" ]; then
        var_file="-var-file=${environment}.tfvars"
    fi
    
    log_message "INFO" "Generating destruction plan for ${environment} environment..."
    
    cd "${env_dir}"
    if terraform plan -destroy ${var_file}; then
        log_message "INFO" "Destruction plan generated successfully."
        return 0
    else
        log_message "ERROR" "Failed to generate destruction plan."
        return 1
    fi
}

# Function to prompt the user to confirm destruction of resources
confirm_destruction() {
    local environment="$1"
    
    echo
    log_message "WARNING" "=============================================================="
    log_message "WARNING" "You are about to DESTROY all resources in the ${environment} environment!"
    log_message "WARNING" "=============================================================="
    echo
    
    # Extra safeguard for production
    if [ "${environment}" == "prod" ] || [ "${environment}" == "production" ]; then
        echo "DANGER: You are attempting to destroy PRODUCTION environment!"
        echo "Please type the current timestamp to confirm ($(date +%H%M%S)):"
        read -r timestamp_check
        
        if [ "$timestamp_check" != "$(date +%H%M%S)" ]; then
            log_message "INFO" "Destruction aborted: timestamp verification failed."
            return 1
        fi
    fi
    
    echo "To confirm destruction, please type 'destroy' (exactly as shown):"
    read -r confirmation
    
    if [ "${confirmation}" != "destroy" ]; then
        log_message "INFO" "Destruction aborted: confirmation text did not match."
        return 1
    fi
    
    log_message "INFO" "Destruction confirmed."
    return 0
}

# Function to destroy the Terraform-managed infrastructure
destroy_terraform() {
    local environment="$1"
    local auto_approve="$2"
    local env_dir="${TERRAFORM_DIR}/${environment}"
    local var_file=""
    local auto_approve_flag=""
    
    # Check if there's a variable file for this environment
    if [ -f "${env_dir}/terraform.tfvars" ]; then
        var_file="-var-file=terraform.tfvars"
    elif [ -f "${env_dir}/${environment}.tfvars" ]; then
        var_file="-var-file=${environment}.tfvars"
    fi
    
    # Add auto-approve flag if requested
    if [ "${auto_approve}" = true ]; then
        auto_approve_flag="-auto-approve"
    fi
    
    log_message "INFO" "Destroying infrastructure in ${environment} environment..."
    
    cd "${env_dir}"
    if terraform destroy ${auto_approve_flag} ${var_file}; then
        log_message "INFO" "Infrastructure destruction completed successfully."
        return 0
    else
        log_message "ERROR" "Infrastructure destruction failed."
        return 1
    fi
}

# Main function that processes arguments and calls appropriate functions
main() {
    local environment=""
    local plan_only=false
    local auto_approve=false
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            -p|--plan-only)
                plan_only=true
                shift
                ;;
            -a|--auto-approve)
                auto_approve=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            *)
                if [ -z "${environment}" ]; then
                    environment="$1"
                else
                    log_message "ERROR" "Unknown argument: $1"
                    usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if environment is provided
    if [ -z "${environment}" ]; then
        log_message "ERROR" "No environment specified."
        usage
        exit 1
    fi
    
    # Validate environment parameter (dev, staging, prod)
    case "${environment}" in
        dev|development)
            environment="dev"
            ;;
        staging|stage)
            environment="staging"
            ;;
        prod|production)
            environment="prod"
            ;;
        *)
            log_message "ERROR" "Invalid environment: ${environment}. Must be one of: dev, staging, prod"
            exit 1
            ;;
    esac
    
    # Log script start
    log_message "INFO" "Starting Terraform destroy script for ${environment} environment."
    log_message "INFO" "Logging to: ${LOG_FILE}"
    
    # Call check_prerequisites function
    if ! check_prerequisites; then
        log_message "ERROR" "Prerequisites check failed. Exiting."
        exit 1
    fi
    
    # Call init_terraform function with specified environment
    if ! init_terraform "${environment}"; then
        log_message "ERROR" "Terraform initialization failed. Exiting."
        exit 1
    fi
    
    # Create backup of state before destruction
    backup_file=$(create_backup "${environment}")
    log_message "INFO" "State backup created at: ${backup_file}"
    
    # If plan_only flag is set, call plan_destroy and exit
    if [ "${plan_only}" = true ]; then
        log_message "INFO" "Running in plan-only mode."
        if ! plan_destroy "${environment}"; then
            log_message "ERROR" "Destruction plan failed. Exiting."
            exit 1
        fi
        log_message "INFO" "Destruction plan completed. No changes were made."
        exit 0
    fi
    
    # Otherwise, call confirm_destruction for safety check
    if [ "${auto_approve}" = false ]; then
        if ! confirm_destruction "${environment}"; then
            log_message "INFO" "Destruction aborted by user."
            exit 0
        fi
    else
        log_message "WARNING" "Auto-approve flag set. Skipping confirmation."
    fi
    
    # If confirmed, call destroy_terraform with environment and auto_approve settings
    if ! destroy_terraform "${environment}" "${auto_approve}"; then
        log_message "ERROR" "Destruction failed. Check the logs for details."
        exit 1
    fi
    
    log_message "INFO" "Terraform destroy completed successfully for ${environment} environment."
    return 0
}

# Run the main function with all arguments
main "$@"
exit $?