/*
  # Create ProjectRev Tables

  1. New Tables
    - `ads` - Stores ad content information
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `type` (text) - either 'image' or 'video'
      - `url` (text) - URL to the ad content
      - `external_link` (text) - URL for the QR code
      - `duration` (integer) - duration in seconds for image ads
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `rickshaw_devices` - Stores information about display devices
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone_number` (text, unique)
      - `pin` (text) - 4-digit PIN for login
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage ads
    - Add policies for device access
*/

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  external_link text NOT NULL,
  duration integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create rickshaw_devices table
CREATE TABLE IF NOT EXISTS rickshaw_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text UNIQUE NOT NULL,
  pin text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rickshaw_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for ads table
CREATE POLICY "Authenticated users can create ads"
  ON ads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read ads"
  ON ads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update their ads"
  ON ads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ads"
  ON ads
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for public access to active ads
CREATE POLICY "Public can view active ads"
  ON ads
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Create policies for rickshaw_devices table
CREATE POLICY "Authenticated users can manage devices"
  ON rickshaw_devices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous can read devices for PIN verification"
  ON rickshaw_devices
  FOR SELECT
  TO anon
  USING (true);

-- Insert test accounts
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@projectrev.com',
  crypt('controller123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
) ON CONFLICT DO NOTHING;

-- Insert test rickshaw device
INSERT INTO rickshaw_devices (name, phone_number, pin)
VALUES (
  'Test Rickshaw',
  '+91 9876543210',
  '1234'
) ON CONFLICT DO NOTHING;