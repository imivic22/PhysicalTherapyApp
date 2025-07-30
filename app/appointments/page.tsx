'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, List, Calendar, Users } from 'lucide-react';
import { AppointmentScheduler } from '../components/AppointmentScheduler';
import { AppointmentDashboard } from '../components/AppointmentDashboard';
import { supabase } from '../../lib/supabase';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule'>('dashboard');
  const [userType, setUserType] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/auth/login');
    } else if (user) {
      fetchUserType();
    }
  }, [user, loading, router]);

  const fetchUserType = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_app_profiles')
        .select('user_type')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserType(data.user_type);
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show appointments page if user is authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userType === 'provider' ? 'Manage Appointments' : 'My Appointments'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {userType === 'provider' 
                    ? 'View and manage patient appointment requests' 
                    : 'Schedule and manage your healthcare appointments'
                  }
                </p>
              </div>
              {userType === 'provider' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push('/provider/appointments')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Provider View
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <List className="h-4 w-4 mr-2" />
                    {userType === 'provider' ? 'Patient Requests' : 'My Appointments'}
                  </div>
                </button>
                {userType === 'patient' && (
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'schedule'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule New
                    </div>
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'dashboard' ? (
              <AppointmentDashboard />
            ) : (
              <div className="max-w-2xl">
                <AppointmentScheduler 
                  onAppointmentBooked={() => setActiveTab('dashboard')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached, but just in case
  return null;
} 