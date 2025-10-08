# 🚀 Ponpa Backend Deployment Guide - Google Cloud Run

## Prerequisites

1. **Google Cloud CLI**: Install from https://cloud.google.com/sdk/docs/install
2. **Docker**: Ensure Docker Desktop is running
3. **Firebase Project**: Your existing Firebase project with Firestore enabled

## Step 1: Install Google Cloud CLI

```bash
# macOS
brew install --cask google-cloud-sdk

# Or download installer from Google Cloud
```

## Step 2: Setup Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your Firebase project ID (replace with actual project ID)
gcloud config set project YOUR_FIREBASE_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 3: Deploy Backend to Cloud Run

```bash
# Navigate to backend directory
cd /Users/szonjajakab/own_projects/ponpa/backend

# Run the deployment script
./deploy.sh

# Or deploy manually:
gcloud run deploy ponpa-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300
```

## Step 4: Set Environment Variables

After deployment, set these environment variables in Cloud Run:

```bash
# Set Firebase configuration
gcloud run services update ponpa-backend \
  --set-env-vars="FIREBASE_PROJECT_ID=your-firebase-project-id" \
  --set-env-vars="GOOGLE_AI_API_KEY=your-google-ai-api-key" \
  --set-env-vars="ENVIRONMENT=production" \
  --region us-central1
```

## Step 5: Update Frontend Configuration

1. **Get your Cloud Run URL** from the deployment output (e.g., `https://ponpa-backend-xyz123-uc.a.run.app`)

2. **Update frontend API configuration**:
   ```typescript
   // In /frontend/src/constants/api.ts
   export const API_CONFIG = {
     BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://YOUR_CLOUD_RUN_URL',
     TIMEOUT: 10000,
   };
   ```

## Step 6: Test Deployment

```bash
# Test the health endpoint
curl https://YOUR_CLOUD_RUN_URL/health

# Expected response:
{
  "status": "healthy",
  "service": "ponpa-backend",
  "firebase": {
    "firestore": "connected",
    "storage": "connected"
  }
}
```

## Files Created for Deployment

- ✅ `Dockerfile` - Container configuration
- ✅ `.dockerignore` - Docker build exclusions
- ✅ `deploy.sh` - Deployment script
- ✅ `.env.production` - Production environment template

## Next Steps

1. **Deploy backend** using the steps above
2. **Update frontend** with the Cloud Run URL
3. **Build mobile app** for beta testing
4. **Set up Firebase App Distribution** for CEO testing

## Troubleshooting

### Common Issues:

1. **Build fails**: Check `requirements.txt` and Python version
2. **502 errors**: Verify environment variables are set
3. **Firebase connection fails**: Check service account and project ID
4. **CORS errors**: Verify CORS_ORIGINS environment variable

### Logs:
```bash
# View Cloud Run logs
gcloud run services logs tail ponpa-backend --region us-central1
```

## Security Notes

- 🔒 Never commit real API keys to git
- 🔒 Use Cloud Run environment variables for secrets
- 🔒 Consider using Google Secret Manager for sensitive data
- 🔒 Review IAM permissions for production

---

**After deployment, your backend will be accessible at:**
`https://ponpa-backend-[random-hash]-[region].a.run.app`

Update your frontend API_CONFIG.BASE_URL with this URL!