-- Create immunizations table for storing patient immunization records
-- This table will store both manually entered and uploaded immunization records

-- Create the immunizations table
CREATE TABLE IF NOT EXISTS medical_app_immunizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES medical_app_profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES medical_app_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    date_received DATE NOT NULL,
    next_due_date DATE,
    status VARCHAR(50) DEFAULT 'up_to_date' CHECK (status IN ('up_to_date', 'due', 'overdue')),
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_immunizations_patient_id ON medical_app_immunizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_provider_id ON medical_app_immunizations(provider_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_date_received ON medical_app_immunizations(date_received);
CREATE INDEX IF NOT EXISTS idx_immunizations_status ON medical_app_immunizations(status);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_immunizations_updated_at 
    BEFORE UPDATE ON medical_app_immunizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE medical_app_immunizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Patients can view their own immunization records
CREATE POLICY "Patients can view own immunizations" ON medical_app_immunizations
    FOR SELECT USING (
        auth.uid() = patient_id
    );

-- Policy: Patients can insert their own immunization records
CREATE POLICY "Patients can insert own immunizations" ON medical_app_immunizations
    FOR INSERT WITH CHECK (
        auth.uid() = patient_id
    );

-- Policy: Patients can update their own immunization records
CREATE POLICY "Patients can update own immunizations" ON medical_app_immunizations
    FOR UPDATE USING (
        auth.uid() = patient_id
    );

-- Policy: Patients can delete their own immunization records
CREATE POLICY "Patients can delete own immunizations" ON medical_app_immunizations
    FOR DELETE USING (
        auth.uid() = patient_id
    );

-- Policy: Providers can view immunization records of their patients
CREATE POLICY "Providers can view patient immunizations" ON medical_app_immunizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_app_appointments 
            WHERE provider_id = auth.uid() 
            AND patient_id = medical_app_immunizations.patient_id
        )
    );

-- Policy: Providers can update immunization records they created
CREATE POLICY "Providers can update immunizations they created" ON medical_app_immunizations
    FOR UPDATE USING (
        provider_id = auth.uid()
    );

-- Create storage bucket for immunization documents (if not exists)
-- Note: This needs to be run in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('immunization-documents', 'immunization-documents', true);

-- Create storage policy for immunization documents
-- Policy: Users can upload their own immunization documents
-- CREATE POLICY "Users can upload own immunization documents" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'immunization-documents' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can view their own immunization documents
-- CREATE POLICY "Users can view own immunization documents" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'immunization-documents' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Policy: Users can delete their own immunization documents
-- CREATE POLICY "Users can delete own immunization documents" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'immunization-documents' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Add comments to the table and columns for documentation
COMMENT ON TABLE medical_app_immunizations IS 'Stores patient immunization records including both manually entered and uploaded documents';
COMMENT ON COLUMN medical_app_immunizations.id IS 'Unique identifier for the immunization record';
COMMENT ON COLUMN medical_app_immunizations.patient_id IS 'Reference to the patient who received the immunization';
COMMENT ON COLUMN medical_app_immunizations.provider_id IS 'Reference to the healthcare provider who administered the immunization';
COMMENT ON COLUMN medical_app_immunizations.name IS 'Name of the immunization/vaccine';
COMMENT ON COLUMN medical_app_immunizations.date_received IS 'Date when the immunization was received';
COMMENT ON COLUMN medical_app_immunizations.next_due_date IS 'Date when the next dose is due (for multi-dose vaccines)';
COMMENT ON COLUMN medical_app_immunizations.status IS 'Current status: up_to_date, due, or overdue';
COMMENT ON COLUMN medical_app_immunizations.notes IS 'Additional notes about the immunization';
COMMENT ON COLUMN medical_app_immunizations.document_url IS 'URL to uploaded immunization document';
COMMENT ON COLUMN medical_app_immunizations.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN medical_app_immunizations.updated_at IS 'Timestamp when the record was last updated';

-- Insert some sample data for testing (optional)
-- INSERT INTO medical_app_immunizations (patient_id, name, date_received, status, notes) VALUES
--     ('sample-patient-id', 'COVID-19 Vaccine', '2023-01-15', 'up_to_date', 'First dose received'),
--     ('sample-patient-id', 'Flu Shot', '2023-10-01', 'up_to_date', 'Annual flu vaccination'),
--     ('sample-patient-id', 'Tetanus Booster', '2022-06-20', 'up_to_date', 'Tdap booster'); 