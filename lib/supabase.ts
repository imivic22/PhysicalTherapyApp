import { createClient } from '@supabase/supabase-js'

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Please create a .env.local file with:')
  console.warn('NEXT_PUBLIC_SUPABASE_URL=your_project_url_here')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here')
}

// Create client with fallback values for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
) 