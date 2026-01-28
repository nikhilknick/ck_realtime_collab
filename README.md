# Real-Time Collaborative Editor with CKEditor 5

A production-ready real-time collaborative text editor built with React, CKEditor 5, Supabase, and **CKEditor's Official Collaboration**. Features Google OAuth authentication, PostgreSQL document storage, and real-time collaboration with automatic conflict resolution.

## Features

- 🔐 **Authentication**: Google OAuth via Supabase Auth
- 📝 **Document Management**: Create, edit, and delete documents with metadata storage
- ✨ **Real-time Collaboration**: Multiple users can edit simultaneously using CKEditor's official collaboration
- 👥 **User Presence**: Built-in user presence tracking with colored cursors and names
- 🔄 **Live Updates**: Changes appear instantly across all connected clients
- 🎯 **Automatic Conflict Resolution**: CKEditor handles conflict resolution using Operational Transformation
- 💾 **Database Storage**: PostgreSQL via Supabase with Row Level Security
- 🔒 **Secure Tokens**: JWT-based authentication for CKEditor Cloud Services
- 💬 **Comments & Track Changes**: Built-in collaboration features
- 🤖 **AI Features**: CKEditor AI for content recommendations and chat

## Architecture

- **Frontend**: React + Vite + CKEditor 5 with Real-time Collaboration plugin
- **Backend**: Node.js + Express with JWT token generation
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with Google OAuth
- **Real-time Sync**: CKEditor Cloud Services WebSocket connection
- **Conflict Resolution**: Operational Transformation (handled by CKEditor)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- **Supabase account** (free tier available)
- **CKEditor Cloud Services account** with production credentials
- **Google Cloud Console** project for OAuth

## Quick Start (Development)

This branch (`production-ready`) includes full authentication and database integration. For a quick test:

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Copy environment template
cp .env.example .env

# Set up external services (see Setup Instructions below)
# Then start both servers:
cd server && npm start &
npm run dev
```

## Setup Instructions

For detailed setup instructions, see:
- **[Supabase Setup Guide](docs/SUPABASE_SETUP.md)** - Database and authentication setup
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

### Quick Setup Overview

1. **Create Supabase Project** (https://supabase.com)
   - Get Project URL and API keys
   - Run database migrations from `supabase/migrations/`
   - Configure Google OAuth

2. **Configure Google OAuth** (https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add Supabase callback URL to authorized redirects

3. **Get CKEditor Credentials** (https://ckeditor.com/cloud-services/)
   - Get WebSocket URL, Environment ID, License Key, and API Secret

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see `.env.example` for all required variables):

```env
# Frontend - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Frontend - CKEditor
VITE_CKEDITOR_TOKEN_URL=http://localhost:3001/cs-token
VITE_CKEDITOR_WS_URL=wss://your-env.cke-cs.com/ws
VITE_CKEDITOR_ENVIRONMENT_ID=your-env-id
VITE_CKEDITOR_LICENSE_KEY=your-license-key

# Backend - Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend - CKEditor
CKEDITOR_ENVIRONMENT_ID=your-env-id
CKEDITOR_API_SECRET=your-api-secret
```

### 5. Start the Application

**Backend:**
```bash
cd server
npm start
```

**Frontend (in a new terminal):**
```bash
npm run dev
```

### 6. Test the Application

1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Create a new document
4. Share the document URL with another user or open in another browser
5. Edit simultaneously and see real-time updates!

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Supabase Auth redirects to Google OAuth
3. Google authenticates and redirects back to Supabase
4. Supabase creates session and returns JWT token
5. Frontend stores session and shows document dashboard

### Document Management

1. User creates document with title and description
2. Document metadata saved to Supabase PostgreSQL
3. Unique `document_id` generated for CKEditor channel
4. Row Level Security ensures users only see their own documents
5. Document updates tracked with timestamps

### Real-Time Collaboration

1. User opens a document from dashboard
2. Frontend requests CKEditor token from backend with Authorization header
3. Backend verifies Supabase JWT and generates CKEditor JWT
4. CKEditor connects to Cloud Services WebSocket
5. Multiple users can edit simultaneously with automatic conflict resolution

### Real-time Synchronization

1. When you type, CKEditor's collaboration plugin sends changes via WebSocket to CKEditor Cloud Services
2. CKEditor Cloud Services broadcasts changes to all other connected clients
3. CKEditor handles conflict resolution automatically using Operational Transformation
4. Remote cursors and selections are displayed automatically

### Conflict Resolution

CKEditor's collaboration uses **Operational Transformation (OT)**:
- All edits are transformed to resolve conflicts automatically
- No data loss even with simultaneous edits
- Cursor positions are preserved correctly
- Works seamlessly across multiple users

## Project Structure

```
realtime_collab/
├── src/
│   ├── lib/
│   │   └── supabase.js           # Supabase client configuration
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication state management
│   ├── components/
│   │   ├── Login.jsx/css         # Login UI with Google OAuth
│   │   └── DocumentDashboard.jsx/css  # Document list and management
│   ├── App.jsx                   # Main app with routing and editor
│   ├── App.css                   # Global styles
│   └── main.jsx                  # React entry point
├── server/
│   ├── server.js                 # Express server with auth + token generation
│   ├── supabaseClient.js         # Supabase admin client
│   ├── ckeditorToken.js          # CKEditor JWT generation
│   └── package.json              # Server dependencies
├── supabase/
│   └── migrations/
│       ├── 001_create_documents_table.sql  # Database schema
│       └── 002_create_rls_policies.sql     # Security policies
├── docs/
│   ├── SUPABASE_SETUP.md         # Detailed Supabase setup guide
│   └── DEPLOYMENT.md             # Production deployment guide
├── .env.example                  # Environment variables template
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

## Configuration

### Environment Variables

- `VITE_CKEDITOR_TOKEN_URL`: Your backend token endpoint URL
- `VITE_CKEDITOR_WS_URL`: CKEditor Cloud Services WebSocket URL (required)
- `VITE_CKEDITOR_ENVIRONMENT_ID`: Your CKEditor Cloud Services Environment ID (optional)

### Editor Configuration

Edit `src/App.jsx` to customize:
- Plugins (add/remove CKEditor plugins)
- Toolbar items
- Collaboration settings
- Initial data

## What's New in Production Branch

This branch (`production-ready`) adds:

- ✅ **Google OAuth Authentication** via Supabase Auth
- ✅ **PostgreSQL Database** for document metadata storage
- ✅ **Row Level Security** to protect user data
- ✅ **Document Management Dashboard** with CRUD operations
- ✅ **JWT Token Generation** for CKEditor with user verification
- ✅ **Production-Ready Backend** with proper authentication
- ✅ **Deployment Documentation** for multiple platforms
- ✅ **Comprehensive Setup Guides** for Supabase and external services

## Troubleshooting

### "Missing Supabase environment variables"

- Ensure `.env` file exists in project root
- Check variable names have `VITE_` prefix for frontend
- Restart dev servers after updating `.env`

### "Unauthorized" / "Invalid token"

- Verify Supabase credentials are correct
- Check that you're signed in (browser console)
- Try signing out and back in
- Ensure backend service role key is set correctly

### Google OAuth redirect fails

- Verify redirect URI in Google Cloud Console matches Supabase callback URL exactly
- Check Google OAuth is enabled in Supabase dashboard
- Try in incognito window to rule out cookie issues

### "Failed to generate token" / Token endpoint errors

- Check backend server is running on port 3001
- Verify CKEDITOR_API_SECRET is set in backend `.env`
- Check Authorization header is being sent from frontend
- Look at backend logs for specific error messages

### CKEditor connection issues

- Verify WebSocket URL is correct (starts with `wss://`)
- Check CKEditor environment is active in CKEditor dashboard
- Ensure license key is valid and not expired
- Check browser console for CKEditor errors

### Documents not appearing in dashboard

- Check Supabase RLS policies are enabled
- Verify user is authenticated
- Look at Network tab for Supabase API errors
- Check documents table in Supabase Table Editor

## Production Deployment

This application is production-ready and can be deployed to various platforms:

- **Vercel** (Frontend) + **Railway** (Backend) - Recommended
- **AWS** (S3 + CloudFront + ECS/Lambda)
- **VPS** with Docker Compose
- **Netlify** + **Render/Heroku**

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Security Considerations

- ✅ Service role key only in backend (never exposed to frontend)
- ✅ Row Level Security enabled on all tables
- ✅ JWT-based authentication for all API endpoints
- ✅ Google OAuth for secure user authentication
- ✅ Authorization header required for token generation
- ✅ CORS configured for specific frontend origin
- ✅ Environment variables for all secrets

## Future Enhancements

- [ ] Document sharing with other users (read/write permissions)
- [ ] Document folders/organization
- [ ] Document templates
- [ ] Export to PDF/Word
- [ ] File upload and image hosting
- [ ] Activity log and audit trail
- [ ] Email notifications for document changes
- [ ] Public document sharing (view-only links)
- [ ] Document versioning and restore
- [ ] Self-hosted CKEditor collaboration server option

## License

This project uses CKEditor 5 with premium features. Ensure you have the appropriate license for production use.

## Resources

- [CKEditor Cloud Services](https://ckeditor.com/cloud-services/)
- [CKEditor Collaboration Documentation](https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/real-time-collaboration/real-time-collaboration-integration.html)
- [Self-Hosted Collaboration Server](https://ckeditor.com/docs/cs/latest/guides/collaboration-server/self-hosted-collaboration-server.html)
