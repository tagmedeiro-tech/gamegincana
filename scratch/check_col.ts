import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHRzZmN6Y2R6cWJtcm94YXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc2NTMsImV4cCI6MjA5MjcyMzY1M30.WyYAoWvh8NeiXnbjlXQJkvVmJSGLA-BXOrlxz1Sf7yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.from('notifications').select('link').limit(1);
  if (error && error.code === '42703') {
    console.log('MISSING');
  } else if (error) {
    console.log('ERROR', error.message);
  } else {
    console.log('EXISTS');
  }
}

check();
