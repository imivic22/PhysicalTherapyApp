'use client';

import React, { useState, useEffect } from 'react';
import { PatientCard } from './PatientCard';
import { AppointmentList } from './AppointmentList';
import { ClipboardList, Users, Calendar, Activity, User, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export function ProviderDashboard() {
  const [providerName, setProviderName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    activeTreatmentPlans: 0,
    recoveryRate: 87,
    patientSatisfaction: 94
  });

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch provider name
      const { data: profileData, error: profileError } = await supabase
        .from('medical_app_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProviderName(`Dr. ${profileData.first_name} ${profileData.last_name}`);
      }

      // Fetch today's appointments count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('medical_app_appointments')
        .select('id')
        .eq('provider_id', user.id)
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString());

      if (!appointmentsError && appointmentsData) {
        setStats(prev => ({
          ...prev,
          todayAppointments: appointmentsData.length
        }));
      }

      // Fetch unique patients count
      const { data: patientsData, error: patientsError } = await supabase
        .from('medical_app_appointments')
        .select('patient_id')
        .eq('provider_id', user.id);

      if (!patientsError && patientsData) {
        const uniquePatients = new Set(patientsData.map(apt => apt.patient_id));
        setStats(prev => ({
          ...prev,
          totalPatients: uniquePatients.size
        }));
      }

    } catch (error) {
      console.error('Error fetching provider data:', error);
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
              href="/patients"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-3" />
              <span>View Patients</span>
            </Link>
            <Link 
              href="/provider/appointments"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span>Manage Appointments</span>
            </Link>
            <Link 
              href="/treatments"
              className="flex items-center p-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              <span>Treatment Plans</span>
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
                Total Patients
              </h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalPatients}</p>
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
                Today's Appointments
              </h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.todayAppointments}</p>
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
                Active Treatment Plans
              </h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.activeTreatmentPlans}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Recovery Rate
              </h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.recoveryRate}%</p>
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
                Patient Satisfaction
              </h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.patientSatisfaction}%</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800">
                Today's Appointments
              </h3>
            </div>
            <div className="px-6 py-5">
              <AppointmentList />
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800">
                Recent Patients
              </h3>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-5">
                <PatientCard name="Sarah Johnson" condition="Lower Back Pain" nextAppointment="Today, 10:00 AM" progress={70} />
                <PatientCard name="Michael Chen" condition="Knee Rehabilitation" nextAppointment="Today, 11:30 AM" progress={45} />
                <PatientCard name="Emily Rodriguez" condition="Shoulder Injury" nextAppointment="Tomorrow, 9:15 AM" progress={90} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 