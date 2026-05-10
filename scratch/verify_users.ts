import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  console.log('--- DIAGNÓSTICO DE BANCO DE DADOS ---')
  
  // 1. Contagem total de Perfis
  const { data: profiles, error: pError, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
  
  if (pError) {
    console.error('Erro ao buscar perfis:', pError)
  } else {
    console.log(`Total de perfis encontrados: ${count}`)
    console.log('Lista de nomes encontrados:', profiles.map(p => p.name).join(', '))
  }

  // 2. Verificar se existem usuários sem groupId
  const { count: noGroupCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .is('groupId', null)
  
  console.log(`Perfis sem Tribo: ${noGroupCount}`)

  // 3. Verificar status
  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  console.log(`Perfis com status 'pending': ${pendingCount}`)
}

verify()
