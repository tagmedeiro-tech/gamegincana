import { supabase } from '../src/lib/supabase';

async function main() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

main();
