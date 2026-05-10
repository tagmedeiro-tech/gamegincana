
import { supabase } from '../src/lib/supabase';

async function inspectNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.error('Erro ao ler notificações:', error);
    return;
  }
  console.log('Colunas disponíveis na tabela notifications:', Object.keys(data[0] || {}));
}

inspectNotifications();
