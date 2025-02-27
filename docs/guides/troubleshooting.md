# Troubleshooting Guide

## Introduction

This guide provides troubleshooting steps for common issues encountered in the Interaction Management System. It covers authentication problems, site context issues, interaction management errors, API and database connectivity problems, and more.

## Authentication Issues

### Login Failures

**Problem**: Unable to log in to the system.

**Possible Causes**:
- Incorrect username or password
- Account locked after 5 failed attempts
- User account inactive

**Solutions**:
1. Verify credentials are correct
2. Check for 'Account locked' message and contact administrator
3. Ensure account is active in the system
4. Clear browser cache and cookies
5. Try incognito/private browsing mode

### Session Expiration

**Problem**: Unexpectedly logged out or seeing 'Session expired' messages.

**Possible Causes**:
- JWT token has reached its 24-hour expiration
- Browser storage cleared during session
- Server-side session invalidation

**Solutions**:
1. Log in again to obtain a new token
2. Check if browser is set to clear cookies on close
3. Verify system time synchronization

### Authentication Service Issues

**Problem**: Authentication service unavailable error.

**Possible Causes**:
- Auth0 service disruption
- Network connectivity problems
- Configuration errors

**Solutions**:
1. Check Auth0 status page for service disruptions
2. Verify network connectivity to authentication endpoints
3. Review auth service logs in CloudWatch
4. Validate Auth0 configuration parameters

## Site Context Issues

### No Sites Available

**Problem**: After login, no sites are available for selection.

**Possible Causes**:
- User not associated with any sites
- All associated sites are inactive
- Site data not loading properly

**Solutions**:
1. Administrator should assign user to at least one site
2. Verify site status in the database
3. Check network requests for site loading errors in browser console
4. Verify site context is being properly retrieved from the API

### Site Switching Problems

**Problem**: Unable to switch between sites or site context not updating correctly.

**Possible Causes**:
- Frontend state not updating
- API errors when setting site context
- Permission issues for target site

**Solutions**:
1. Refresh the page after switching sites
2. Check network tab for API errors during site switching
3. Verify user has permissions for the selected site
4. Review SiteContext implementation in the codebase

## Interaction Management Issues

### Form Validation Errors

**Problem**: Cannot save interaction due to validation errors.

**Possible Causes**:
- Required fields missing
- Invalid date range (end before start)
- Field format or length requirements not met

**Solutions**:
1. Check for highlighted fields with error messages
2. Ensure end date/time is after start date/time
3. Verify all required fields are completed
4. Check field length and format requirements
5. Consult browser console for detailed validation errors

### Search and Filter Issues

**Problem**: Search returns unexpected or no results.

**Possible Causes**:
- Search terms too specific or contain typos
- Site context limiting visible interactions
- Database indexing issues
- Filter combination too restrictive

**Solutions**:
1. Try broader search terms
2. Verify current site context is appropriate for expected data
3. Clear all filters and try again
4. Check if pagination is hiding results (try changing page)
5. Verify search is working in API directly

### Interaction Save Failures

**Problem**: Unable to save new or edited interactions.

**Possible Causes**:
- API endpoint errors
- Database constraints violation
- Network connectivity issues
- Server validation failures

**Solutions**:
1. Check browser console for specific error messages
2. Verify network connectivity
3. Check server logs for detailed error information
4. Verify all required fields have valid values
5. Check for unique constraint violations

## API and Backend Issues

### Common API Error Codes

**401 Unauthorized**:
- JWT token missing, invalid, or expired
- Solution: Log out and log back in to refresh token

**403 Forbidden**:
- User lacks permission for the requested resource
- Solution: Verify user has appropriate site access and permissions

**404 Not Found**:
- Requested resource doesn't exist
- Solution: Verify resource ID and API endpoint path

**422 Validation Error**:
- Request data failed validation
- Solution: Check request payload against API requirements

**500 Internal Server Error**:
- Unhandled exception in server code
- Solution: Check server logs for detailed error information

### Database Connection Issues

**Problem**: API returns database connection errors.

**Possible Causes**:
- Database server unavailable
- Connection pool exhausted
- Credentials or configuration issues

**Solutions**:
1. Verify database health via `/health/db` endpoint
2. Check database server status in AWS console
3. Review connection pool settings for saturation
4. Check database credentials and configuration
5. Verify network connectivity between app and database

### Performance Issues

**Problem**: API responses are unusually slow.

**Possible Causes**:
- Inefficient database queries
- Resource constraints
- Large result sets without pagination
- Missing database indexes

**Solutions**:
1. Check CloudWatch metrics for resource utilization
2. Verify queries are using appropriate indexes
3. Implement pagination for large result sets
4. Review query execution plans
5. Scale resources if consistently under high load

## Frontend Issues

### Rendering Problems

**Problem**: UI elements not displaying correctly or visual glitches.

**Possible Causes**:
- CSS conflicts
- JavaScript errors
- Incompatible browser version
- Missing assets

**Solutions**:
1. Check browser console for JavaScript errors
2. Clear browser cache and reload
3. Try different browser to isolate compatibility issues
4. Verify assets are loading correctly (network tab)
5. Check responsive design at different screen sizes

### Client-Side Performance Issues

**Problem**: UI feels sluggish or unresponsive.

**Possible Causes**:
- Excessive re-renders
- Large datasets in memory
- Heavy computations on main thread
- Memory leaks

**Solutions**:
1. Use React DevTools to identify performance bottlenecks
2. Implement virtualization for large tables
3. Optimize component rendering with memoization
4. Move heavy processing to web workers
5. Monitor memory usage for leaks

## Deployment and Infrastructure Issues

### CI/CD Pipeline Failures

**Problem**: Deployment pipeline failing.

**Possible Causes**:
- Test failures
- Build errors
- Environment configuration issues
- Infrastructure provisioning failures

**Solutions**:
1. Check GitHub Actions logs for specific error messages
2. Verify tests pass locally before pushing
3. Review environment configuration variables
4. Check infrastructure resources for availability
5. Consult the deployment pipeline documentation

### Container Issues

**Problem**: Docker containers fail to start or crash.

**Possible Causes**:
- Missing environment variables
- Resource constraints
- Image compatibility issues
- Dependency problems

**Solutions**:
1. Check container logs for specific errors
2. Verify all required environment variables are set
3. Ensure container has sufficient resources
4. Validate base image and dependency versions
5. Test container locally before deployment

### Environment Configuration

**Problem**: Application behaves differently across environments.

**Possible Causes**:
- Environment variable differences
- Resource allocation variations
- Service version inconsistencies
- Infrastructure differences

**Solutions**:
1. Compare environment variables across environments
2. Review resource allocation in each environment
3. Ensure consistent service versions
4. Check for environment-specific code paths
5. Validate infrastructure configuration

## Using Monitoring Tools for Troubleshooting

### Accessing Logs

**CloudWatch Logs**:
- Navigate to AWS CloudWatch console > Log Groups
- Select appropriate log group:
  - `/aws/lambda/interaction-api-{env}` for API logs
  - `/ecs/interaction-frontend-{env}` for frontend container logs
  - `/rds/postgresql/{instance-id}` for database logs

**Local Development Logs**:
- Backend: Check console output or `logs/` directory
- Frontend: Browser console (F12 or Ctrl+Shift+J)

**Log Analysis**:
- Use CloudWatch Logs Insights for complex queries
- Filter logs by correlation ID to trace requests
- Search for ERROR level messages for critical issues

### Monitoring Dashboards

**Available Dashboards**:

1. **Operations Dashboard**:
   - Overall system health
   - Component status
   - Resource utilization
   - Access at: CloudWatch > Dashboards > operations

2. **Application Dashboard**:
   - API performance metrics
   - Error rates by endpoint
   - Request volume
   - Access at: CloudWatch > Dashboards > application

3. **Database Dashboard**:
   - Query performance
   - Connection statistics
   - Resource utilization
   - Access at: CloudWatch > Dashboards > database

**Using Dashboards for Troubleshooting**:
- Check for correlated spikes in error rates and resource usage
- Review performance metrics during reported issues
- Compare current metrics with historical baselines

### Health Check Endpoints

The system provides health check endpoints to verify component status:

- `/health`: Overall system health
- `/health/db`: Database connectivity check
- `/health/auth`: Authentication service check
- `/health/storage`: Storage service check

These endpoints return status information that can help isolate issues to specific components.

## Common Error Codes Reference

**Authentication Errors**:
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Account locked
- `AUTH_003`: Token expired
- `AUTH_004`: Invalid token

**Authorization Errors**:
- `AUTHZ_001`: Insufficient permissions
- `AUTHZ_002`: Invalid site context
- `AUTHZ_003`: Site access denied

**Validation Errors**:
- `VAL_001`: Missing required field
- `VAL_002`: Invalid field format
- `VAL_003`: Date range invalid
- `VAL_004`: Value out of range

**Database Errors**:
- `DB_001`: Connection failed
- `DB_002`: Query timeout
- `DB_003`: Constraint violation

**System Errors**:
- `SYS_001`: Internal server error
- `SYS_002`: Service unavailable
- `SYS_003`: Dependency failure
- `SYS_004`: Rate limit exceeded

## Getting Additional Help

If you're still experiencing issues after following this guide:

**For System Users**:
- Contact your site administrator
- Submit a support ticket through the internal system
- Include error messages, steps to reproduce, and screenshots

**For Developers**:
- Check project documentation in the `/docs` directory
- Review relevant code and tests
- Submit an issue in the GitHub repository with:
  - Detailed description of the problem
  - Steps to reproduce
  - Environment information
  - Logs and error messages
  - Screenshots if applicable