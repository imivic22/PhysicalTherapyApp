'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
  notes: string;
  provider?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function AppointmentDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>('');

  useEffect(() => {
    fetchUserTypeAndAppointments();
  }, []);

  const fetchUserTypeAndAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      // First get user type
      const { data: profileData, error: profileError } = await supabase
        .from('medical_app_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserType(profileData.user_type);

      // Then fetch appointments based on user type
      if (profileData.user_type === 'provider') {
        await fetchProviderAppointments(user.id);
      } else {
        await fetchPatientAppointments(user.id);
      }

    } catch (error) {
      console.error('Error fetching user type:', error);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderAppointments = async (userId: string) => {
    try {
      console.log('Fetching provider appointments for user:', userId);

      // Get appointments for this provider
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
        .eq('provider_id', userId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

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

      setAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const fetchPatientAppointments = async (userId: string) => {
    try {
      console.log('Fetching patient appointments for user:', userId);

      const { data, error } = await supabase
        .from('medical_app_appointments')
        .select(`
          id,
          appointment_date,
          appointment_type,
          consultation_type,
          status,
          notes,
          provider_id
        `)
        .eq('patient_id', userId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Get provider details for each appointment
      const appointmentsWithProviders = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: providerData } = await supabase
            .from('medical_app_profiles')
            .select('first_name, last_name')
            .eq('id', apt.provider_id)
            .single();

          return {
            id: apt.id,
            appointment_date: apt.appointment_date,
            appointment_type: apt.appointment_type,
            status: apt.status,
            notes: apt.notes,
            provider: {
              first_name: providerData?.first_name || 'Dr.',
              last_name: providerData?.last_name || 'Provider',
              specialization: 'General Practice'
            }
          };
        })
      );

      setAppointments(appointmentsWithProviders);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'declined' | 'cancelled' | 'completed') => {
    try {
      setUpdatingStatus(appointmentId);
      
      const { error } = await supabase
        .from('medical_app_appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh appointments
      await fetchUserTypeAndAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    } finally {
      setUpdatingStatus(null);
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

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">
            {userType === 'provider' ? 'Patient Appointment Requests' : 'My Appointments'}
          </h2>
        </div>
        <span className="text-sm text-gray-500">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {userType === 'provider' ? 'No appointment requests' : 'No appointments scheduled'}
          </h3>
          <p className="text-gray-500">
            {userType === 'provider' 
              ? 'You don\'t have any pending appointment requests.' 
              : 'You don\'t have any upcoming appointments.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.appointment_date);
            const isUpcomingAppointment = isUpcoming(appointment.appointment_date);
            
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
                        {userType === 'provider' ? (
                          <>
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </>
                        ) : (
                          <>
                            Dr. {appointment.provider?.first_name} {appointment.provider?.last_name} - {appointment.provider?.specialization}
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{date}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{time}</span>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col space-y-2">
                    {/* View button for all appointments */}
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {/* Accept/Decline buttons for pending appointments */}
                    {appointment.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateAppointmentStatus(appointment.id, 'accepted')}
                          disabled={updatingStatus === appointment.id}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          {updatingStatus === appointment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => updateAppointmentStatus(appointment.id, 'declined')}
                          disabled={updatingStatus === appointment.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {updatingStatus === appointment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    )}
                    
                    {/* Cancel button for accepted upcoming appointments (patients only) */}
                    {userType === 'patient' && appointment.status === 'accepted' && isUpcomingAppointment && (
                      <button 
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        disabled={updatingStatus === appointment.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {updatingStatus === appointment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Mark Complete button for accepted upcoming appointments (providers only) */}
                    {userType === 'provider' && appointment.status === 'accepted' && isUpcomingAppointment && (
                      <button 
                        onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        disabled={updatingStatus === appointment.id}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {updatingStatus === appointment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 