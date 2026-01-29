// Real-Time Collaborative Editor with Supabase Authentication
// Main application component handling auth flow and document management

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
  RevisionHistory,
  AIChat,
  AIQuickActions,
  AIActions,
  AIReviewMode,
  AIBalloon,
  AIEditorIntegration
} from 'ckeditor5-premium-features';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';
import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DocumentDashboard from './components/DocumentDashboard';
import { supabase } from './lib/supabase';

// Environment variables
const TOKEN_URL = import.meta.env.VITE_CKEDITOR_TOKEN_URL || 'http://localhost:3001/cs-token';
const WS_URL = import.meta.env.VITE_CKEDITOR_WS_URL || '';
const ENVIRONMENT_ID = import.meta.env.VITE_CKEDITOR_ENVIRONMENT_ID || '';
const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY || '';

// Editor Component
function Editor({ document, onBack }) {
  const { user, getAccessToken } = useAuth();
  const [content, setContent] = useState('<p>Start Collaborating ... </p>');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [editorLoading, setEditorLoading] = useState(true);
  const editorRef = useRef(null);
  const stateCheckIntervalRef = useRef(null);
  const [editorKey] = useState(() => Math.random());

  // Custom token URL function (works with or without authentication)
  const tokenUrl = useCallback(async () => {
    const url = `${TOKEN_URL}?channelId=${encodeURIComponent(document.document_id)}`;

    try {
      const headers = {};

      // Add Authorization header if user is logged in
      const token = getAccessToken ? getAccessToken() : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const ckEditorToken = await response.text();
      return ckEditorToken;
    } catch (error) {
      console.error('Error fetching CKEditor token:', error);
      throw error;
    }
  }, [document.document_id, getAccessToken]);

  // Save document metadata on content change (only if user is authenticated)
  const saveDocumentMetadata = useCallback(async () => {
    if (!user) {
      // Anonymous users can't update metadata
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          last_edited_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) {
        console.error('Error updating document metadata:', error);
      }
    } catch (err) {
      console.error('Error saving document:', err);
    }
  }, [document.id, user]);

  // Handle editor ready
  const handleReady = useCallback((editorInstance) => {
    console.log('Editor ready with CKEditor collaboration');
    editorRef.current = editorInstance;
    setEditorLoading(false); // Hide loader when editor is ready

    const collaborationPlugin = editorInstance.plugins.get('RealTimeCollaborativeEditing');

    if (collaborationPlugin) {
      const updateConnectionState = () => {
        try {
          const gateway = collaborationPlugin._gateway || collaborationPlugin.gateway;
          if (gateway) {
            const state = gateway.state;
            const connected = state === 'connected';
            setIsConnected(connected);
            if (!connected) {
              console.log('Connection state:', state);
            }
          }
        } catch (e) {
          console.log('Could not check connection state:', e);
        }
      };

      setTimeout(updateConnectionState, 1000);

      if (stateCheckIntervalRef.current) {
        clearInterval(stateCheckIntervalRef.current);
      }

      stateCheckIntervalRef.current = setInterval(updateConnectionState, 2000);

      collaborationPlugin.on('connectionStateChange', (evt, data) => {
        console.log('Collaboration connection state change:', data);
        updateConnectionState();

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

      collaborationPlugin.on('usersChange', (evt, data) => {
        console.log('Active users:', data.users);
        // Filter out current user (if authenticated)
        const currentUserId = user?.id;
        const otherUsers = currentUserId
          ? data.users.filter(u => u.id !== currentUserId)
          : data.users;
        setActiveUsers(otherUsers);
        if (data.users && data.users.length > 0) {
          setIsConnected(true);
          setConnectionError(null);
          if (stateCheckIntervalRef.current) {
            clearInterval(stateCheckIntervalRef.current);
            stateCheckIntervalRef.current = null;
          }
        }
      });

      collaborationPlugin.on('error', (evt, error) => {
        console.error('Collaboration error:', error);
        setConnectionError(error.message || 'Collaboration error occurred');
        setIsConnected(false);
      });
    }
  }, [user]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (stateCheckIntervalRef.current) {
        clearInterval(stateCheckIntervalRef.current);
      }
    };
  }, []);

  // Handle content change
  const handleChange = useCallback((event, editorInstance) => {
    const data = editorInstance.getData();
    setContent(data);

    // Debounce save
    if (handleChange.saveTimeout) {
      clearTimeout(handleChange.saveTimeout);
    }
    handleChange.saveTimeout = setTimeout(() => {
      saveDocumentMetadata();
    }, 2000);
  }, [saveDocumentMetadata]);

  // Editor configuration
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
      CloudServices,
      FormatPainter,
      RealTimeCollaborativeEditing,
      RealTimeCollaborativeComments,
      RealTimeCollaborativeTrackChanges,
      RealTimeCollaborativeRevisionHistory,
      Comments,
      TrackChanges,
      RevisionHistory,
      AIChat,
      AIQuickActions,
      AIActions,
      AIReviewMode,
      AIBalloon,
      AIEditorIntegration
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
        'toggleAi',
        'aiQuickActions',
        'ask-ai',
        'improve-writing',
        '|',
        'undo',
        'redo'
      ]
    },
    cloudServices: {
      tokenUrl: tokenUrl,
      webSocketUrl: WS_URL,
      ...(ENVIRONMENT_ID && { environmentId: ENVIRONMENT_ID })
    },
    collaboration: {
      channelId: document.document_id
    },
    ai: {
      container: {
        type: 'overlay',
        side: 'right',
        visibleByDefault: false
      }
    },
    comments: {
      editorConfig: {
        extraPlugins: [Bold, Italic, List]
      }
    },
    revisionHistory: {
      editorContainer: null,
      viewerContainer: null,
      viewerEditorElement: null,
      viewerSidebarContainer: null,
      resumeUnsavedRevision: true
    },
    sidebar: {
      container: null
    },
    initialData: content
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <button onClick={onBack} className="back-button">
            ← Back to Documents
          </button>
          <h1>{document.title}</h1>
          <div className="header-controls">
            {isConnected && (
              <div className="connection-status">
                <span className="status-indicator connected">●</span>
                <span>Connected</span>
              </div>
            )}
            {connectionError && (
              <div className="connection-error">
                {connectionError}
              </div>
            )}
          </div>
        </div>
        <div className="document-info">
          <span className="doc-id">Doc ID: {document.document_id}</span>
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
        {editorLoading && (
          <div className="editor-loader">
            <div className="spinner"></div>
            <p>Loading editor...</p>
          </div>
        )}
        <div style={{ display: editorLoading ? 'none' : 'block', width: '100%' }}>
          <CKEditor
            key={editorKey}
            editor={ClassicEditor}
            config={editorConfig}
            onReady={handleReady}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}

// Main App Component
function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [urlDocId, setUrlDocId] = useState(null);

  // Track URL changes
  useEffect(() => {
    const updateUrlDocId = () => {
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('doc');
      console.log('URL changed, doc ID:', docId);
      setUrlDocId(docId);
    };

    updateUrlDocId(); // Initial load
    window.addEventListener('popstate', updateUrlDocId);

    return () => window.removeEventListener('popstate', updateUrlDocId);
  }, []);

  // Update URL when document changes (but don't clear URL on initial load)
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (currentDocument) {
      const url = new URL(window.location.href);
      url.searchParams.set('doc', currentDocument.document_id);
      window.history.pushState({}, '', url);
      setUrlDocId(currentDocument.document_id);
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current && currentView === 'dashboard') {
      // Only clear URL if user explicitly went back to dashboard (not on initial load)
      const url = new URL(window.location.href);
      url.searchParams.delete('doc');
      window.history.pushState({}, '', url);
      setUrlDocId(null);
    }
  }, [currentDocument, currentView]);

  // Load document from URL (works even without authentication for public documents)
  useEffect(() => {
    console.log('URL effect triggered:', { user: !!user, urlDocId, currentDocument: currentDocument?.document_id, currentView });

    if (urlDocId) {
      // Check if we need to load a different document
      const needsLoad = !currentDocument || currentDocument.document_id !== urlDocId;

      if (needsLoad) {
        console.log('Fetching document from Supabase:', urlDocId);

        // Fetch document from Supabase (works for public documents even without auth)
        supabase
          .from('documents')
          .select('*')
          .eq('document_id', urlDocId)
          .maybeSingle() // Use maybeSingle to avoid error if not found
          .then(({ data, error }) => {
            console.log('Supabase response:', { data, error, hasData: !!data });

            if (data) {
              console.log('Document loaded successfully:', data.title, 'is_public:', data.is_public);
              setCurrentDocument(data);
              setCurrentView('editor');
            } else if (error) {
              console.error('Failed to load document:', error);
              alert(`Error loading document: ${error.message}`);
              setCurrentView('dashboard');
            } else {
              console.error('Document not found');
              alert('Document not found or you do not have permission to access it.');
              setCurrentView('dashboard');
            }
          })
          .catch(err => {
            console.error('Exception loading document:', err);
            alert(`Failed to load document: ${err.message}`);
            setCurrentView('dashboard');
          });
      } else {
        console.log('Document already loaded, skipping fetch');
      }
    } else {
      console.log('No urlDocId present');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDocId]);

  const handleOpenDocument = (doc) => {
    setCurrentDocument(doc);
    setCurrentView('editor');
  };

  const handleCreateDocument = (doc) => {
    setCurrentDocument(doc);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setCurrentDocument(null);
    setCurrentView('dashboard');
  };

  // Show loading state while authenticating OR while loading a document from URL
  if (loading || (urlDocId && !currentDocument && currentView !== 'dashboard')) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>{loading ? 'Loading...' : 'Loading document...'}</p>
      </div>
    );
  }

  // If there's a document loaded (from URL), show editor even without login
  if (currentView === 'editor' && currentDocument) {
    return <Editor document={currentDocument} onBack={handleBackToDashboard} />;
  }

  // Otherwise require authentication for dashboard
  if (!user) {
    return <Login />;
  }

  return (
    <DocumentDashboard
      onOpenDocument={handleOpenDocument}
      onCreateDocument={handleCreateDocument}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
