# Deployment Guide

## Introduction

This document provides comprehensive deployment instructions for the Interaction Management System, a web application for managing and viewing Interaction records through a searchable table interface (Finder) and a dedicated add/edit form. The system is designed to be deployed to AWS cloud infrastructure using containerization and Infrastructure as Code (IaC) principles.

The Interaction Management System follows a modern architecture with:
- React frontend for the user interface (SPA)
- Flask backend for the API layer
- PostgreSQL for the database
- Redis for caching

This guide covers the deployment process for development, staging, and production environments, using Terraform for infrastructure provisioning and Docker containers for application deployment. It also details the CI/CD pipeline setup using GitHub Actions for automated deployments.

## Prerequisites

### Required Tools

Before beginning the deployment process, ensure you have the following tools installed and properly configured:

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 24.0.5+ | Building and testing containers locally |
| Docker Compose | 2.20.0+ | Local environment setup |
| Terraform | 1.5.4+ | Infrastructure as Code deployment |
| AWS CLI | 2.13.0+ | AWS resource management |
| Git | 2.40.0+ | Source code management |

### Access Requirements

You will need the following accounts and permissions:

1. **AWS Account**:
   - IAM user with programmatic access
   - Permissions to create and manage:
     - VPC and networking resources
     - ECS/Fargate
     - RDS (PostgreSQL)
     - ElastiCache (Redis)
     - S3
     - CloudFront
     - CloudWatch
     - ECR (Elastic Container Registry)
     - IAM roles and policies

2. **GitHub Repository**:
   - Access to the Interaction Management System repository
   - Permissions to manage GitHub Actions workflows
   - Ability to create and manage GitHub Secrets

3. **Auth0 Account**:
   - Admin access to configure authentication settings
   - API credentials for backend integration

4. **SendGrid Account**:
   - API key for email notifications

### Environment Setup

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, default region (e.g., us-east-1), and output format (json).

2. **Set up environment variables**:
   Create a `.env` file for local development with the following variables:
   ```
   # AWS Configuration
   AWS_REGION=us-east-1
   
   # Application Configuration
   APP_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=interaction_management
   DB_USER=admin
   DB_PASSWORD=secure_password
   
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Auth0 Configuration
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_AUDIENCE=your-api-audience
   
   # SendGrid Configuration
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```

3. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/interaction-management-system.git
   cd interaction-management-system
   ```

## Deployment Environments

### Development Environment

The development environment is designed for ongoing development and testing with reduced resources.

**Resource Specifications**:
- Compute: 2 vCPUs
- Memory: 4 GB RAM
- Storage: 20 GB SSD
- Network: 1 Gbps
- Database: db.t3.small (single AZ)
- Cache: cache.t2.micro

**Deployment Pattern**:
- Continuous deployment from feature branches
- Simplified infrastructure with single instances
- Development-specific settings for debugging

### Staging Environment

The staging environment mirrors the production setup but with reduced capacity, used for integration testing and UAT.

**Resource Specifications**:
- Compute: 2 vCPUs
- Memory: 4 GB RAM
- Storage: 50 GB SSD
- Network: 1 Gbps with load balancing
- Database: db.t3.medium with Multi-AZ
- Cache: cache.t3.small with replication

**Deployment Pattern**:
- Deployed on merge to main branch
- Tech lead approval required
- Full infrastructure resembling production
- Staging-specific settings for testing

### Production Environment

The production environment is a highly available deployment with auto-scaling capabilities.

**Resource Specifications**:
- Compute: 4 vCPUs with Auto-scaling (2-6 instances)
- Memory: 8 GB RAM per instance
- Storage: 100 GB SSD + 500 GB Database
- Network: 1 Gbps with load balancing
- Database: db.t3.medium with Multi-AZ
- Cache: cache.t3.small with cluster mode

**Deployment Pattern**:
- Deployed from release branches
- Product owner approval required
- Blue-green deployment strategy
- Multi-AZ deployment for high availability

### Environment Variables

Each environment requires specific configuration variables. These are managed through:

1. **AWS Systems Manager Parameter Store**:
   - For non-sensitive configuration
   - Organized by environment path (/dev/, /staging/, /prod/)

2. **AWS Secrets Manager**:
   - For sensitive data like database credentials and API keys
   - Referenced securely by the application

3. **Environment-specific variable values**:

   | Variable | Development | Staging | Production |
   |----------|-------------|---------|------------|
   | LOG_LEVEL | DEBUG | INFO | INFO |
   | APP_ENV | development | staging | production |
   | DB_INSTANCE_CLASS | db.t3.small | db.t3.medium | db.t3.medium |
   | CACHE_INSTANCE_CLASS | cache.t2.micro | cache.t3.small | cache.t3.small |
   | AUTOSCALING_MIN | 1 | 1 | 2 |
   | AUTOSCALING_MAX | 1 | 2 | 6 |
   | MULTI_AZ_DATABASE | false | true | true |
   | ENABLE_DETAILED_MONITORING | false | true | true |

## Infrastructure Deployment

### Terraform Initialization

1. **Navigate to the Terraform directory**:
   ```bash
   cd terraform
   ```

2. **Initialize Terraform with the appropriate workspace**:
   ```bash
   # For development
   terraform workspace new dev || terraform workspace select dev
   
   # For staging
   terraform workspace new staging || terraform workspace select staging
   
   # For production
   terraform workspace new prod || terraform workspace select prod
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init -backend-config="bucket=interaction-mgmt-tfstate-${terraform.workspace}" -backend-config="key=infrastructure/terraform.tfstate" -backend-config="region=us-east-1"
   ```

### Planning and Validation

1. **Load environment-specific variables**:
   ```bash
   # For development
   terraform plan -var-file="environments/dev.tfvars" -out=tfplan
   
   # For staging
   terraform plan -var-file="environments/staging.tfvars" -out=tfplan
   
   # For production
   terraform plan -var-file="environments/prod.tfvars" -out=tfplan
   ```

2. **Review the plan**:
   Carefully examine the planned changes to ensure they match your expectations.

3. **Validate the configuration**:
   ```bash
   terraform validate
   ```

### Infrastructure Provisioning

1. **Apply the Terraform configuration**:
   ```bash
   terraform apply tfplan
   ```

2. **Record the outputs**:
   Terraform will output important information such as:
   - VPC ID
   - Subnet IDs
   - RDS endpoint
   - ElastiCache endpoint
   - Load balancer DNS name
   - ECS cluster name

   Save these for future reference.

### Infrastructure Verification

After deployment, verify that your infrastructure was correctly provisioned:

1. **Verify VPC and Subnets**:
   ```bash
   aws ec2 describe-vpcs --vpc-ids <vpc_id>
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc_id>"
   ```

2. **Verify RDS instance**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier <rds_identifier>
   ```

3. **Verify ElastiCache cluster**:
   ```bash
   aws elasticache describe-cache-clusters --cache-cluster-id <cache_cluster_id>
   ```

4. **Verify ECS cluster**:
   ```bash
   aws ecs describe-clusters --clusters <cluster_name>
   ```

5. **Verify Load Balancer**:
   ```bash
   aws elbv2 describe-load-balancers --names <lb_name>
   ```

### Infrastructure Updates

To update existing infrastructure:

1. **Pull the latest Terraform code**:
   ```bash
   git pull origin main
   ```

2. **Plan the changes**:
   ```bash
   terraform plan -var-file="environments/${env}.tfvars" -out=tfplan
   ```

3. **Review the planned changes carefully**, especially for:
   - Resource replacements
   - Database modifications
   - Network changes

4. **Apply the changes**:
   ```bash
   terraform apply tfplan
   ```

5. **Verify the updated infrastructure** as described in the previous section.

## Container Deployment

### Building Container Images

1. **Navigate to the project root**:
   ```bash
   cd <project_root>
   ```

2. **Build the frontend container**:
   ```bash
   docker build -t interaction-mgmt-frontend:latest -f docker/frontend/Dockerfile .
   ```

3. **Build the backend container**:
   ```bash
   docker build -t interaction-mgmt-backend:latest -f docker/backend/Dockerfile .
   ```

4. **Test locally (optional)**:
   ```bash
   docker-compose -f docker-compose.local.yml up
   ```

5. **Tag images with version and environment**:
   ```bash
   # Get the short Git hash
   GIT_HASH=$(git rev-parse --short HEAD)
   
   # Tag the images
   docker tag interaction-mgmt-frontend:latest interaction-mgmt-frontend:${VERSION}-${ENV}-${GIT_HASH}
   docker tag interaction-mgmt-backend:latest interaction-mgmt-backend:${VERSION}-${ENV}-${GIT_HASH}
   ```

### Amazon ECR Setup

1. **Create ECR repositories** (if not already created by Terraform):
   ```bash
   aws ecr create-repository --repository-name interaction-mgmt/frontend
   aws ecr create-repository --repository-name interaction-mgmt/backend
   ```

2. **Authenticate Docker to ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
   ```

3. **Tag images for ECR**:
   ```bash
   docker tag interaction-mgmt-frontend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/interaction-mgmt/frontend:${VERSION}-${ENV}-${GIT_HASH}
   docker tag interaction-mgmt-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/interaction-mgmt/backend:${VERSION}-${ENV}-${GIT_HASH}
   ```

4. **Push images to ECR**:
   ```bash
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/interaction-mgmt/frontend:${VERSION}-${ENV}-${GIT_HASH}
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/interaction-mgmt/backend:${VERSION}-${ENV}-${GIT_HASH}
   ```

### Deploying to ECS

1. **Update the ECS task definition**:
   ```bash
   # Replace placeholders with actual values from Terraform output
   # and update image tags to the latest pushed versions
   envsubst < ecs/task-definition-template.json > ecs/task-definition.json
   ```

2. **Register the new task definition**:
   ```bash
   aws ecs register-task-definition --cli-input-json file://ecs/task-definition.json
   ```

3. **Update the service**:
   ```bash
   aws ecs update-service --cluster <cluster_name> --service <service_name> --task-definition <task_definition_family>:<task_definition_revision> --force-new-deployment
   ```

4. **Monitor the deployment**:
   ```bash
   aws ecs describe-services --cluster <cluster_name> --services <service_name>
   ```

### Container Configuration

Container configuration is managed through environment variables passed to the containers at runtime:

1. **Frontend container environment variables**:
   - `REACT_APP_API_URL`: Backend API URL
   - `REACT_APP_AUTH0_DOMAIN`: Auth0 domain
   - `REACT_APP_AUTH0_CLIENT_ID`: Auth0 client ID
   - `REACT_APP_AUTH0_AUDIENCE`: Auth0 API audience
   - `NODE_ENV`: Environment (development, production)

2. **Backend container environment variables**:
   - `APP_ENV`: Application environment
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection details
   - `REDIS_HOST`, `REDIS_PORT`: Redis connection details
   - `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`: Auth0 configuration
   - `LOG_LEVEL`: Logging level
   - `SENDGRID_API_KEY`: SendGrid API key for email notifications

### Manual Deployment

In situations where the CI/CD pipeline is not available, follow these steps for manual deployment:

1. **Build and push container images** as described earlier.

2. **Create a deployment JSON file** (deploy.json):
   ```json
   {
     "cluster": "<cluster_name>",
     "service": "<service_name>",
     "taskDefinition": "<task_definition_family>:<task_definition_revision>",
     "forceNewDeployment": true
   }
   ```

3. **Execute the deployment**:
   ```bash
   aws ecs deploy --cli-input-json file://deploy.json
   ```

4. **Verify the deployment status**:
   ```bash
   aws ecs describe-services --cluster <cluster_name> --services <service_name>
   ```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Configure GitHub Secrets**:
   Navigate to your GitHub repository > Settings > Secrets and add the following secrets:
   - `AWS_ACCESS_KEY_ID`: AWS access key for deployment
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
   - `AWS_REGION`: AWS region (e.g., us-east-1)
   - `ECR_REPOSITORY_FRONTEND`: ECR repository URI for frontend
   - `ECR_REPOSITORY_BACKEND`: ECR repository URI for backend
   - `ECS_CLUSTER`: ECS cluster name
   - `ECS_SERVICE_FRONTEND`: ECS service name for frontend
   - `ECS_SERVICE_BACKEND`: ECS service name for backend
   - `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state

2. **Enable GitHub Actions**:
   Ensure the Actions tab is enabled in your repository settings.

3. **Configure branch protection rules**:
   - For `main` branch: Require pull request reviews and status checks
   - For `release/*` branches: Require approvals for production deployments

### Development Pipeline

The development pipeline automatically deploys feature branches to the development environment:

1. **Workflow trigger**:
   - Push to feature branch
   - Pull request created/updated

2. **Pipeline steps**:
   - Checkout code
   - Run unit tests
   - Build Docker images
   - Push to ECR with feature branch tag
   - Deploy to development ECS cluster

3. **Workflow configuration** (.github/workflows/dev-deploy.yml):
   ```yaml
   name: Development Deployment
   
   on:
     push:
       branches:
         - 'feature/**'
     pull_request:
       branches:
         - main
   
   jobs:
     test-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout code
           uses: actions/checkout@v3
         
         # Test steps...
         
         - name: Configure AWS credentials
           uses: aws-actions/configure-aws-credentials@v1
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: ${{ secrets.AWS_REGION }}
         
         - name: Login to Amazon ECR
           id: login-ecr
           uses: aws-actions/amazon-ecr-login@v1
         
         # Build and push images...
         
         # Update ECS services...
   ```

### Staging Pipeline

The staging pipeline deploys the `main` branch to the staging environment after approval:

1. **Workflow trigger**:
   - Push to main branch
   - Manual approval by tech lead

2. **Pipeline steps**:
   - Checkout code
   - Run unit and integration tests
   - Build Docker images
   - Push to ECR with staging tag
   - Apply Terraform for staging
   - Deploy to staging ECS cluster

3. **Workflow configuration** (.github/workflows/staging-deploy.yml):
   ```yaml
   name: Staging Deployment
   
   on:
     push:
       branches:
         - main
     workflow_dispatch:
   
   jobs:
     deploy-to-staging:
       runs-on: ubuntu-latest
       environment: staging
       steps:
         # Similar steps as development pipeline
         # with additional approval environment
   ```

### Production Pipeline

The production pipeline deploys release branches to production with formal approval:

1. **Workflow trigger**:
   - Push to release/* branch
   - Manual approval by product owner

2. **Pipeline steps**:
   - Checkout code
   - Run all tests including E2E
   - Build Docker images
   - Push to ECR with production tag
   - Apply Terraform for production
   - Deploy to production ECS cluster with blue-green strategy

3. **Workflow configuration** (.github/workflows/prod-deploy.yml):
   ```yaml
   name: Production Deployment
   
   on:
     push:
       branches:
         - 'release/**'
     workflow_dispatch:
   
   jobs:
     deploy-to-production:
       runs-on: ubuntu-latest
       environment: production
       steps:
         # Similar steps as staging pipeline
         # with additional blue-green deployment steps
   ```

### Blue-Green Deployment Process

The production environment uses a blue-green deployment strategy for zero-downtime updates:

1. **Preparation**:
   - Current "blue" environment is serving production traffic
   - New "green" environment is prepared with the new version

2. **Deployment process**:
   ```bash
   # 1. Register a new task definition with the new image
   aws ecs register-task-definition --cli-input-json file://ecs/task-definition.json
   
   # 2. Create a new "green" target group
   aws elbv2 create-target-group --name <green-target-group> --protocol HTTP --port 80 --vpc-id <vpc-id> --health-check-path /health
   
   # 3. Update service to use the new task definition with the green target group
   aws ecs update-service --cluster <cluster> --service <service> --task-definition <new-task-def> --load-balancers targetGroupArn=<green-target-group-arn>,containerName=<container>,containerPort=<port>
   
   # 4. Wait for the service to stabilize
   aws ecs wait services-stable --cluster <cluster> --services <service>
   
   # 5. Modify the load balancer listener to forward traffic to the green target group
   aws elbv2 modify-listener --listener-arn <listener-arn> --default-actions Type=forward,TargetGroupArn=<green-target-group-arn>
   
   # 6. Monitor for any issues
   # If issues are detected, rollback by switching listener back to blue target group
   ```

3. **Verification**:
   - Automated health checks verify the new version
   - Traffic gradually shifts to the green environment

4. **Finalization**:
   - Once the green environment is stable, the blue environment is deprecated
   - The old blue environment becomes available for the next deployment

### Pipeline Variables and Secrets

Manage environment variables and secrets for the pipelines using:

1. **GitHub Environments**:
   - Create environments for "development", "staging", and "production"
   - Configure environment-specific secrets
   - Set required reviewers for protected environments

2. **GitHub Repository Secrets**:
   - Store global secrets like AWS credentials

3. **Environment Variables**:
   - Use environment files per environment
   - Pass variables via the workflow files

4. **Secret Rotation**:
   - Implement a quarterly secret rotation policy
   - Update GitHub secrets after rotation

## Verification and Monitoring

### Health Checks

Verify the health of deployed services using built-in health check endpoints:

1. **Frontend health check**:
   ```bash
   curl -I https://<frontend-url>/health
   ```

2. **Backend health check**:
   ```bash
   curl https://<api-url>/api/health
   ```

3. **Database health check**:
   ```bash
   curl https://<api-url>/api/health/db
   ```

4. **Automated health checks**:
   - Configure load balancer health checks
   - Set up CloudWatch alarms for health check failures
   - Create a health check dashboard

### Smoke Testing

Perform these basic tests after deployment to verify functionality:

1. **Authentication test**:
   ```bash
   # Request authentication using the API
   curl -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test"}' https://<api-url>/api/auth/login
   ```

2. **Interaction retrieval test**:
   ```bash
   # Retrieve interactions (requires auth token)
   curl -H "Authorization: Bearer <token>" https://<api-url>/api/interactions
   ```

3. **Automated smoke tests** with Postman or similar tool:
   - Create a collection of essential API tests
   - Run after each deployment
   - Set failure thresholds for deployment validation

### Monitoring Setup

Set up CloudWatch dashboards and alarms for system monitoring:

1. **Create a CloudWatch dashboard**:
   ```bash
   aws cloudwatch put-dashboard --dashboard-name InteractionManagementSystem --dashboard-body file://cloudwatch/dashboard.json
   ```

2. **Set up key metric alarms**:
   - API response time > 500ms for 5 minutes
   - Error rate > 1% for 5 minutes
   - CPU utilization > 70% for 10 minutes
   - Memory usage > 75% for 10 minutes

3. **Configure alarm notifications** via SNS:
   ```bash
   aws sns create-topic --name InteractionManagementAlarms
   aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint alerts@example.com
   ```

### Logs and Diagnostics

Access and analyze application logs in CloudWatch:

1. **View backend logs**:
   ```bash
   aws logs get-log-events --log-group-name /ecs/interaction-management-backend --log-stream-name <log-stream-id>
   ```

2. **Filter logs for errors**:
   ```bash
   aws logs filter-log-events --log-group-name /ecs/interaction-management-backend --filter-pattern "ERROR"
   ```

3. **Set up log insights queries** for common diagnostics:
   - Error frequency analysis
   - Slow API endpoint identification
   - Authentication failure tracking

### Performance Verification

Methods to verify system performance meets requirements:

1. **Response time monitoring**:
   - Set up CloudWatch metrics for API endpoint response times
   - Verify 95% of responses are under 500ms

2. **Load testing** (for staging environment only):
   ```bash
   # Using k6 (or similar load testing tool)
   k6 run -e API_URL=https://<staging-api-url> load-tests/find-interactions.js
   ```

3. **Resource utilization monitoring**:
   - Track CPU, memory usage against expected baselines
   - Monitor database connection count and query performance

## Troubleshooting

### Common Infrastructure Issues

| Issue | Solution |
|-------|----------|
| Terraform apply fails with state lock | `terraform force-unlock <lock-id>` |
| VPC peering connection issues | Check route tables and security groups |
| IAM permission denied | Verify IAM role permissions and trust relationships |
| S3 access denied | Check bucket policy and IAM permissions |

### Container Deployment Problems

| Issue | Solution |
|-------|----------|
| Container fails to start | Check CloudWatch logs for startup errors |
| Container exits immediately | Verify environment variables and connection strings |
| Out of memory errors | Increase task memory allocation |
| Image pull failures | Check ECR permissions and image tag |

### CI/CD Pipeline Failures

| Issue | Solution |
|-------|----------|
| GitHub Actions workflow fails | Check action logs for specific error messages |
| AWS authentication failures | Verify GitHub secrets for AWS credentials |
| Test failures blocking deployment | Fix failing tests before retrying |
| Terraform validation errors | Ensure resource names and configurations are valid |

### Database Migration Issues

| Issue | Solution |
|-------|----------|
| Migration fails to apply | Check migration logs for SQL errors |
| Data inconsistency after migration | Verify migration scripts and consider a rollback |
| Connection failures during migration | Check security groups and network connectivity |
| Lock timeout during migration | Consider adjusting lock timeout parameters or scheduling during low-usage periods |

### Rollback Procedures

If issues are detected in a deployment, follow these rollback procedures:

1. **Immediate rollback to previous version**:
   ```bash
   # For blue-green deployments
   aws elbv2 modify-listener --listener-arn <listener-arn> --default-actions Type=forward,TargetGroupArn=<previous-target-group-arn>
   
   # For standard deployments
   aws ecs update-service --cluster <cluster> --service <service> --task-definition <previous-task-definition>
   ```

2. **Database rollback**:
   - If database changes were involved, restore from the point-in-time backup
   ```bash
   aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier <db-instance> --target-db-instance-identifier <db-instance>-restore --restore-time <timestamp>
   ```

3. **Infrastructure rollback**:
   ```bash
   # Revert to previous Terraform state
   terraform workspace select <environment>
   terraform plan -destroy -target=<problem_resource> -out=rollback.tfplan
   terraform apply rollback.tfplan
   ```

4. **Communication procedure**:
   - Notify stakeholders of the issue and rollback
   - Document the incident for post-mortem analysis
   - Schedule a fix for the identified issue

## Appendix

### AWS Resource Reference

| Resource | Purpose | Configuration Notes |
|----------|---------|---------------------|
| VPC | Network isolation | CIDR block: 10.0.0.0/16 |
| Subnets | Network segmentation | Public, private app, private data subnets across AZs |
| Security Groups | Access control | Restrictive inbound rules, specific outbound rules |
| RDS | Database storage | Multi-AZ for production, automated backups |
| ElastiCache | Session and data caching | Redis engine, encryption at rest |
| ECS | Container orchestration | Fargate for serverless container management |
| ECR | Container registry | Lifecycle policies to manage image versions |
| S3 | Static asset storage | CloudFront distribution for edge caching |
| CloudWatch | Monitoring and logging | Custom dashboards, alarms, log retention |

### Environment Variable Reference

Complete list of all environment variables used across environments:

**Application Environment Variables**:
- `APP_ENV`: Application environment (development, staging, production)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, ERROR)

**Database Configuration**:
- `DB_HOST`: Database hostname
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_INSTANCE_CLASS`: RDS instance class
- `MULTI_AZ_DATABASE`: Enable Multi-AZ deployment

**Redis Configuration**:
- `REDIS_HOST`: Redis hostname
- `REDIS_PORT`: Redis port (default: 6379)
- `CACHE_INSTANCE_CLASS`: ElastiCache instance class

**Auth0 Configuration**:
- `AUTH0_DOMAIN`: Auth0 tenant domain
- `AUTH0_CLIENT_ID`: Auth0 application client ID
- `AUTH0_CLIENT_SECRET`: Auth0 application client secret
- `AUTH0_AUDIENCE`: Auth0 API audience

**AWS Configuration**:
- `AWS_REGION`: AWS region for deployment
- `AUTOSCALING_MIN`: Minimum instances for auto-scaling
- `AUTOSCALING_MAX`: Maximum instances for auto-scaling
- `ENABLE_DETAILED_MONITORING`: Enable detailed CloudWatch monitoring

**Frontend Configuration**:
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_AUTH0_DOMAIN`: Auth0 domain for frontend
- `REACT_APP_AUTH0_CLIENT_ID`: Auth0 client ID for frontend
- `REACT_APP_AUTH0_AUDIENCE`: Auth0 API audience for frontend
- `NODE_ENV`: Node environment (development, production)

**Email Configuration**:
- `SENDGRID_API_KEY`: SendGrid API key for email notifications

### Command Reference

Common commands used for deployment and management:

**Terraform Commands**:
```bash
# Initialize Terraform
terraform init

# Create/select workspace
terraform workspace new/select <environment>

# Plan deployment
terraform plan -var-file="environments/<env>.tfvars" -out=tfplan

# Apply deployment
terraform apply tfplan

# Destroy resources
terraform destroy -var-file="environments/<env>.tfvars"
```

**Docker Commands**:
```bash
# Build images
docker build -t <image-name>:<tag> -f <dockerfile> .

# Run locally
docker-compose -f docker-compose.local.yml up

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-repo>
docker tag <image-name>:<tag> <ecr-repo>:<tag>
docker push <ecr-repo>:<tag>
```

**AWS CLI Commands**:
```bash
# ECS deployment
aws ecs update-service --cluster <cluster> --service <service> --task-definition <task-def> --force-new-deployment

# View logs
aws logs get-log-events --log-group-name <log-group> --log-stream-name <stream>

# Check RDS status
aws rds describe-db-instances --db-instance-identifier <db-instance>

# Create/update CloudWatch alarm
aws cloudwatch put-metric-alarm --alarm-name <name> --metric-name <metric> --namespace <namespace> --threshold <value> --comparison-operator <operator> --evaluation-periods <periods> --period <seconds> --statistic <statistic> --alarm-actions <actions>
```

### Additional Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Auth0 Documentation](https://auth0.com/docs/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)