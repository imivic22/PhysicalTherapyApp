'use client';

import React, { useState, useEffect } from 'react';
import { PatientDashboard } from './PatientDashboard';
import { ProviderDashboard } from './ProviderDashboard';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const [userType, setUserType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserType();
  }, []);

  const fetchUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('medical_app_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserType(data.user_type);
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userType === 'provider' ? <ProviderDashboard /> : <PatientDashboard />}
    </div>
  );
}