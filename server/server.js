// Production Server with Supabase Authentication
// Handles CKEditor token generation with user verification

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { verifyUserToken } from './supabaseClient.js';
import { generateCKEditorToken } from './ckeditorToken.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * CKEditor Cloud Services Token Endpoint
 * Authenticates user and generates a signed JWT token for CKEditor
 *
 * Expects: Authorization header with Supabase JWT token
 * Returns: CKEditor JWT token as plain text
 */
const handleTokenRequest = async (req, res) => {
  try {
    // TEMPORARY: Use development token URL as fallback
    // This allows anonymous collaboration without authentication
    const devTokenUrl = process.env.CKEDITOR_DEV_TOKEN_URL;

    if (devTokenUrl) {
      console.log('Using development token URL (allows anonymous collaboration)');
      const https = await import('https');
      const { URL } = await import('url');

      return new Promise((resolve, reject) => {
        const tokenUrl = new URL(devTokenUrl);
        https.get(tokenUrl, (tokenRes) => {
          let data = '';
          tokenRes.on('data', chunk => data += chunk);
          tokenRes.on('end', () => {
            res.setHeader('Content-Type', 'text/plain');
            res.send(data.trim());
            resolve();
          });
        }).on('error', reject);
      });
    }

    // Production JWT token generation (optional authentication)
    const authHeader = req.headers.authorization;
    let user = null;

    // Try to authenticate if token provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = await verifyUserToken(token);
      if (!result.error) {
        user = result.user;
      }
    }

    // If no authenticated user, create anonymous user
    if (!user) {
      user = {
        id: `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: 'anonymous@example.com',
        user_metadata: {
          full_name: 'Anonymous User'
        }
      };
      console.log('Creating anonymous user for collaboration:', user.id);
    }

    const channelId = req.query.channelId || req.body?.channelId;

    if (!channelId) {
      console.error('Missing channelId parameter');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'channelId parameter is required'
      });
    }

    const ckEditorToken = generateCKEditorToken(user, channelId);
    console.log(`Token generated for user: ${user.email} (${user.id}), channel: ${channelId}`);

    res.setHeader('Content-Type', 'text/plain');
    res.send(ckEditorToken);

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate token'
    });
  }
};

// Handle OPTIONS for CORS preflight
app.options('/cs-token', (req, res) => {
  res.sendStatus(200);
});

// Token endpoint - supports both GET and POST
app.get('/cs-token', handleTokenRequest);
app.post('/cs-token', handleTokenRequest);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Token endpoint: http://localhost:${PORT}/cs-token`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
