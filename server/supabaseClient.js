// Supabase Admin Client for Backend
// This file provides the Supabase client with service role access
// and helper functions for user verification

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
// This bypasses RLS and should only be used server-side
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Verify a user's JWT token and return user data
 * @param {string} token - The JWT token from Authorization header
 * @returns {Promise<{user: object, error: object|null}>}
 */
export async function verifyUserToken(token) {
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Get user profile from auth.users table
 * @param {string} userId - The user's UUID
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data.user;
}
