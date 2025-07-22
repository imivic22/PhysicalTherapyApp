import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
export function Navbar() {
  return <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">
                PhysioTherapy
              </span>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="#" className="text-blue-600 border-blue-500 border-b-2 px-1 pt-1 font-medium">
                Dashboard
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">
                Patients
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">
                Appointments
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">
                Treatments
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">
                Reports
              </a>
            </nav>
          </div>
          <div className="flex items-center">
            <button className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
              <Bell className="h-6 w-6" />
            </button>
            <button className="ml-3 p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
              <User className="h-6 w-6" />
            </button>
            <button className="md:hidden ml-3 p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>;
}