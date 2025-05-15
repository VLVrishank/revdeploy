/*
  # Configure storage bucket and policies

  1. Storage Configuration
    - Creates a public storage bucket named 'ads' for storing ad media files
    - Configures bucket for public access
  
  2. Security
    - Sets up policies for file access and management
    - Allows authenticated users to manage files
    - Allows public read access to files
*/

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for file management
BEGIN;
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view files" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Authenticated users can upload files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'ads');

  CREATE POLICY "Authenticated users can update files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'ads')
    WITH CHECK (bucket_id = 'ads');

  CREATE POLICY "Authenticated users can delete files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'ads');

  CREATE POLICY "Public can view files"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'ads');
COMMIT;