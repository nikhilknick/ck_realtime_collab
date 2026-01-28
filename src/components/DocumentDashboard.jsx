// Document Dashboard Component
// Displays list of user's documents with CRUD operations

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './DocumentDashboard.css';

function DocumentDashboard({ onOpenDocument, onCreateDocument }) {
  const { user, signOut } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch user's documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    setCreating(true);
    try {
      // Generate unique document ID
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            document_id: documentId,
            title: newDocTitle.trim(),
            description: newDocDescription.trim() || null,
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setDocuments([data, ...documents]);

      // Reset form and close modal
      setNewDocTitle('');
      setNewDocDescription('');
      setShowCreateModal(false);

      // Open the new document
      if (onCreateDocument) {
        onCreateDocument(data);
      }
    } catch (err) {
      console.error('Error creating document:', err);
      alert('Failed to create document: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!confirm(`Delete "${doc.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      // Remove from local state
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Documents</h1>
          <div className="header-actions">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              + New Document
            </button>
            <div className="user-menu">
              <img
                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
                alt="User avatar"
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button onClick={signOut} className="btn-link">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading documents...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>Error loading documents: {error}</p>
            <button onClick={fetchDocuments} className="btn-secondary">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2>No documents yet</h2>
            <p>Create your first document to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Document
            </button>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-card-header">
                  <h3>{doc.title}</h3>
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="btn-icon"
                    title="Delete document"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {doc.description && (
                  <p className="document-description">{doc.description}</p>
                )}
                <div className="document-card-footer">
                  <span className="document-date">
                    Updated {formatDate(doc.updated_at)}
                  </span>
                  <button
                    onClick={() => onOpenDocument(doc)}
                    className="btn-secondary btn-small"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Document</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-icon"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateDocument} className="modal-body">
              <div className="form-group">
                <label htmlFor="doc-title">Title *</label>
                <input
                  id="doc-title"
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="doc-description">Description (optional)</label>
                <textarea
                  id="doc-description"
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Add a description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newDocTitle.trim()}
                >
                  {creating ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentDashboard;
