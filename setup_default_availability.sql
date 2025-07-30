-- Set up default availability for providers
-- This will create availability for weekdays 9 AM to 5 PM

-- First, let's see what providers we have
SELECT id, first_name, last_name FROM medical_app_profiles WHERE user_type = 'provider';

-- Insert default availability for all providers (weekdays 9 AM to 5 PM)
INSERT INTO medical_app_provider_availability (provider_id, day_of_week, start_time, end_time)
SELECT 
  id as provider_id,
  day_of_week,
  '09:00'::time as start_time,
  '17:00'::time as end_time
FROM medical_app_profiles 
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS days(day_of_week)
WHERE user_type = 'provider'
ON CONFLICT (provider_id, day_of_week, start_time, end_time) DO NOTHING;

-- Generate time slots for the next 30 days for all providers
SELECT generate_provider_time_slots(
  provider_id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
)
FROM medical_app_profiles 
WHERE user_type = 'provider';

-- Show the generated time slots
SELECT 
  p.first_name,
  p.last_name,
  ts.slot_date,
  ts.slot_time,
  ts.is_available,
  ts.is_booked
FROM medical_app_provider_time_slots ts
JOIN medical_app_profiles p ON ts.provider_id = p.id
WHERE ts.slot_date >= CURRENT_DATE
ORDER BY p.first_name, ts.slot_date, ts.slot_time
LIMIT 20; 