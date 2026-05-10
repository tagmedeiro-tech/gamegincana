// Teste: autenticar com email/senha e testar leitura do perfil
// Simula o que o browser faz
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fwdtsfczcdzqbmroxaxc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHRzZmN6Y2R6cWJtcm94YXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc2NTMsImV4cCI6MjA5MjcyMzY1M30.WyYAoWvh8NeiXnbjlXQJkvVmJSGLA-BXOrlxz1Sf7yk'
);

// Substitua pela senha real para testar
const EMAIL = 'tagmedeiro@gmail.com';
const SENHA = process.argv[2] || '';

async function testar() {
  if (!SENHA) {
    console.log('Uso: node scratch/test_auth.mjs <senha>');
    console.log('\nTestando apenas leitura de perfis (sem autenticar)...');
    const { data, error } = await supabase.from('profiles').select('id, name, role, status').limit(5);
    console.log('Perfis (anon):', data, 'Erro:', error?.message);
    return;
  }

  console.log(`Autenticando ${EMAIL}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: SENHA
  });

  if (authError) {
    console.error('Erro de auth:', authError.message);
    return;
  }

  console.log('Auth OK! UID:', authData.user?.id);

  // Testar leitura do perfil (como o AuthProvider faz)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ ERRO ao ler perfil (RLS ainda bloqueando):', profileError.message);
  } else {
    console.log('✅ Perfil carregado:', profile?.name, '| Role:', profile?.role, '| Status:', profile?.status);
  }

  // Logout
  await supabase.auth.signOut();
}

testar().catch(console.error);
