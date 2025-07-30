'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Stethoscope, X, Shield, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  years_experience: number;
}

interface HealthcareTeamMember {
  id: string;
  provider_id: string;
  relationship_type: string;
  permissions: {
    view_records: boolean;
    schedule_appointments: boolean;
    view_appointments: boolean;
    view_immunizations: boolean;
  };
  is_active: boolean;
  added_date: string;
  provider: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

export default function HealthcareTeamPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [teamMembers, setTeamMembers] = useState<HealthcareTeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingProvider, setAddingProvider] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debug function to check database directly
  const debugDatabase = async () => {
    try {
      console.log('=== DEBUG DATABASE ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Current user ID:', user.id);

      // Check all healthcare team records for this user
      const { data: allTeamData, error: allTeamError } = await supabase
        .from('medical_app_healthcare_team')
        .select('*')
        .eq('patient_id', user.id);

      console.log('All team data for user:', allTeamData);
      console.log('All team error:', allTeamError);

      // Check active team records
      const { data: activeTeamData, error: activeTeamError } = await supabase
        .from('medical_app_healthcare_team')
        .select('*')
        .eq('patient_id', user.id)
        .eq('is_active', true);

      console.log('Active team data:', activeTeamData);
      console.log('Active team error:', activeTeamError);

      console.log('=== END DEBUG DATABASE ===');
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchHealthcareTeam();
    // Run debug on component mount
    debugDatabase();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProviders([]);
      setShowProviderDropdown(false);
    } else {
      const filtered = providers.filter(provider => {
        const fullName = `${provider.first_name} ${provider.last_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return (
          provider.first_name.toLowerCase().includes(searchLower) ||
          provider.last_name.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower) ||
          provider.specialization.toLowerCase().includes(searchLower)
        );
      });
      
      setFilteredProviders(filtered);
      setShowProviderDropdown(true);
    }
  }, [searchTerm, providers]);

  const fetchProviders = async () => {
    try {
      const { data: allProfiles, error } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name, user_type');

      if (error) throw error;

      if (allProfiles) {
        // Filter to only providers
        const providers = allProfiles?.filter(profile => profile.user_type === 'provider') || [];
        
        const providersWithDetails = providers.map(profile => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          specialization: 'General Practice', // Default specialization
          years_experience: 5 // Default experience
        }));
        
        setProviders(providersWithDetails);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to load providers');
    }
  };

  const fetchHealthcareTeam = async () => {
    try {
      console.log('=== FETCHING HEALTHCARE TEAM ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Current user ID:', user.id);

      // First, get the healthcare team records
      const { data: teamData, error: teamError } = await supabase
        .from('medical_app_healthcare_team')
        .select('id, provider_id, relationship_type, permissions, is_active, added_date')
        .eq('patient_id', user.id)
        .eq('is_active', true)
        .order('added_date', { ascending: false });

      console.log('Team data:', teamData);
      console.log('Team data length:', teamData?.length);
      console.log('Team error:', teamError);

      if (teamError) {
        console.error('Team query error:', teamError);
        throw teamError;
      }

      if (!teamData || teamData.length === 0) {
        console.log('No team members found - setting empty array');
        setTeamMembers([]);
        return;
      }

      console.log('Found team members, getting provider details...');

      // Get provider details for each team member
      const providerIds = teamData.map(member => member.provider_id);
      console.log('Provider IDs to fetch:', providerIds);

      // Try fetching all profiles first, then filter
      console.log('Trying simple query first...');
      const { data: simpleProfiles, error: simpleError } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name');

      console.log('Simple profiles:', simpleProfiles);
      console.log('Simple error:', simpleError);

      if (simpleError) {
        console.error('Simple query failed:', simpleError);
        throw simpleError;
      }

      // If simple query works, try the full query
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('medical_app_profiles')
        .select('id, first_name, last_name, specialization, user_type');

      console.log('All profiles:', allProfiles);
      console.log('All profiles error:', allProfilesError);
      console.log('All profiles error details:', JSON.stringify(allProfilesError, null, 2));
      
      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError);
        console.error('Error code:', allProfilesError.code);
        console.error('Error message:', allProfilesError.message);
        console.error('Error details:', allProfilesError.details);
        
        // Fallback to simple profiles if full query fails
        console.log('Using fallback to simple profiles...');
        const fallbackProfiles = simpleProfiles?.map(profile => ({
          ...profile,
          specialization: 'General Practice',
          user_type: 'provider' // Assume all are providers for now
        })) || [];
        
        const allProviders = fallbackProfiles.filter(profile => profile.user_type === 'provider');
        console.log('Fallback providers:', allProviders);
        
        // Continue with fallback data
        const providerData = allProviders.filter(provider => 
          providerIds.includes(provider.id)
        );

        console.log('Provider data for team members (fallback):', providerData);
        console.log('Provider data length (fallback):', providerData?.length);

        // Create a map of provider data
        const providerMap = new Map();
        providerData?.forEach(provider => {
          providerMap.set(provider.id, provider);
        });

        console.log('Provider map size (fallback):', providerMap.size);

        // Transform the data to match the interface
        const transformedData = teamData.map((item: any) => {
          const provider = providerMap.get(item.provider_id);
          console.log('Processing item (fallback):', item, 'Provider:', provider);
          console.log('Provider first_name (fallback):', provider?.first_name);
          console.log('Provider last_name (fallback):', provider?.last_name);
          console.log('Provider specialization (fallback):', provider?.specialization);
          return {
            id: item.id,
            provider_id: item.provider_id,
            relationship_type: item.relationship_type,
            permissions: item.permissions,
            is_active: item.is_active,
            added_date: item.added_date,
            provider: {
              first_name: provider?.first_name || '',
              last_name: provider?.last_name || '',
              specialization: provider?.specialization || 'General Practice'
            }
          };
        });

        console.log('Final transformed data (fallback):', transformedData);
        console.log('Setting team members with length (fallback):', transformedData.length);
        console.log('=== END FETCHING HEALTHCARE TEAM ===');

        setTeamMembers(transformedData);
        return;
      }

      // Filter to only providers
      const allProviders = allProfiles?.filter(profile => profile.user_type === 'provider') || [];
      console.log('Filtered providers:', allProviders);

      // Filter to only the providers we need
      const providerData = allProviders.filter(provider => 
        providerIds.includes(provider.id)
      );

      console.log('Provider data for team members:', providerData);
      console.log('Provider data length:', providerData?.length);

      // Create a map of provider data
      const providerMap = new Map();
      providerData?.forEach(provider => {
        providerMap.set(provider.id, provider);
      });

      console.log('Provider map size:', providerMap.size);

      // Transform the data to match the interface
      const transformedData = teamData.map((item: any) => {
        const provider = providerMap.get(item.provider_id);
        console.log('Processing item:', item, 'Provider:', provider);
        console.log('Provider first_name:', provider?.first_name);
        console.log('Provider last_name:', provider?.last_name);
        console.log('Provider specialization:', provider?.specialization);
        return {
          id: item.id,
          provider_id: item.provider_id,
          relationship_type: item.relationship_type,
          permissions: item.permissions,
          is_active: item.is_active,
          added_date: item.added_date,
          provider: {
            first_name: provider?.first_name || '',
            last_name: provider?.last_name || '',
            specialization: provider?.specialization || 'General Practice'
          }
        };
      });

      console.log('Final transformed data:', transformedData);
      console.log('Setting team members with length:', transformedData.length);
      console.log('=== END FETCHING HEALTHCARE TEAM ===');

      setTeamMembers(transformedData);
    } catch (error) {
      console.error('Error fetching healthcare team:', error);
      setError('Failed to load healthcare team');
    } finally {
      setLoading(false);
    }
  };

  const addProviderToTeam = async (providerId: string, providerName: string) => {
    try {
      console.log('=== ADDING PROVIDER TO TEAM ===');
      console.log('Provider ID:', providerId);
      console.log('Provider Name:', providerName);
      
      setAddingProvider(true);
      setError('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setError('You must be logged in to add providers');
        return;
      }

      console.log('Current user ID:', user.id);

      // Check if provider is already in team (check database directly)
      const { data: existingData, error: checkError } = await supabase
        .from('medical_app_healthcare_team')
        .select('id, is_active')
        .eq('patient_id', user.id)
        .eq('provider_id', providerId)
        .single();

      console.log('Existing relationship check:', existingData, checkError);

      if (existingData) {
        if (existingData.is_active) {
          console.log('Provider already active in team');
          setError('This provider is already in your healthcare team');
          return;
        } else {
          // Reactivate the relationship
          console.log('Reactivating existing relationship');
          const { error: updateError } = await supabase
            .from('medical_app_healthcare_team')
            .update({ is_active: true })
            .eq('id', existingData.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }

          setSuccess(`Dr. ${providerName} has been added back to your healthcare team!`);
          setSearchTerm('');
          setShowProviderDropdown(false);
          await fetchHealthcareTeam();
          return;
        }
      }

      const insertData = {
        patient_id: user.id,
        provider_id: providerId,
        relationship_type: 'primary',
        permissions: {
          view_records: true,
          schedule_appointments: true,
          view_appointments: true,
          view_immunizations: true
        }
      };

      console.log('Inserting data:', insertData);

      const { data: insertResult, error } = await supabase
        .from('medical_app_healthcare_team')
        .insert([insertData])
        .select();

      console.log('Insert result:', insertResult);
      console.log('Insert error:', error);

      if (error) {
        console.error('Insert error:', error);
        if (error.code === '23505') { // Unique constraint violation
          setError('This provider is already in your healthcare team');
        } else {
          throw error;
        }
        return;
      }

      console.log('Provider added successfully');
      setSuccess(`Dr. ${providerName} has been added to your healthcare team!`);
      setSearchTerm('');
      setShowProviderDropdown(false);
      
      // Refresh the team list
      console.log('Refreshing team list...');
      await fetchHealthcareTeam();
      
    } catch (error) {
      console.error('Error adding provider to team:', error);
      setError('Failed to add provider to team');
    } finally {
      setAddingProvider(false);
    }
  };

  const removeProviderFromTeam = async (memberId: string, providerName: string) => {
    try {
      const { error } = await supabase
        .from('medical_app_healthcare_team')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      setSuccess(`Dr. ${providerName} has been removed from your healthcare team`);
      
      // Refresh the team list
      await fetchHealthcareTeam();
      
    } catch (error) {
      console.error('Error removing provider from team:', error);
      setError('Failed to remove provider from team');
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    switch (type) {
      case 'primary': return 'Primary Care';
      case 'specialist': return 'Specialist';
      case 'therapist': return 'Therapist';
      case 'consultant': return 'Consultant';
      default: return type;
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-blue-100 text-blue-800';
      case 'specialist': return 'bg-purple-100 text-purple-800';
      case 'therapist': return 'bg-green-100 text-green-800';
      case 'consultant': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Healthcare Team</h1>
            <p className="mt-2 text-gray-600">
              Manage your trusted healthcare providers and control who has access to your information
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Provider Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Plus className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Add Provider</h2>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowProviderDropdown(true)}
                placeholder="Search for a provider..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Provider Dropdown */}
              {showProviderDropdown && searchTerm.trim() !== '' && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProviders.length > 0 ? (
                    filteredProviders.map((provider) => {
                      const isInTeam = teamMembers.some(member => member.provider_id === provider.id);
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => !isInTeam && addProviderToTeam(
                            provider.id, 
                            `${provider.first_name} ${provider.last_name}`
                          )}
                          disabled={isInTeam || addingProvider}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            isInTeam ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            Dr. {provider.first_name} {provider.last_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {provider.specialization} • {provider.years_experience} years experience
                          </div>
                          {isInTeam && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Already in your team
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No providers found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>• Search by name or specialization</p>
              <p>• Only providers you add can see your information</p>
              <p>• You can remove providers at any time</p>
            </div>
          </div>
        </div>

        {/* Healthcare Team List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Healthcare Team</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {teamMembers.length} provider{teamMembers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No providers in your team yet</h3>
                  <p className="text-gray-600 mb-4">
                    Add healthcare providers to your team to start scheduling appointments and sharing information securely.
                  </p>
                  <p className="text-sm text-gray-500">
                    Only providers you add will have access to your medical information.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">
                            Dr. {member.provider.first_name} {member.provider.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{member.provider.specialization}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipTypeColor(member.relationship_type)}`}>
                              {getRelationshipTypeLabel(member.relationship_type)}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              Added {new Date(member.added_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProviderFromTeam(member.id, `${member.provider.first_name} ${member.provider.last_name}`)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from team"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 