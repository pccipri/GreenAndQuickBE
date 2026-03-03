import { supaEnv } from '@/config/env';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supaEnv.supabaseUrl, supaEnv.supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
