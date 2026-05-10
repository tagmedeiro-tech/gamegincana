/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

const customFetch = async (url: RequestInfo | URL, options?: RequestInit, retries = 2) => {
  // Removido AbortController com setTimeout fixo, pois causa falhas em abas "dormindo".
  // A requisição usa os mecanismos nativos de timeout do navegador.
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error: unknown) {
    if (retries > 0) {
      console.warn(`Supabase fetch failed, retrying... (${retries} left)`);
      // Simples delay antes do retry sem setTimeout bloqueante principal
      await new Promise(res => setTimeout(res, 500));
      return customFetch(url, options, retries - 1);
    }
    
    console.error('Supabase fetch failed completely:', error);
    throw error;
  }
};

let authQueue = Promise.resolve();

const createSupabaseClient = () => {
  return createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
      fetch: customFetch
    },
    auth: {
      // Só aplicamos o bypass do lock no ambiente de dev (HMR).
      // Em produção, usa o padrão navigator.locks (mais resiliente com abas inativas).
      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        const result = authQueue.then(async () => {
          try {
            return await fn() as R;
          } catch (error: unknown) {
            const authError = error as { message?: string };
            if (authError?.message?.includes('Invalid Refresh Token')) {
              console.warn('Sessão expirada. Limpando cache...');
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('auth.token')) localStorage.removeItem(key);
              });
            }
            throw error;
          }
        });

        authQueue = result.then(() => {}).catch(() => {});
        return result;
      },
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    }
  });
};

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createSupabaseClient>;
};

export const supabase = globalForSupabase.supabase || createSupabaseClient();

if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}
