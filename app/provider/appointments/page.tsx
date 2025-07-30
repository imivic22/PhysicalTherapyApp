'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ProviderAppointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  consultation_type: string;
  status: string;
  notes: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function ProviderAppointmentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchProviderAppointments();
    }
  }, [user, loading, router]);

  const fetchProviderAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching provider appointments for user:', user.id);

      // First, get the provider's profile ID
      const { data: profileData, error: profileError } = await supabase
        .from('medical_app_profiles')
        .select('id')
        .eq('id', user.id)
        .eq('user_type', 'provider')
        .single();

      if (profileError || !profileData) {
        console.error('Provider profile not found:', profileError);
        setError('Provider profile not found');
        return;
      }

      console.log('Provider profile ID:', profileData.id);

      // Then get appointments for this provider
      const { data, error } = await supabase
        .from('medical_app_appointments')
        .select(`
          id,
          appointment_date,
          appointment_type,
          consultation_type,
          status,
          notes,
          patient_id
        `)
        .eq('provider_id', profileData.id)
        .order('appointment_date', { ascending: true });

      console.log('Provider appointments query result:', data);
      console.log('Provider appointments query error:', error);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Get patient details for each appointment
      const appointmentsWithPatients = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: patientData } = await supabase
            .from('medical_app_profiles')
            .select('first_name, last_name, email')
            .eq('id', apt.patient_id)
            .single();

          return {
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_type: apt.appointment_type,
            consultation_type: apt.consultation_type,
            status: apt.status,
            notes: apt.notes,
            patient: {
              first_name: patientData?.first_name || 'Unknown',
              last_name: patientData?.last_name || 'Patient',
              email: patientData?.email || 'No email'
            }
          };
        })
      );

      console.log('Appointments with patients:', appointmentsWithPatients);
      setAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'declined' | 'completed') => {
    try {
      const { error } = await supabase
        .from('medical_app_appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh appointments
      fetchProviderAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (loading || loadingAppointments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Appointments</h1>
              <p className="mt-2 text-gray-600">
                View and manage your upcoming patient appointments
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
              <p className="text-gray-500">You don't have any upcoming appointments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.appointment_date);
                const isUpcoming = new Date(appointment.appointment_date) > new Date();
                const isPending = appointment.status === 'pending';
                
                return (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.appointment_type}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <User className="h-4 w-4 mr-2" />
                          <span>
                            {appointment.patient.first_name} {appointment.patient.last_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{date}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{time} ({appointment.consultation_type})</span>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Patient Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {isPending && (
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'accepted')}
                            className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'declined')}
                            className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {isUpcoming && appointment.status === 'accepted' && (
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Mark Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 