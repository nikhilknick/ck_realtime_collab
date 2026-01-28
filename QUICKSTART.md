# Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Setup Steps

### 1. Install Frontend Dependencies

```bash
npm install
```

This will install:
- React and React DOM
- CKEditor 5 and React integration
- Socket.io client

### 2. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

This will install:
- Express.js
- Socket.io
- CORS middleware

### 3. Start the Server

In a terminal, navigate to the `server` directory and run:

```bash
cd server
npm start
```

You should see:
```
WebSocket server running on port 3001
```

### 4. Start the Frontend

In a **new terminal**, navigate to the project root and run:

```bash
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 5. Test Collaboration

1. Open `http://localhost:5173` in your browser
2. Open the same URL in another browser window/tab (or use incognito mode)
3. Start typing in one window - you should see changes appear in real-time in the other window!
4. Notice the active users list updating as you join/leave

## Troubleshooting

### Server won't start
- Make sure port 3001 is available
- Check that you're in the `server` directory when running `npm start`
- Verify all server dependencies are installed

### Frontend can't connect
- Make sure the server is running first
- Check the browser console for connection errors
- Verify the `SOCKET_URL` in `src/App.jsx` matches your server port

### Changes not syncing
- Check the connection indicator in the header (should be green)
- Open browser DevTools console to see WebSocket messages
- Make sure both windows are on the same document (check the Doc ID in the header)

## Next Steps

- Share the document URL (`?doc=doc_xxx`) with others to collaborate
- Change your display name in the header input field
- Try editing simultaneously from multiple windows to see conflict resolution

## Development Tips

- The server supports hot-reload with `npm run dev` in the server directory
- Frontend supports hot-reload automatically with Vite
- Document state is stored in-memory on the server (not persisted to database)
- User IDs and names are stored in browser localStorage
