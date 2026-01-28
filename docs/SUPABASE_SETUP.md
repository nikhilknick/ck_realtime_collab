# Supabase Setup Guide

This guide walks you through setting up Supabase for the real-time collaborative editor with authentication and database storage.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Basic understanding of PostgreSQL and SQL

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name:** `realtime-collab` (or your preferred name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient for development
5. Click "Create new project"
6. Wait for project to be provisioned (2-3 minutes)

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL:** `https://your-project-ref.supabase.co`
   - **anon/public key:** This is safe to use in frontend
   - **service_role key:** Keep this secret, backend only!

3. Add these to your `.env` file:

```env
# Frontend
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/migrations/001_create_documents_table.sql`
4. Paste into the editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Repeat for `002_create_rls_policies.sql`

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 4: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see a `documents` table with columns:
   - `id` (uuid, primary key)
   - `document_id` (text, unique)
   - `title` (text)
   - `description` (text)
   - `owner_id` (uuid, foreign key to auth.users)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)
   - `is_public` (boolean)
   - `last_edited_by` (uuid, foreign key to auth.users)

3. Check indexes:
   - `idx_documents_document_id`
   - `idx_documents_owner_id`
   - `idx_documents_updated_at`

## Step 5: Configure Google OAuth

### In Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: Real-Time Collaborative Editor
   - User support email: your email
   - Developer contact: your email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Supabase Auth
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### In Supabase Dashboard

1. Go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable the Google provider
4. Paste your Google OAuth credentials:
   - **Client ID:** from Google Cloud Console
   - **Client Secret:** from Google Cloud Console
5. Copy the callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
6. Click "Save"

### Test Google OAuth

1. Go to **Authentication** → **Users**
2. Click "Invite user" → "Sign in with Google"
3. Test the OAuth flow
4. Check that user appears in the Users table

## Step 6: Configure Row Level Security (RLS)

RLS is already configured via migration `002_create_rls_policies.sql`. Verify:

1. Go to **Authentication** → **Policies**
2. Select `documents` table
3. You should see 4 policies:
   - "Users can view own documents"
   - "Users can create documents"
   - "Users can update own documents"
   - "Users can delete own documents"

### Test RLS

```sql
-- Test as authenticated user (run in SQL Editor)
SELECT auth.uid(); -- Should return your user ID

-- Try to access documents (should only see your own)
SELECT * FROM documents;
```

## Step 7: Environment Variables Summary

Your final `.env` file should look like:

```env
# Frontend - Supabase
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# Backend - Supabase
SUPABASE_URL=https://xyzabc123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Frontend - CKEditor
VITE_CKEDITOR_TOKEN_URL=http://localhost:3001/cs-token
VITE_CKEDITOR_WS_URL=wss://your-env.cke-cs.com/ws
VITE_CKEDITOR_ENVIRONMENT_ID=your-env-id
VITE_CKEDITOR_LICENSE_KEY=your-license-key

# Backend - CKEditor
CKEDITOR_ENVIRONMENT_ID=your-env-id
CKEDITOR_API_SECRET=your-api-secret
```

## Step 8: Test the Application

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173
4. Click "Sign in with Google"
5. Authorize the application
6. Create a new document
7. Verify document appears in Supabase Table Editor

## Troubleshooting

### "Missing Supabase environment variables"

- Make sure `.env` file exists and contains the required variables
- Restart your dev servers after updating `.env`
- Check that variable names match exactly (including `VITE_` prefix for frontend)

### "Invalid or expired token"

- Check that your Supabase anon key is correct
- Verify you're signed in (check browser console for auth errors)
- Try signing out and back in

### "Failed to create document"

- Check browser console for errors
- Verify RLS policies are enabled
- Check that you're authenticated
- Look at Network tab to see the actual error from Supabase

### Google OAuth redirect issues

- Verify redirect URI in Google Cloud Console exactly matches Supabase callback URL
- Check that Google OAuth is enabled in Supabase dashboard
- Try in an incognito window to rule out cookie issues

## Security Best Practices

1. **Never commit `.env` files** - they contain secrets
2. **Service role key** - Only use on backend, never expose to frontend
3. **Anon key** - Safe for frontend, respects RLS
4. **OAuth credentials** - Keep Google Client Secret private
5. **RLS** - Always enable and test Row Level Security policies
6. **API keys** - Rotate regularly in production
7. **HTTPS** - Always use HTTPS in production (Supabase provides this automatically)

## Next Steps

- See `DEPLOYMENT.md` for production deployment guide
- Set up backup strategies for your Supabase database
- Configure email templates in Supabase for password reset, etc.
- Add monitoring and logging
- Set up Supabase webhooks for document change notifications (optional)
