
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseAnonKey = 'sb_publishable_krVkEiF6PmWiSBnjhdf74g_CqxKuy9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns in messages:', Object.keys(data[0]));
  } else {
    console.log('No messages found to check columns.');
  }
}

checkColumns();
