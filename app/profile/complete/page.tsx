'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { checkProfileCompletion } from '../../../lib/profileUtils';
import { supabase } from '../../../lib/supabase';
import { 
  Phone, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Heart, 
  Building,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface ProfileData {
  // Common fields
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Provider specific fields
  specialization?: string;
  years_experience?: number;
  license_number?: string;
  education?: string;
  certifications?: string;
  practice_setting?: string;
  hospital_affiliations?: string;
  treatment_approaches?: string;
  
  // Patient specific fields
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({});

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const { isComplete, userType: type } = await checkProfileCompletion(user.id);
        
        if (isComplete) {
          // Profile already complete, redirect to dashboard
          router.push('/dashboard');
          return;
        }

        setUserType(type);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking profile:', error);
        setError('Failed to load profile information');
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const baseData = {
        id: user.id,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        updated_at: new Date().toISOString()
      };

      if (userType === 'provider') {
        // Insert into healthcare providers table
        const { error: providerError } = await supabase
          .from('medical_app_healthcare_providers')
          .insert([{
            ...baseData,
            specialization: formData.specialization,
            years_experience: formData.years_experience,
            license_number: formData.license_number,
            education: formData.education,
            certifications: formData.certifications,
            practice_setting: formData.practice_setting,
            hospital_affiliations: formData.hospital_affiliations,
            treatment_approaches: formData.treatment_approaches
          }]);

        if (providerError) throw providerError;
      } else {
        // Insert into patients/caretakers table
        const { error: patientError } = await supabase
          .from('medical_app_patients_caretakers')
          .insert([{
            ...baseData,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            insurance_provider: formData.insurance_provider,
            insurance_policy_number: formData.insurance_policy_number,
            medical_history: formData.medical_history,
            allergies: formData.allergies,
            current_medications: formData.current_medications
          }]);

        if (patientError) throw patientError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error completing profile:', error);
      setError(error.message || 'Failed to complete profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
          <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              {userType === 'provider' ? (
                <Stethoscope className="h-8 w-8 text-white" />
              ) : (
                <Heart className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            {userType === 'provider' 
              ? 'Help us set up your healthcare provider profile'
              : 'Help us set up your patient profile'
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Account Created</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Email Verified</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-blue-900">Complete Profile</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300" />
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-full">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-400">Access Dashboard</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main Street"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code || ''}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="12345"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Provider Specific Fields */}
            {userType === 'provider' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select specialization</option>
                      <option value="Physical Therapy">Physical Therapy</option>
                      <option value="Occupational Therapy">Occupational Therapy</option>
                      <option value="Sports Medicine">Sports Medicine</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Practice">General Practice</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Geriatrics">Geriatrics</option>
                      <option value="Rehabilitation">Rehabilitation</option>
                      <option value="Pain Management">Pain Management</option>
                      <option value="Sports Rehabilitation">Sports Rehabilitation</option>
                      <option value="Neurological Rehabilitation">Neurological Rehabilitation</option>
                      <option value="Cardiac Rehabilitation">Cardiac Rehabilitation</option>
                      <option value="Pulmonary Rehabilitation">Pulmonary Rehabilitation</option>
                      <option value="Women's Health">Women's Health</option>
                      <option value="Vestibular Therapy">Vestibular Therapy</option>
                      <option value="Lymphedema Therapy">Lymphedema Therapy</option>
                      <option value="Wound Care">Wound Care</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      id="years_experience"
                      name="years_experience"
                      value={formData.years_experience || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5"
                      min="0"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      id="license_number"
                      name="license_number"
                      value={formData.license_number || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="License number"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
                      Education & Credentials
                    </label>
                    <input
                      type="text"
                      id="education"
                      name="education"
                      value={formData.education || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., DPT, MD, OTR/L, SCS"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications & Specializations
                    </label>
                    <textarea
                      id="certifications"
                      name="certifications"
                      value={formData.certifications || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List any board certifications, specialized training, or additional qualifications..."
                    />
                  </div>

                  <div>
                    <label htmlFor="practice_setting" className="block text-sm font-medium text-gray-700 mb-2">
                      Practice Setting
                    </label>
                    <select
                      id="practice_setting"
                      name="practice_setting"
                      value={formData.practice_setting || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select practice setting</option>
                      <option value="Private Practice">Private Practice</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Outpatient Clinic">Outpatient Clinic</option>
                      <option value="Rehabilitation Center">Rehabilitation Center</option>
                      <option value="Sports Medicine Clinic">Sports Medicine Clinic</option>
                      <option value="Home Health">Home Health</option>
                      <option value="Skilled Nursing Facility">Skilled Nursing Facility</option>
                      <option value="School System">School System</option>
                      <option value="Academic/University">Academic/University</option>
                      <option value="Military">Military</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="hospital_affiliations" className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Affiliations
                    </label>
                    <textarea
                      id="hospital_affiliations"
                      name="hospital_affiliations"
                      value={formData.hospital_affiliations || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List any hospitals or medical centers where you have privileges..."
                    />
                  </div>

                  <div>
                    <label htmlFor="treatment_approaches" className="block text-sm font-medium text-gray-700 mb-2">
                      Treatment Approaches & Techniques
                    </label>
                    <textarea
                      id="treatment_approaches"
                      name="treatment_approaches"
                      value={formData.treatment_approaches || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your treatment philosophy, preferred techniques, or specialized approaches..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Patient Specific Fields */}
            {userType === 'patient' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Emergency contact name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="insurance_provider" className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      id="insurance_provider"
                      name="insurance_provider"
                      value={formData.insurance_provider || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Insurance provider"
                    />
                  </div>

                  <div>
                    <label htmlFor="insurance_policy_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Policy Number
                    </label>
                    <input
                      type="text"
                      id="insurance_policy_number"
                      name="insurance_policy_number"
                      value={formData.insurance_policy_number || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Policy number"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-2">
                      Medical History
                    </label>
                    <textarea
                      id="medical_history"
                      name="medical_history"
                      value={formData.medical_history || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please list any relevant medical history..."
                    />
                  </div>

                  <div>
                    <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <textarea
                      id="allergies"
                      name="allergies"
                      value={formData.allergies || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List any allergies..."
                    />
                  </div>

                  <div>
                    <label htmlFor="current_medications" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <textarea
                      id="current_medications"
                      name="current_medications"
                      value={formData.current_medications || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List current medications..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing Profile...
                  </div>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 