#!/bin/bash
# monitoring-setup.sh
# 
# Description: Automates the setup and configuration of the monitoring infrastructure 
# for the Interaction Management System, including CloudWatch dashboards, alarms, 
# and PagerDuty integrations.
#
# Version: 1.0.0
# 
# Usage: ./monitoring-setup.sh -e [environment] -r [region] -a [alb_name] -c [cluster_name]
#                              -s [service_name] -d [db_instance_id] -p [pagerduty_api_key]

# Set strict error handling
set -e
set -o pipefail

# Define colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Path to template files
readonly TEMPLATE_DIR="$(dirname "$0")/../monitoring/cloudwatch"
readonly DASHBOARDS_DIR="${TEMPLATE_DIR}/dashboards"
readonly ALARMS_DIR="${TEMPLATE_DIR}/alarms"

# Log function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "DEBUG")
            if [[ "${DEBUG}" == "true" ]]; then
                echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message"
            fi
            ;;
        *)
            echo -e "${timestamp} - $message"
            ;;
    esac
}

# Error handling function
handle_error() {
    local exit_code=$?
    local line_number=$1
    
    if [ $exit_code -ne 0 ]; then
        log "ERROR" "Failed at line $line_number with exit code $exit_code"
        exit $exit_code
    fi
}
trap 'handle_error $LINENO' ERR

# Display usage information
usage() {
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -e  Environment (dev, staging, prod) [Required]"
    echo "  -r  AWS region [Required]"
    echo "  -a  Application Load Balancer name [Required]"
    echo "  -c  ECS cluster name [Required]"
    echo "  -s  ECS service name [Required]"
    echo "  -d  RDS instance identifier [Required]"
    echo "  -p  PagerDuty API key [Optional]"
    echo "  -h  Display this help message"
    echo
    exit 1
}

# Parse command-line arguments
parse_args() {
    while getopts "e:r:a:c:s:d:p:h" opt; do
        case $opt in
            e)
                ENVIRONMENT="${OPTARG}"
                ;;
            r)
                AWS_REGION="${OPTARG}"
                ;;
            a)
                ALB_NAME="${OPTARG}"
                ;;
            c)
                ECS_CLUSTER_NAME="${OPTARG}"
                ;;
            s)
                ECS_SERVICE_NAME="${OPTARG}"
                ;;
            d)
                DB_INSTANCE_ID="${OPTARG}"
                ;;
            p)
                PAGERDUTY_API_KEY="${OPTARG}"
                ;;
            h)
                usage
                ;;
            \?)
                log "ERROR" "Invalid option: -${OPTARG}"
                usage
                ;;
            :)
                log "ERROR" "Option -${OPTARG} requires an argument."
                usage
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "${ENVIRONMENT}" || -z "${AWS_REGION}" || -z "${ALB_NAME}" || 
          -z "${ECS_CLUSTER_NAME}" || -z "${ECS_SERVICE_NAME}" || -z "${DB_INSTANCE_ID}" ]]; then
        log "ERROR" "Missing required arguments"
        usage
    fi
    
    # Validate environment value
    if [[ "${ENVIRONMENT}" != "dev" && "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "prod" ]]; then
        log "ERROR" "Environment must be one of: dev, staging, prod"
        usage
    fi
}

# Setup environment and validate AWS credentials
setup_environment() {
    log "INFO" "Setting up environment for ${ENVIRONMENT} in ${AWS_REGION}"
    
    # Validate AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log "ERROR" "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Validate jq is installed
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed. Please install it first."
        exit 1
    }
    
    # Configure AWS CLI to use specified region
    export AWS_DEFAULT_REGION="${AWS_REGION}"
    
    # Validate AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log "ERROR" "Failed to validate AWS credentials. Please ensure AWS CLI is configured correctly."
        exit 1
    fi
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log "INFO" "Using AWS Account ID: ${AWS_ACCOUNT_ID}"
    
    # Set dashboard prefix based on environment
    DASHBOARD_PREFIX="InteractionManagement-${ENVIRONMENT}"
    
    # Validate that template directories exist
    if [[ ! -d "${DASHBOARDS_DIR}" || ! -d "${ALARMS_DIR}" ]]; then
        log "ERROR" "Template directories not found at ${TEMPLATE_DIR}"
        exit 1
    fi
    
    # Validate AWS resources exist
    log "INFO" "Validating AWS resources..."
    
    # Check ALB exists
    if ! aws elbv2 describe-load-balancers --names "${ALB_NAME}" &> /dev/null; then
        log "WARN" "Application Load Balancer '${ALB_NAME}' not found. Proceeding anyway, but this may cause issues."
    fi
    
    # Check ECS cluster exists
    if ! aws ecs describe-clusters --clusters "${ECS_CLUSTER_NAME}" --query "clusters[?status=='ACTIVE']" --output text | grep -q "${ECS_CLUSTER_NAME}"; then
        log "WARN" "ECS Cluster '${ECS_CLUSTER_NAME}' not found. Proceeding anyway, but this may cause issues."
    fi
    
    # Check RDS instance exists
    if ! aws rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" &> /dev/null; then
        log "WARN" "RDS instance '${DB_INSTANCE_ID}' not found. Proceeding anyway, but this may cause issues."
    fi
    
    # Get ElastiCache info if available (optional)
    if aws elasticache describe-cache-clusters &> /dev/null; then
        # Try to find a Redis cluster
        CACHE_CLUSTER_ID=$(aws elasticache describe-cache-clusters --query "CacheClusters[?Engine=='redis']|[0].CacheClusterId" --output text)
        if [[ "${CACHE_CLUSTER_ID}" != "None" && -n "${CACHE_CLUSTER_ID}" ]]; then
            log "INFO" "Found ElastiCache cluster: ${CACHE_CLUSTER_ID}"
        else
            log "WARN" "No Redis ElastiCache cluster found. Some monitoring components may be incomplete."
            CACHE_CLUSTER_ID="interaction-management-cache"
        fi
    else
        log "WARN" "Unable to query ElastiCache clusters. Some monitoring components may be incomplete."
        CACHE_CLUSTER_ID="interaction-management-cache"
    fi
    
    # Get RDS info for threshold calculations
    if aws rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" &> /dev/null; then
        # Get allocated storage in bytes (GB to bytes conversion)
        DB_ALLOCATED_STORAGE=$(aws rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query "DBInstances[0].AllocatedStorage" --output text)
        RDS_ALLOCATED_STORAGE_BYTES=$((DB_ALLOCATED_STORAGE * 1024 * 1024 * 1024))
        
        # Estimate max connections based on instance type
        DB_INSTANCE_CLASS=$(aws rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query "DBInstances[0].DBInstanceClass" --output text)
        
        # Set reasonable default based on instance class
        case ${DB_INSTANCE_CLASS} in
            db.t3.micro)
                DB_MAX_CONNECTIONS=100
                ;;
            db.t3.small)
                DB_MAX_CONNECTIONS=150
                ;;
            db.t3.medium)
                DB_MAX_CONNECTIONS=300
                ;;
            db.t3.large)
                DB_MAX_CONNECTIONS=600
                ;;
            db.r5.*)
                DB_MAX_CONNECTIONS=1000
                ;;
            *)
                DB_MAX_CONNECTIONS=200
                ;;
        esac
        log "INFO" "Estimated max database connections: ${DB_MAX_CONNECTIONS}"
    else
        # Default values if unable to query
        RDS_ALLOCATED_STORAGE_BYTES=$((20 * 1024 * 1024 * 1024))  # 20 GB
        DB_MAX_CONNECTIONS=200
        log "WARN" "Using default values for database parameters"
    fi
    
    log "INFO" "Environment setup completed successfully"
    return 0
}

# Create SNS topics for different alert priorities
create_sns_topics() {
    log "INFO" "Creating SNS topics for alerts..."
    
    # Create topic for critical alerts
    log "DEBUG" "Creating/retrieving SNS topic for critical alerts"
    CRITICAL_TOPIC_NAME="interaction-management-${ENVIRONMENT}-critical"
    CRITICAL_TOPIC_ARN=$(aws sns create-topic --name "${CRITICAL_TOPIC_NAME}" --query 'TopicArn' --output text)
    SNS_TOPIC_CRITICAL="${CRITICAL_TOPIC_ARN}"
    log "INFO" "Critical alerts topic: ${SNS_TOPIC_CRITICAL}"
    
    # Create topic for high priority alerts
    log "DEBUG" "Creating/retrieving SNS topic for high priority alerts"
    HIGH_TOPIC_NAME="interaction-management-${ENVIRONMENT}-high"
    HIGH_TOPIC_ARN=$(aws sns create-topic --name "${HIGH_TOPIC_NAME}" --query 'TopicArn' --output text)
    SNS_TOPIC_HIGH="${HIGH_TOPIC_ARN}"
    log "INFO" "High priority alerts topic: ${SNS_TOPIC_HIGH}"
    
    # Create topic for medium priority alerts
    log "DEBUG" "Creating/retrieving SNS topic for medium priority alerts"
    MEDIUM_TOPIC_NAME="interaction-management-${ENVIRONMENT}-medium"
    MEDIUM_TOPIC_ARN=$(aws sns create-topic --name "${MEDIUM_TOPIC_NAME}" --query 'TopicArn' --output text)
    SNS_TOPIC_MEDIUM="${MEDIUM_TOPIC_ARN}"
    log "INFO" "Medium priority alerts topic: ${SNS_TOPIC_MEDIUM}"
    
    # Create topic for low priority alerts
    log "DEBUG" "Creating/retrieving SNS topic for low priority alerts"
    LOW_TOPIC_NAME="interaction-management-${ENVIRONMENT}-low"
    LOW_TOPIC_ARN=$(aws sns create-topic --name "${LOW_TOPIC_NAME}" --query 'TopicArn' --output text)
    SNS_TOPIC_LOW="${LOW_TOPIC_ARN}"
    log "INFO" "Low priority alerts topic: ${SNS_TOPIC_LOW}"
    
    # Create topic for OK notifications
    log "DEBUG" "Creating/retrieving SNS topic for OK notifications"
    OK_TOPIC_NAME="interaction-management-${ENVIRONMENT}-ok"
    OK_TOPIC_ARN=$(aws sns create-topic --name "${OK_TOPIC_NAME}" --query 'TopicArn' --output text)
    SNS_TOPIC_OK="${OK_TOPIC_ARN}"
    log "INFO" "OK notifications topic: ${SNS_TOPIC_OK}"
    
    log "INFO" "SNS topics created successfully"
    return 0
}

# Create CloudWatch dashboards from template files
create_dashboards() {
    log "INFO" "Creating CloudWatch dashboards..."
    
    # Check template files exist
    if [[ ! -f "${DASHBOARDS_DIR}/operations.json" ]]; then
        log "ERROR" "Operations dashboard template not found at ${DASHBOARDS_DIR}/operations.json"
        return 1
    fi
    
    if [[ ! -f "${DASHBOARDS_DIR}/application.json" ]]; then
        log "ERROR" "Application dashboard template not found at ${DASHBOARDS_DIR}/application.json"
        return 1
    fi
    
    if [[ ! -f "${DASHBOARDS_DIR}/database.json" ]]; then
        log "ERROR" "Database dashboard template not found at ${DASHBOARDS_DIR}/database.json"
        return 1
    fi
    
    if [[ ! -f "${DASHBOARDS_DIR}/security.json" ]]; then
        log "ERROR" "Security dashboard template not found at ${DASHBOARDS_DIR}/security.json"
        return 1
    fi
    
    # Create operations dashboard
    log "DEBUG" "Creating operations dashboard"
    OPERATIONS_DASHBOARD_NAME="${DASHBOARD_PREFIX}-Operations"
    
    # Create a temporary file for the dashboard
    TEMP_OPERATIONS_DASHBOARD=$(mktemp)
    
    # Read the operations dashboard template and replace placeholders
    cat "${DASHBOARDS_DIR}/operations.json" | \
    sed "s/\${region}/${AWS_REGION}/g" | \
    sed "s/\${account_id}/${AWS_ACCOUNT_ID}/g" | \
    sed "s/\${alb_name}/${ALB_NAME}/g" | \
    sed "s/\${ecs_cluster_name}/${ECS_CLUSTER_NAME}/g" | \
    sed "s/\${ecs_service_name}/${ECS_SERVICE_NAME}/g" | \
    sed "s/\${db_instance_id}/${DB_INSTANCE_ID}/g" | \
    sed "s/\${cache_cluster_id}/${CACHE_CLUSTER_ID}/g" | \
    sed "s/\${rds_allocated_storage_bytes}/${RDS_ALLOCATED_STORAGE_BYTES}/g" | \
    sed "s/\${db_connection_threshold_warning}/$((DB_MAX_CONNECTIONS * 70 / 100))/g" | \
    sed "s/\${db_connection_threshold_critical}/$((DB_MAX_CONNECTIONS * 90 / 100))/g" > "${TEMP_OPERATIONS_DASHBOARD}"
    
    # Create the dashboard in CloudWatch
    aws cloudwatch put-dashboard --dashboard-name "${OPERATIONS_DASHBOARD_NAME}" --dashboard-body "file://${TEMP_OPERATIONS_DASHBOARD}"
    log "INFO" "Created operations dashboard: ${OPERATIONS_DASHBOARD_NAME}"
    
    # Clean up temp file
    rm "${TEMP_OPERATIONS_DASHBOARD}"
    
    # Create application dashboard
    log "DEBUG" "Creating application dashboard"
    APPLICATION_DASHBOARD_NAME="${DASHBOARD_PREFIX}-Application"
    
    # Create a temporary file for the dashboard
    TEMP_APPLICATION_DASHBOARD=$(mktemp)
    
    # Read the application dashboard template and replace placeholders
    cat "${DASHBOARDS_DIR}/application.json" | \
    sed "s/us-east-1/${AWS_REGION}/g" > "${TEMP_APPLICATION_DASHBOARD}"
    
    # Create the dashboard in CloudWatch
    aws cloudwatch put-dashboard --dashboard-name "${APPLICATION_DASHBOARD_NAME}" --dashboard-body "file://${TEMP_APPLICATION_DASHBOARD}"
    log "INFO" "Created application dashboard: ${APPLICATION_DASHBOARD_NAME}"
    
    # Clean up temp file
    rm "${TEMP_APPLICATION_DASHBOARD}"
    
    # Create database dashboard
    log "DEBUG" "Creating database dashboard"
    DATABASE_DASHBOARD_NAME="${DASHBOARD_PREFIX}-Database"
    
    # Create a temporary file for the dashboard
    TEMP_DATABASE_DASHBOARD=$(mktemp)
    
    # Read the database dashboard template and replace placeholders
    cat "${DASHBOARDS_DIR}/database.json" | \
    sed "s/\${aws:region}/${AWS_REGION}/g" | \
    sed "s/\${aws:rds_instance_id}/${DB_INSTANCE_ID}/g" | \
    sed "s/\${aws:elasticache_cluster_id}/${CACHE_CLUSTER_ID}/g" | \
    sed "s/\${aws:rds_storage_warning_threshold}/$((RDS_ALLOCATED_STORAGE_BYTES * 30 / 100))/g" | \
    sed "s/\${aws:rds_storage_critical_threshold}/$((RDS_ALLOCATED_STORAGE_BYTES * 15 / 100))/g" | \
    sed "s/\${aws:rds_connections_warning_threshold}/$((DB_MAX_CONNECTIONS * 70 / 100))/g" | \
    sed "s/\${aws:rds_connections_critical_threshold}/$((DB_MAX_CONNECTIONS * 90 / 100))/g" | \
    sed "s/\${aws:namespace}/InteractionManagementSystem/g" > "${TEMP_DATABASE_DASHBOARD}"
    
    # Create the dashboard in CloudWatch
    aws cloudwatch put-dashboard --dashboard-name "${DATABASE_DASHBOARD_NAME}" --dashboard-body "file://${TEMP_DATABASE_DASHBOARD}"
    log "INFO" "Created database dashboard: ${DATABASE_DASHBOARD_NAME}"
    
    # Clean up temp file
    rm "${TEMP_DATABASE_DASHBOARD}"
    
    # Create security dashboard
    log "DEBUG" "Creating security dashboard"
    SECURITY_DASHBOARD_NAME="${DASHBOARD_PREFIX}-Security"
    
    # Create a temporary file for the dashboard
    TEMP_SECURITY_DASHBOARD=$(mktemp)
    
    # Read the security dashboard template and replace placeholders
    cat "${DASHBOARDS_DIR}/security.json" | \
    sed "s/us-east-1/${AWS_REGION}/g" | \
    sed "s/123456789012/${AWS_ACCOUNT_ID}/g" > "${TEMP_SECURITY_DASHBOARD}"
    
    # Create the dashboard in CloudWatch
    aws cloudwatch put-dashboard --dashboard-name "${SECURITY_DASHBOARD_NAME}" --dashboard-body "file://${TEMP_SECURITY_DASHBOARD}"
    log "INFO" "Created security dashboard: ${SECURITY_DASHBOARD_NAME}"
    
    # Clean up temp file
    rm "${TEMP_SECURITY_DASHBOARD}"
    
    log "INFO" "CloudWatch dashboards created successfully"
    return 0
}

# Create CloudWatch alarms from alarm definition files
create_alarms() {
    log "INFO" "Creating CloudWatch alarms..."
    
    # Check template files exist
    if [[ ! -f "${ALARMS_DIR}/system_alarms.json" ]]; then
        log "ERROR" "System alarms template not found at ${ALARMS_DIR}/system_alarms.json"
        return 1
    fi
    
    if [[ ! -f "${ALARMS_DIR}/application_alarms.json" ]]; then
        log "ERROR" "Application alarms template not found at ${ALARMS_DIR}/application_alarms.json"
        return 1
    fi
    
    if [[ ! -f "${ALARMS_DIR}/database_alarms.json" ]]; then
        log "ERROR" "Database alarms template not found at ${ALARMS_DIR}/database_alarms.json"
        return 1
    fi
    
    if [[ ! -f "${ALARMS_DIR}/security_alarms.json" ]]; then
        log "ERROR" "Security alarms template not found at ${ALARMS_DIR}/security_alarms.json"
        return 1
    fi
    
    # Estimate default request count per 5 minutes based on environment
    case "${ENVIRONMENT}" in
        "dev")
            REQUEST_COUNT=300
            ;;
        "staging")
            REQUEST_COUNT=500
            ;;
        "prod")
            REQUEST_COUNT=1000
            ;;
        *)
            REQUEST_COUNT=500
            ;;
    esac
    
    log "INFO" "Estimated request count for 5-minute period: ${REQUEST_COUNT}"
    
    # Create each alarm via AWS CLI commands
    log "INFO" "Creating CloudWatch alarms from templates..."
    
    # System alarms
    log "INFO" "Creating system alarms..."
    
    # System - ECS CPU
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-ECS-CPU-Critical" \
        --alarm-description "Alarm when ECS service CPU exceeds 85% for 5 minutes" \
        --metric-name "CPUUtilization" \
        --namespace "AWS/ECS" \
        --statistic "Average" \
        --dimensions "Name=ClusterName,Value=${ECS_CLUSTER_NAME}" "Name=ServiceName,Value=${ECS_SERVICE_NAME}" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 85 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # System - RDS CPU
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-RDS-CPU-Critical" \
        --alarm-description "Alarm when RDS CPU exceeds 85% for 5 minutes" \
        --metric-name "CPUUtilization" \
        --namespace "AWS/RDS" \
        --statistic "Average" \
        --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 85 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # System - RDS Free Storage Space
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-RDS-Storage-Critical" \
        --alarm-description "Alarm when free storage space falls below 15% for 10 minutes" \
        --metric-name "FreeStorageSpace" \
        --namespace "AWS/RDS" \
        --statistic "Average" \
        --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold $((RDS_ALLOCATED_STORAGE_BYTES * 15 / 100)) \
        --comparison-operator "LessThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # System - ALB 5XX Errors
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-ALB-5XX-Critical" \
        --alarm-description "Alarm when ALB 5XX error rate exceeds 5% for 2 minutes" \
        --metric-name "HTTPCode_ELB_5XX_Count" \
        --namespace "AWS/ApplicationELB" \
        --statistic "Sum" \
        --dimensions "Name=LoadBalancer,Value=${ALB_NAME}" \
        --period 120 \
        --evaluation-periods 1 \
        --threshold $((REQUEST_COUNT * 5 / 100)) \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # Application alarms
    log "INFO" "Creating application alarms..."
    
    # App - API Response Time
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-API-ResponseTime-Critical" \
        --alarm-description "Alarm when API average response time exceeds 500ms for 2 minutes" \
        --metric-name "api_response_time" \
        --namespace "InteractionManagementSystem" \
        --statistic "Average" \
        --dimensions "Name=endpoint,Value=interactions" \
        --period 120 \
        --evaluation-periods 1 \
        --threshold 500 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # App - Search Response Time
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-Search-Performance-Critical" \
        --alarm-description "Alarm when advanced search response time exceeds 3 seconds" \
        --metric-name "search_response_time" \
        --namespace "InteractionManagementSystem" \
        --statistic "Average" \
        --dimensions "Name=type,Value=advanced" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 3000 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # App - Exception Count
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-Exception-Count-Critical" \
        --alarm-description "Alarm when unhandled exceptions exceed 15 in 5 minutes" \
        --metric-name "exception_count" \
        --namespace "InteractionManagementSystem" \
        --statistic "Sum" \
        --dimensions "Name=type,Value=UnhandledError" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 15 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # Database alarms
    log "INFO" "Creating database alarms..."
    
    # DB - Database Connection Count
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-RDS-Connection-Critical" \
        --alarm-description "Alarm when database connection count exceeds 90% of max for 5 minutes" \
        --metric-name "DatabaseConnections" \
        --namespace "AWS/RDS" \
        --statistic "Average" \
        --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold $((DB_MAX_CONNECTIONS * 90 / 100)) \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # DB - Database Latency
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-RDS-WriteLatency-Critical" \
        --alarm-description "Alarm when write latency exceeds 50ms for 5 minutes" \
        --metric-name "WriteLatency" \
        --namespace "AWS/RDS" \
        --statistic "Average" \
        --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 0.05 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # Security alarms
    log "INFO" "Creating security alarms..."
    
    # Security - Login Failure Rate
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-Login-Failure-Critical" \
        --alarm-description "Alarm when login failure rate exceeds 40% over 5 minutes" \
        --metric-name "LoginFailureRate" \
        --namespace "Custom/Auth" \
        --statistic "Average" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 40 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    # Security - Cross-Site Access Attempts
    aws cloudwatch put-metric-alarm \
        --alarm-name "${ENVIRONMENT}-CrossSite-Access-Critical" \
        --alarm-description "Alarm when cross-site access attempts exceed 5 in 5 minutes" \
        --metric-name "CrossSiteAttempts" \
        --namespace "Custom/Auth" \
        --statistic "Sum" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 5 \
        --comparison-operator "GreaterThanThreshold" \
        --alarm-actions "${SNS_TOPIC_CRITICAL}" \
        --ok-actions "${SNS_TOPIC_OK}"
    
    log "INFO" "CloudWatch alarms created successfully"
    return 0
}

# Configure PagerDuty integration with CloudWatch alarms
configure_pagerduty() {
    local pagerduty_api_key=$1
    
    if [[ -z "${pagerduty_api_key}" ]]; then
        log "INFO" "No PagerDuty API key provided, skipping PagerDuty integration"
        return 0
    fi
    
    log "INFO" "Configuring PagerDuty integration..."
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        log "ERROR" "curl command not found. Please install curl to configure PagerDuty."
        return 1
    fi
    
    # Define PagerDuty API URL
    PAGERDUTY_API_URL="https://api.pagerduty.com"
    
    # Create PagerDuty services for different priorities
    log "DEBUG" "Creating PagerDuty services"
    
    # Function to create or get PagerDuty service
    create_pd_service() {
        local name=$1
        local escalation_policy_id=$2
        local description=$3
        
        # Check if service already exists
        local service_id=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
            -H "Authorization: Token token=${pagerduty_api_key}" \
            -H "Content-Type: application/json" \
            "${PAGERDUTY_API_URL}/services?query=${name}" | \
            jq -r ".services[] | select(.name == \"${name}\") | .id")
        
        if [[ -n "${service_id}" ]]; then
            log "INFO" "PagerDuty service '${name}' already exists with ID: ${service_id}"
            echo "${service_id}"
            return 0
        fi
        
        # Create new service
        local response=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
            -H "Authorization: Token token=${pagerduty_api_key}" \
            -H "Content-Type: application/json" \
            -X POST "${PAGERDUTY_API_URL}/services" \
            -d "{
                \"service\": {
                    \"type\": \"service\",
                    \"name\": \"${name}\",
                    \"description\": \"${description}\",
                    \"escalation_policy\": {
                        \"id\": \"${escalation_policy_id}\",
                        \"type\": \"escalation_policy_reference\"
                    },
                    \"alert_creation\": \"create_alerts_and_incidents\"
                }
            }")
        
        local new_service_id=$(echo "${response}" | jq -r '.service.id')
        
        if [[ -n "${new_service_id}" && "${new_service_id}" != "null" ]]; then
            log "INFO" "Created PagerDuty service '${name}' with ID: ${new_service_id}"
            echo "${new_service_id}"
            return 0
        else
            log "ERROR" "Failed to create PagerDuty service '${name}': $(echo "${response}" | jq -r '.error.message')"
            return 1
        fi
    }
    
    # Get default escalation policy
    log "DEBUG" "Getting default escalation policy"
    DEFAULT_ESCALATION_POLICY_ID=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
        -H "Authorization: Token token=${pagerduty_api_key}" \
        -H "Content-Type: application/json" \
        "${PAGERDUTY_API_URL}/escalation_policies" | \
        jq -r '.escalation_policies[0].id')
    
    if [[ -z "${DEFAULT_ESCALATION_POLICY_ID}" || "${DEFAULT_ESCALATION_POLICY_ID}" == "null" ]]; then
        log "ERROR" "Failed to get default escalation policy from PagerDuty"
        return 1
    fi
    
    log "INFO" "Using default escalation policy ID: ${DEFAULT_ESCALATION_POLICY_ID}"
    
    # Create or get services for different priorities
    CRITICAL_SERVICE_NAME="Interaction Management ${ENVIRONMENT} - Critical"
    CRITICAL_SERVICE_ID=$(create_pd_service "${CRITICAL_SERVICE_NAME}" "${DEFAULT_ESCALATION_POLICY_ID}" "Critical alerts for Interaction Management System - ${ENVIRONMENT}")
    
    HIGH_SERVICE_NAME="Interaction Management ${ENVIRONMENT} - High"
    HIGH_SERVICE_ID=$(create_pd_service "${HIGH_SERVICE_NAME}" "${DEFAULT_ESCALATION_POLICY_ID}" "High priority alerts for Interaction Management System - ${ENVIRONMENT}")
    
    MEDIUM_SERVICE_NAME="Interaction Management ${ENVIRONMENT} - Medium"
    MEDIUM_SERVICE_ID=$(create_pd_service "${MEDIUM_SERVICE_NAME}" "${DEFAULT_ESCALATION_POLICY_ID}" "Medium priority alerts for Interaction Management System - ${ENVIRONMENT}")
    
    LOW_SERVICE_NAME="Interaction Management ${ENVIRONMENT} - Low"
    LOW_SERVICE_ID=$(create_pd_service "${LOW_SERVICE_NAME}" "${DEFAULT_ESCALATION_POLICY_ID}" "Low priority alerts for Interaction Management System - ${ENVIRONMENT}")
    
    # Create or get integrations for each service
    log "DEBUG" "Creating PagerDuty integrations"
    
    # Function to create or get CloudWatch integration for a service
    create_pd_integration() {
        local service_id=$1
        
        # Check if CloudWatch integration already exists for this service
        local integration_id=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
            -H "Authorization: Token token=${pagerduty_api_key}" \
            -H "Content-Type: application/json" \
            "${PAGERDUTY_API_URL}/services/${service_id}/integrations" | \
            jq -r ".integrations[] | select(.type == \"aws_cloudwatch_inbound_integration\") | .id")
        
        if [[ -n "${integration_id}" ]]; then
            log "INFO" "CloudWatch integration already exists for service ID ${service_id} with integration ID: ${integration_id}"
            
            # Get the integration key
            local integration_key=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
                -H "Authorization: Token token=${pagerduty_api_key}" \
                -H "Content-Type: application/json" \
                "${PAGERDUTY_API_URL}/services/${service_id}/integrations/${integration_id}" | \
                jq -r '.integration.integration_key')
            
            echo "${integration_key}"
            return 0
        fi
        
        # Create new CloudWatch integration
        local response=$(curl -s -H "Accept: application/vnd.pagerduty+json;version=2" \
            -H "Authorization: Token token=${pagerduty_api_key}" \
            -H "Content-Type: application/json" \
            -X POST "${PAGERDUTY_API_URL}/services/${service_id}/integrations" \
            -d "{
                \"integration\": {
                    \"type\": \"aws_cloudwatch_inbound_integration\",
                    \"name\": \"CloudWatch Integration\"
                }
            }")
        
        local integration_key=$(echo "${response}" | jq -r '.integration.integration_key')
        
        if [[ -n "${integration_key}" && "${integration_key}" != "null" ]]; then
            log "INFO" "Created CloudWatch integration for service ID ${service_id} with integration key: ${integration_key}"
            echo "${integration_key}"
            return 0
        else
            log "ERROR" "Failed to create CloudWatch integration for service ID ${service_id}: $(echo "${response}" | jq -r '.error.message')"
            return 1
        fi
    }
    
    # Create integrations and get integration keys
    CRITICAL_INTEGRATION_KEY=$(create_pd_integration "${CRITICAL_SERVICE_ID}")
    HIGH_INTEGRATION_KEY=$(create_pd_integration "${HIGH_SERVICE_ID}")
    MEDIUM_INTEGRATION_KEY=$(create_pd_integration "${MEDIUM_SERVICE_ID}")
    LOW_INTEGRATION_KEY=$(create_pd_integration "${LOW_SERVICE_ID}")
    
    # Create SNS subscriptions to PagerDuty endpoints
    log "DEBUG" "Creating SNS subscriptions to PagerDuty endpoints"
    
    # Subscribe critical topic to PagerDuty
    if [[ -n "${CRITICAL_INTEGRATION_KEY}" ]]; then
        aws sns subscribe \
            --topic-arn "${SNS_TOPIC_CRITICAL}" \
            --protocol https \
            --notification-endpoint "https://events.pagerduty.com/integration/${CRITICAL_INTEGRATION_KEY}/enqueue" \
            --region "${AWS_REGION}"
        log "INFO" "Subscribed critical SNS topic to PagerDuty"
    fi
    
    # Subscribe high priority topic to PagerDuty
    if [[ -n "${HIGH_INTEGRATION_KEY}" ]]; then
        aws sns subscribe \
            --topic-arn "${SNS_TOPIC_HIGH}" \
            --protocol https \
            --notification-endpoint "https://events.pagerduty.com/integration/${HIGH_INTEGRATION_KEY}/enqueue" \
            --region "${AWS_REGION}"
        log "INFO" "Subscribed high priority SNS topic to PagerDuty"
    fi
    
    # Subscribe medium priority topic to PagerDuty
    if [[ -n "${MEDIUM_INTEGRATION_KEY}" ]]; then
        aws sns subscribe \
            --topic-arn "${SNS_TOPIC_MEDIUM}" \
            --protocol https \
            --notification-endpoint "https://events.pagerduty.com/integration/${MEDIUM_INTEGRATION_KEY}/enqueue" \
            --region "${AWS_REGION}"
        log "INFO" "Subscribed medium priority SNS topic to PagerDuty"
    fi
    
    # Subscribe low priority topic to PagerDuty
    if [[ -n "${LOW_INTEGRATION_KEY}" ]]; then
        aws sns subscribe \
            --topic-arn "${SNS_TOPIC_LOW}" \
            --protocol https \
            --notification-endpoint "https://events.pagerduty.com/integration/${LOW_INTEGRATION_KEY}/enqueue" \
            --region "${AWS_REGION}"
        log "INFO" "Subscribed low priority SNS topic to PagerDuty"
    fi
    
    log "INFO" "PagerDuty integration configured successfully"
    return 0
}

# Create and configure CloudWatch log groups
setup_log_groups() {
    log "INFO" "Setting up CloudWatch log groups..."
    
    # Define log group names with environment prefix
    APPLICATION_LOG_GROUP="/interaction-management-system/${ENVIRONMENT}/application"
    API_ACCESS_LOG_GROUP="/interaction-management-system/${ENVIRONMENT}/api-access"
    SECURITY_LOG_GROUP="/interaction-management-system/${ENVIRONMENT}/security"
    
    # Set retention periods based on environment
    case "${ENVIRONMENT}" in
        "dev")
            APPLICATION_RETENTION=7
            API_ACCESS_RETENTION=7
            SECURITY_RETENTION=30
            ;;
        "staging")
            APPLICATION_RETENTION=14
            API_ACCESS_RETENTION=14
            SECURITY_RETENTION=60
            ;;
        "prod")
            APPLICATION_RETENTION=30
            API_ACCESS_RETENTION=90
            SECURITY_RETENTION=180
            ;;
        *)
            APPLICATION_RETENTION=14
            API_ACCESS_RETENTION=14
            SECURITY_RETENTION=60
            ;;
    esac
    
    # Create application log group
    log "DEBUG" "Creating application log group"
    aws logs create-log-group --log-group-name "${APPLICATION_LOG_GROUP}" --region "${AWS_REGION}" || log "WARN" "Log group ${APPLICATION_LOG_GROUP} may already exist"
    aws logs put-retention-policy --log-group-name "${APPLICATION_LOG_GROUP}" --retention-in-days "${APPLICATION_RETENTION}" --region "${AWS_REGION}"
    log "INFO" "Created application log group: ${APPLICATION_LOG_GROUP} with ${APPLICATION_RETENTION} day retention"
    
    # Create API access log group
    log "DEBUG" "Creating API access log group"
    aws logs create-log-group --log-group-name "${API_ACCESS_LOG_GROUP}" --region "${AWS_REGION}" || log "WARN" "Log group ${API_ACCESS_LOG_GROUP} may already exist"
    aws logs put-retention-policy --log-group-name "${API_ACCESS_LOG_GROUP}" --retention-in-days "${API_ACCESS_RETENTION}" --region "${AWS_REGION}"
    log "INFO" "Created API access log group: ${API_ACCESS_LOG_GROUP} with ${API_ACCESS_RETENTION} day retention"
    
    # Create security log group
    log "DEBUG" "Creating security log group"
    aws logs create-log-group --log-group-name "${SECURITY_LOG_GROUP}" --region "${AWS_REGION}" || log "WARN" "Log group ${SECURITY_LOG_GROUP} may already exist"
    aws logs put-retention-policy --log-group-name "${SECURITY_LOG_GROUP}" --retention-in-days "${SECURITY_RETENTION}" --region "${AWS_REGION}"
    log "INFO" "Created security log group: ${SECURITY_LOG_GROUP} with ${SECURITY_RETENTION} day retention"
    
    # Create metric filters for error detection
    log "DEBUG" "Creating metric filters for error detection"
    
    # Application error filter
    aws logs put-metric-filter \
        --log-group-name "${APPLICATION_LOG_GROUP}" \
        --filter-name "ErrorCount" \
        --filter-pattern "ERROR" \
        --metric-transformations \
            metricName=ApplicationErrors,metricNamespace=InteractionManagementSystem,metricValue=1 \
        --region "${AWS_REGION}"
    log "INFO" "Created metric filter for application errors"
    
    # Authentication failure filter
    aws logs put-metric-filter \
        --log-group-name "${SECURITY_LOG_GROUP}" \
        --filter-name "AuthFailureCount" \
        --filter-pattern "Authentication failed" \
        --metric-transformations \
            metricName=AuthenticationFailures,metricNamespace=InteractionManagementSystem,metricValue=1 \
        --region "${AWS_REGION}"
    log "INFO" "Created metric filter for authentication failures"
    
    # Site access denied filter
    aws logs put-metric-filter \
        --log-group-name "${SECURITY_LOG_GROUP}" \
        --filter-name "SiteAccessDenied" \
        --filter-pattern "Site access denied" \
        --metric-transformations \
            metricName=SiteAccessDenied,metricNamespace=InteractionManagementSystem,metricValue=1 \
        --region "${AWS_REGION}"
    log "INFO" "Created metric filter for site access denied events"
    
    log "INFO" "CloudWatch log groups setup completed successfully"
    return 0
}

# Verify the monitoring setup
verify_setup() {
    log "INFO" "Verifying monitoring setup..."
    local verification_success=true
    
    # Check dashboards
    log "DEBUG" "Verifying dashboards"
    local dashboards_list=$(aws cloudwatch list-dashboards --region "${AWS_REGION}" --query "DashboardEntries[].DashboardName" --output text)
    
    if echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Operations"; then
        log "INFO" "Operations dashboard verified"
    else
        log "WARN" "Operations dashboard not found"
        verification_success=false
    fi
    
    if echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Application"; then
        log "INFO" "Application dashboard verified"
    else
        log "WARN" "Application dashboard not found"
        verification_success=false
    fi
    
    if echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Database"; then
        log "INFO" "Database dashboard verified"
    else
        log "WARN" "Database dashboard not found"
        verification_success=false
    fi
    
    if echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Security"; then
        log "INFO" "Security dashboard verified"
    else
        log "WARN" "Security dashboard not found"
        verification_success=false
    fi
    
    # Check alarms
    log "DEBUG" "Verifying alarms"
    local alarms_list=$(aws cloudwatch describe-alarms --region "${AWS_REGION}" --query "MetricAlarms[].AlarmName" --output text)
    
    if echo "${alarms_list}" | grep -q "${ENVIRONMENT}-ECS-CPU-Critical"; then
        log "INFO" "ECS CPU alarm verified"
    else
        log "WARN" "ECS CPU alarm not found"
        verification_success=false
    fi
    
    if echo "${alarms_list}" | grep -q "${ENVIRONMENT}-RDS-CPU-Critical"; then
        log "INFO" "RDS CPU alarm verified"
    else
        log "WARN" "RDS CPU alarm not found"
        verification_success=false
    fi
    
    if echo "${alarms_list}" | grep -q "${ENVIRONMENT}-ALB-5XX-Critical"; then
        log "INFO" "ALB 5XX alarm verified"
    else
        log "WARN" "ALB 5XX alarm not found"
        verification_success=false
    fi
    
    # Check SNS topics
    log "DEBUG" "Verifying SNS topics"
    local topics_list=$(aws sns list-topics --region "${AWS_REGION}" --query "Topics[].TopicArn" --output text)
    
    if echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-critical"; then
        log "INFO" "Critical alerts SNS topic verified"
    else
        log "WARN" "Critical alerts SNS topic not found"
        verification_success=false
    fi
    
    if echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-high"; then
        log "INFO" "High priority alerts SNS topic verified"
    else
        log "WARN" "High priority alerts SNS topic not found"
        verification_success=false
    fi
    
    # Check log groups
    log "DEBUG" "Verifying log groups"
    local log_groups_list=$(aws logs describe-log-groups --region "${AWS_REGION}" --query "logGroups[].logGroupName" --output text)
    
    if echo "${log_groups_list}" | grep -q "/interaction-management-system/${ENVIRONMENT}/application"; then
        log "INFO" "Application log group verified"
    else
        log "WARN" "Application log group not found"
        verification_success=false
    fi
    
    if echo "${log_groups_list}" | grep -q "/interaction-management-system/${ENVIRONMENT}/security"; then
        log "INFO" "Security log group verified"
    else
        log "WARN" "Security log group not found"
        verification_success=false
    fi
    
    # Generate verification report
    log "INFO" "Generating verification report..."
    cat << EOF > "monitoring-setup-verification-${ENVIRONMENT}.txt"
Interaction Management System Monitoring Setup Verification Report
==================================================================

Environment: ${ENVIRONMENT}
Region: ${AWS_REGION}
Date: $(date)

Dashboards:
- Operations Dashboard: $(echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Operations" && echo "✓" || echo "✗")
- Application Dashboard: $(echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Application" && echo "✓" || echo "✗")
- Database Dashboard: $(echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Database" && echo "✓" || echo "✗")
- Security Dashboard: $(echo "${dashboards_list}" | grep -q "${DASHBOARD_PREFIX}-Security" && echo "✓" || echo "✗")

Alarms:
- ECS CPU Alarm: $(echo "${alarms_list}" | grep -q "${ENVIRONMENT}-ECS-CPU-Critical" && echo "✓" || echo "✗")
- RDS CPU Alarm: $(echo "${alarms_list}" | grep -q "${ENVIRONMENT}-RDS-CPU-Critical" && echo "✓" || echo "✗")
- ALB 5XX Alarm: $(echo "${alarms_list}" | grep -q "${ENVIRONMENT}-ALB-5XX-Critical" && echo "✓" || echo "✗")

SNS Topics:
- Critical Alerts: $(echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-critical" && echo "✓" || echo "✗")
- High Priority Alerts: $(echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-high" && echo "✓" || echo "✗")
- Medium Priority Alerts: $(echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-medium" && echo "✓" || echo "✗")
- Low Priority Alerts: $(echo "${topics_list}" | grep -q "interaction-management-${ENVIRONMENT}-low" && echo "✓" || echo "✗")

Log Groups:
- Application Logs: $(echo "${log_groups_list}" | grep -q "/interaction-management-system/${ENVIRONMENT}/application" && echo "✓" || echo "✗")
- API Access Logs: $(echo "${log_groups_list}" | grep -q "/interaction-management-system/${ENVIRONMENT}/api-access" && echo "✓" || echo "✗")
- Security Logs: $(echo "${log_groups_list}" | grep -q "/interaction-management-system/${ENVIRONMENT}/security" && echo "✓" || echo "✗")

Overall Status: $(${verification_success} && echo "✓ PASSED" || echo "✗ FAILED")
EOF
    
    log "INFO" "Verification report saved to: monitoring-setup-verification-${ENVIRONMENT}.txt"
    
    if ${verification_success}; then
        log "INFO" "Monitoring setup verification completed successfully"
        return 0
    else
        log "WARN" "Monitoring setup verification completed with warnings"
        return 1
    fi
}

# Main function
main() {
    log "INFO" "Starting monitoring setup for Interaction Management System"
    
    # Parse command-line arguments
    parse_args "$@"
    
    # Setup environment and validate AWS credentials
    setup_environment
    
    # Create SNS topics for different alert priorities
    create_sns_topics
    
    # Create CloudWatch dashboards from template files
    create_dashboards
    
    # Create CloudWatch alarms from alarm definition files
    create_alarms
    
    # Configure PagerDuty integration if API key provided
    if [[ -n "${PAGERDUTY_API_KEY}" ]]; then
        configure_pagerduty "${PAGERDUTY_API_KEY}"
    fi
    
    # Create and configure CloudWatch log groups
    setup_log_groups
    
    # Verify monitoring setup
    verify_setup
    
    log "INFO" "Monitoring setup completed successfully"
    
    # Output summary
    cat << EOF

Interaction Management System Monitoring Setup Summary
=====================================================

Environment: ${ENVIRONMENT}
Region: ${AWS_REGION}

Components Setup:
- SNS Topics for Alerts
- CloudWatch Dashboards (Operations, Application, Database, Security)
- CloudWatch Alarms (System, Application, Database, Security)
- CloudWatch Log Groups with Metric Filters
$([ -n "${PAGERDUTY_API_KEY}" ] && echo "- PagerDuty Integration")

To access the dashboards, visit:
https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:

For a full verification report, see:
monitoring-setup-verification-${ENVIRONMENT}.txt

EOF
    
    return 0
}

# Call main function with all arguments
main "$@"