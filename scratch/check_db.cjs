
const { createClient } = require('@supabase/supabase-js');

async function run() {
  try {
    const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHRzZmN6Y2R6cWJtcm94YXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc2NTMsImV4cCI6MjA5MjcyMzY1M30.WyYAoWvh8NeiXnbjlXQJkvVmJSGLA-BXOrlxz1Sf7yk';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    if (data && data[0]) {
      console.log('Columns in profiles:', Object.keys(data[0]));
    } else {
      console.log('No data in profiles table to check columns');
    }
  } catch (e) {
    console.error('Script failed:', e);
  }
}

run();
