/**
 * AppThemeContext — Singleton Provider para o tema da aplicação.
 *
 * MOTIVAÇÃO:
 * O hook `useAppTheme()` criava instâncias independentes em MainLayout, Sidebar e Dashboard.
 * Cada instância fazia seu próprio fetch, criava seu canal Realtime e registrava event listeners,
 * gerando 3 queries à tabela `config` por carregamento e 3 queries por cada focus de janela.
 *
 * SOLUÇÃO:
 * AppThemeProvider no topo da árvore (main.tsx) faz o fetch UMA ÚNICA VEZ.
 * useAppTheme() é agora um shim que lê do context — zero fetches adicionais.
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserLevel, LEVEL_THRESHOLDS } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomTab {
  id: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
}

export interface AppTheme {
  primaryColor: string;
  accentColor: string;
  appName: string;
  churchName: string;
  logoType: string;
  logoUrl?: string;
  welcomeMessage: string;
  seasonLabel: string;
  showRanking: boolean;
  showChat: boolean;
  showBible: boolean;
  showStore: boolean;
  showFeed: boolean;
  showActivities: boolean;
  showReadingPlans: boolean;
  showDuel: boolean;
  showMyGroup: boolean;
  showCalendar: boolean;
  showVoxel: boolean;
  customTabs: CustomTab[];
  loginTitle?: string;
  loginSubtitle?: string;
  loginButtonText?: string;
  registerPrompt?: string;
  registerButtonText?: string;
  whatsappLinks?: Record<string, string>;
  autoDevotional?: {
    startDate: string;
    startBookId: string;
    startChapter: number;
    points: number;
    enabled: boolean;
    mode: 'linear' | 'random';
  };
  dailyLoginBonus?: { enabled: boolean; points: number };
  coinMultiplier?: number;
  logoError?: boolean;
  setLogoError?: (val: boolean) => void;
  muralPoints?: {
    postPoints: number;
    studyPoints: number;
    commentPoints: number;
    commentMaxDaily: number;
    reactionBonusPoints: number;
    reactionBonusThreshold: number;
  };
  duelSettings?: {
    totalQuestions: number;
    questionTime: number;
    winPoints: number;
    drawPoints: number;
    lossPoints: number;
    winCoins: number;
    drawCoins: number;
    lossCoins: number;
    waitTimeBetweenQuestions: number;
  };
  gincanaStatus?: 'active' | 'waiting' | 'preparing';
  gincanaStartDate?: string;
  levels?: UserLevel[];
  landing?: {
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
    videoUrl?: string;
    showStats: boolean;
    showModules: boolean;
    showFeed: boolean;
    showGallery: boolean;
    footerText: string;
  };
  checkinLocation?: {
    enabled: boolean;
    latitude: number;
    longitude: number;
    radius: number;
    label: string;
    points: number;
  };
}

export const DEFAULT_THEME: AppTheme = {
  primaryColor: '#FBBF24',
  accentColor: '#F59E0B',
  appName: 'TRIBO IDE',
  churchName: 'Igreja do Evangelho',
  logoType: 'shield',
  welcomeMessage: 'Bem-vindo à Arena TRIBO IDE!',
  seasonLabel: 'Temporada 2026',
  showRanking: true,
  showChat: true,
  showBible: true,
  showStore: true,
  showFeed: true,
  showActivities: true,
  showReadingPlans: true,
  showDuel: true,
  showMyGroup: true,
  showCalendar: true,
  showVoxel: true,
  customTabs: [],
  loginTitle: 'Acesso à Tribo',
  loginSubtitle: 'Seja bem-vindo soldado!',
  loginButtonText: 'ENTRAR NA BATALHA',
  registerPrompt: 'Ainda não tem uma tribo?',
  registerButtonText: 'Cadastre-se Agora',
  whatsappLinks: {},
  dailyLoginBonus: { enabled: true, points: 5 },
  muralPoints: {
    postPoints: 2,
    studyPoints: 5,
    commentPoints: 1,
    commentMaxDaily: 3,
    reactionBonusPoints: 3,
    reactionBonusThreshold: 5,
  },
  duelSettings: {
    totalQuestions: 10,
    questionTime: 20,
    winPoints: 60,
    drawPoints: 30,
    lossPoints: 15,
    winCoins: 20,
    drawCoins: 10,
    lossCoins: 5,
    waitTimeBetweenQuestions: 1500,
  },
  gincanaStatus: 'active',
  gincanaStartDate: new Date().toISOString(),
  levels: LEVEL_THRESHOLDS,
  landing: {
    heroTitle: 'A MAIOR GINCANA BÍBLICA DA REGIÃO',
    heroSubtitle: 'Prepare-se para a batalha, fortaleça sua fé e lidere sua tribo rumo à vitória na Arena Digital.',
    ctaText: 'ENTRAR NA ARENA',
    videoUrl: '',
    showStats: true,
    showModules: true,
    showFeed: true,
    showGallery: true,
    footerText: '© 2024 Gincana da Tribo - Desenvolvido para a Glória de Deus.',
  },
  checkinLocation: {
    enabled: false,
    latitude: -23.5505, // Coordenadas padrão (Ex: São Paulo)
    longitude: -46.6333,
    radius: 100, // 100 metros
    label: 'Igreja Sede',
    points: 50,
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppThemeContextValue extends AppTheme {
  logoError: boolean;
  setLogoError: (val: boolean) => void;
}

const AppThemeContext = createContext<AppThemeContextValue>({
  ...DEFAULT_THEME,
  logoError: false,
  setLogoError: () => {},
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.min(255, Math.floor(R * (100 + percent) / 100));
  G = Math.min(255, Math.floor(G * (100 + percent) / 100));
  B = Math.min(255, Math.floor(B * (100 + percent) / 100));
  return '#' + R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0');
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const cached = localStorage.getItem('app_theme_cache');
      if (cached) return { ...DEFAULT_THEME, ...JSON.parse(cached) };
    } catch { /* ignora cache corrompido */ }
    return DEFAULT_THEME;
  });
  const [logoError, setLogoError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = (data: AppTheme) => {
    const merged = { ...DEFAULT_THEME, ...data };
    setTheme(merged);
    localStorage.setItem('app_theme_cache', JSON.stringify(merged));
    document.documentElement.style.setProperty('--color-primary', merged.primaryColor);
    document.documentElement.style.setProperty('--color-primary-dark', shadeColor(merged.primaryColor, -20));
  };

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('value')
          .eq('key', 'app')
          .single();
        if (data?.value && !error) applyTheme(data.value as AppTheme);
      } catch (err) {
        console.warn('AppThemeProvider: erro ao buscar tema:', err);
      }
    };

    // Fetch inicial (único no ciclo de vida do app)
    fetchTheme();

    // 🔄 Re-fetch APENAS em visibilitychange — NÃO em 'focus' (que dispara a cada clique na janela)
    // Debounce de 5s para evitar cascata em trocas rápidas de aba
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchTheme, 5000);
      }
    };

    // Re-fetch ao recuperar conexão com a internet
    const handleOnline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchTheme, 2000);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    // Realtime: atualizar tema instantaneamente quando admin mudar no painel
    const channel = supabase
      .channel(`app-theme-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: 'key=eq.app' }, (payload) => {
        const newData = payload.new as { value?: AppTheme };
        if (newData?.value) applyTheme(newData.value);
      })
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppThemeContext.Provider value={{ ...theme, logoError, setLogoError }}>
      {children}
    </AppThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppThemeContext() {
  return useContext(AppThemeContext);
}
