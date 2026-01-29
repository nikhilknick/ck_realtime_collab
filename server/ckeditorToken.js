// CKEditor Cloud Services Token Generator
// Generates JWT tokens for CKEditor collaboration features

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const CKEDITOR_ENVIRONMENT_ID = process.env.CKEDITOR_ENVIRONMENT_ID;
const CKEDITOR_API_SECRET = process.env.CKEDITOR_API_SECRET;

console.log('CKEditor Token Module Loaded:');
console.log('  CKEDITOR_ENVIRONMENT_ID:', CKEDITOR_ENVIRONMENT_ID);
console.log('  CKEDITOR_API_SECRET:', CKEDITOR_API_SECRET ? `${CKEDITOR_API_SECRET.substring(0, 20)}...` : 'undefined');

if (!CKEDITOR_ENVIRONMENT_ID || !CKEDITOR_API_SECRET) {
  console.error('Missing CKEditor environment variables');
  console.error('Required: CKEDITOR_ENVIRONMENT_ID, CKEDITOR_API_SECRET');
}

/**
 * Generate a CKEditor Cloud Services token
 * @param {object} user - The authenticated user object from Supabase
 * @param {string} channelId - The document/channel ID for collaboration
 * @returns {string} - Signed JWT token
 */
export function generateCKEditorToken(user, channelId) {
  console.log('Generating token with CKEDITOR_ENVIRONMENT_ID:', CKEDITOR_ENVIRONMENT_ID);

  // CKEditor requires aud in format: environment:{environmentId}
  const audience = `environment:${CKEDITOR_ENVIRONMENT_ID}`;
  console.log('Using audience:', audience);

  const payload = {
    aud: audience,
    iat: Math.floor(Date.now() / 1000),
    sub: user.id,
    user: {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email,
      avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=random`
    },
    auth: {
      collaboration: {
        '*': {
          role: 'writer'
        }
      },
      comments: {
        '*': {
          role: 'writer'
        }
      }
    }
  };

  // If a specific channel is provided, restrict permissions to that channel
  if (channelId) {
    payload.auth.collaboration = {
      [channelId]: {
        role: 'writer'
      }
    };
    payload.auth.comments = {
      [channelId]: {
        role: 'writer'
      }
    };
  }

  const token = jwt.sign(payload, CKEDITOR_API_SECRET, {
    algorithm: 'HS256'
  });

  return token;
}

/**
 * Generate a token with custom permissions
 * @param {object} user - The authenticated user
 * @param {string} channelId - The channel ID
 * @param {string} role - The role ('writer', 'reader', 'commentator')
 * @returns {string} - Signed JWT token
 */
export function generateCKEditorTokenWithRole(user, channelId, role = 'writer') {
  const payload = {
    aud: `environment:${CKEDITOR_ENVIRONMENT_ID}`,
    iat: Math.floor(Date.now() / 1000),
    sub: user.id,
    user: {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      email: user.email,
      avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=random`
    },
    auth: {
      collaboration: {
        [channelId]: {
          role: role
        }
      },
      comments: {
        [channelId]: {
          role: role === 'reader' ? 'reader' : 'writer'
        }
      }
    }
  };

  const token = jwt.sign(payload, CKEDITOR_API_SECRET, {
    algorithm: 'HS256'
  });

  return token;
}
