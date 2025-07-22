import React from 'react';
import { Clock3, CheckCircle } from 'lucide-react';
export function AppointmentList() {
  const appointments = [{
    id: 1,
    patient: 'Sarah Johnson',
    time: '10:00 AM',
    duration: '45 min',
    type: 'Follow-up',
    status: 'Upcoming'
  }, {
    id: 2,
    patient: 'Michael Chen',
    time: '11:30 AM',
    duration: '60 min',
    type: 'Evaluation',
    status: 'Upcoming'
  }, {
    id: 3,
    patient: 'Robert Williams',
    time: '1:00 PM',
    duration: '30 min',
    type: 'Follow-up',
    status: 'Upcoming'
  }, {
    id: 4,
    patient: 'Lisa Garcia',
    time: '2:15 PM',
    duration: '45 min',
    type: 'Treatment',
    status: 'Upcoming'
  }, {
    id: 5,
    patient: 'James Miller',
    time: '3:30 PM',
    duration: '60 min',
    type: 'Initial Assessment',
    status: 'Upcoming'
  }];
  return <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map(appointment => <tr key={appointment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-800">
                    {appointment.patient}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock3 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{appointment.time}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {appointment.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {appointment.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center text-sm text-gray-600">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">
                    View
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    Check In
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}