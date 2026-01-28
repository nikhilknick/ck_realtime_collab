# Real-Time Collaborative Editor with CKEditor 5

A real-time collaborative text editor built with React, CKEditor 5, and **CKEditor's Official Collaboration** (Real-time Collaboration plugin). Multiple users can edit the same document simultaneously with live updates, built-in user presence tracking, and automatic conflict resolution.

## Features

- ✨ **Real-time Collaboration**: Multiple users can edit the same document simultaneously using CKEditor's official collaboration
- 👥 **User Presence**: Built-in user presence tracking with colored cursors and names
- 🔄 **Live Updates**: Changes appear instantly across all connected clients
- 🎯 **Automatic Conflict Resolution**: CKEditor handles conflict resolution using Operational Transformation
- 💾 **Persistent Sessions**: User IDs and names are stored locally
- 🔗 **Shareable Links**: Each document has a unique URL that can be shared
- 💬 **Comments & Track Changes**: Built-in collaboration features (Comments, Track Changes)

## Architecture

- **Frontend**: React + Vite + CKEditor 5 with Real-time Collaboration plugin
- **Backend**: Node.js + Express (token endpoint for CKEditor Cloud Services)
- **Real-time Sync**: CKEditor Cloud Services WebSocket connection
- **Conflict Resolution**: Operational Transformation (handled by CKEditor)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- **CKEditor Cloud Services account** (or self-hosted collaboration server)

## Setup Instructions

### 1. Get CKEditor Cloud Services Credentials

You have two options:

#### Option A: CKEditor Cloud Services (Recommended for Production)

1. Sign up at [ckeditor.com/cloud-services](https://ckeditor.com/cloud-services/)
2. Get your WebSocket URL and Environment ID from the dashboard
3. Set up a token endpoint (see below)

#### Option B: Self-Hosted Collaboration Server

Follow the [CKEditor documentation](https://ckeditor.com/docs/cs/latest/guides/collaboration-server/self-hosted-collaboration-server.html) to set up your own collaboration server.

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your CKEditor Cloud Services credentials:

```env
VITE_CKEDITOR_TOKEN_URL=http://localhost:3001/cs-token
VITE_CKEDITOR_WS_URL=wss://your-environment-id.cke-cs.com
VITE_CKEDITOR_ENVIRONMENT_ID=your-environment-id
```

### 5. Update Token Endpoint (Backend)

The server includes a mock token endpoint at `/cs-token`. For production, you need to:

1. Implement proper user authentication
2. Call CKEditor Cloud Services API to generate tokens
3. Return the token to the client

See `server/server.js` for the token endpoint implementation and TODO comments.

### 6. Start the Server

In the `server` directory:

```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001` and provide the token endpoint at `http://localhost:3001/cs-token`

### 7. Start the Frontend Development Server

In the root directory:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 8. Open Multiple Browser Windows

1. Open `http://localhost:5173` in one browser window
2. Open the same URL (or share the document URL) in another window/tab
3. Start typing in one window and see the changes appear in real-time in the other!

## How It Works

### Document Sharing

- Each document has a unique ID in the URL (`?doc=doc_xxx`)
- Share the URL with others to collaborate on the same document
- If no document ID is provided, a new one is generated automatically
- The document ID is used as the collaboration `channelId`

### User Management

- User IDs are stored in localStorage
- You can change your display name in the header
- Active users are shown in the header with colored badges
- CKEditor automatically assigns colors to users

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
│   ├── App.jsx          # Main React component with CKEditor collaboration
│   ├── App.css          # Styles for the collaboration UI
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── server/
│   ├── server.js        # Express server with token endpoint
│   └── package.json     # Server dependencies
├── .env.example         # Environment variables template
├── package.json         # Frontend dependencies
└── README.md           # This file
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

## Migration from Custom Socket.io Implementation

This branch uses CKEditor's official collaboration instead of the custom Socket.io implementation. Key differences:

- ✅ **Better conflict resolution**: Uses Operational Transformation instead of version-based
- ✅ **Built-in features**: Cursor tracking, user presence, comments, track changes
- ✅ **More reliable**: Handled by CKEditor's battle-tested collaboration system
- ⚠️ **Requires CKEditor Cloud Services**: Need to set up Cloud Services or self-hosted server
- ⚠️ **Token management**: Need to implement proper token generation

## Troubleshooting

### "WebSocket URL not configured" Error

- Make sure you've created a `.env` file with `VITE_CKEDITOR_WS_URL`
- Restart the dev server after adding environment variables
- Check that the WebSocket URL is correct (starts with `wss://`)

### Connection Issues

- Verify CKEditor Cloud Services credentials are correct
- Check that the token endpoint is working (`http://localhost:3001/cs-token`)
- Check browser console for detailed error messages
- Ensure the server is running on port 3001

### Token Generation

- The current implementation uses a mock token for testing
- For production, implement proper token generation in `server/server.js`
- See CKEditor Cloud Services API documentation for token generation

### Changes Not Syncing

- Verify connection status indicator (should be green)
- Check browser console for collaboration errors
- Ensure both clients are connected to the same document (same `channelId`)
- Verify WebSocket connection is established (check Network tab)

## Known Limitations

1. **Token Endpoint**: Currently uses mock tokens - needs production implementation
2. **Authentication**: No user authentication system (add your own)
3. **Persistence**: Document content is not persisted to a database (only in CKEditor Cloud Services)
4. **Self-Hosted**: Requires CKEditor Cloud Services or self-hosted collaboration server setup

## Future Enhancements

- [ ] Implement proper token generation with user authentication
- [ ] Add database persistence for document metadata
- [ ] Add user authentication and authorization
- [ ] Add document history/versioning
- [ ] Add file upload support
- [ ] Add document templates
- [ ] Self-hosted collaboration server setup guide

## License

This project uses CKEditor 5 with premium features. Ensure you have the appropriate license for production use.

## Resources

- [CKEditor Cloud Services](https://ckeditor.com/cloud-services/)
- [CKEditor Collaboration Documentation](https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/real-time-collaboration/real-time-collaboration-integration.html)
- [Self-Hosted Collaboration Server](https://ckeditor.com/docs/cs/latest/guides/collaboration-server/self-hosted-collaboration-server.html)
