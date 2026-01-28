import { useState, useRef, useCallback, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { 
  ClassicEditor, 
  Essentials, 
  Paragraph, 
  Bold, 
  Italic,
  Heading,
  Link,
  List,
  BlockQuote,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Table,
  TableToolbar,
  CloudServices
} from 'ckeditor5';
import { 
  FormatPainter,
  RealTimeCollaborativeEditing,
  RealTimeCollaborativeComments,
  RealTimeCollaborativeTrackChanges,
  RealTimeCollaborativeRevisionHistory,
  Comments,
  TrackChanges,
  RevisionHistory
  // PresenceList - removed because it requires a container element
  // We're already showing active users manually in the header
} from 'ckeditor5-premium-features';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';
import './App.css';

// Setup Warning Component
function SetupWarning() {
  return (
    <div className="setup-warning">
      <h2 className="setup-warning__title">⚠️ Configuration Required</h2>
      <p className="setup-warning__description">
        To use CKEditor's official collaboration, you need to configure CKEditor Cloud Services.
      </p>
      
      <div className="setup-warning__section">
        <h3 className="setup-warning__section-title">Quick Setup Steps:</h3>
        <ol className="setup-warning__steps">
          <li>
            <strong>Sign up for CKEditor Cloud Services:</strong>{' '}
            <a 
              href="https://ckeditor.com/cloud-services/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="setup-warning__link"
            >
              https://ckeditor.com/cloud-services/
            </a>
          </li>
          <li>
            <strong>Get your credentials</strong> from the CKEditor Cloud Services dashboard:
            <ul className="setup-warning__sublist">
              <li>WebSocket URL (format: <code>wss://your-environment-id.cke-cs.com/ws</code>)</li>
              <li>Environment ID (optional)</li>
            </ul>
          </li>
          <li>
            <strong>Update your <code>.env</code> file</strong> (already created in project root):
            <pre className="setup-warning__code">
{`VITE_CKEDITOR_TOKEN_URL=http://localhost:3001/cs-token
VITE_CKEDITOR_WS_URL=wss://your-environment-id.cke-cs.com/ws
VITE_CKEDITOR_ENVIRONMENT_ID=your-environment-id`}
            </pre>
          </li>
          <li>
            <strong>Restart your dev server</strong> after updating <code>.env</code>
          </li>
        </ol>
      </div>

      <div className="setup-warning__note">
        <h4 className="setup-warning__note-title">📝 Note:</h4>
        <p className="setup-warning__note-text">
          The <code>server/server.js</code> file includes a token endpoint at <code>/cs-token</code>.
          For production, you'll need to update it to generate real tokens from CKEditor Cloud Services API.
          See the TODO comments in the server code.
        </p>
      </div>

      <div className="setup-warning__alternative">
        <h4 className="setup-warning__alternative-title">Alternative: Self-Hosted Collaboration Server</h4>
        <p className="setup-warning__alternative-text">
          You can also self-host CKEditor Collaboration Server. See{' '}
          <a 
            href="https://ckeditor.com/docs/cs/latest/guides/collaboration-server/self-hosted-collaboration-server.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="setup-warning__link"
          >
            CKEditor documentation
          </a> for details.
        </p>
      </div>
    </div>
  );
}

// CKEditor Cloud Services configuration (set in .env, never commit .env)
// VITE_CKEDITOR_TOKEN_URL - Your token endpoint URL (defaults to localhost:3001)
// VITE_CKEDITOR_WS_URL - CKEditor Cloud Services WebSocket URL (required)
// VITE_CKEDITOR_ENVIRONMENT_ID - Your CKEditor Cloud Services Environment ID (optional)
// VITE_CKEDITOR_LICENSE_KEY - Your CKEditor license key (required for premium features)
const TOKEN_URL = import.meta.env.VITE_CKEDITOR_TOKEN_URL || 'http://localhost:3001/cs-token';
const WS_URL = import.meta.env.VITE_CKEDITOR_WS_URL || ''; // REQUIRED: Set your CKEditor Cloud Services WebSocket URL
const ENVIRONMENT_ID = import.meta.env.VITE_CKEDITOR_ENVIRONMENT_ID || '';
const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || '';

function App() {
  const [content, setContent] = useState('<p>Start collaborating!</p>');
  // Use lazy initialization to avoid calling impure functions during render
  const [userId] = useState(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      localStorage.setItem('userId', storedUserId);
    }
    return storedUserId;
  });

  const [userName, setUserName] = useState(() => {
    const storedUserName = localStorage.getItem('userName');
    if (!storedUserName) {
      const defaultName = `User ${userId.slice(-4)}`;
      localStorage.setItem('userName', defaultName);
      return defaultName;
    }
    return storedUserName;
  });

  const [documentId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('doc');
    if (!docId) {
      docId = `doc_${Math.random().toString(36).substr(2, 9)}`;
      window.history.replaceState({}, '', `?doc=${docId}`);
    }
    return docId;
  });
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  // Initialize connection error if WS_URL is not configured
  const [connectionError, setConnectionError] = useState(() => {
    if (!WS_URL) {
      return 'CKEditor Cloud Services WebSocket URL not configured. ' +
        'Please set VITE_CKEDITOR_WS_URL environment variable or update App.jsx';
    }
    return null;
  });
  
  const editorRef = useRef(null);
  const stateCheckIntervalRef = useRef(null);
  const [editorKey] = useState(() => Math.random()); // Stable key to prevent remounts

  // Handle editor ready
  const handleReady = useCallback((editorInstance) => {
    console.log('Editor ready with CKEditor collaboration');
    editorRef.current = editorInstance;
    
    // Listen for collaboration events
    const collaborationPlugin = editorInstance.plugins.get('RealTimeCollaborativeEditing');
    
    if (collaborationPlugin) {
      // Function to check and update connection state
      const updateConnectionState = () => {
        try {
          // Get the WebSocketGateway from the collaboration plugin
          const gateway = collaborationPlugin._gateway || collaborationPlugin.gateway;
          if (gateway) {
            const state = gateway.state;
            console.log('WebSocketGateway state:', state);
            // 'connected' means both browser and WebSocket are connected
            const connected = state === 'connected';
            setIsConnected(connected);
            if (!connected) {
              console.log('Connection state:', state);
            }
          } else {
            // Fallback: check if we can access state directly
            const state = collaborationPlugin.state || collaborationPlugin._state;
            if (state !== undefined) {
              const connected = state === 'connected' || state === 'authenticated';
              console.log('Collaboration plugin state:', state, 'connected:', connected);
              setIsConnected(connected);
            }
          }
        } catch (e) {
          console.log('Could not check connection state:', e);
        }
      };

      // Check initial state after a delay to allow plugin to initialize
      setTimeout(updateConnectionState, 1000);
      
      // Clear any existing interval
      if (stateCheckIntervalRef.current) {
        clearInterval(stateCheckIntervalRef.current);
      }
      
      // Also check periodically in case events don't fire
      stateCheckIntervalRef.current = setInterval(updateConnectionState, 2000);

      // Listen for connection status changes
      collaborationPlugin.on('connectionStateChange', (evt, data) => {
        console.log('Collaboration connection state change event:', data);
        updateConnectionState();
        
        // Also check data object if available
        if (data) {
          if (data.isConnected === true || data.state === 'connected') {
            setIsConnected(true);
            setConnectionError(null);
          } else if (data.error) {
            setConnectionError(data.error.message || 'Connection error');
            setIsConnected(false);
          }
        }
      });

      // Listen for user list updates - if users are present, we're connected
      collaborationPlugin.on('usersChange', (evt, data) => {
        console.log('Active users:', data.users);
        // Filter out current user
        const otherUsers = data.users.filter(u => u.id !== userId);
        setActiveUsers(otherUsers);
        // If we have users, we're definitely connected
        if (data.users && data.users.length > 0) {
          setIsConnected(true);
          setConnectionError(null);
          // Clear the interval since we know we're connected
          if (stateCheckIntervalRef.current) {
            clearInterval(stateCheckIntervalRef.current);
            stateCheckIntervalRef.current = null;
          }
        }
      });

      // Listen for connection errors
      collaborationPlugin.on('error', (evt, error) => {
        console.error('Collaboration error:', error);
        setConnectionError(error.message || 'Collaboration error occurred');
        setIsConnected(false);
      });

    }
  }, [userId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (stateCheckIntervalRef.current) {
        clearInterval(stateCheckIntervalRef.current);
      }
    };
  }, []);

  // Handle content change (for display purposes only - collaboration handles sync)
  const handleChange = useCallback((event, editorInstance) => {
    const data = editorInstance.getData();
    setContent(data);
  }, []);

  // Handle user name change
  const handleUserNameChange = (e) => {
    const newUserName = e.target.value.trim() || `User ${userId?.slice(-4)}`;
    setUserName(newUserName);
    localStorage.setItem('userName', newUserName);
    
    // Update user identity in collaboration if editor is ready
    if (editorRef.current) {
      const collaborationPlugin = editorRef.current.plugins.get('RealTimeCollaborativeEditing');
      if (collaborationPlugin) {
        // Note: User identity is typically set during editor initialization
        // You may need to reconnect to update the name
        console.log('User name changed. Reconnect may be needed to update in collaboration.');
      }
    }
  };

  // Editor configuration with CKEditor collaboration
  const editorConfig = {
    ...(LICENSE_KEY && { licenseKey: LICENSE_KEY }),
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Heading,
      Link,
      List,
      BlockQuote,
      Image,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Table,
      TableToolbar,
      CloudServices, // Required for collaboration features - must be before collaboration plugins
      FormatPainter,
      // Real-time collaboration plugins
      RealTimeCollaborativeEditing,
      RealTimeCollaborativeComments,
      RealTimeCollaborativeTrackChanges,
      RealTimeCollaborativeRevisionHistory,
      Comments,
      TrackChanges,
      RevisionHistory
      // PresenceList removed - requires container element, we show users manually
    ],
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'blockQuote',
        'insertTable',
        '|',
        'formatPainter',
        '|',
        'undo',
        'redo'
      ]
    },
    // CKEditor Cloud Services configuration
    cloudServices: {
      tokenUrl: TOKEN_URL,
      webSocketUrl: WS_URL,
      ...(ENVIRONMENT_ID && { environmentId: ENVIRONMENT_ID })
    },
    // Collaboration configuration
    collaboration: {
      channelId: documentId || 'default-doc', // Use document ID as channel ID
      // User identity - this identifies the current user in collaboration
      // Note: This should match the userId used in token generation
    },
    // Comments configuration
    comments: {
      editorConfig: {
        extraPlugins: [Bold, Italic, List]
      }
    },
    // Revision history configuration
    revisionHistory: {
      editorContainer: null, // Set to editor container element if using revision history viewer
      viewerContainer: null, // Set to revision history viewer container
      viewerEditorElement: null, // Set to revision history editor element
      viewerSidebarContainer: null, // Set to revision history sidebar container
      resumeUnsavedRevision: true
    },
    // Sidebar configuration (for comments/annotations)
    sidebar: {
      container: null // Set to sidebar container element if using sidebar
    },
    // Initial data - use initialData in config, not data prop (to avoid conflicts)
    initialData: content
  };


  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Real-Time Collaborative Editor</h1>
          <div className="header-controls">
            <input
              type="text"
              value={userName}
              onChange={handleUserNameChange}
              placeholder="Your name"
              className="user-name-input"
            />
            <div className="connection-status">
              <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '●' : '○'}
              </span>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {connectionError && (
              <div className="connection-error">
                {connectionError}
              </div>
            )}
          </div>
        </div>
        <div className="document-info">
          <span className="doc-id">Doc ID: {documentId}</span>
          {activeUsers.length > 0 && (
            <div className="active-users">
              <span>Active users: </span>
              {activeUsers.map((user) => (
                <span key={user.id} className="user-badge" style={{ backgroundColor: user.color }}>
                  {user.name || user.id}
                </span>
              ))}
            </div>
          )}
        </div>
      </header> 

      <div className="editor-wrapper">
        <CKEditor
          key={editorKey}
          editor={ClassicEditor}
          config={editorConfig}
          onReady={handleReady}
          onChange={handleChange}
        />
      </div>

      {!WS_URL && <SetupWarning />}
    </div>
  );
}

export default App;
