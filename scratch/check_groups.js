
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseAnonKey = 'sb_publishable_krVkEiF6PmWiSBnjhdf74g_CqxKuy9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGroups() {
  const { data, error } = await supabase.from('groups').select('id, name');
  console.log('Groups:', data);
  if (error) console.error('Error:', error);
}

checkGroups();
