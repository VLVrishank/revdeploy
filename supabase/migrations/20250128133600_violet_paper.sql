/*
  # Add insert policy for profiles table

  1. Changes
    - Add RLS policy to allow users to insert their own profile
    - This fixes the 403 error during sign up

  2. Security
    - Users can only insert a profile for themselves
    - Maintains existing policies for viewing and updating
*/

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);