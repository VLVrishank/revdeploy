/*
  # Create storage bucket for ads

  1. New Storage Bucket
    - Creates a new public storage bucket named 'ads' for storing ad media files
    - Enables public access for the bucket
  
  2. Security
    - Enables RLS on the bucket
    - Adds policies for:
      - Authenticated users can upload files
      - Anyone can download files
*/

-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true);

-- Enable RLS
alter table storage.objects enable row level security;

-- Allow authenticated users to upload files
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'ads');

-- Allow public access to files
create policy "Anyone can download files"
on storage.objects for select
to public
using (bucket_id = 'ads');