
import { supabase } from '../src/lib/supabase';

async function checkStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('Nenhum usuário logado.');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('Seu Perfil:', profile);

  const { data: configRows } = await supabase
    .from('config')
    .select('*');
  
  console.log('Tabela Config:', configRows);
}

checkStatus();
