'use client';

import React, { useState, useEffect } from 'react';
import { PatientCard } from './PatientCard';
import { AppointmentList } from './AppointmentList';
import { ClipboardList, Users, Calendar, Activity, User, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface HealthcareTeamMember {
  id: string;
  provider_id: string;
  relationship_type: string;
  provider: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

export function PatientDashboard() {
  const [patientName, setPatientName] = useState<string>('');
  const [healthcareTeam, setHealthcareTeam] = useState<HealthcareTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientName();
    fetchHealthcareTeam();
  }, []);

  const fetchPatientName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('medical_app_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPatientName(`${data.first_name} ${data.last_name}`);
      }
    } catch (error) {
      console.error('Error fetching patient name:', error);
    }
  };

  const fetchHealthcareTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get the healthcare team records
      const { data: teamData, error: teamError } = await supabase
        .from('medical_app_healthcare_team')
        .select('id, provider_id, relationship_type')
        .eq('patient_id', user.id)
        .eq('is_active', true)
        .order('added_date', { ascending: false });

      if (teamError) throw teamError;

      if (!teamData || teamData.length === 0) {
        setHealthcareTeam([]);
        return;
      }

      // Get provider details for each team member
      const providerIds = teamData.map(member => member.provider_id);
      
      // Fetch all providers and filter them instead of individual queries
      const { data: simpleProfiles, error: simpleError } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name');

      if (simpleError) throw simpleError;

      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name, specialization, user_type');

      if (allProfilesError) {
        // Fallback to simple profiles if full query fails
        const fallbackProfiles = simpleProfiles?.map(profile => ({
          ...profile,
          specialization: 'General Practice',
          user_type: 'provider' // Assume all are providers for now
        })) || [];
        
        const allProviders = fallbackProfiles.filter(profile => profile.user_type === 'provider');
        
        // Filter to only the providers we need
        const providerData = allProviders.filter(provider => 
          providerIds.includes(provider.id)
        );

        // Create a map of provider data
        const providerMap = new Map();
        providerData?.forEach(provider => {
          providerMap.set(provider.id, provider);
        });

        // Transform the data to match the interface
        const transformedData = teamData.map((item: any) => {
          const provider = providerMap.get(item.provider_id);
          return {
            id: item.id,
            provider_id: item.provider_id,
            relationship_type: item.relationship_type,
            provider: {
              first_name: provider?.first_name || '',
              last_name: provider?.last_name || '',
              specialization: provider?.specialization || 'General Practice'
            }
          };
        });

        setHealthcareTeam(transformedData);
        return;
      }

      // Filter to only providers
      const allProviders = allProfiles?.filter(profile => profile.user_type === 'provider') || [];

      // Filter to only the providers we need
      const providerData = allProviders.filter(provider => 
        providerIds.includes(provider.id)
      );

      // Create a map of provider data
      const providerMap = new Map();
      providerData?.forEach(provider => {
        providerMap.set(provider.id, provider);
      });

      // Transform the data to match the interface
      const transformedData = teamData.map((item: any) => {
        const provider = providerMap.get(item.provider_id);
        return {
          id: item.id,
          provider_id: item.provider_id,
          relationship_type: item.relationship_type,
          provider: {
            first_name: provider?.first_name || '',
            last_name: provider?.last_name || '',
            specialization: provider?.specialization || 'General Practice'
          }
        };
      });

      setHealthcareTeam(transformedData);
    } catch (error) {
      console.error('Error fetching healthcare team:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              href="/appointments"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span>Schedule Appointment</span>
            </Link>
            <Link 
              href="/profile"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <User className="h-5 w-5 mr-3" />
              <span>View Profile</span>
            </Link>
            <Link 
              href="/medical-records"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-3" />
              <span>Medical Records</span>
            </Link>
            <Link 
              href="/immunizations"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Shield className="h-5 w-5 mr-3" />
              <span>Manage Immunizations</span>
            </Link>
            <Link 
              href="/healthcare-team"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-3" />
              <span>My Healthcare Team</span>
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                My Appointments
              </h2>
              <p className="text-2xl font-semibold text-gray-800">5</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Next Appointment
              </h2>
              <p className="text-2xl font-semibold text-gray-800">Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Treatment Plans
              </h2>
              <p className="text-2xl font-semibold text-gray-800">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Activity className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Recovery Progress
              </h2>
              <p className="text-2xl font-semibold text-gray-800">75%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Shield className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Immunizations
              </h2>
              <p className="text-2xl font-semibold text-gray-800">8</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800">
                My Appointments
              </h3>
            </div>
            <div className="px-6 py-5">
              <AppointmentList userType="patient" />
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800">
                My Healthcare Team
              </h3>
            </div>
            <div className="px-6 py-5">
              {healthcareTeam.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No healthcare providers in your team yet</p>
                  <Link 
                    href="/healthcare-team"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Add Providers
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {healthcareTeam.map((member) => (
                    <PatientCard
                      key={member.id}
                      name={`DR ${member.provider.first_name} ${member.provider.last_name}`}
                      condition={member.provider.specialization}
                      nextAppointment="Next Week" // Placeholder, needs actual data
                      progress={100} // Placeholder, needs actual data
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 