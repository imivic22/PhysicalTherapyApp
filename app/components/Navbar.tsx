'use client';

import React, { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export function Navbar() {
  const router = useRouter();
  const { signOut, user, loading } = useAuth();
  const [userType, setUserType] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      // Clear user data when user is not authenticated
      setUserType('');
      setUserName('');
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_app_profiles')
        .select('first_name, last_name, user_type')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserType(data.user_type);
        setUserName(`${data.first_name} ${data.last_name}`);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNavLinks = () => {
    if (userType === 'provider') {
      return [
        { href: '/dashboard', label: 'Dashboard', active: true },
        { href: '/patients', label: 'Patients', active: false },
        { href: '/provider/appointments', label: 'Appointments', active: false },
        { href: '/treatments', label: 'Treatments', active: false },
        { href: '/reports', label: 'Reports', active: false },
      ];
    } else {
      return [
        { href: '/dashboard', label: 'Dashboard', active: true },
        { href: '/appointments', label: 'Appointments', active: false },
        { href: '/medical-records', label: 'Medical Records', active: false },
        { href: '/profile', label: 'Profile', active: false },
      ];
    }
  };

  const navLinks = getNavLinks();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-blue-600 font-bold text-xl">
                  PhysioTherapy
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href={user ? "/dashboard" : "/"} className="text-blue-600 font-bold text-xl">
                PhysioTherapy
              </Link>
            </div>
            {/* Only show navigation links if user is authenticated */}
            {user && (
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-1 pt-1 font-medium ${
                      link.active
                        ? 'text-blue-600 border-blue-500 border-b-2'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              // Show user interface when authenticated
              <>
                <span className="text-sm text-gray-600 mr-4 hidden md:block">
                  Welcome, {userName || 'User'}
                </span>
                <button className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
                  <Bell className="h-6 w-6" />
                </button>
                <button className="ml-3 p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
                  <User className="h-6 w-6" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="ml-3 p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 focus:outline-none"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              // Show login/signup links when not authenticated
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button className="md:hidden ml-3 p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}