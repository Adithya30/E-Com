import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from Supabase Dashboard > Settings > API
const supabaseUrl = 'https://dyudimiajjaudhpiuutm.supabase.co'
const supabaseKey = 'sb_publishable_gog41CXVoXNIv2IFilZkog_sTY1Bh7R'

export const supabase = createClient(supabaseUrl, supabaseKey)