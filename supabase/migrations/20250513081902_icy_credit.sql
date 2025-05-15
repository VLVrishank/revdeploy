/*
  # Add storage bucket policies

  1. Security
    - Add policies for authenticated users to:
      - Upload files
      - Read files
      - Delete files
    - Add policy for public file access
*/

-- Create bucket if it doesn't exist using security definer function
CREATE OR REPLACE FUNCTION create_storage_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('ads', 'ads', true)
  ON CONFLICT (id) DO NOTHING;
END
$$;

SELECT create_storage_bucket();

-- Create policies using security definer function
CREATE OR REPLACE FUNCTION create_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
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
END
$$;

SELECT create_storage_policies();