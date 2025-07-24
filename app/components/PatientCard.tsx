import React from 'react';
import { ChevronRight } from 'lucide-react';
interface PatientCardProps {
  name: string;
  condition: string;
  nextAppointment: string;
  progress: number;
}
export function PatientCard({
  name,
  condition,
  nextAppointment,
  progress
}: PatientCardProps) {
  return <div className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-800">{name}</h4>
          <p className="text-sm text-gray-500">{condition}</p>
          <div className="mt-2">
            <span className="text-xs font-medium text-gray-500">
              Next: {nextAppointment}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-3">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{
              width: `${progress}%`
            }}></div>
            </div>
          </div>
          <span className="ml-2 text-xs font-medium text-gray-500">
            {progress}%
          </span>
        </div>
      </div>
    </div>;
}