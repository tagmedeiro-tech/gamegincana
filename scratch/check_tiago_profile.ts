import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHRzZmN6Y2R6cWJtcm94YXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc2NTMsImV4cCI6MjA5MjcyMzY1M30.WyYAoWvh8NeiXnbjlXQJkvVmJSGLA-BXOrlxz1Sf7yk'; 

async function checkTiago() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('profiles').select('*').ilike('name', '%Tiago Medeiros%').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Tiago Profile:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('Tiago not found.');
  }
}

checkTiago();
