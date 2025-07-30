import { supabase } from "./supabase";

export async function checkProfileCompletion(userId: string): Promise<{
  isComplete: boolean;
  userType: string | null;
  missingTable: string | null;
}> {
  console.log('Checking profile completion for user:', userId);
  try {
    // First, get the user type
    const { data: profileData, error: profileError } = await supabase
      .from("medical_app_profiles")
      .select("user_type")
      .eq("id", userId)
      .single();

    console.log('Profile data:', profileData, 'Profile error:', profileError);

    if (profileError || !profileData) {
      console.log('No profile found, returning incomplete');
      return { isComplete: false, userType: null, missingTable: "medical_app_profiles" };
    }

    const userType = profileData.user_type;
    console.log('User type:', userType);

    if (userType === "provider") {
      // Check if provider profile exists
      const { data: providerData, error: providerError } = await supabase
        .from("medical_app_healthcare_providers")
        .select("id")
        .eq("id", userId)
        .single();

      console.log('Provider data:', providerData, 'Provider error:', providerError);

      // Handle 406 error specifically (RLS issue)
      if (providerError && providerError.code === '406') {
        console.log('RLS policy blocking access to provider table, assuming incomplete profile');
        return { isComplete: false, userType, missingTable: "medical_app_healthcare_providers" };
      }

      if (providerError || !providerData) {
        console.log('Provider profile incomplete');
        return { isComplete: false, userType, missingTable: "medical_app_healthcare_providers" };
      }
    } else {
      // Check if patient profile exists
      const { data: patientData, error: patientError } = await supabase
        .from("medical_app_patients_caretakers")
        .select("id")
        .eq("id", userId)
        .single();

      console.log('Patient data:', patientData, 'Patient error:', patientError);

      // Handle 406 error specifically (RLS issue)
      if (patientError && patientError.code === '406') {
        console.log('RLS policy blocking access to patient table, assuming incomplete profile');
        return { isComplete: false, userType, missingTable: "medical_app_patients_caretakers" };
      }

      if (patientError || !patientData) {
        console.log('Patient profile incomplete');
        return { isComplete: false, userType, missingTable: "medical_app_patients_caretakers" };
      }
    }

    console.log('Profile is complete');
    return { isComplete: true, userType, missingTable: null };
  } catch (error) {
    console.error("Error checking profile completion:", error);
    return { isComplete: false, userType: null, missingTable: null };
  }
}
