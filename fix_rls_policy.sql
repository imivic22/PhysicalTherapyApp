-- Fix RLS policy to allow reading all profiles for appointment scheduling
-- This will allow the appointment scheduler to see all provider profiles

-- First, let's see the current policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'medical_app_profiles' AND cmd = 'SELECT';

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON medical_app_profiles;

-- Create a new SELECT policy that allows reading all profiles
-- This is needed for the appointment scheduler to see all providers
CREATE POLICY "Enable read access for all profiles" ON medical_app_profiles
FOR SELECT
TO public
USING (true);

-- Verify the new policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'medical_app_profiles' AND cmd = 'SELECT'; 