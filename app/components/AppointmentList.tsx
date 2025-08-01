'use client';

import React, { useState, useEffect } from 'react';
import { Clock3, CheckCircle, Calendar, User, XCircle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  consultation_type: string;
  status: string;
  notes: string;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  provider?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

interface AppointmentListProps {
  userType?: 'provider' | 'patient';
}

export function AppointmentList({ userType }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [userType]);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      // If userType is not provided, determine it from the user's profile
      let currentUserType = userType;
      if (!currentUserType) {
        const { data: profileData, error: profileError } = await supabase
          .from('medical_app_profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user type:', profileError);
          setError('Failed to load user information');
          return;
        }

        currentUserType = profileData.user_type;
      }

      console.log('Fetching appointments for user:', user.id, 'Type:', currentUserType);

      if (currentUserType === 'provider') {
        await fetchProviderAppointments(user.id);
      } else {
        await fetchPatientAppointments(user.id);
      }

    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderAppointments = async (userId: string) => {
    try {
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

      setAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const fetchPatientAppointments = async (userId: string) => {
    try {
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
            consultation_type: apt.consultation_type,
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
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
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

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
        <p className="text-gray-500">You don't have any upcoming appointments.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {userType === 'provider' ? 'Patient' : 'Provider'}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(appointment => (
              <tr key={appointment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="font-medium text-gray-800">
                      {userType === 'provider' ? (
                        <>
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </>
                      ) : (
                        <>
                          Dr. {appointment.provider?.first_name} {appointment.provider?.last_name}
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock3 className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-gray-600">{formatTime(appointment.appointment_date)}</div>
                      <div className="text-sm text-gray-500">{formatDate(appointment.appointment_date)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {appointment.appointment_type}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">{appointment.consultation_type}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
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
                    {userType === 'patient' && appointment.status === 'accepted' && isUpcoming(appointment.appointment_date) && (
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
                    {userType === 'provider' && appointment.status === 'accepted' && isUpcoming(appointment.appointment_date) && (
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}