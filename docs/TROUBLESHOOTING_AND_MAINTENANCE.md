# Spektif Agency Troubleshooting and Maintenance Guide

## Common Issues and Solutions

### Database Connection Issues

#### Issue: Functions Using Wrong Database (CRITICAL)
**Date Resolved**: September 14, 2025  
**Symptoms**: 
- Functions successfully deploy and report success
- Firebase console shows data in unexpected database location
- Tables/migrations appear in `(default)` database (US servers) instead of intended `spektif` database (EU4)
- Application functionality appears broken despite successful function execution

**Root Cause**: 
- **Primary Issue**: Incorrect getFirestore() syntax in functions code
- **Secondary Issue**: TypeScript compilation errors preventing proper deployment
- **Tertiary Issue**: Cached/outdated compiled JavaScript being deployed

**The Problem in Detail**:
```typescript
// WRONG - This was causing the issue
const db = getFirestore(admin.app(), { databaseId: "spektif" });

// CORRECT - This is the proper syntax
const db = getFirestore(admin.app(), "spektif");
```

**User's Note**: *"This was one of the biggest obstacles we faced - the functions would report success but data would appear in the wrong database location, making it seem like everything was working when it wasn't."*

**Complete Solution Process**:
1. **Identify the Issue**:
   ```bash
   # Check which database functions are actually using
   curl https://your-function-url/testFirestore
   # Look for "databaseId" in response
   ```

2. **Fix the Code**:
   ```typescript
   // In functions/src/index.ts
   // Change from:
   const db = getFirestore(admin.app(), { databaseId: "spektif" });
   
   // To:
   const db = getFirestore(admin.app(), "spektif");
   ```

3. **Fix TypeScript Compilation Issues**:
   ```bash
   cd functions
   npm run build  # This will show any TypeScript errors
   # Fix all compilation errors before deployment
   ```

4. **Deploy Corrected Functions**:
   ```bash
   firebase deploy --only functions
   ```

5. **Verify Fix**:
   ```bash
   # Test database connection
   curl https://your-function-url/testFirestore
   # Should now show "databaseId": "spektif"
   
   # Test data creation
   curl -X POST https://your-function-url/seedDatabase
   # Check Firebase console for data in correct database
   ```

**Warning Signs to Watch For**:
- Functions deploy successfully but data doesn't appear where expected
- testFirestore endpoint returns wrong database ID
- TypeScript compilation errors during build process
- Response shows `"databaseId": "spektif-agency"` or `"databaseId": "(default)"` instead of `"spektif"`

**Prevention**:
- Always run `npm run build` in functions directory before deployment
- Verify database connection immediately after deployment
- Use proper TypeScript syntax for getFirestore() calls
- Monitor which database is actually being used via test endpoints

#### Issue: "5 NOT_FOUND" Error
**Symptoms**: Functions return 5 NOT_FOUND error when accessing Firestore
**Root Cause**: Incorrect database ID configuration or region mismatch
**Solution**:
```bash
# Check current database configuration
firebase functions:config:get

# Set correct database ID
firebase functions:config:set firestore.database_id=spektif-agency

# Redeploy functions
firebase deploy --only functions
```

#### Issue: Cross-Region Latency
**Symptoms**: Slow database responses despite correct configuration
**Root Cause**: Functions and database in different regions
**Solution**:
```bash
# Verify database region
firebase firestore:databases:get spektif-agency

# Ensure functions deploy to same region
# Update firebase.json and setGlobalOptions in functions code
```

### Function Deployment Issues

#### Issue: Functions Deploy to Wrong Region
**Symptoms**: Functions appear in us-central1 despite europe-west4 configuration
**Root Cause**: Incomplete region configuration
**Solution**:
```typescript
// In functions/src/index.ts
setGlobalOptions({ 
  maxInstances: 10,
  region: 'europe-west4'
});
```
```json
// In firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs22",
    "region": "europe-west4"
  }
}
```

#### Issue: Function Cold Starts
**Symptoms**: First request to function takes 5-10 seconds
**Root Cause**: Firebase Functions cold start behavior
**Solution**:
- Implement function warming strategy
- Use Firebase Functions concurrency settings
- Consider upgrading to higher memory allocation

### Authentication Issues

#### Issue: NextAuth Session Errors
**Symptoms**: Users cannot maintain login sessions
**Root Cause**: Incorrect NEXTAUTH_URL or secret configuration
**Solution**:
```env
NEXTAUTH_URL=https://spektif-agency-final.vercel.app
NEXTAUTH_SECRET=spektif-agency-secret-key-production-2024-hardcoded
```

#### Issue: Firebase Auth Token Validation
**Symptoms**: Backend rejects valid authentication tokens
**Root Cause**: Token verification configuration issues
**Solution**:
- Verify Firebase Admin SDK initialization
- Check service account key configuration
- Validate token expiration settings

### Performance Issues

#### Issue: Slow API Responses
**Symptoms**: API calls take 2+ seconds to complete
**Root Cause**: Various factors including region, database queries, function configuration
**Diagnostic Steps**:
```bash
# Test function health
curl https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/health

# Test database connectivity
curl https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/testFirestore

# Check function logs
firebase functions:log --only functionName
```

#### Issue: Database Query Optimization
**Symptoms**: Specific queries are slow
**Root Cause**: Inefficient Firestore query patterns
**Solution**:
- Create composite indexes for complex queries
- Optimize query structure for Firestore
- Implement pagination for large result sets

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
1. **Monitor Function Performance**
   ```bash
   firebase functions:log --limit 100
   ```

2. **Check Database Usage**
   - Review Firestore usage in Firebase Console
   - Monitor read/write operations
   - Check storage usage

3. **Verify System Health**
   ```bash
   curl https://europe-west4-spektif-agency-final-prod.cloudfunctions.net/health
   ```

#### Monthly Tasks
1. **Review Security Rules**
   - Audit Firestore security rules
   - Update access patterns as needed
   - Test security rule effectiveness

2. **Performance Analysis**
   - Review function execution times
   - Analyze database query patterns
   - Identify optimization opportunities

3. **Backup Verification**
   - Test data export procedures
   - Verify backup integrity
   - Update disaster recovery procedures

#### Quarterly Tasks
1. **Dependency Updates**
   ```bash
   cd functions
   npm audit
   npm update
   ```

2. **Security Audit**
   - Review authentication mechanisms
   - Update API keys and secrets
   - Audit user access patterns

3. **Capacity Planning**
   - Review usage trends
   - Plan for scaling requirements
   - Update resource allocations

### Emergency Procedures

#### Database Recovery
**Scenario**: Database corruption or accidental data deletion
**Steps**:
1. **Immediate Response**
   ```bash
   # Stop all write operations
   # Deploy read-only security rules if necessary
   ```

2. **Assessment**
   - Identify scope of data loss
   - Determine recovery point objective
   - Assess available backup options

3. **Recovery**
   ```bash
   # Export current state
   gcloud firestore export gs://backup-bucket/emergency-backup

   # Import from previous backup if available
   gcloud firestore import gs://backup-bucket/previous-backup
   ```

#### Function Outage
**Scenario**: All functions become unavailable
**Steps**:
1. **Immediate Response**
   - Check Firebase status page
   - Verify function deployment status
   - Review recent changes

2. **Diagnosis**
   ```bash
   firebase functions:list
   firebase functions:log --limit 50
   ```

3. **Recovery**
   ```bash
   # Redeploy functions
   firebase deploy --only functions

   # If deployment fails, rollback to previous version
   # (Manual process - maintain version control)
   ```

#### Security Breach
**Scenario**: Unauthorized access detected
**Steps**:
1. **Immediate Response**
   - Revoke compromised API keys
   - Update security rules to deny all access temporarily
   - Change authentication secrets

2. **Investigation**
   - Review access logs
   - Identify breach vector
   - Assess data exposure

3. **Recovery**
   - Implement security fixes
   - Update authentication mechanisms
   - Restore normal operations with enhanced security

### Monitoring and Alerting

#### Key Metrics to Monitor
1. **Function Performance**
   - Execution time
   - Error rate
   - Cold start frequency
   - Memory usage

2. **Database Performance**
   - Read/write operations per second
   - Query latency
   - Storage usage
   - Index usage

3. **User Experience**
   - Authentication success rate
   - API response times
   - Error rates by endpoint

#### Alerting Thresholds
- Function error rate > 5%
- API response time > 2 seconds
- Database query time > 1 second
- Storage usage > 80% of quota
- Function execution failures > 10 per hour

### Scaling Considerations

#### Horizontal Scaling
**Firebase Functions**: Automatic scaling up to configured max instances
**Firestore**: Automatic scaling with usage-based pricing
**Frontend**: Vercel automatic scaling

#### Vertical Scaling
**Function Memory**: Increase from 256Mi to 512Mi or 1Gi for memory-intensive operations
**Function Timeout**: Increase from 60s to 300s for long-running operations
**Concurrent Instances**: Increase max instances for high-traffic periods

#### Cost Optimization
1. **Function Optimization**
   - Minimize cold starts
   - Optimize memory usage
   - Reduce execution time

2. **Database Optimization**
   - Minimize read operations
   - Use efficient query patterns
   - Implement caching where appropriate

3. **Storage Optimization**
   - Compress uploaded files
   - Implement file lifecycle policies
   - Use appropriate storage classes

### Development and Deployment Best Practices

#### Code Quality
- Implement comprehensive error handling
- Use TypeScript for type safety
- Follow Firebase Functions best practices
- Implement proper logging

#### Testing Strategy
```bash
# Local testing with emulators
firebase emulators:start

# Function testing
cd functions && npm test

# Integration testing
# (Implement automated API testing)
```

#### Deployment Process
1. **Pre-deployment Checks**
   - Run tests
   - Review code changes
   - Check configuration updates

2. **Deployment**
   ```bash
   # Build functions
   cd functions && npm run build

   # Deploy to production
   firebase deploy --only functions
   ```

3. **Post-deployment Verification**
   - Test critical endpoints
   - Monitor function logs
   - Verify system health

This troubleshooting guide provides comprehensive coverage of common issues and maintenance procedures for the Spektif Agency Firebase deployment. Regular use of these procedures will ensure system reliability and optimal performance.
