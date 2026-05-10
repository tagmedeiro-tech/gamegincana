
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdtsfczcdzqbmroxaxc.supabase.co';
const supabaseAnonKey = 'sb_publishable_krVkEiF6PmWiSBnjhdf74g_CqxKuy9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data, error } = await supabase.from('messages').insert([
    { text: 'Teste Global', senderName: 'Sistema', groupId: null }
  ]);
  if (error) {
    console.error('Error inserting with NULL:', error.message);
  } else {
    console.log('Success inserting with NULL!');
  }
}

testInsert();
