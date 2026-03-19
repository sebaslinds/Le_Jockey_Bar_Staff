import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qcijvabqhjfxxsmpjwbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaWp2YWJxaGpmeHhzbXBqd2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQxNjEsImV4cCI6MjA4ODc4MDE2MX0.VTDFBxm5IhUACdA-QNB-AJralYxgG4oBhnnDdc7zGrc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function test() {
  const { data, error } = await supabase.from('order_items').select('*').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
test();
