-- Migration 003: Add support for public document sharing
-- This allows documents to be shared via URL without requiring authentication

-- Add is_public column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for faster lookups of public documents
CREATE INDEX IF NOT EXISTS idx_documents_is_public
ON documents(is_public) WHERE is_public = true;

-- Policy: Allow anonymous users to view public documents
CREATE POLICY "Anyone can view public documents"
  ON documents FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own documents" ON documents;

-- Note: Other policies (INSERT, UPDATE, DELETE) remain unchanged
-- Only authenticated owners can create, modify, or delete documents
