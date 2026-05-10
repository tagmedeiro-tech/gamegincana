
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseAnonKey = 'sb_publishable_krVkEiF6PmWiSBnjhdf74g_CqxKuy9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { error } = await supabase.from('message_likes').select('*').limit(1);
  if (error) {
    console.error('Table message_likes does not exist or access denied:', error.message);
  } else {
    console.log('Table message_likes exists!');
  }
}

checkTable();
