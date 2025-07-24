import React from 'react';
import { PatientCard } from './PatientCard';
import { AppointmentList } from './AppointmentList';
import { ClipboardList, Users, Calendar, Activity } from 'lucide-react';
export function Dashboard() {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, Dr. Thompson
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your patients today
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Total Patients
              </h2>
              <p className="text-2xl font-semibold text-gray-800">248</p>
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
              <p className="text-2xl font-semibold text-gray-800">12</p>
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
              <p className="text-2xl font-semibold text-gray-800">36</p>
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
                Recovery Rate
              </h2>
              <p className="text-2xl font-semibold text-gray-800">87%</p>
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
    </div>;
}