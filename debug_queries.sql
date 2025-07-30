-- Debug queries to see what's in your database

-- 1. Show ALL profiles in medical_app_profiles table
SELECT 
  id,
  first_name,
  last_name,
  user_type,
  email,
  created_at
FROM medical_app_profiles
ORDER BY created_at DESC;

-- 2. Show only provider profiles
SELECT 
  id,
  first_name,
  last_name,
  user_type,
  email
FROM medical_app_profiles
WHERE user_type = 'provider'
ORDER BY created_at DESC;

-- 3. Show all healthcare providers
SELECT 
  id,
  specialization,
  years_experience,
  license_number,
  education
FROM medical_app_healthcare_providers
ORDER BY created_at DESC;

-- 4. Count total profiles by user_type
SELECT 
  user_type,
  COUNT(*) as count
FROM medical_app_profiles
GROUP BY user_type;

-- 5. Show profiles with "Collin" in the name (case insensitive)
SELECT 
  id,
  first_name,
  last_name,
  user_type,
  email
FROM medical_app_profiles
WHERE 
  LOWER(first_name) LIKE '%collin%' OR 
  LOWER(last_name) LIKE '%collin%'
ORDER BY created_at DESC; 