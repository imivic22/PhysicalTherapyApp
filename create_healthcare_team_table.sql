-- Create healthcare team table for storing patient-provider relationships
-- This table will control which providers have access to patient information

-- Create the healthcare team table
CREATE TABLE IF NOT EXISTS medical_app_healthcare_team (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES medical_app_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES medical_app_profiles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'specialist', 'therapist', 'consultant')),
    permissions JSONB DEFAULT '{"view_records": true, "schedule_appointments": true, "view_appointments": true, "view_immunizations": true}',
    is_active BOOLEAN DEFAULT true,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique patient-provider combinations
    UNIQUE(patient_id, provider_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_healthcare_team_patient_id ON medical_app_healthcare_team(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_team_provider_id ON medical_app_healthcare_team(provider_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_team_active ON medical_app_healthcare_team(is_active);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_healthcare_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_healthcare_team_updated_at 
    BEFORE UPDATE ON medical_app_healthcare_team 
    FOR EACH ROW 
    EXECUTE FUNCTION update_healthcare_team_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE medical_app_healthcare_team ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Patients can view their own healthcare team
CREATE POLICY "Patients can view own healthcare team" ON medical_app_healthcare_team
    FOR SELECT USING (
        auth.uid() = patient_id
    );

-- Policy: Patients can insert providers to their team
CREATE POLICY "Patients can add providers to team" ON medical_app_healthcare_team
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id
    );

-- Policy: Patients can update their healthcare team relationships
CREATE POLICY "Patients can update own healthcare team" ON medical_app_healthcare_team
    FOR UPDATE USING (
        auth.uid() = patient_id
    );

-- Policy: Patients can remove providers from their team
CREATE POLICY "Patients can remove providers from team" ON medical_app_healthcare_team
    FOR DELETE USING (
        auth.uid() = patient_id
    );

-- Policy: Providers can view patients who have added them to their team
CREATE POLICY "Providers can view patients who added them" ON medical_app_healthcare_team
    FOR SELECT USING (
        auth.uid() = provider_id
    );

-- Add comments to the table and columns for documentation
COMMENT ON TABLE medical_app_healthcare_team IS 'Stores patient-provider relationships and permissions for healthcare team access';
COMMENT ON COLUMN medical_app_healthcare_team.id IS 'Unique identifier for the healthcare team relationship';
COMMENT ON COLUMN medical_app_healthcare_team.patient_id IS 'Reference to the patient';
COMMENT ON COLUMN medical_app_healthcare_team.provider_id IS 'Reference to the healthcare provider';
COMMENT ON COLUMN medical_app_healthcare_team.relationship_type IS 'Type of relationship: primary, specialist, therapist, consultant';
COMMENT ON COLUMN medical_app_healthcare_team.permissions IS 'JSON object defining what the provider can access for this patient';
COMMENT ON COLUMN medical_app_healthcare_team.is_active IS 'Whether this relationship is currently active';
COMMENT ON COLUMN medical_app_healthcare_team.added_date IS 'Date when the provider was added to the team';
COMMENT ON COLUMN medical_app_healthcare_team.updated_at IS 'Timestamp when the relationship was last updated';

-- Insert some sample data for testing (optional)
-- INSERT INTO medical_app_healthcare_team (patient_id, provider_id, relationship_type) VALUES
--     ('sample-patient-id', 'sample-provider-id', 'primary'); 