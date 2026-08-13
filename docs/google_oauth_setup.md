# Google OAuth 2.0 Setup Guide for CareerForge

## Overview
This guide walks you through setting up Google OAuth 2.0 credentials for CareerForge. Google OAuth is **optional** — the app works with email/password auth without it.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it `CareerForge` → Click **Create**
4. Select the project from the dropdown

## Step 2: Enable APIs

1. Go to **APIs & Services** → **Library**
2. Search for **Google+ API** → Click **Enable**
3. Search for **Google Identity Services** → Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → Click **Create**
3. Fill in:
   - **App name**: `CareerForge`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. **Scopes**: Add `email`, `profile`, `openid` → **Save and Continue**
6. **Test users**: Add your Gmail → **Save and Continue**
7. Click **Back to Dashboard**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `CareerForge Web`
5. **Authorized JavaScript origins**:
   - `http://localhost:5173` (dev frontend)
   - `http://localhost:8000` (dev backend)
6. **Authorized redirect URIs**:
   - `http://localhost:8000/api/v1/auth/google/callback`
7. Click **Create**
8. Copy **Client ID** and **Client Secret**

## Step 5: Configure Environment

Add to your `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

## Step 6: Production Setup

When deploying to production:

1. Add your production domain to **Authorized JavaScript origins**
2. Add your production callback URL to **Authorized redirect URIs**
3. Update `GOOGLE_REDIRECT_URI` in production environment
4. Submit app for **Google verification** if you have > 100 users

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `redirect_uri_mismatch` | Ensure redirect URI in `.env` exactly matches Google Console |
| `access_denied` | Add your email as a test user in consent screen |
| `invalid_client` | Double-check Client ID and Secret |

## Security Notes

- Never commit `GOOGLE_CLIENT_SECRET` to version control
- Use different OAuth credentials for dev and production
- Restrict redirect URIs to known domains only
