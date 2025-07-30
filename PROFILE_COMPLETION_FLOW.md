# Profile Completion Flow

## Overview

The application now enforces a complete profile completion flow before users can access the dashboard. This ensures that all necessary information is collected based on the user type (patient or provider).

## User Flow

### 1. Signup Process
1. User fills out signup form with basic information (name, email, password, user type)
2. User receives email verification link
3. User clicks verification link

### 2. Email Verification
1. User is redirected to `/auth/callback`
2. System checks if profile is complete
3. If incomplete, redirects to `/profile/complete`
4. If complete, redirects to `/dashboard`

### 3. Profile Completion
1. User is presented with a comprehensive form based on their user type
2. **Common fields for all users:**
   - Phone number
   - Date of birth
   - Address (street, city, state, zip code)

3. **Provider-specific fields:**
   - Specialization
   - Years of experience
   - License number
   - Education

4. **Patient-specific fields:**
   - Emergency contact information
   - Insurance information
   - Medical history
   - Allergies
   - Current medications

### 4. Dashboard Access
1. After profile completion, user is redirected to dashboard
2. Middleware prevents access to dashboard without complete profile
3. Users can only access dashboard with complete profile

## Database Tables

### medical_app_profiles
- Basic user information (created during signup)
- Contains: id, email, first_name, last_name, user_type

### medical_app_healthcare_providers
- Provider-specific information
- Contains: id, phone, date_of_birth, address, specialization, years_experience, license_number, education

### medical_app_patients_caretakers
- Patient-specific information
- Contains: id, phone, date_of_birth, address, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_policy_number, medical_history, allergies, current_medications

## Route Protection

The middleware (`middleware.ts`) protects all routes and ensures:
- Unauthenticated users are redirected to login
- Authenticated users without complete profiles are redirected to profile completion
- Users with complete profiles can access dashboard and other protected routes

## Key Features

- **Progress indicator** showing the user's current step in the onboarding process
- **Role-based forms** with different fields for patients vs providers
- **Form validation** with required fields
- **Automatic redirects** based on profile completion status
- **Persistent protection** preventing dashboard access without complete profile

## Testing the Flow

1. **Signup:** Go to `/auth/signup` and create a new account
2. **Email verification:** Check email and click verification link
3. **Profile completion:** Should be redirected to `/profile/complete`
4. **Dashboard access:** After completing profile, should be redirected to `/dashboard`
5. **Login:** Try logging in with existing account - should check profile completion

## Error Handling

- If profile completion fails, user sees error message and can retry
- If database errors occur, user is redirected to profile completion
- All form validations prevent submission of incomplete data 