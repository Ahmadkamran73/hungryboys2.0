# 🔒 Google Sheets Security Guide

## Current Setup Status
✅ **Service Account**: Working with backend proxy  
✅ **Spreadsheet**: Accessible via service account  
⚠️ **Security**: Needs immediate attention  

## 🚨 URGENT: Secure Your Spreadsheet

### 1. Remove Public Access
**Current Issue**: Your spreadsheet is editable by "anyone with the link"

**Steps to Fix:**
1. Open your Google Spreadsheet: `1VCvhWcx3vOtxeiPe5KuWuDIbWSKfvRZkv4Y1P_M6QuM`
2. Click **"Share"** button (top right)
3. Click **"Change to anyone with the link"**
4. **Remove** the "anyone with the link" access
5. Click **"Done"**

### 2. Add Service Account Access Only
1. In the same Share dialog, click **"Add people and groups"**
2. Add your service account email: `hungry-boys-sheets-writer@hungry-boys-465704.iam.gserviceaccount.com`
3. Set permission to **"Editor"**
4. **Uncheck** "Notify people" (service accounts don't need notifications)
5. Click **"Share"**

## 🔐 Secure Your Service Account

### 1. Restrict Service Account Permissions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"IAM & Admin" > "Service Accounts"**
3. Find your service account: `hungry-boys-sheets-writer@hungry-boys-465704.iam.gserviceaccount.com`
4. Click on it and go to **"Permissions"** tab
5. Ensure it only has these roles:
   - **"Editor"** (for the specific project)
   - **"Service Account User"** (if needed)

### 2. Remove Unnecessary Permissions
- Remove any **"Owner"** or **"Admin"** roles
- Remove any **"Viewer"** roles on other projects
- Keep only the minimum required permissions

### 3. Secure the Credentials File
**Current Location**: `backend/credentials.json`

**Security Actions:**
1. **Add to .gitignore** (if not already there):
   ```
   # Google Service Account
   backend/credentials.json
   backend/*.json
   ```

2. **Set proper file permissions** (on Linux/Mac):
   ```bash
   chmod 600 backend/credentials.json
   ```

3. **Environment Variable Alternative** (Recommended):
   - Convert credentials.json to base64
   - Store as environment variable
   - Update backend to use environment variable

## 🌐 Production Deployment Security

### 1. Environment Variables Setup
Create a `.env` file in your backend directory:

```env
# Google Sheets Configuration
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiaHVuZ3J5LWJveXMtNDY1NzA0IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiMTdiMWM1OTdmZjI4NmFhM2QyZjQxMDJjNDI5ZDE3NGJkMDhhMGQ0YSIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFDbDBDZU5ncVVSNTFLSFxucTAzeU9BOVdmaGdPUjdXQnBKR2s0RWJ4Z1BmTHYvaituREJQMzlORjNpOUNBdjZPMXZrdktOWURjOUw1ZTNZVFxuL2o2SWY0dVkwREN2clJhMnF5VitTMlIrMDhaeFZ0NkpLQmpuQk5nWkN2OXNmaElORXUvZHdsUjg2Ukp5VndOWlxuNmhmZUc5YTVGZ0RlclJHK280dmI5byswNFpXVUFlTnQzRW9jM1lsUnhKODA2bk44SjNvUzh0RWUremxtWlpjN1xuK1B1dUtZSEt3VjN0SS9Gazg0aUJKYlVRK3NvWCtERGZDL29CRC9XSmVPUm1ySTZpV1BNb2I3MFNVMmI3eDFBYlxuS3Y1M25URzJUK0pFS2FjbW1lcmN2YlFkSkdleVl3VThLS2xhTDdLaExUcEZFME5jbElkN2dIYkE0RDMxRVF3WlxuMDl4c2FvV2ZBZ01CQUFFQ2dnRUFCT0FjK1owNHkxRDQ3VUpOTlcwT2ptV0F3Wks4TklhcFBhYldqeTFTbSt3V1xuSHk1cWdUNjhrSlphMzE4Rkt5QUpEYWp1dWdWQzA5RWNoTFA2Rkx0aldHZnV0b3VwV2srbjk1R3g3OFM4VmdMT1xuNGt1S2graHRqamJ6a2JZWFE4a2x3bWgvWVhqYzhQMjcvSDNVbTlSSHVRTjduUkNMc0FaUkMzT3hnQWtPQTk4S1xuT1dHL3ZMZzZvREorQ0tCZ2NlVDAxU1JWVXNiRUpsZGFKMWJQcWdlK1dqYzFUTU83UTdtYUR6WmNGR3AvQzNOblxuejN3TG1reWNmRGtISS9sNUU3SWJLMEtsdnRkc2o2S3JRMGFlZUpUQ0psZkxlYm9SRDlQd3lvalFPS21QTWZRL1xuaWxKbWNOaHY1YUZ1NkFVaUUyR0V2ZklWc3RVWjBweHpLZ25aSHVyeDZRS0JnUURTeDU3SWR5aDA2Q0Ivc1NPTFxuNk9HdDhRbjhUOFhnUzNrdCtnM0pYMGFBTXhHYjFMKzB6TXJjWmRjYnRFWEdhNFhTK2tOZG5BYXhJZHdjUHIyYVxuS3p5WXlvRVhDVHRqcDRrdS9VVGVScGlVRTdjYVVoWmlNbjFRbmZkRGFSa2NLd2QwZFdZa1A5NmIyWmpKM2daUlxuWklTNTFFcHJEZlJ4ZnZkS3drOXhHMEZCL1FLQmdRREpZdU92U1B1MW9ud2EyV2o0aXorVyt0Unhqbi9BMkpDdFxuK3o5c0hsZTZ5aGc5NmdYbytNSUNONjVZS2IvWXhUck5HbGRIZFZraldPNU5pVHJ3RHhEUUo4RVVvajhFWWt0TFxuZ01FWU1hYmNNWXkzUlNxdHlSRithcXI1RTNWMTF1QVZTTEd0L05jcTlyS0dReTBVK1F1ckx3RjhHYVBYSUtSNlxudS9NUHJxMmF5d0tCZ1FDWFJ1WFRBcEpxdFY3OXhtaTR0WCtqazJlVFNyMjk2TzBqN2wrT3MyNnArLzBiVm1ud1xublRyTFM5eEM2Zk5hSVRsKzNsY1RERFJSVlBmZzNiYSt1MkZXVjZDbW85MlgvRm9jKzNFK0JuVGpjZkxzVlJYelxuakVFY1p3TmJ3a1pmVFJLZ3B0R1VHckx1TUJIVWNDRWdzWUFBenpoSjlVNEhWeFNzOXlDRkVRYVpFUUtCZ0hWUFxuUlpJMTBXcGMzQzVIdHY0UkgxbXpnMDBpMVFoaEh1WTZGUmZHRlJTWjVNVXNMWVVvWXRzbjFFZEhDcG9iU2NWd1xuTXFkTmxEOGk3cTM3NG5rMFRYYnpzV1Z6bllIUVFFd2JGR0FqakM5NExhQVVpbWZ4V0Y5cmcyelVDUGc3MHd5U1xuNisyTiswanJxOUxLRHRqSXVpTmRubC9NRDhTaEh5N2ZqUmIxaWV0QkFvR0FGT2V5N2ttWkxWS3M1K1NaeXdMK1xuR0VBSlhpcm0yQStBQmR2aWVnY1RIZ21kM3NGM09TeFB5ejRoUTJhRzFLREpNV095MDBJTnkxK0o3MHNIL1hvUlxuSXprcXNKTGkwa3VCTjdlTGtDY21IbXBFZjhiR3VLQnYxbDZ0anBrelhXQVBOV2hrY2ZsS3lMSVZVZGFHMzJSelxuMGxjVWEycTdaZHpSSkhhNzdnaHdWOWs9XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiaHVuZ3J5LWJveXMtc2hlZXRzLXdyaXRlckBodW5ncnktYm95cy00NjU3MDQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTE1MTU1NDQyNDQ1Mjc0MjE3NDU4IiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9odW5ncnktYm95cy1zaGVldHMtd3JpdGVyJTQwaHVuZ3J5LWJveXMtNDY1NzA0LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9Cg==
SPREADSHEET_ID=1VCvhWcx3vOtxeiPe5KuWuDIbWSKfvRZkv4Y1P_M6QuM

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here

# Server Configuration
PORT=4000
NODE_ENV=production
```

### 2. Update Backend to Use Environment Variables
Update your `backend/index.js` to use environment variables instead of the credentials file:

```javascript
// Load credentials from base64 environment variable
const credentialsJSON = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
const credentials = JSON.parse(credentialsJSON);
```

### 3. Remove Credentials File from Repository
```bash
git rm --cached backend/credentials.json
git commit -m "Remove credentials file for security"
```

## 🛡️ Additional Security Measures

### 1. API Rate Limiting
Add rate limiting to your backend:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/sheets/', limiter);
```

### 2. CORS Restrictions
Update your CORS settings to only allow your production domain:

```javascript
const allowedOrigins = [
  'https://your-production-domain.com',
  'https://www.your-production-domain.com'
];
```

### 3. Environment-Specific Configuration
- **Development**: Use localhost origins
- **Production**: Use only production domains
- **Staging**: Use staging domains

## 🔍 Security Checklist

### ✅ Immediate Actions (Do Now)
- [ ] Remove "anyone with the link" access from spreadsheet
- [ ] Add service account email as editor only
- [ ] Add credentials.json to .gitignore
- [ ] Set proper file permissions on credentials.json

### ✅ Before Production Deployment
- [ ] Convert credentials to environment variables
- [ ] Remove credentials.json from repository
- [ ] Set up proper CORS for production domains
- [ ] Add rate limiting to API endpoints
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS in production

### ✅ Ongoing Security
- [ ] Regularly rotate service account keys
- [ ] Monitor API usage and logs
- [ ] Review and audit permissions quarterly
- [ ] Keep dependencies updated

## 🚨 Emergency Actions

If you suspect a security breach:

1. **Immediately revoke the service account key** in Google Cloud Console
2. **Create a new service account** with minimal permissions
3. **Update your environment variables** with new credentials
4. **Review all recent spreadsheet changes** for unauthorized modifications
5. **Check your application logs** for suspicious activity

## 📞 Support

If you need help with any of these security measures, refer to:
- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs)
- [Google Sheets API Security](https://developers.google.com/sheets/api/guides/authorizing)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/service-accounts)

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures as your application grows. 