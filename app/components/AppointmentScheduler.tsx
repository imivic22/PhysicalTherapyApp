'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, ChevronLeft, ChevronRight, Clock, AlertCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  years_experience: number;
}

interface SupabaseProvider {
  id: string;
  medical_app_profiles: {
    first_name: string;
    last_name: string;
  }[];
  specialization: string;
  years_experience: number;
}

interface AppointmentSchedulerProps {
  onAppointmentBooked?: () => void;
}

export function AppointmentScheduler({ onAppointmentBooked }: AppointmentSchedulerProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [consultationType, setConsultationType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // All possible time slots (9 AM to 5 PM, 1-hour intervals)
  const allTimeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  const appointmentTypes = [
    'Initial Consultation',
    'Follow-up',
    'Physical Therapy',
    'Assessment',
    'Treatment',
    'Review'
  ];

  const consultationTypes = [
    'In-person',
    'Virtual'
  ];

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    console.log('Search term changed:', searchTerm);
    console.log('Available providers:', providers);
    
    if (searchTerm.trim() === '') {
      setFilteredProviders([]);
      setShowProviderDropdown(false);
      console.log('No search term, hiding dropdown');
    } else {
      const filtered = providers.filter(provider => {
        const fullName = `${provider.first_name} ${provider.last_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        const matches = 
          provider.first_name.toLowerCase().includes(searchLower) ||
          provider.last_name.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower) ||
          provider.specialization.toLowerCase().includes(searchLower);
        
        console.log(`Checking provider: ${fullName} against "${searchLower}" - matches: ${matches}`);
        return matches;
      });
      
      console.log('Filtered providers:', filtered);
      setFilteredProviders(filtered);
      setShowProviderDropdown(true);
    }
  }, [searchTerm, providers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.provider-search-container')) {
        setShowProviderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch available time slots when provider or date changes
  useEffect(() => {
    if (selectedProvider && selectedDate) {
      fetchAvailableTimeSlots(selectedDate, selectedProvider);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedProvider, selectedDate]);

  const fetchProviders = async () => {
    try {
      console.log('Fetching trusted providers...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      // Get providers from the patient's healthcare team
      const { data: teamData, error: teamError } = await supabase
        .from('medical_app_healthcare_team')
        .select(`
          provider_id,
          provider:medical_app_profiles!provider_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq('patient_id', user.id)
        .eq('is_active', true);

      if (teamError) {
        console.error('Error fetching healthcare team:', teamError);
        return;
      }

      console.log('Healthcare team data:', teamData);

      if (teamData && teamData.length > 0) {
        const trustedProviders = teamData.map((item: any) => ({
          id: item.provider.id,
          first_name: item.provider.first_name,
          last_name: item.provider.last_name,
          specialization: 'General Practice', // Default specialization
          years_experience: 5 // Default experience
        }));
        
        setProviders(trustedProviders);
        console.log('Trusted providers:', trustedProviders);
      } else {
        console.log('No trusted providers found');
        setProviders([]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  // Debug function to check appointments in database
  const debugAppointments = async () => {
    try {
      console.log('=== DEBUGGING APPOINTMENTS ===');
      
      // Check all appointments
      const { data: allAppointments, error: allError } = await supabase
        .from('medical_app_appointments')
        .select('*');
      
      console.log('All appointments in database:', allAppointments);
      console.log('All appointments error:', allError);
      
      if (allAppointments && allAppointments.length > 0) {
        console.log('Sample appointment:', allAppointments[0]);
        console.log('Appointment date format:', allAppointments[0].appointment_date);
        console.log('Appointment date type:', typeof allAppointments[0].appointment_date);
      }
      
      console.log('=== END DEBUGGING ===');
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Call debug function on component mount
  useEffect(() => {
    debugAppointments();
  }, []);

  const fetchAvailableTimeSlots = async (date: Date, providerId: string) => {
    try {
      setLoadingTimeSlots(true);
      
      // Format date to match database format
      const dateString = date.toISOString().split('T')[0];
      
      console.log('=== FETCHING TIME SLOTS ===');
      console.log('Selected date:', date);
      console.log('Date string:', dateString);
      console.log('Provider ID:', providerId);
      console.log('All possible time slots:', allTimeSlots);

      // Get all appointments for this provider on this date
      const { data: existingAppointments, error } = await supabase
        .from('medical_app_appointments')
        .select('appointment_date, status')
        .eq('provider_id', providerId)
        .gte('appointment_date', `${dateString}T00:00:00`)
        .lt('appointment_date', `${dateString}T23:59:59`)
        .neq('status', 'cancelled')
        .neq('status', 'declined'); // Use neq instead of not.in

      if (error) {
        console.error('Error fetching existing appointments:', error);
        // If there's an error, show all slots as available
        setAvailableTimeSlots(allTimeSlots);
        return;
      }

      console.log('Existing appointments for this date/provider:', existingAppointments);

      // If no existing appointments, all slots are available
      if (!existingAppointments || existingAppointments.length === 0) {
        console.log('No existing appointments found for this date/provider, all slots available');
        setAvailableTimeSlots(allTimeSlots);
        return;
      }

      // Extract booked time slots
      const bookedTimeSlots = existingAppointments.map(apt => {
        const appointmentDate = new Date(apt.appointment_date);
        const timeString = appointmentDate.toTimeString().slice(0, 5); // Get HH:MM format
        console.log('Processing appointment:', apt.appointment_date);
        console.log('Appointment date object:', appointmentDate);
        console.log('Extracted time string:', timeString);
        return timeString;
      });

      console.log('Booked time slots:', bookedTimeSlots);

      // Filter out booked slots from all available slots
      const availableSlots = allTimeSlots.filter(slot => {
        const isAvailable = !bookedTimeSlots.includes(slot);
        console.log(`Time slot ${slot}: ${isAvailable ? 'Available' : 'Booked'}`);
        return isAvailable;
      });
      
      console.log('Final available time slots:', availableSlots);
      console.log('=== END FETCHING TIME SLOTS ===');
      
      setAvailableTimeSlots(availableSlots);
      
      // Clear selected time if it's no longer available
      if (selectedTime && !availableSlots.includes(selectedTime)) {
        setSelectedTime('');
      }

    } catch (error) {
      console.error('Error fetching available time slots:', error);
      // If there's an error, show all slots as available
      setAvailableTimeSlots(allTimeSlots);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleProviderSelect = (providerId: string, providerName: string) => {
    setSelectedProvider(providerId);
    setSelectedProviderName(providerName);
    setSearchTerm('');
    setShowProviderDropdown(false);
    setSelectedDate(null);
    setSelectedTime('');
    setAvailableTimeSlots([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    console.log('=== BOOKING APPOINTMENT ===');
    console.log('Selected provider:', selectedProvider);
    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);
    console.log('Appointment type:', appointmentType);
    console.log('Consultation type:', consultationType);

    if (!selectedProvider || !selectedDate || !selectedTime || !appointmentType || !consultationType) {
      console.log('Missing required fields');
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setError('You must be logged in to book an appointment');
        return;
      }

      console.log('Current user:', user.id);

      // Double-check availability before booking
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log('Checking availability for:', dateString, selectedTime);
      
      const { data: conflictingAppointments, error: checkError } = await supabase
        .from('medical_app_appointments')
        .select('id')
        .eq('provider_id', selectedProvider)
        .eq('appointment_date', `${dateString}T${selectedTime}:00`)
        .neq('status', 'cancelled')
        .neq('status', 'declined'); // Use neq instead of not.in

      if (checkError) {
        console.error('Error checking availability:', checkError);
        throw checkError;
      }

      console.log('Conflicting appointments:', conflictingAppointments);

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        console.log('Conflict found, slot no longer available');
        setError('This time slot is no longer available. Please select another time.');
        // Refresh available slots
        await fetchAvailableTimeSlots(selectedDate, selectedProvider);
        return;
      }

      // Create appointment datetime
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log('Appointment datetime:', appointmentDateTime.toISOString());

      // Create the appointment
      const appointmentData = {
        patient_id: user.id,
        provider_id: selectedProvider,
        appointment_date: appointmentDateTime.toISOString(),
        appointment_type: appointmentType,
        consultation_type: consultationType,
        notes: notes,
        status: 'pending'
      };

      console.log('Inserting appointment data:', appointmentData);

      const { data: appointmentResult, error: appointmentError } = await supabase
        .from('medical_app_appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError);
        throw appointmentError;
      }

      console.log('Appointment created successfully:', appointmentResult);

      setSuccess('Appointment booked successfully! Your provider will review and confirm your appointment.');
      setSelectedProvider('');
      setSelectedProviderName('');
      setSelectedDate(null);
      setSelectedTime('');
      setAppointmentType('');
      setConsultationType('');
      setNotes('');
      setSearchTerm('');
      setAvailableTimeSlots([]);
      
      if (onAppointmentBooked) {
        onAppointmentBooked();
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Only show weekdays (Monday = 1, Friday = 5)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const getAvailableDatesForMonth = (year: number, month: number) => {
    const dates = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of the month
    
    // If it's the current month, start from today
    const today = new Date();
    const actualStartDate = (startDate.getMonth() === today.getMonth() && startDate.getFullYear() === today.getFullYear()) 
      ? today 
      : startDate;
    
    for (let d = new Date(actualStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      // Only show weekdays (Monday = 1, Friday = 5)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push(new Date(date));
      }
    }
    
    return dates;
  };

  const getMonthName = (year: number, month: number) => {
    return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayNames = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getCurrentMonthDates = () => {
    return getAvailableDatesForMonth(currentYear, currentMonth);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Calendar className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Provider *
          </label>
          
          {providers.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">No trusted providers available</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to add healthcare providers to your team before scheduling appointments.
                  </p>
                  <Link 
                    href="/healthcare-team"
                    className="inline-flex items-center mt-2 text-sm text-yellow-800 hover:text-yellow-900 font-medium"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Manage Healthcare Team
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Show selected provider */}
              {selectedProviderName && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span className="text-blue-900 font-medium">{selectedProviderName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider('');
                      setSelectedProviderName('');
                      setSearchTerm('');
                      setSelectedDate(null);
                      setSelectedTime('');
                      setAvailableTimeSlots([]);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              )}
              
              {/* Search field - only show if no provider is selected */}
              {!selectedProviderName && (
                <div className="relative provider-search-container">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProviderDropdown(true);
                    }}
                    onFocus={() => setShowProviderDropdown(true)}
                    placeholder="Search your trusted providers..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  
                  {/* Provider Dropdown */}
                  {showProviderDropdown && searchTerm.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProviders.length > 0 ? (
                        filteredProviders.map((provider) => (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleProviderSelect(
                              provider.id, 
                              `Dr. ${provider.first_name} ${provider.last_name} - ${provider.specialization}`
                            )}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              Dr. {provider.first_name} {provider.last_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {provider.specialization} • {provider.years_experience} years experience
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          No trusted providers found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Type *
          </label>
          <select
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select appointment type...</option>
            {appointmentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Consultation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consultation Type *
          </label>
          <select
            value={consultationType}
            onChange={(e) => setConsultationType(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select consultation type...</option>
            {consultationTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date *
          </label>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {getMonthName(currentYear, currentMonth)}
            </h3>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {getDayNames().map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-5 gap-2">
            {getCurrentMonthDates().map((date) => (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime('');
                }}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="font-medium">{date.getDate()}</div>
              </button>
            ))}
          </div>
          
          {/* Show message if no available dates in current month */}
          {getCurrentMonthDates().length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No available appointments in {getMonthName(currentYear, currentMonth)}
            </div>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && selectedProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time *
            </label>
            
            {loadingTimeSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600">Loading available times...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                
                {availableTimeSlots.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p>No available time slots for this date</p>
                    <p className="text-sm">Please select another date or provider</p>
                  </div>
                )}
                
                {availableTimeSlots.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {availableTimeSlots.length} time slot{availableTimeSlots.length !== 1 ? 's' : ''} available
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any specific concerns or information you'd like to share..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedProvider || !selectedDate || !selectedTime || !appointmentType || !consultationType}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Booking Appointment...
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>
      </form>
    </div>
  );
} 