import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY 

// NOTA: Para ler a tabela auth.users, precisaríamos da Service Role Key.
// Como não temos, vamos tentar listar os perfis e ver se conseguimos forçar a criação via RPC se existir.

const supabase = createClient(supabaseUrl, supabaseKey)

async function sync() {
  console.log('--- INICIANDO SINCRONIZAÇÃO DE PERFIS ---')
  
  // 1. Verificar quem já existe
  const { data: profiles, error } = await supabase.from('profiles').select('email')
  if (error) {
    console.error('Erro ao ler perfis:', error)
    return
  }

  const existingEmails = profiles.map(p => p.email)
  console.log('E-mails já cadastrados nos perfis:', existingEmails)

  console.log('\n--- DICA CRÍTICA ---')
  console.log('Se você vê muitos usuários no painel "Authentication" do Supabase mas eles não estão na lista acima,')
  console.log('significa que a tabela "profiles" está vazia para eles.')
  console.log('\nPara resolver isso via SQL, execute o comando abaixo no seu SQL Editor:')
  console.log(`
  -- COMANDO PARA CRIAR PERFIS FALTANTES --
  INSERT INTO public.profiles (id, email, name, role, status)
  SELECT id, email, raw_user_meta_data->>'full_name', 'participant', 'active'
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles);
  `)
}

sync()
