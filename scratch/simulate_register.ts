import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHRzZmN6Y2R6cWJtcm94YXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc2NTMsImV4cCI6MjA5MjcyMzY1M30.WyYAoWvh8NeiXnbjlXQJkvVmJSGLA-BXOrlxz1Sf7yk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const testId = '11111111-1111-1111-1111-111111111111'; // Dummy UUID
  console.log('Testing insert into profiles with all fields...');
  
  const payload = {
    id: testId,
    name: 'Test',
    email: 'test@test.com',
    role: 'participant',
    groupId: null,
    avatar_url: '',
    avatarUrl: '',
    birthDate: '2000-01-01',
    whatsapp: '123456789',
    isBaptized: false,
    isServing: false,
    wantsToServe: false,
    serviceArea: '',
    praiseInstrument: '',
    totalPoints: 0,
    coins: 0,
    achievements: [],
    status: 'pending'
  };

  const { error } = await supabase.from('profiles').insert([payload]);
  console.log('Insert Error:', error);
}

main();
