# Setup Instructions

## Quick Setup

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Start the Server

**Terminal 1:**
```bash
cd server
npm start
```

You should see:
```
WebSocket server running on port 3001
```

### 4. Start the Frontend

**Terminal 2:**
```bash
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 5. Test It!

1. Open `http://localhost:5173` in your browser
2. Open the same URL in another browser window/tab (or incognito mode)
3. Start typing in one window - changes should appear in real-time in the other!

## What's Fixed

✅ **Debouncing**: Content changes are debounced (300ms) to prevent server flooding  
✅ **Version Management**: Proper version synchronization between client and server  
✅ **Error Handling**: Connection errors are displayed to the user  
✅ **Reconnection**: Automatic reconnection if server disconnects  
✅ **Race Conditions**: Fixed timing issues with editor initialization  
✅ **Cursor Tracking**: Improved cursor position tracking (debounced)  
✅ **Conflict Resolution**: Better version conflict handling  

## Troubleshooting

### "Failed to connect to server"
- Make sure the server is running (`cd server && npm start`)
- Check that port 3001 is not in use
- Verify the `SOCKET_URL` in `src/App.jsx` matches your server port

### Changes not syncing
- Check browser console for errors
- Verify connection indicator shows "Connected" (green)
- Make sure both windows are on the same document (check Doc ID)

### Editor not loading
- Check browser console for CKEditor errors
- Verify all dependencies are installed
- Try clearing browser cache

## Development

- Server supports auto-reload: `npm run dev` in server directory
- Frontend has hot-reload automatically with Vite
- Check browser console and server logs for debugging
