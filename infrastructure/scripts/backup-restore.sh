#!/bin/bash
# -------------------------------------------------------
# backup-restore.sh
# -------------------------------------------------------
# Shell script for managing backup and restore operations
# for the Interaction Management System's infrastructure
# components, focusing on database recovery and system restoration.
#
# Usage: ./backup-restore.sh [command] [options]
# -------------------------------------------------------
# Version: 1.0.0
# -------------------------------------------------------

# Exit on any error
set -e

# Global variables
SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOG_FILE="/var/log/interaction-management/backup-restore.log"
ENV_CONFIG_PATH="../terraform/environments"
S3_BACKUP_BUCKET="interaction-management-backups"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to print usage information
print_usage() {
    echo "Interaction Management System - Backup and Restore Utility"
    echo "==========================================================="
    echo "This script manages backup and restore operations for the system"
    echo "including database backups, asset backups, and full system restoration."
    echo
    echo "COMMANDS:"
    echo "  backup [options]    Create a backup of system components"
    echo "  restore [options]   Restore system from a backup"
    echo "  list [options]      List available backups"
    echo "  verify [options]    Verify backup integrity"
    echo "  cleanup [options]   Remove old backups based on retention policy"
    echo "  test [options]      Test restore procedure with a backup"
    echo
    echo "OPTIONS for 'backup':"
    echo "  -e, --environment ENV        Target environment (dev, staging, prod)"
    echo "  -t, --type TYPE              Backup type (full, db, assets)"
    echo "  -d, --description DESC       Backup description"
    echo
    echo "OPTIONS for 'restore':"
    echo "  -b, --backup-id ID           Backup ID to restore from"
    echo "  -e, --environment ENV        Target environment for restore"
    echo "  -p, --point-in-time TIME     Point-in-time for recovery (ISO format)"
    echo "  -c, --components COMP        Components to restore (all, db, assets)"
    echo
    echo "OPTIONS for 'list':"
    echo "  -e, --environment ENV        Filter by environment"
    echo "  -t, --type TYPE              Filter by backup type"
    echo "  -n, --limit NUM              Limit number of results"
    echo
    echo "OPTIONS for 'verify':"
    echo "  -b, --backup-id ID           Backup ID to verify"
    echo "  -d, --detail                 Show detailed verification results"
    echo
    echo "OPTIONS for 'cleanup':"
    echo "  -e, --environment ENV        Target environment for cleanup"
    echo "  -r, --retention DAYS         Retention period in days (default: 30)"
    echo "  -f, --force                  Skip confirmation prompt"
    echo
    echo "OPTIONS for 'test':"
    echo "  -b, --backup-id ID           Backup ID to test"
    echo "  -e, --environment ENV        Test environment name"
    echo
    echo "EXAMPLES:"
    echo "  ./backup-restore.sh backup -e prod -t full -d \"Weekly full backup\""
    echo "  ./backup-restore.sh list -e prod -t db -n 10"
    echo "  ./backup-restore.sh restore -b 20230815-010101-prod -e staging"
    echo "  ./backup-restore.sh verify -b 20230815-010101-prod -d"
    echo "  ./backup-restore.sh cleanup -e dev -r 15 -f"
    echo "  ./backup-restore.sh test -b 20230815-010101-prod -e test-restore"
}

# Function to log a message
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local formatted_message="[$timestamp] [$level] $message"
    
    # Output to console
    if [[ "$level" == "ERROR" ]]; then
        echo "$formatted_message" >&2
    else
        echo "$formatted_message"
    fi
    
    # Output to log file
    echo "$formatted_message" >> "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_message "ERROR" "AWS CLI is not installed. Please install AWS CLI v2.x"
        return 1
    fi
    
    aws_version=$(aws --version | cut -d' ' -f1 | cut -d'/' -f2)
    log_message "INFO" "AWS CLI version: $aws_version"
    
    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        log_message "ERROR" "PostgreSQL client is not installed. Please install postgresql-client 15.x"
        return 1
    fi
    
    pg_version=$(psql --version | awk '{print $3}')
    log_message "INFO" "PostgreSQL client version: $pg_version"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_message "ERROR" "AWS credentials are not configured properly"
        return 1
    fi
    
    # Check if the S3 backup bucket exists
    if ! aws s3 ls "s3://$S3_BACKUP_BUCKET" &> /dev/null; then
        log_message "ERROR" "S3 backup bucket does not exist or is not accessible: $S3_BACKUP_BUCKET"
        return 1
    fi
    
    # Check environment config path
    if [[ ! -d "$SCRIPT_DIR/$ENV_CONFIG_PATH" ]]; then
        log_message "ERROR" "Environment configuration path does not exist: $SCRIPT_DIR/$ENV_CONFIG_PATH"
        return 1
    fi
    
    log_message "INFO" "Prerequisites check completed successfully"
    return 0
}

# Function to get RDS instances for the specified environment
get_rds_instances() {
    local environment="$1"
    local config_file="$SCRIPT_DIR/$ENV_CONFIG_PATH/$environment/terraform.tfvars"
    
    if [[ ! -f "$config_file" ]]; then
        log_message "ERROR" "Environment configuration file not found: $config_file"
        return 1
    fi
    
    # Extract RDS instance identifiers from environment configuration
    local prefix=$(grep "resource_prefix" "$config_file" | cut -d'=' -f2 | tr -d '" ' | tr -d '\r')
    
    if [[ -z "$prefix" ]]; then
        log_message "WARNING" "Could not determine resource prefix from config, using environment name"
        prefix="$environment"
    fi
    
    # Use AWS CLI to list RDS instances with the environment prefix
    local instances=$(aws rds describe-db-instances --query "DBInstances[?starts_with(DBInstanceIdentifier, '$prefix')].DBInstanceIdentifier" --output text)
    
    if [[ -z "$instances" ]]; then
        log_message "WARNING" "No RDS instances found for environment: $environment"
        return 0
    fi
    
    log_message "INFO" "Found RDS instances for $environment: $instances"
    echo "$instances"
}

# Function to create a database backup
create_database_backup() {
    local instance_id="$1"
    local backup_type="$2"
    local backup_dir="$SCRIPT_DIR/backups/$TIMESTAMP/$instance_id"
    local backup_id=""
    
    mkdir -p "$backup_dir"
    
    log_message "INFO" "Creating $backup_type backup for RDS instance: $instance_id"
    
    case "$backup_type" in
        "snapshot")
            # Create RDS snapshot using AWS CLI
            local snapshot_id="${instance_id}-${TIMESTAMP}"
            
            log_message "INFO" "Creating RDS snapshot: $snapshot_id"
            aws rds create-db-snapshot \
                --db-instance-identifier "$instance_id" \
                --db-snapshot-identifier "$snapshot_id" \
                --tags Key=BackupTimestamp,Value="$TIMESTAMP"
            
            # Wait for snapshot to be available
            log_message "INFO" "Waiting for snapshot to become available..."
            aws rds wait db-snapshot-available \
                --db-snapshot-identifier "$snapshot_id"
            
            backup_id="$snapshot_id"
            
            # Save snapshot metadata
            echo "SNAPSHOT_ID=$snapshot_id" > "$backup_dir/metadata.txt"
            echo "INSTANCE_ID=$instance_id" >> "$backup_dir/metadata.txt"
            echo "TIMESTAMP=$TIMESTAMP" >> "$backup_dir/metadata.txt"
            echo "BACKUP_TYPE=snapshot" >> "$backup_dir/metadata.txt"
            ;;
            
        "dump")
            # Get instance details
            local instance_details=$(aws rds describe-db-instances \
                --db-instance-identifier "$instance_id" \
                --query 'DBInstances[0].[Endpoint.Address,Endpoint.Port,MasterUsername,DBName]' \
                --output text)
            
            local host=$(echo "$instance_details" | cut -f1)
            local port=$(echo "$instance_details" | cut -f2)
            local user=$(echo "$instance_details" | cut -f3)
            local dbname=$(echo "$instance_details" | cut -f4)
            
            # Generate a temporary password file
            local temp_pgpass=$(mktemp)
            
            # Get database password from Secrets Manager or prompt user
            log_message "INFO" "Retrieving database credentials..."
            local secret_id="${instance_id}-credentials"
            
            if aws secretsmanager describe-secret --secret-id "$secret_id" &> /dev/null; then
                local db_password=$(aws secretsmanager get-secret-value \
                    --secret-id "$secret_id" \
                    --query 'SecretString' \
                    --output text | jq -r '.password')
                
                # Write password to pgpass file
                echo "$host:$port:$dbname:$user:$db_password" > "$temp_pgpass"
                chmod 600 "$temp_pgpass"
                export PGPASSFILE="$temp_pgpass"
            else
                log_message "WARNING" "Database credentials not found in Secrets Manager"
                read -s -p "Enter database password for $user@$host: " db_password
                echo
                
                # Write password to pgpass file
                echo "$host:$port:$dbname:$user:$db_password" > "$temp_pgpass"
                chmod 600 "$temp_pgpass"
                export PGPASSFILE="$temp_pgpass"
            fi
            
            # Create pg_dump file
            local dump_file="$backup_dir/${dbname}_${TIMESTAMP}.sql"
            log_message "INFO" "Creating database dump to $dump_file"
            
            PGPASSFILE="$temp_pgpass" pg_dump \
                -h "$host" \
                -p "$port" \
                -U "$user" \
                -d "$dbname" \
                -F c \
                -f "$dump_file"
            
            backup_id="$dump_file"
            
            # Save dump metadata
            echo "DUMP_FILE=$dump_file" > "$backup_dir/metadata.txt"
            echo "INSTANCE_ID=$instance_id" >> "$backup_dir/metadata.txt"
            echo "TIMESTAMP=$TIMESTAMP" >> "$backup_dir/metadata.txt"
            echo "HOST=$host" >> "$backup_dir/metadata.txt"
            echo "PORT=$port" >> "$backup_dir/metadata.txt"
            echo "USER=$user" >> "$backup_dir/metadata.txt"
            echo "DBNAME=$dbname" >> "$backup_dir/metadata.txt"
            echo "BACKUP_TYPE=dump" >> "$backup_dir/metadata.txt"
            
            # Cleanup
            rm -f "$temp_pgpass"
            unset PGPASSFILE
            ;;
            
        *)
            log_message "ERROR" "Unsupported backup type: $backup_type"
            return 1
            ;;
    esac
    
    log_message "SUCCESS" "Database backup created: $backup_id"
    echo "$backup_id"
}

# Function to backup S3 assets
backup_s3_assets() {
    local source_bucket="$1"
    local destination_path="$2"
    
    log_message "INFO" "Backing up S3 assets from $source_bucket to $destination_path"
    
    # Create backup directory
    mkdir -p "$destination_path"
    
    # Sync S3 bucket to backup location
    log_message "INFO" "Syncing S3 bucket contents..."
    aws s3 sync "s3://$source_bucket" "$destination_path" \
        --delete \
        --exclude "*.tmp" \
        --exclude "tmp/*"
    
    # Create metadata file
    echo "SOURCE_BUCKET=$source_bucket" > "$destination_path/metadata.txt"
    echo "TIMESTAMP=$TIMESTAMP" >> "$destination_path/metadata.txt"
    echo "BACKUP_TYPE=s3" >> "$destination_path/metadata.txt"
    
    # Upload backup to S3 backup bucket
    local s3_backup_path="s3://$S3_BACKUP_BUCKET/assets/$TIMESTAMP"
    log_message "INFO" "Uploading backup to $s3_backup_path"
    
    aws s3 sync "$destination_path" "$s3_backup_path" \
        --delete
    
    log_message "SUCCESS" "S3 assets backup completed: $s3_backup_path"
    echo "$s3_backup_path"
}

# Function to perform a full backup
perform_full_backup() {
    local environment="$1"
    local description="$2"
    local backup_dir="$SCRIPT_DIR/backups/$TIMESTAMP"
    
    log_message "INFO" "Starting full backup for environment: $environment"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Create backup manifest
    local manifest="$backup_dir/manifest.json"
    cat > "$manifest" << EOF
{
  "backup_id": "$TIMESTAMP",
  "environment": "$environment",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "description": "$description",
  "components": []
}
EOF
    
    # Get RDS instances for the environment
    local rds_instances=$(get_rds_instances "$environment")
    
    # Backup each database
    local db_backups=()
    local assets_backup=""
    
    if [[ -n "$rds_instances" ]]; then
        for instance in $rds_instances; do
            log_message "INFO" "Processing database instance: $instance"
            
            # Create database backup (snapshot)
            local db_backup=$(create_database_backup "$instance" "snapshot")
            
            if [[ -n "$db_backup" ]]; then
                db_backups+=("$db_backup")
                
                # Add to manifest
                local temp_manifest=$(mktemp)
                jq ".components += [{
                    \"type\": \"database\",
                    \"instance\": \"$instance\",
                    \"backup_id\": \"$db_backup\",
                    \"backup_type\": \"snapshot\"
                }]" "$manifest" > "$temp_manifest"
                mv "$temp_manifest" "$manifest"
            else
                log_message "ERROR" "Failed to backup database instance: $instance"
            fi
        done
    else
        log_message "WARNING" "No database instances found for environment: $environment"
    fi
    
    # Backup S3 assets
    # First, get the S3 buckets for this environment from config
    local config_file="$SCRIPT_DIR/$ENV_CONFIG_PATH/$environment/terraform.tfvars"
    
    if [[ -f "$config_file" ]]; then
        local assets_bucket=$(grep "assets_bucket" "$config_file" | cut -d'=' -f2 | tr -d '" ' | tr -d '\r')
        
        if [[ -n "$assets_bucket" ]]; then
            log_message "INFO" "Backing up assets from bucket: $assets_bucket"
            
            local assets_backup_dir="$backup_dir/assets"
            assets_backup=$(backup_s3_assets "$assets_bucket" "$assets_backup_dir")
            
            if [[ -n "$assets_backup" ]]; then
                # Add to manifest
                local temp_manifest=$(mktemp)
                jq ".components += [{
                    \"type\": \"s3_assets\",
                    \"source_bucket\": \"$assets_bucket\",
                    \"backup_path\": \"$assets_backup\"
                }]" "$manifest" > "$temp_manifest"
                mv "$temp_manifest" "$manifest"
            else
                log_message "ERROR" "Failed to backup S3 assets from bucket: $assets_bucket"
            fi
        else
            log_message "WARNING" "No assets bucket found for environment: $environment"
        fi
    else
        log_message "WARNING" "Environment configuration file not found: $config_file"
    fi
    
    # Upload manifest to S3
    aws s3 cp "$manifest" "s3://$S3_BACKUP_BUCKET/manifests/${TIMESTAMP}_${environment}.json"
    
    # Create backup summary
    local summary=$(jq -r "{
        backup_id: .backup_id,
        environment: .environment,
        timestamp: .timestamp,
        description: .description,
        database_backups: [.components[] | select(.type == \"database\") | .backup_id],
        assets_backup: [.components[] | select(.type == \"s3_assets\") | .backup_path]
    }" "$manifest")
    
    log_message "SUCCESS" "Full backup completed: $TIMESTAMP"
    echo "$summary"
}

# Function to list available backups
list_available_backups() {
    local environment="$1"
    local resource_type="$2"
    local limit="$3"
    
    log_message "INFO" "Listing available backups for environment: $environment, type: $resource_type"
    
    # Get list of backup manifests from S3
    local manifests=$(aws s3 ls "s3://$S3_BACKUP_BUCKET/manifests/" \
        --recursive \
        | grep -E "_${environment}\.json$" \
        | sort -r \
        | awk '{print $4}')
    
    if [[ -z "$manifests" ]]; then
        log_message "INFO" "No backups found for environment: $environment"
        return 0
    fi
    
    local backup_list=()
    local count=0
    
    for manifest_path in $manifests; do
        # Download manifest
        local temp_manifest=$(mktemp)
        aws s3 cp "s3://$S3_BACKUP_BUCKET/$manifest_path" "$temp_manifest"
        
        # Parse manifest information
        local backup_id=$(jq -r '.backup_id' "$temp_manifest")
        local backup_env=$(jq -r '.environment' "$temp_manifest")
        local timestamp=$(jq -r '.timestamp' "$temp_manifest")
        local description=$(jq -r '.description' "$temp_manifest")
        
        # Filter by resource type if specified
        if [[ -n "$resource_type" && "$resource_type" != "all" ]]; then
            local has_resource=$(jq -r --arg type "$resource_type" \
                '.components[] | select(.type == $type) | .type' "$temp_manifest")
            
            if [[ -z "$has_resource" ]]; then
                # Skip this backup as it doesn't have the requested resource type
                rm -f "$temp_manifest"
                continue
            fi
        fi
        
        # Add to backup list
        backup_list+=("$backup_id | $backup_env | $timestamp | $description")
        
        rm -f "$temp_manifest"
        
        # Check limit
        ((count++))
        if [[ -n "$limit" && $count -ge $limit ]]; then
            break
        fi
    done
    
    # Print backup list
    if [[ ${#backup_list[@]} -eq 0 ]]; then
        log_message "INFO" "No backups found matching the criteria"
        return 0
    fi
    
    log_message "INFO" "Found ${#backup_list[@]} backups:"
    echo ""
    echo "Backup ID | Environment | Timestamp | Description"
    echo "---------------------------------------------------------------------------"
    for backup in "${backup_list[@]}"; do
        echo "$backup"
    done
    
    echo "${backup_list[@]}"
}

# Function to restore a database
restore_database() {
    local backup_id="$1"
    local target_instance="$2"
    local point_in_time="$3"
    
    log_message "INFO" "Restoring database for instance $target_instance from backup: $backup_id"
    
    # Check if the backup is a snapshot or dump
    if [[ "$backup_id" == *"-snapshot-"* ]]; then
        # This is a snapshot restore
        log_message "INFO" "Restoring from RDS snapshot: $backup_id"
        
        # Check if snapshot exists
        if ! aws rds describe-db-snapshots --db-snapshot-identifier "$backup_id" &> /dev/null; then
            log_message "ERROR" "Snapshot not found: $backup_id"
            return 1
        fi
        
        # Check if the target instance exists
        if aws rds describe-db-instances --db-instance-identifier "$target_instance" &> /dev/null; then
            # If the instance exists, confirm before replacing it
            log_message "WARNING" "Target instance already exists: $target_instance"
            read -p "Do you want to replace the existing instance? This will cause downtime. (y/n): " confirm
            
            if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
                log_message "INFO" "Restore operation cancelled by user"
                return 1
            fi
            
            # Rename the existing instance as a backup
            local renamed_instance="${target_instance}-pre-restore-${TIMESTAMP}"
            log_message "INFO" "Renaming existing instance to $renamed_instance"
            
            aws rds modify-db-instance \
                --db-instance-identifier "$target_instance" \
                --new-db-instance-identifier "$renamed_instance" \
                --apply-immediately
            
            log_message "INFO" "Waiting for instance rename to complete..."
            aws rds wait db-instance-available --db-instance-identifier "$renamed_instance"
        fi
        
        # Restore from snapshot
        log_message "INFO" "Creating new instance from snapshot..."
        aws rds restore-db-instance-from-db-snapshot \
            --db-instance-identifier "$target_instance" \
            --db-snapshot-identifier "$backup_id"
        
        log_message "INFO" "Waiting for restore to complete..."
        aws rds wait db-instance-available --db-instance-identifier "$target_instance"
        
        # Apply point-in-time recovery if specified
        if [[ -n "$point_in_time" ]]; then
            log_message "INFO" "Performing point-in-time recovery to: $point_in_time"
            
            # Create a temporary instance for point-in-time recovery
            local temp_instance="${target_instance}-pitr-${TIMESTAMP}"
            
            aws rds restore-db-instance-to-point-in-time \
                --source-db-instance-identifier "$target_instance" \
                --target-db-instance-identifier "$temp_instance" \
                --restore-time "$point_in_time"
            
            log_message "INFO" "Waiting for point-in-time restore to complete..."
            aws rds wait db-instance-available --db-instance-identifier "$temp_instance"
            
            # Rename instances to swap them
            log_message "INFO" "Swapping instances for point-in-time recovery..."
            aws rds modify-db-instance \
                --db-instance-identifier "$target_instance" \
                --new-db-instance-identifier "${target_instance}-pre-pitr" \
                --apply-immediately
            
            aws rds wait db-instance-available --db-instance-identifier "${target_instance}-pre-pitr"
            
            aws rds modify-db-instance \
                --db-instance-identifier "$temp_instance" \
                --new-db-instance-identifier "$target_instance" \
                --apply-immediately
            
            aws rds wait db-instance-available --db-instance-identifier "$target_instance"
            
            # Cleanup the temporary instance
            log_message "INFO" "Cleaning up temporary instances..."
            aws rds delete-db-instance \
                --db-instance-identifier "${target_instance}-pre-pitr" \
                --skip-final-snapshot
        fi
        
        log_message "SUCCESS" "Database restored successfully from snapshot: $backup_id"
        return 0
        
    elif [[ -f "$backup_id" && "$backup_id" == *.sql ]]; then
        # This is a dump file restore
        log_message "INFO" "Restoring from database dump file: $backup_id"
        
        # Get target instance details
        local instance_details=$(aws rds describe-db-instances \
            --db-instance-identifier "$target_instance" \
            --query 'DBInstances[0].[Endpoint.Address,Endpoint.Port,MasterUsername,DBName]' \
            --output text)
        
        if [[ -z "$instance_details" ]]; then
            log_message "ERROR" "Target instance not found: $target_instance"
            return 1
        fi
        
        local host=$(echo "$instance_details" | cut -f1)
        local port=$(echo "$instance_details" | cut -f2)
        local user=$(echo "$instance_details" | cut -f3)
        local dbname=$(echo "$instance_details" | cut -f4)
        
        # Generate a temporary password file
        local temp_pgpass=$(mktemp)
        
        # Get database password from Secrets Manager or prompt user
        log_message "INFO" "Retrieving database credentials..."
        local secret_id="${target_instance}-credentials"
        
        if aws secretsmanager describe-secret --secret-id "$secret_id" &> /dev/null; then
            local db_password=$(aws secretsmanager get-secret-value \
                --secret-id "$secret_id" \
                --query 'SecretString' \
                --output text | jq -r '.password')
            
            # Write password to pgpass file
            echo "$host:$port:$dbname:$user:$db_password" > "$temp_pgpass"
            chmod 600 "$temp_pgpass"
            export PGPASSFILE="$temp_pgpass"
        else
            log_message "WARNING" "Database credentials not found in Secrets Manager"
            read -s -p "Enter database password for $user@$host: " db_password
            echo
            
            # Write password to pgpass file
            echo "$host:$port:$dbname:$user:$db_password" > "$temp_pgpass"
            chmod 600 "$temp_pgpass"
            export PGPASSFILE="$temp_pgpass"
        fi
        
        # Check connection
        if ! PGPASSFILE="$temp_pgpass" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -c "SELECT 1" &> /dev/null; then
            log_message "ERROR" "Failed to connect to database $dbname on $host:$port as $user"
            rm -f "$temp_pgpass"
            unset PGPASSFILE
            return 1
        fi
        
        # Confirm before proceeding
        log_message "WARNING" "This will overwrite the existing database: $dbname on $host"
        read -p "Do you want to proceed with the restore? (y/n): " confirm
        
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_message "INFO" "Restore operation cancelled by user"
            rm -f "$temp_pgpass"
            unset PGPASSFILE
            return 1
        fi
        
        # Drop and recreate database
        log_message "INFO" "Dropping existing database..."
        PGPASSFILE="$temp_pgpass" psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbname'" &> /dev/null
        PGPASSFILE="$temp_pgpass" psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "DROP DATABASE IF EXISTS $dbname" &> /dev/null
        
        log_message "INFO" "Creating new database..."
        PGPASSFILE="$temp_pgpass" psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "CREATE DATABASE $dbname" &> /dev/null
        
        # Restore from dump
        log_message "INFO" "Restoring from dump file..."
        PGPASSFILE="$temp_pgpass" pg_restore \
            -h "$host" \
            -p "$port" \
            -U "$user" \
            -d "$dbname" \
            -v \
            "$backup_id"
        
        restore_status=$?
        
        # Clean up
        rm -f "$temp_pgpass"
        unset PGPASSFILE
        
        if [[ $restore_status -eq 0 ]]; then
            log_message "SUCCESS" "Database restored successfully from dump file: $backup_id"
            return 0
        else
            log_message "ERROR" "Failed to restore database from dump file. pg_restore exited with code $restore_status"
            return 1
        fi
    else
        log_message "ERROR" "Unsupported backup format: $backup_id"
        return 1
    fi
}

# Function to restore S3 assets
restore_s3_assets() {
    local backup_path="$1"
    local target_bucket="$2"
    
    log_message "INFO" "Restoring S3 assets from $backup_path to bucket: $target_bucket"
    
    # Check if target bucket exists
    if ! aws s3 ls "s3://$target_bucket" &> /dev/null; then
        log_message "ERROR" "Target bucket does not exist: $target_bucket"
        return 1
    fi
    
    # Check if backup path exists
    if [[ "$backup_path" == s3://* ]]; then
        # Backup is in S3
        if ! aws s3 ls "$backup_path" &> /dev/null; then
            log_message "ERROR" "Backup path does not exist: $backup_path"
            return 1
        fi
        
        # Confirm before proceeding
        log_message "WARNING" "This will overwrite content in the target bucket: $target_bucket"
        read -p "Do you want to proceed with the restore? (y/n): " confirm
        
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_message "INFO" "Restore operation cancelled by user"
            return 1
        fi
        
        # Sync from backup to target bucket
        log_message "INFO" "Syncing assets from backup to target bucket..."
        aws s3 sync "$backup_path" "s3://$target_bucket" \
            --delete \
            --exclude "metadata.txt"
        
        log_message "SUCCESS" "S3 assets restored successfully from: $backup_path"
        return 0
    elif [[ -d "$backup_path" ]]; then
        # Backup is a local directory
        # Confirm before proceeding
        log_message "WARNING" "This will overwrite content in the target bucket: $target_bucket"
        read -p "Do you want to proceed with the restore? (y/n): " confirm
        
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_message "INFO" "Restore operation cancelled by user"
            return 1
        fi
        
        # Sync from backup to target bucket
        log_message "INFO" "Syncing assets from backup to target bucket..."
        aws s3 sync "$backup_path" "s3://$target_bucket" \
            --delete \
            --exclude "metadata.txt"
        
        log_message "SUCCESS" "S3 assets restored successfully from: $backup_path"
        return 0
    else
        log_message "ERROR" "Backup path does not exist or is not a directory: $backup_path"
        return 1
    fi
}

# Function to perform a full restore
perform_full_restore() {
    local backup_id="$1"
    local environment="$2"
    
    log_message "INFO" "Starting full restore for environment $environment from backup: $backup_id"
    
    # Find the backup manifest
    local manifest_path="s3://$S3_BACKUP_BUCKET/manifests/${backup_id}_${environment}.json"
    local temp_manifest=$(mktemp)
    
    if ! aws s3 cp "$manifest_path" "$temp_manifest" &> /dev/null; then
        log_message "ERROR" "Backup manifest not found: $manifest_path"
        rm -f "$temp_manifest"
        return 1
    fi
    
    # Parse manifest
    local backup_description=$(jq -r '.description' "$temp_manifest")
    log_message "INFO" "Found backup: $backup_id ($backup_description)"
    
    # Confirm restore operation
    log_message "WARNING" "This will restore the entire environment: $environment"
    log_message "WARNING" "All existing data will be overwritten"
    read -p "Do you want to proceed with the full restore? (y/n): " confirm
    
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_message "INFO" "Restore operation cancelled by user"
        rm -f "$temp_manifest"
        return 1
    fi
    
    # Track restore results
    local restore_results=()
    local has_failures=false
    
    # Restore databases
    local db_components=$(jq -r '.components[] | select(.type == "database")' "$temp_manifest")
    
    if [[ -n "$db_components" ]]; then
        log_message "INFO" "Restoring database components..."
        
        while IFS= read -r component; do
            local instance=$(echo "$component" | jq -r '.instance')
            local backup_id=$(echo "$component" | jq -r '.backup_id')
            local backup_type=$(echo "$component" | jq -r '.backup_type')
            
            log_message "INFO" "Restoring database instance: $instance"
            
            if restore_database "$backup_id" "$instance" ""; then
                restore_results+=("Database $instance: SUCCESS")
            else
                restore_results+=("Database $instance: FAILED")
                has_failures=true
            fi
        done < <(echo "$db_components" | jq -c '.')
    else
        log_message "INFO" "No database components found in backup"
    fi
    
    # Restore S3 assets
    local s3_components=$(jq -r '.components[] | select(.type == "s3_assets")' "$temp_manifest")
    
    if [[ -n "$s3_components" ]]; then
        log_message "INFO" "Restoring S3 asset components..."
        
        while IFS= read -r component; do
            local source_bucket=$(echo "$component" | jq -r '.source_bucket')
            local backup_path=$(echo "$component" | jq -r '.backup_path')
            
            log_message "INFO" "Restoring assets to bucket: $source_bucket"
            
            if restore_s3_assets "$backup_path" "$source_bucket"; then
                restore_results+=("S3 Assets $source_bucket: SUCCESS")
            else
                restore_results+=("S3 Assets $source_bucket: FAILED")
                has_failures=true
            fi
        done < <(echo "$s3_components" | jq -c '.')
    else
        log_message "INFO" "No S3 asset components found in backup"
    fi
    
    # Clean up
    rm -f "$temp_manifest"
    
    # Print restore summary
    log_message "INFO" "Restore operation completed."
    echo ""
    echo "Restore Summary:"
    echo "---------------------------------------------------------------------------"
    for result in "${restore_results[@]}"; do
        echo "$result"
    done
    
    if [[ "$has_failures" = true ]]; then
        log_message "WARNING" "Some components failed to restore. Check the log for details."
        return 1
    else
        log_message "SUCCESS" "Full restore completed successfully."
        return 0
    fi
}

# Function to verify a backup
verify_backup() {
    local backup_id="$1"
    local show_details="$2"
    
    log_message "INFO" "Verifying backup: $backup_id"
    
    # Find manifests that match this backup ID
    local manifests=$(aws s3 ls "s3://$S3_BACKUP_BUCKET/manifests/" | grep "$backup_id" | awk '{print $4}')
    
    if [[ -z "$manifests" ]]; then
        log_message "ERROR" "No manifests found for backup ID: $backup_id"
        return 1
    fi
    
    # Track verification results
    local verification_results=()
    local all_valid=true
    
    for manifest_file in $manifests; do
        local temp_manifest=$(mktemp)
        aws s3 cp "s3://$S3_BACKUP_BUCKET/manifests/$manifest_file" "$temp_manifest"
        
        local environment=$(jq -r '.environment' "$temp_manifest")
        log_message "INFO" "Verifying backup $backup_id for environment: $environment"
        
        # Verify each component
        local components=$(jq -r '.components[]' "$temp_manifest")
        
        if [[ -z "$components" ]]; then
            log_message "WARNING" "No components found in backup manifest"
            verification_results+=("Manifest $manifest_file: NO COMPONENTS")
            all_valid=false
            rm -f "$temp_manifest"
            continue
        fi
        
        while IFS= read -r component; do
            local component_type=$(echo "$component" | jq -r '.type')
            local component_valid=true
            local details=""
            
            case "$component_type" in
                "database")
                    local backup_id=$(echo "$component" | jq -r '.backup_id')
                    local backup_type=$(echo "$component" | jq -r '.backup_type')
                    local instance=$(echo "$component" | jq -r '.instance')
                    
                    if [[ "$backup_type" == "snapshot" ]]; then
                        # Verify snapshot exists
                        if aws rds describe-db-snapshots --db-snapshot-identifier "$backup_id" &> /dev/null; then
                            details="Snapshot $backup_id exists"
                        else
                            details="Snapshot $backup_id not found"
                            component_valid=false
                        fi
                    elif [[ -f "$backup_id" ]]; then
                        # Verify dump file exists and is valid
                        if [[ -f "$backup_id" && -s "$backup_id" ]]; then
                            details="Dump file $backup_id exists and has data"
                        else
                            details="Dump file $backup_id does not exist or is empty"
                            component_valid=false
                        fi
                    else
                        details="Backup $backup_id not found or has unknown format"
                        component_valid=false
                    fi
                    ;;
                
                "s3_assets")
                    local backup_path=$(echo "$component" | jq -r '.backup_path')
                    local source_bucket=$(echo "$component" | jq -r '.source_bucket')
                    
                    if [[ "$backup_path" == s3://* ]]; then
                        # Verify S3 backup path exists
                        if aws s3 ls "$backup_path" &> /dev/null; then
                            # Count objects to make sure it's not empty
                            local object_count=$(aws s3 ls "$backup_path" --recursive | wc -l)
                            
                            if [[ $object_count -gt 0 ]]; then
                                details="S3 backup at $backup_path contains $object_count objects"
                            else
                                details="S3 backup at $backup_path is empty"
                                component_valid=false
                            fi
                        else
                            details="S3 backup at $backup_path not found"
                            component_valid=false
                        fi
                    elif [[ -d "$backup_path" ]]; then
                        # Count files to make sure it's not empty
                        local file_count=$(find "$backup_path" -type f | wc -l)
                        
                        if [[ $file_count -gt 0 ]]; then
                            details="Local backup at $backup_path contains $file_count files"
                        else
                            details="Local backup at $backup_path is empty"
                            component_valid=false
                        fi
                    else
                        details="Backup at $backup_path not found or has unknown format"
                        component_valid=false
                    fi
                    ;;
                
                *)
                    details="Unknown component type: $component_type"
                    component_valid=false
                    ;;
            esac
            
            # Record verification result
            if [[ "$component_valid" = true ]]; then
                verification_results+=("$component_type: VALID - $details")
            else
                verification_results+=("$component_type: INVALID - $details")
                all_valid=false
            fi
            
        done < <(echo "$components" | jq -c '.')
        
        rm -f "$temp_manifest"
    done
    
    # Print verification summary
    log_message "INFO" "Backup verification completed."
    echo ""
    echo "Verification Summary for Backup: $backup_id"
    echo "---------------------------------------------------------------------------"
    
    if [[ "$show_details" = true ]]; then
        for result in "${verification_results[@]}"; do
            echo "$result"
        done
    fi
    
    if [[ "$all_valid" = true ]]; then
        log_message "SUCCESS" "Backup is valid."
        return 0
    else
        log_message "ERROR" "Backup verification failed. Some components are invalid or missing."
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    local environment="$1"
    local retention_days="$2"
    local force="$3"
    
    if [[ -z "$retention_days" ]]; then
        retention_days=30
    fi
    
    log_message "INFO" "Cleaning up backups older than $retention_days days for environment: $environment"
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "$retention_days days ago" +"%Y%m%d")
    
    # Get list of backup manifests from S3
    local manifests=$(aws s3 ls "s3://$S3_BACKUP_BUCKET/manifests/" \
        --recursive \
        | grep -E "_${environment}\.json$" \
        | awk '{print $4}')
    
    if [[ -z "$manifests" ]]; then
        log_message "INFO" "No backups found for environment: $environment"
        return 0
    fi
    
    # Identify old backups
    local old_backups=()
    local cleaned_count=0
    
    for manifest_path in $manifests; do
        # Extract backup date from manifest filename
        local backup_date=$(echo "$manifest_path" | grep -o -E "[0-9]{8}" | head -1)
        
        if [[ -z "$backup_date" ]]; then
            log_message "WARNING" "Could not determine date for manifest: $manifest_path"
            continue
        fi
        
        # Check if backup is older than retention period
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            # Download manifest to get component details
            local temp_manifest=$(mktemp)
            aws s3 cp "s3://$S3_BACKUP_BUCKET/$manifest_path" "$temp_manifest"
            
            local backup_id=$(jq -r '.backup_id' "$temp_manifest")
            local backup_timestamp=$(jq -r '.timestamp' "$temp_manifest")
            local description=$(jq -r '.description' "$temp_manifest")
            
            old_backups+=("$backup_id | $backup_timestamp | $description")
            
            rm -f "$temp_manifest"
        fi
    done
    
    # Print old backups
    if [[ ${#old_backups[@]} -eq 0 ]]; then
        log_message "INFO" "No backups found older than $retention_days days"
        return 0
    fi
    
    log_message "INFO" "Found ${#old_backups[@]} backups older than $retention_days days:"
    echo ""
    echo "Backup ID | Timestamp | Description"
    echo "---------------------------------------------------------------------------"
    for backup in "${old_backups[@]}"; do
        echo "$backup"
    done
    
    # Confirm before proceeding
    if [[ "$force" != true ]]; then
        read -p "Do you want to delete these backups? This action cannot be undone. (y/n): " confirm
        
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_message "INFO" "Cleanup operation cancelled by user"
            return 1
        fi
    fi
    
    # Delete old backups
    for manifest_path in $manifests; do
        # Extract backup date from manifest filename
        local backup_date=$(echo "$manifest_path" | grep -o -E "[0-9]{8}" | head -1)
        
        if [[ -z "$backup_date" ]]; then
            continue
        fi
        
        # Check if backup is older than retention period
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            # Download manifest to get component details
            local temp_manifest=$(mktemp)
            aws s3 cp "s3://$S3_BACKUP_BUCKET/$manifest_path" "$temp_manifest"
            
            local backup_id=$(jq -r '.backup_id' "$temp_manifest")
            log_message "INFO" "Cleaning up backup: $backup_id"
            
            # Delete database components
            local db_components=$(jq -r '.components[] | select(.type == "database")' "$temp_manifest")
            if [[ -n "$db_components" ]]; then
                while IFS= read -r component; do
                    local backup_id=$(echo "$component" | jq -r '.backup_id')
                    local backup_type=$(echo "$component" | jq -r '.backup_type')
                    
                    if [[ "$backup_type" == "snapshot" ]]; then
                        log_message "INFO" "Deleting RDS snapshot: $backup_id"
                        aws rds delete-db-snapshot --db-snapshot-identifier "$backup_id" || true
                    elif [[ -f "$backup_id" ]]; then
                        log_message "INFO" "Deleting dump file: $backup_id"
                        rm -f "$backup_id" || true
                    fi
                done < <(echo "$db_components" | jq -c '.')
            fi
            
            # Delete S3 asset backups
            local s3_components=$(jq -r '.components[] | select(.type == "s3_assets")' "$temp_manifest")
            if [[ -n "$s3_components" ]]; then
                while IFS= read -r component; do
                    local backup_path=$(echo "$component" | jq -r '.backup_path')
                    
                    if [[ "$backup_path" == s3://* ]]; then
                        log_message "INFO" "Deleting S3 assets backup: $backup_path"
                        aws s3 rm "$backup_path" --recursive || true
                    elif [[ -d "$backup_path" ]]; then
                        log_message "INFO" "Deleting local assets backup: $backup_path"
                        rm -rf "$backup_path" || true
                    fi
                done < <(echo "$s3_components" | jq -c '.')
            fi
            
            # Delete manifest
            log_message "INFO" "Deleting backup manifest: $manifest_path"
            aws s3 rm "s3://$S3_BACKUP_BUCKET/$manifest_path" || true
            
            rm -f "$temp_manifest"
            ((cleaned_count++))
        fi
    done
    
    log_message "SUCCESS" "Cleaned up $cleaned_count backups older than $retention_days days"
    
    # Return a summary object
    echo "{\"cleaned_count\": $cleaned_count, \"retention_days\": $retention_days}"
}

# Function to test restore procedure
test_restore_procedure() {
    local backup_id="$1"
    local test_environment="$2"
    
    log_message "INFO" "Testing restore procedure for backup $backup_id in environment: $test_environment"
    
    # Verify the backup exists
    if ! verify_backup "$backup_id" false; then
        log_message "ERROR" "Backup verification failed. Cannot proceed with test restore."
        return 1
    fi
    
    # Create test environment
    log_message "INFO" "Creating test environment: $test_environment"
    local test_dir="$SCRIPT_DIR/test_restore/$test_environment"
    mkdir -p "$test_dir"
    
    # Find the backup manifest
    local manifest_files=$(aws s3 ls "s3://$S3_BACKUP_BUCKET/manifests/" | grep "$backup_id" | awk '{print $4}')
    
    if [[ -z "$manifest_files" ]]; then
        log_message "ERROR" "No manifests found for backup ID: $backup_id"
        rm -rf "$test_dir"
        return 1
    fi
    
    local source_environment=""
    local temp_manifest=$(mktemp)
    
    for manifest_file in $manifest_files; do
        aws s3 cp "s3://$S3_BACKUP_BUCKET/manifests/$manifest_file" "$temp_manifest"
        source_environment=$(jq -r '.environment' "$temp_manifest")
        break
    done
    
    if [[ -z "$source_environment" ]]; then
        log_message "ERROR" "Could not determine source environment from backup manifest"
        rm -f "$temp_manifest"
        rm -rf "$test_dir"
        return 1
    fi
    
    log_message "INFO" "Backup is from environment: $source_environment"
    
    # Copy configuration from source environment
    local source_config="$SCRIPT_DIR/$ENV_CONFIG_PATH/$source_environment"
    local test_config="$test_dir/config"
    
    if [[ ! -d "$source_config" ]]; then
        log_message "ERROR" "Source environment configuration not found: $source_config"
        rm -f "$temp_manifest"
        rm -rf "$test_dir"
        return 1
    fi
    
    mkdir -p "$test_config"
    cp -r "$source_config"/* "$test_config/"
    
    # Modify configuration for test environment
    echo "TEST_ENVIRONMENT=$test_environment" > "$test_config/test_environment.txt"
    echo "SOURCE_ENVIRONMENT=$source_environment" >> "$test_config/test_environment.txt"
    echo "BACKUP_ID=$backup_id" >> "$test_config/test_environment.txt"
    echo "TEST_TIMESTAMP=$TIMESTAMP" >> "$test_config/test_environment.txt"
    
    # Create test validation report
    local test_report="$test_dir/validation_report.txt"
    echo "Test Restore Validation Report" > "$test_report"
    echo "===========================" >> "$test_report"
    echo "Backup ID: $backup_id" >> "$test_report"
    echo "Source Environment: $source_environment" >> "$test_report"
    echo "Test Environment: $test_environment" >> "$test_report"
    echo "Test Date: $(date)" >> "$test_report"
    echo "===========================" >> "$test_report"
    echo "" >> "$test_report"
    echo "Components:" >> "$test_report"
    
    # Extract components from manifest for validation
    local components=$(jq -r '.components[]' "$temp_manifest")
    
    # Simulate the test restore
    log_message "INFO" "Simulating test restore of backup components..."
    
    local test_success=true
    
    while IFS= read -r component; do
        local component_type=$(echo "$component" | jq -r '.type')
        
        case "$component_type" in
            "database")
                local instance=$(echo "$component" | jq -r '.instance')
                local backup_id=$(echo "$component" | jq -r '.backup_id')
                echo "Database ($instance): Would restore from $backup_id" >> "$test_report"
                echo "  - Connection test: SIMULATED" >> "$test_report"
                echo "  - Schema validation: SIMULATED" >> "$test_report"
                echo "  - Data integrity: SIMULATED" >> "$test_report"
                ;;
                
            "s3_assets")
                local source_bucket=$(echo "$component" | jq -r '.source_bucket')
                local backup_path=$(echo "$component" | jq -r '.backup_path')
                echo "S3 Assets ($source_bucket): Would restore from $backup_path" >> "$test_report"
                echo "  - File count check: SIMULATED" >> "$test_report"
                echo "  - Content validation: SIMULATED" >> "$test_report"
                ;;
                
            *)
                echo "Unknown component type: $component_type" >> "$test_report"
                test_success=false
                ;;
        esac
    done < <(echo "$components" | jq -c '.')
    
    # Finalize test report
    echo "" >> "$test_report"
    echo "Test Result: $(if [[ "$test_success" = true ]]; then echo "SUCCESS"; else echo "FAILURE"; fi)" >> "$test_report"
    echo "Notes: This was a simulated test. In production, actual restore would be performed." >> "$test_report"
    
    # Clean up
    rm -f "$temp_manifest"
    
    # Output report path
    log_message "INFO" "Test restore simulation completed."
    log_message "INFO" "Test report available at: $test_report"
    
    if [[ "$test_success" = true ]]; then
        log_message "SUCCESS" "Test restore procedure completed successfully"
        return 0
    else
        log_message "ERROR" "Test restore procedure encountered issues"
        return 1
    fi
}

# Main function to parse arguments and execute commands
main() {
    # No arguments provided
    if [[ $# -eq 0 ]]; then
        print_usage
        return 1
    fi
    
    # Parse command
    local command="$1"
    shift
    
    # Parse options
    local environment=""
    local backup_type="full"
    local description=""
    local backup_id=""
    local target_instance=""
    local point_in_time=""
    local resource_type="all"
    local limit=10
    local retention_days=30
    local force=false
    local show_details=false
    local test_environment=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -e|--environment)
                environment="$2"
                shift 2
                ;;
            -t|--type)
                backup_type="$2"
                resource_type="$2"
                shift 2
                ;;
            -d|--description)
                description="$2"
                shift 2
                ;;
            --detail)
                show_details=true
                shift
                ;;
            -b|--backup-id)
                backup_id="$2"
                shift 2
                ;;
            -i|--instance)
                target_instance="$2"
                shift 2
                ;;
            -p|--point-in-time)
                point_in_time="$2"
                shift 2
                ;;
            -n|--limit)
                limit="$2"
                shift 2
                ;;
            -r|--retention)
                retention_days="$2"
                shift 2
                ;;
            -f|--force)
                force=true
                shift
                ;;
            --help)
                print_usage
                return 0
                ;;
            *)
                log_message "ERROR" "Unknown option: $1"
                print_usage
                return 1
                ;;
        esac
    done
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_message "ERROR" "Prerequisites check failed. Cannot proceed."
        return 1
    fi
    
    # Execute command
    case "$command" in
        backup)
            if [[ -z "$environment" ]]; then
                log_message "ERROR" "Environment (-e) must be specified for backup command"
                return 1
            fi
            
            case "$backup_type" in
                full)
                    perform_full_backup "$environment" "$description"
                    ;;
                db)
                    if [[ -z "$target_instance" ]]; then
                        log_message "ERROR" "Instance (-i) must be specified for db backup"
                        return 1
                    fi
                    create_database_backup "$target_instance" "snapshot"
                    ;;
                assets)
                    local config_file="$SCRIPT_DIR/$ENV_CONFIG_PATH/$environment/terraform.tfvars"
                    if [[ -f "$config_file" ]]; then
                        local assets_bucket=$(grep "assets_bucket" "$config_file" | cut -d'=' -f2 | tr -d '" ' | tr -d '\r')
                        if [[ -n "$assets_bucket" ]]; then
                            local assets_backup_dir="$SCRIPT_DIR/backups/$TIMESTAMP/assets"
                            backup_s3_assets "$assets_bucket" "$assets_backup_dir"
                        else
                            log_message "ERROR" "No assets bucket found for environment: $environment"
                            return 1
                        fi
                    else
                        log_message "ERROR" "Environment configuration file not found: $config_file"
                        return 1
                    fi
                    ;;
                *)
                    log_message "ERROR" "Unknown backup type: $backup_type"
                    return 1
                    ;;
            esac
            ;;
            
        restore)
            if [[ -z "$backup_id" ]]; then
                log_message "ERROR" "Backup ID (-b) must be specified for restore command"
                return 1
            fi
            
            if [[ -z "$environment" ]]; then
                log_message "ERROR" "Environment (-e) must be specified for restore command"
                return 1
            fi
            
            perform_full_restore "$backup_id" "$environment"
            ;;
            
        list)
            list_available_backups "$environment" "$resource_type" "$limit"
            ;;
            
        verify)
            if [[ -z "$backup_id" ]]; then
                log_message "ERROR" "Backup ID (-b) must be specified for verify command"
                return 1
            fi
            
            verify_backup "$backup_id" "$show_details"
            ;;
            
        cleanup)
            if [[ -z "$environment" ]]; then
                log_message "ERROR" "Environment (-e) must be specified for cleanup command"
                return 1
            fi
            
            cleanup_old_backups "$environment" "$retention_days" "$force"
            ;;
            
        test)
            if [[ -z "$backup_id" ]]; then
                log_message "ERROR" "Backup ID (-b) must be specified for test command"
                return 1
            fi
            
            if [[ -z "$test_environment" ]]; then
                test_environment="test-restore-$TIMESTAMP"
                log_message "INFO" "Using default test environment: $test_environment"
            fi
            
            test_restore_procedure "$backup_id" "$test_environment"
            ;;
            
        *)
            log_message "ERROR" "Unknown command: $command"
            print_usage
            return 1
            ;;
    esac
    
    return $?
}

# Execute main function with all arguments
main "$@"