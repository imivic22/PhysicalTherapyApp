'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Plus, Upload, Calendar, CheckCircle, AlertCircle, Download, User, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Immunization {
  id: string;
  name: string;
  date_received: string;
  next_due_date?: string;
  status: 'up_to_date' | 'due' | 'overdue';
  notes?: string;
  document_url?: string;
  provider_name?: string;
  provider_id?: string;
}

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
}

export default function ImmunizationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingImmunizations, setLoadingImmunizations] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state for manual entry
  const [formData, setFormData] = useState({
    name: '',
    date_received: '',
    next_due_date: '',
    provider_id: '',
    notes: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchImmunizations();
      fetchProviders();
    }
  }, [user, loading, router]);

  const fetchImmunizations = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_app_immunizations')
        .select('*')
        .eq('patient_id', user?.id)
        .order('date_received', { ascending: false });

      if (error) throw error;

      setImmunizations(data || []);
    } catch (error) {
      console.error('Error fetching immunizations:', error);
      setError('Failed to load immunizations');
    } finally {
      setLoadingImmunizations(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name')
        .eq('user_type', 'provider');

      if (error) throw error;

      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('immunization-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('immunization-documents')
        .getPublicUrl(fileName);

      // Add immunization record
      const { error: insertError } = await supabase
        .from('medical_app_immunizations')
        .insert([
          {
            patient_id: user?.id,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            date_received: new Date().toISOString(),
            status: 'up_to_date',
            document_url: urlData.publicUrl,
            notes: 'Uploaded document'
          }
        ]);

      if (insertError) throw insertError;

      setShowUploadModal(false);
      fetchImmunizations();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);

      const { error: insertError } = await supabase
        .from('medical_app_immunizations')
        .insert([
          {
            patient_id: user?.id,
            name: formData.name,
            date_received: formData.date_received,
            next_due_date: formData.next_due_date || null,
            provider_id: formData.provider_id || null,
            status: 'up_to_date',
            notes: formData.notes
          }
        ]);

      if (insertError) throw insertError;

      setShowAddModal(false);
      setFormData({
        name: '',
        date_received: '',
        next_due_date: '',
        provider_id: '',
        notes: ''
      });
      fetchImmunizations();
    } catch (error) {
      console.error('Error adding immunization:', error);
      setError('Failed to add immunization');
    } finally {
      setUploading(false);
    }
  };

  const deleteImmunization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this immunization record?')) return;

    try {
      const { error } = await supabase
        .from('medical_app_immunizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchImmunizations();
    } catch (error) {
      console.error('Error deleting immunization:', error);
      setError('Failed to delete immunization');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up_to_date':
        return 'bg-green-100 text-green-800';
      case 'due':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up_to_date':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'due':
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredImmunizations = immunizations.filter(immunization => {
    const matchesSearch = immunization.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || immunization.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading || loadingImmunizations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Immunizations</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your immunization records
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search immunizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="up_to_date">Up to Date</option>
                <option value="due">Due</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {filteredImmunizations.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {immunizations.length === 0 ? 'No immunization records' : 'No matching records'}
              </h3>
              <p className="text-gray-500 mb-4">
                {immunizations.length === 0 
                  ? 'Add your immunization records to keep them organized and accessible.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {immunizations.length === 0 && (
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Record
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredImmunizations.map((immunization) => (
                <div
                  key={immunization.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {immunization.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(immunization.status)}`}>
                            {immunization.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <button
                            onClick={() => deleteImmunization(immunization.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Received: {formatDate(immunization.date_received)}</span>
                        </div>
                        
                        {immunization.next_due_date && (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Next due: {formatDate(immunization.next_due_date)}</span>
                          </div>
                        )}
                        
                        {immunization.provider_id && (
                          <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span>Provider: {immunization.provider_name || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                      
                      {immunization.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {immunization.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      {getStatusIcon(immunization.status)}
                      {immunization.document_url && (
                        <a
                          href={immunization.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Immunization Record</h3>
              <form onSubmit={handleManualAdd}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Immunization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., COVID-19 Vaccine, Flu Shot"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Received *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date_received}
                      onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.next_due_date}
                      onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      value={formData.provider_id}
                      onChange={(e) => setFormData({...formData, provider_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a provider</option>
                      {providers.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          Dr. {provider.first_name} {provider.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Adding...' : 'Add Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Immunization Document</h3>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 