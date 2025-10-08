#!/bin/bash

# Ponpa Backend Deployment Script for Google Cloud Run

echo "🚀 Deploying Ponpa Backend to Google Cloud Run..."

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
echo "📍 Using project: $PROJECT_ID"

# Build and deploy to Cloud Run
echo "🏗️ Building and deploying..."
gcloud run deploy ponpa-backend \
  --source . \
  --platform managed \
  --region europe-central2 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="ENVIRONMENT=production,FIREBASE_PROJECT_ID=ponpa-4e211,FIREBASE_STORAGE_BUCKET=ponpa-4e211.appspot.com" \
  --timeout 300

echo "✅ Deployment complete!"
echo "📝 Your backend URL should be displayed above"
echo "🔗 Update your frontend API_BASE_URL to use this URL"