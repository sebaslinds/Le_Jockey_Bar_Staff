import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcijvabqhjfxxsmpjwbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaWp2YWJxaGpmeHhzbXBqd2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQxNjEsImV4cCI6MjA4ODc4MDE2MX0.VTDFBxm5IhUACdA-QNB-AJralYxgG4oBhnnDdc7zGrc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
