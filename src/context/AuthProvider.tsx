import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { AuthContext } from './AuthContext';
import { loadAchievementDefinitions } from '../lib/AchievementService';
import { PushService } from '../lib/PushService';
import { OfflineService } from '../lib/OfflineService';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidateCount, setRevalidateCount] = useState(0);
  const profileRef = useRef<UserProfile | null>(null);
  // Refs estáveis para callbacks (evita recriar o listener de auth a cada render)
  const fetchProfileRef = useRef<((userId: string) => Promise<UserProfile | null>) | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    // Promise.race: garante timeout real de 5s — o AbortController anterior
    // não conectava o signal ao SDK do Supabase, então nunca abortava de fato.
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('fetchProfile timeout (30s)') }), 30000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        if (error.message.includes('timeout')) {
          console.warn('AuthProvider: fetchProfile timeout — tentando novamente...');
          const retry = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          if (retry.error) { 
            console.error('AuthProvider: retry falhou:', retry.error.message); 
            return profileRef.current; // Retorna o que já temos em cache se falhar
          }
          return retry.data as UserProfile | null;
        }
        console.error('AuthProvider: Erro RLS ao buscar perfil:', error.message);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error('AuthProvider: Exceção ao buscar perfil:', err);
      return null;
    }
  }, []);

  // Manter ref estável para fetchProfile (evita recriar listener)
  fetchProfileRef.current = fetchProfile;

  const triggerRevalidate = useCallback(() => {
    setRevalidateCount(prev => prev + 1);
  }, []);

  // Sincroniza cache local sempre que o perfil muda
  useEffect(() => {
    if (profile) {
      OfflineService.save('user_profile', profile);
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const updatedProfile = await fetchProfile(currentUser.id);
      if (mountedRef.current) {
        setProfile(updatedProfile);
        profileRef.current = updatedProfile;
        triggerRevalidate();
      }
    }
  }, [fetchProfile, triggerRevalidate]);

  useEffect(() => {
    mountedRef.current = true;

    // Timer de segurança (35s) — libera o loading caso algo falhe silenciosamente
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("AuthProvider: Safety Timeout reached (35s). Liberando loading.");
        setLoading(false);
      }
    }, 35000);

    const initializeAuth = async () => {
      try {
        // Tenta restaurar perfil do cache IMEDIATAMENTE (Estratégia APK Fast-Load)
        const cachedProfile = OfflineService.get<UserProfile>('user_profile');
        if (cachedProfile) {
          setProfile(cachedProfile);
          profileRef.current = cachedProfile;
          // Não tiramos o loading aqui para permitir que o initializeAuth verifique a sessão real
        }

        // Carrega conquistas em segundo plano para não travar o perfil
        loadAchievementDefinitions().catch(err => console.warn("Erro ao carregar conquistas:", err));

        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfileRef.current!(session.user.id);
          if (mountedRef.current) {
            setProfile(p);
            profileRef.current = p;
            if (p) OfflineService.save('user_profile', p);
            clearTimeout(timeoutId); // Limpa o safety timeout se carregar antes
            setLoading(false);
          }
        } else {
          // Se não tem sessão, limpa cache
          OfflineService.clearAll();
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mountedRef.current) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // ⚠️ CRÍTICO: usar lista de deps VAZIA para não recriar o listener a cada render.
    // O listener usa fetchProfileRef.current que é sempre atualizado via ref estável.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      // INITIAL_SESSION é tratado por initializeAuth — ignorar aqui para evitar duplicidade
      if (event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (!profileRef.current || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          try {
            const p = await fetchProfileRef.current!(currentUser.id);
            if (mountedRef.current) {
              setProfile(p);
              profileRef.current = p;
              // Registrar token de push nativo após login
              if (event === 'SIGNED_IN') {
                PushService.register(currentUser.id).catch(console.warn);
              }
            }
          } catch (err) {
            console.error("Error fetching profile on state change:", err);
          }
        }
      } else {
        if (mountedRef.current) {
          setProfile(null);
          profileRef.current = null;
          OfflineService.clearAll();
        }
      }

      if (mountedRef.current) setLoading(false);
    });

    // 🔄 MOTOR DE AUTO-RECUPERAÇÃO (apenas online/visibility — não em focus para evitar spam)
    let recoveryDebounceId: ReturnType<typeof setTimeout> | null = null;

    const handleAutoRecovery = async () => {
      if (!navigator.onLine || !mountedRef.current) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mountedRef.current && fetchProfileRef.current) {
          const p = await fetchProfileRef.current(session.user.id);
          if (mountedRef.current) {
            setProfile(p);
            profileRef.current = p;
            setRevalidateCount(c => c + 1);
          }
        }
      } catch (err) {
        console.error("Auto-Recovery error:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reduzido para 2s para atualizar rapidamente caso o Admin aprove enquanto o app estava minimizado
        if (recoveryDebounceId) clearTimeout(recoveryDebounceId);
        recoveryDebounceId = setTimeout(handleAutoRecovery, 2000);
      }
    };

    window.addEventListener('online', handleAutoRecovery);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
      if (recoveryDebounceId) clearTimeout(recoveryDebounceId);
      window.removeEventListener('online', handleAutoRecovery);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← DEPS VAZIAS: listener de auth deve ser criado UMA única vez

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Só limpa o estado local após confirmar o logout
      // Se signOut falhar (ex: sem rede), o usuário continua logado e com perfil visível
      OfflineService.clearAll();
      setProfile(null);
      profileRef.current = null;
    } else {
      console.error('AuthProvider: signOut falhou:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      refreshProfile,
      revalidateCount,
      triggerRevalidate 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
