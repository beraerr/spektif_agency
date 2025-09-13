# 🔥 Firebase App Hosting Setup Guide

## Current Status
- ✅ **Backend API**: Running on Render at `https://spektif-agency.onrender.com`
- ✅ **Frontend**: Running on Vercel at `https://spektif-agency-final.vercel.app`
- ✅ **Database**: PostgreSQL on Railway
- 🔄 **Firebase**: App Hosting setup in progress

## Step 1: Complete Firebase Setup in Terminal

In your terminal where you see the Firebase setup prompt:

1. **Select "Link to an existing backend"** (already highlighted)
2. **Press Enter**
3. When prompted for backend URL, enter: `https://spektif-agency.onrender.com`
4. When prompted for API path, enter: `/api`

## Step 2: Get Firebase Configuration

After completing the setup, you'll need to get your Firebase configuration:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll down to **Your apps** section
5. Click on the web app icon `</>`
6. Copy the configuration values

## Step 3: Create Environment Variables

Create a `.env.local` file in `apps/web/` with the following content:

```bash
# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General

# Backend (Firebase Admin) - For server-side operations
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Frontend (Firebase Client) - For client-side operations
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Keep existing variables for your current setup
NEXT_PUBLIC_API_URL=https://spektif-agency.onrender.com/api
NEXTAUTH_URL=https://spektif-agency-final.vercel.app
NEXTAUTH_SECRET=spektif-nextauth-secret-key-2024
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# For server-side API calls (NextAuth)
API_URL=https://spektif-agency.onrender.com/api
```

## Step 4: Firebase Service Account Setup

For server-side operations, you'll need a Firebase service account:

1. Go to **Firebase Console** > **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the values and add them to your `.env.local`:
   - `FIREBASE_PROJECT_ID`: From the JSON file
   - `FIREBASE_CLIENT_EMAIL`: From the JSON file
   - `FIREBASE_PRIVATE_KEY`: From the JSON file (keep the quotes and newlines)

## Step 5: Firebase Data Connect Configuration

Your `dataconnect.yaml` is already configured for PostgreSQL:

```yaml
specVersion: "v1"
serviceId: "spektifagency"
location: "europe-west3"
schema:
  source: "./schema"
  datasource:
    postgresql:
      database: "fdcdb"
      cloudSql:
        instanceId: "spektifagency-fdc"
```

## Step 6: Deploy to Firebase

After completing the setup:

```bash
# Deploy to Firebase App Hosting
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

## Step 7: Update Vercel Environment Variables

If you want to use Firebase instead of Vercel, update your Vercel environment variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add the Firebase configuration variables

## Architecture After Firebase Setup

```
┌─────────────────┐    HTTPS API    ┌─────────────────┐
│   FIREBASE      │ ──────────────▶ │   RENDER        │
│   (Frontend)    │                 │   (Backend)     │
│   Next.js       │                 │   NestJS        │
│   App Hosting   │                 │   Port: 10000   │
└─────────────────┘                 └─────────────────┘
                                              │
                                              │ PostgreSQL
                                              ▼
                                    ┌─────────────────┐
                                    │   RAILWAY       │
                                    │   (Database)    │
                                    │   PostgreSQL    │
                                    └─────────────────┘
```

## Benefits of Firebase App Hosting

1. **Integrated Authentication**: Firebase Auth + your existing NextAuth setup
2. **Real-time Database**: Firestore for real-time features
3. **Cloud Functions**: Serverless functions for additional logic
4. **Analytics**: Built-in analytics and monitoring
5. **CDN**: Global content delivery
6. **Data Connect**: Direct database integration

## Troubleshooting

### If Firebase setup fails:
1. Make sure you're logged into Firebase CLI: `firebase login`
2. Check your project ID is correct
3. Verify the backend URL is accessible: `curl https://spektif-agency.onrender.com/api/health`

### If environment variables don't work:
1. Restart your development server after adding `.env.local`
2. Check that variable names start with `NEXT_PUBLIC_` for client-side access
3. Verify the Firebase project ID matches in all places

### If deployment fails:
1. Check Firebase project permissions
2. Verify all required environment variables are set
3. Check Firebase CLI version: `firebase --version`

## Next Steps

After successful Firebase setup:
1. Test the integration with your existing API
2. Set up Firebase Authentication (optional, you can keep NextAuth)
3. Configure Firestore rules for data security
4. Set up Firebase Analytics for monitoring
5. Consider migrating some features to Firebase services

## Current Working URLs

- **Frontend (Vercel)**: https://spektif-agency-final.vercel.app
- **Backend API (Render)**: https://spektif-agency.onrender.com
- **API Health**: https://spektif-agency.onrender.com/api/health
- **API Docs**: https://spektif-agency.onrender.com/docs

After Firebase setup, you'll also have:
- **Firebase Hosting**: https://your-project.web.app
- **Firebase Console**: https://console.firebase.google.com/project/your-project
