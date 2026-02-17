# 🔑 Google OAuth Setup Guide

Follow these steps to get your Google OAuth credentials:

## Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

## Step 2: Create or Select a Project

1. Click the project dropdown at the top
2. Click **"New Project"**
3. Name it: **WeBet Social** (or any name you prefer)
4. Click **"Create"**
5. Wait for project creation and select it

## Step 3: Enable Google+ API

1. In the left menu, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

## Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for testing) or **"Internal"** (if you have Google Workspace)
3. Click **"Create"**

Fill in the required fields:
- **App name**: WeBet Social
- **User support email**: Your email
- **Developer contact**: Your email

4. Click **"Save and Continue"**
5. Skip **"Scopes"** (click "Save and Continue")
6. Add test users if needed (your email)
7. Click **"Save and Continue"** → **"Back to Dashboard"**

## Step 5: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"**

Configure:
- **Name**: WeBet Social Web Client
- **Authorized JavaScript origins**: 
  - `http://localhost:3000`
  - `http://localhost:3001`
- **Authorized redirect URIs**:
  - `http://localhost:3001/api/auth/google/callback`

5. Click **"Create"**

## Step 6: Copy Your Credentials

A popup will show:
- **Client ID** - Copy this
- **Client Secret** - Copy this

## Step 7: Update Your .env File

Open `/Users/rishitha/Desktop/WeBet/.env` and update:

```env
GOOGLE_CLIENT_ID="paste-your-client-id-here"
GOOGLE_CLIENT_SECRET="paste-your-client-secret-here"
```

Also update `/Users/rishitha/Desktop/WeBet/packages/frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=paste-your-client-id-here
```

## Step 8: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd /Users/rishitha/Desktop/WeBet
pnpm dev
```

## ✅ Verify It Works

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. You should see Google's OAuth consent screen

## 🎯 Quick Links

- **Google Cloud Console**: https://console.cloud.google.com/
- **Credentials Page**: https://console.cloud.google.com/apis/credentials

## 📝 Notes

- For development, you can use **"External"** user type
- Add your email as a test user in OAuth consent screen
- The redirect URI **must match exactly**: `http://localhost:3001/api/auth/google/callback`
- Keep your Client Secret private - never commit it to git

## 🐛 Troubleshooting

**"redirect_uri_mismatch" error?**
- Check that `http://localhost:3001/api/auth/google/callback` is in Authorized redirect URIs
- No trailing slashes
- Exact URL match required

**Can't see consent screen?**
- Make sure you're added as a test user
- Or publish the app (not required for development)

---

Once you have your credentials, paste them in the `.env` files and restart `pnpm dev`!
