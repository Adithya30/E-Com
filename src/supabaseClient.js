import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from Supabase Dashboard > Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)