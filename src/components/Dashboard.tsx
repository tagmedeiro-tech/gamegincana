import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, Users, ChevronRight, Star, Award, Zap, LayoutGrid, Crown, Medal, BookOpen, AlertCircle } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { Group, Activity, getUserLevel, getLevelProgress, Achievement } from '../types';
import PostCommentSection from './feed/PostCommentSection';
import AchievementList from './AchievementList';
import LevelIcon from './LevelIcon';
import { useToast } from '../context/ToastContext';
import { AIMissionPanel } from './AIMissionPanel';
import { BibleService } from '../lib/BibleService';
import { ReadingPlanService, UserPlan } from '../lib/ReadingPlanService';
import StreakWidget from './StreakWidget';
import { AutomationService } from '../lib/AutomationService';
import { Link, useNavigate } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import PointHistory from './PointHistory';
import { DuelBanner, MissionsGrid } from './dashboard/DashboardSubcomponents';
import { AchievementService } from '../lib/AchievementService';
import DashboardSkeleton from './dashboard/DashboardSkeleton';
import DashboardHeader from './dashboard/DashboardHeader';
import TribeLeaderboard from './dashboard/TribeLeaderboard';
import QuickActionCards from './dashboard/QuickActionCards';
import CalendarWidget from './dashboard/CalendarWidget';
import AnniversaryPopup from './dashboard/AnniversaryPopup';
import PhotoMural from './PhotoMural';
import LocationCheckin from './LocationCheckin';
import { NotificationService } from '../lib/NotificationService';
import { OfflineService } from '../lib/OfflineService';


interface Member {
  id: string;
  name: string;
  avatar_url?: string;
  totalPoints: number;
}

interface GroupWithMembers extends Group {
  members: Member[];
}

interface RecentLog {
  id: string;
  points: number;
  reason: string;
  profiles?: { name: string } | { name: string }[] | null;
}

export default function Dashboard() {
  const theme = useAppTheme();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, revalidateCount, signOut, refreshProfile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [hasReadToday, setHasReadToday] = useState(false);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [readingStreak, setReadingStreak] = useState(0);
  const [weeklyXPData, setWeeklyXPData] = useState<{date: string, points: number}[]>([]);
  const [awardingMemberId, setAwardingMemberId] = useState<string | null>(null);
  const [quickXPValue, setQuickXPValue] = useState<string>("");
  const [processingAward, setProcessingAward] = useState(false);
  const [activeReadingPlan, setActiveReadingPlan] = useState<UserPlan | null>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [showAnniversaryPopup, setShowAnniversaryPopup] = useState(false);
  const [rankingGroups, setRankingGroups] = useState<Group[]>([]);
  const [hasData, setHasData] = useState(false);

  // Monitor de Subida de Nível (Level Up Notification)
  const { playBackground, playWoosh, playVictory, playCollect } = useAudio();

  useEffect(() => {
    // Inicia trilha sonora épica de fundo (baixada automaticamente para public/audio/epic_bg.mp3)
    playBackground('/audio/epic_bg.mp3', 0.1);
  }, []);

  useEffect(() => {
    if (!profile) return;
    
    const lvl = getUserLevel(profile.totalPoints, theme.levels);
    const currentLevel = lvl.level;
    const lastSeenLevel = parseInt(localStorage.getItem(`last_seen_level_${profile.id}`) || '0');
    
    // Só dispara se o nível aumentou e se já havia um nível registrado (evita notificar no primeiro login)
    if (lastSeenLevel > 0 && currentLevel > lastSeenLevel) {
      const triggerLevelUpNotif = async () => {
        const actorAvatar = profile.avatar_url || profile.avatarUrl;
        await NotificationService.send(
          profile.id,
          'achievement',
          '⭐ NOVO NÍVEL ALCANÇADO!',
          `Parabéns! Você agora é um ${lvl.title} (Nível ${currentLevel}). Sua honra cresce na arena!`,
          `/dashboard/profile/${profile.id}`,
          actorAvatar
        );
      };
      triggerLevelUpNotif();
    }
    
    localStorage.setItem(`last_seen_level_${profile.id}`, currentLevel.toString());
  }, [profile?.totalPoints, profile?.id, theme.levels]);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!profile) return;
    
    // 🔥 LÓGICA DE CACHE APK: No primeiro carregamento, tentamos restaurar tudo do cache
    if (isInitial) {
      const cachedGroups = OfflineService.get<GroupWithMembers[]>('dashboard_groups');
      const cachedRanking = OfflineService.get<Group[]>('dashboard_ranking');
      if (cachedGroups) setGroups(cachedGroups);
      if (cachedRanking) setRankingGroups(cachedRanking);
    }

    try {
      if (!isInitial) setLoading(true);
      
      // Guarda para evitar fetch duplicado em menos de 1s, MAS apenas se já tivermos dados.
      // Se a tela estiver vazia, precisamos carregar independente do tempo.
      const lastFetch = parseInt(sessionStorage.getItem('dashboard_last_fetch') || '0');
      if (Date.now() - lastFetch < 1000 && groups.length > 0) {
        setLoading(false);
        return;
      }
      sessionStorage.setItem('dashboard_last_fetch', Date.now().toString());
      
      // Timer de emergência: se o fetch demorar mais de 10s, libera a tela de qualquer jeito
      const safetyTimer = setTimeout(() => setLoading(false), 10000);
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayUTCStr = startOfToday.toISOString();
      
      const toLocalISOString = (dateInput: Date | string) => {
        const d = new Date(dateInput);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      };
      const todayLocal = toLocalISOString(now);

      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 1. BLOCO CRÍTICO: Dados essenciais para renderizar a estrutura principal
      const [groupsRes, activitiesRes, profileRes] = await Promise.all([
        supabase.from('groups').select('*').order('totalPoints', { ascending: false }).limit(10),
        supabase.from('activities').select('*').eq('status', 'active').order('points', { ascending: false }).limit(5),
        refreshProfile ? refreshProfile() : Promise.resolve() // Garante perfil atualizado
      ]);

      // Busca profiles de cada grupo em paralelo — apenas os campos necessários
      let allProfiles: any[] = [];
      if (groupsRes.data && groupsRes.data.length > 0) {
        const groupIds = groupsRes.data.map((g: any) => g.id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, totalPoints, role, "groupId"')
          .in('"groupId"', groupIds)
          .order('totalPoints', { ascending: false });
        
        allProfiles = profilesData || [];
      }

      if (groupsRes.data) {
        const processedGroups = groupsRes.data.map((g: any) => ({
          ...g,
          members: allProfiles.filter(p => (p.groupId || p["groupId"]) === g.id)
        }));
        
        const sortedRanking = [...groupsRes.data].sort((a, b) => b.totalPoints - a.totalPoints);
        
        setGroups(processedGroups as GroupWithMembers[]);
        setRankingGroups(sortedRanking);

        // Salva no cache local para a próxima vez
        OfflineService.save('dashboard_groups', processedGroups);
        OfflineService.save('dashboard_ranking', sortedRanking);
        setHasData(true);
      }

      if (activitiesRes.data) {
        setActivities(activitiesRes.data as Activity[]);
      }

      // ✅ LIBERAÇÃO IMEDIATA: Assim que o ranking e atividades básicas carregam, liberamos a tela
      setLoading(false);
      setHasData(true);

      // 2. BLOCO SECUNDÁRIO: Carregamento assíncrono em background (não bloqueante)
      // Agrupamos consultas de logs para reduzir Round-Trips
      const [achievementsRes, userBadgesRes, logsRes, userPlansRes, feedRes] = await Promise.all([
        supabase.from('user_achievements').select('*').eq('"userId"', profile.id).order('created_at', { ascending: false }),
        supabase.from('user_badges').select('*, badges(*)').eq('"userId"', profile.id).order('created_at', { ascending: false }),
        // Consulta unificada de logs (últimos 60 para streak + sparkline)
        supabase.from('point_logs').select('id, points, reason, created_at').eq('"userId"', profile.id).order('created_at', { ascending: false }).limit(60),
        supabase.from('user_reading_plans').select('*').eq('user_id', profile.id).eq('status', 'active').maybeSingle(),
        // Busca o feed global separadamente (pois envolve outros usuários)
        supabase.from('point_logs').select('id, points, reason, "userId", created_at').order('created_at', { ascending: false }).limit(15)
      ]);

      // 3. Processamento Otimizado de Logs (Streak, HasReadToday, Sparkline)
      if (logsRes.data) {
        const userLogs = logsRes.data;
        const devotionalLogs = userLogs.filter(l => l.reason.toLowerCase().includes('devoc'));
        
        // Has Read Today
        setHasReadToday(devotionalLogs.some(l => toLocalISOString(l.created_at) === todayLocal));

        // Streak de Leitura
        const devocDates = [...new Set(devotionalLogs.map(l => toLocalISOString(l.created_at)))];
        let streak = 0;
        const checkDate = new Date();
        if (!devocDates.includes(todayLocal)) checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
          if (devocDates.includes(toLocalISOString(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
        setReadingStreak(streak);

        // XP Semanal (Sparkline)
        const dailyPts: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(); d.setDate(d.getDate() - i);
          dailyPts[toLocalISOString(d)] = 0;
        }
        userLogs.filter(l => new Date(l.created_at) >= sevenDaysAgo).forEach(log => {
          const d = toLocalISOString(log.created_at);
          if (dailyPts[d] !== undefined) dailyPts[d] += log.points;
        });
        setWeeklyXPData(Object.keys(dailyPts).sort().map(d => ({ date: d, points: dailyPts[d] })));
      }

      // 4. Feed de Atividades (com lookup de nomes)
      if (feedRes.data) {
        const userIds = [...new Set(feedRes.data.map((l: any) => l.userId).filter(Boolean))];
        let feedProfileMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: feedProfiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
          if (feedProfiles) feedProfiles.forEach(p => feedProfileMap.set(p.id, p.name));
        }
        const feedLogs = feedRes.data.map((log: any) => ({
          ...log,
          profiles: log.userId ? { name: feedProfileMap.get(log.userId) || 'Membro' } : null
        }));
        setRecentLogs(feedLogs);
      }

      // 5. Plano de Leitura e Metadados finais
      if (userPlansRes.data) {
        const { data: completions } = await supabase.from('reading_plan_completions').select('day_number').eq('user_plan_id', userPlansRes.data.id);
        setActiveReadingPlan({
          id: userPlansRes.data.id,
          planId: userPlansRes.data.plan_id,
          startedAt: userPlansRes.data.started_at,
          status: userPlansRes.data.status,
          completedDays: (completions || []).map((c: any) => c.day_number)
        }); 
      } else {
        setActiveReadingPlan(null);
      }

      setAchievements(achievementsRes.data || []);
      setUserBadges(userBadgesRes.data || []);
      
      clearTimeout(safetyTimer);
    } catch (err: any) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, refreshProfile]);

  useEffect(() => {
    if (activeReadingPlan && profile?.id) {
      const plan = ReadingPlanService.getPlanById(activeReadingPlan.planId);
      if (!plan) return;
      const currentDay = activeReadingPlan.completedDays.length >= plan.totalDays 
        ? plan.totalDays 
        : activeReadingPlan.completedDays.length + 1;
      const expectedDay = Math.min(ReadingPlanService.getCurrentDay(activeReadingPlan.startedAt), plan.totalDays);
      const daysLate = expectedDay - currentDay;
      const isLate = daysLate > 0 && !activeReadingPlan.completedDays.includes(currentDay);
      
      if (isLate) {
        const today = new Date().toISOString().split('T')[0];
        const key = `late_notification_sent_${activeReadingPlan.id}_${today}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, 'true');
          const actorAvatar = profile.avatar_url || profile.avatarUrl;
          NotificationService.send(
            profile.id,
            'announcement',
            'Plano Atrasado!',
            `Você está ${daysLate} dia${daysLate > 1 ? 's' : ''} atrasado no plano "${plan.name}". Recupere sua leitura hoje!`,
            '/dashboard/reading-plans',
            actorAvatar
          ).catch(console.error);
        }
      }
    }
  }, [activeReadingPlan, profile?.id]);

  // 🎉 Birthday Celebration Check
  useEffect(() => {
    fetchData(true);
    if (profile?.id) {
      AutomationService.checkBirthday(profile.id).then(isBday => {
        if (isBday) {
          const sessionKey = `bday_popup_shown_${new Date().getFullYear()}`;
          if (!sessionStorage.getItem(sessionKey)) {
            playWoosh();
            setShowAnniversaryPopup(true);
            sessionStorage.setItem(sessionKey, 'true');
          }
        }
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (profile?.id) {
      fetchData();

      // ⚠️ handleDailyLogin NÃO é chamado aqui — já é chamado no MainLayout (App.tsx).
      // Chamá-lo aqui gera o loop: handleDailyLogin → refreshProfile → revalidateCount++ → fetchData.

      // 📡 Realtime: Atualizar ranking instantaneamente
      const channelId = `groups-realtime-${Math.random().toString(36).substr(2, 9)}`;
      channel = supabase.channel(channelId)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups' }, () => {
          fetchData();
        })
        .subscribe();
    } else if (!authLoading) {
      setLoading(false);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  // ⚠️ fetchData e revalidateCount removidos das deps para evitar loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, authLoading]);

  const { success: toastSuccess, error: toastError } = useToast();

  const handleQuickAward = async (memberId: string, groupId: string, points: number) => {
    if (processingAward) return;
    setProcessingAward(true);
    try {
      const { error } = await supabase.rpc('increment_points', {
        user_id: memberId,
        group_id: groupId,
        pts: points,
        reason: `Lancamento Rapido: +${points} XP`
      });

      if (error) throw error;
      
      setAwardingMemberId(null);
      refreshProfile?.();
      fetchData();
      toastSuccess('XP Creditado!', `+${points} XP atribuídos com sucesso.`);
    } catch (err) {
      console.error("Erro ao atribuir pontos:", err);
      toastError('Erro', 'Não foi possível processar os pontos.');
    } finally {
      setProcessingAward(false);
    }
  };

  // ⚡ TURBO: Removemos o bloqueio total para permitir Instant UI (Layout Shell)
  const isPendingData = authLoading || (loading && groups.length === 0) || (user && !profile);

  // ⚡ TURBO: Se ainda estiver carregando, mostramos o Skeleton do Layout imediatamente
  if (isPendingData) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="h-48 bg-zinc-900/50 border-4 border-zinc-800/50 rounded-[3rem] animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900/30 border-2 border-zinc-800/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    const isMasterEmail = user?.email?.toLowerCase() === 'tagmedeiro@gmail.com';
    
    const handleCreateMasterProfile = async () => {
      if (!user) return;
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          name: 'Administrador Mestre',
          email: user.email,
          role: 'admin',
          status: 'active',
          totalPoints: 0,
          coins: 0,
          achievements: []
        });
        if (error) throw error;
        // Bug fix: alert() não funciona em WebViews Android — usa toast
        toastSuccess('Perfil Criado', 'Perfil mestre inicializado com sucesso!');
        refreshProfile?.();
      } catch (err) {
        console.error("Erro ao criar perfil mestre:", err);
        toastError('Falha', 'Erro ao criar perfil: ' + (err instanceof Error ? err.message : 'Erro de RLS ou Banco'));
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-zinc-900 border-4 border-red-500 rounded-[3rem] p-12 text-center shadow-[0_0_80px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertCircle size={200} className="text-red-500" />
          </div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-black border-4 border-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            
            <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none mb-6">
              PERFIL <span className="text-red-500">INEXISTENTE</span>
            </h2>
            
            <div className="bg-black/50 border-2 border-zinc-800 rounded-2xl p-4 mb-8 inline-block text-left">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Status da Sessão</p>
              <p className="text-xs font-mono text-zinc-300">UID: {user?.id || 'Desconectado'}</p>
              <p className="text-xs font-mono text-zinc-300">Email: {user?.email || 'N/A'}</p>
            </div>

            <p className="text-zinc-400 font-bold italic text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Detectamos que você está logado no sistema de autenticação, mas seus dados de jogador não foram encontrados no banco de dados da Arena.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              {isMasterEmail && (
                <button 
                  onClick={handleCreateMasterProfile}
                  className="w-full sm:w-auto flex items-center gap-3 px-8 py-5 bg-primary text-black rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white transition-all shadow-[0_0_50px_rgba(251,191,36,0.3)]"
                >
                  <Zap size={24} /> INICIALIZAR PERFIL MESTRE
                </button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                  onClick={() => signOut?.()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-8 py-4 bg-zinc-800 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-zinc-700 transition-colors duration-200"
                >
                  SAIR DO SISTEMA
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-8 py-4 border-2 border-zinc-800 text-zinc-500 rounded-2xl font-black uppercase italic tracking-tighter hover:text-white hover:border-white transition-colors duration-200"
                >
                  RECARREGAR TELA
                </button>
              </div>
            </div>

            {isMasterEmail && (
              <p className="mt-8 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                Nota: Se o botão falhar, certifique-se de que as políticas de RLS no Supabase foram aplicadas.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-zinc-900 border-4 border-primary rounded-[3rem] p-12 text-center shadow-[0_0_80px_rgba(251,191,36,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={200} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-black border-4 border-primary rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.3)]">
              <Zap size={48} className="text-primary" />
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none mb-6">
              ACESSO EM <span className="text-primary">ANÁLISE</span>
            </h2>
            <p className="text-zinc-400 font-bold italic text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Olá, <span className="text-white">{profile.name}</span>! Seu cadastro na <span className="text-primary uppercase tracking-widest">{theme.appName}</span> foi realizado com sucesso.
              <br/><br/>
              Agora, um administrador ou líder da sua tribo precisa validar sua entrada na arena.
              Geralmente isso leva apenas alguns minutos.
            </p>
            <div className="bg-black/50 border-2 border-zinc-800 rounded-3xl p-6 mb-10 inline-block">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Sua Tribo Selecionada</p>
              <p className="text-2xl font-black italic text-white uppercase">{groups.find(g => g.id === profile.groupId)?.name || 'Carregando Tribo...'}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white transition-colors duration-200 active:scale-95"
              >
                <ChevronRight size={20} className="rotate-180" /> ATUALIZAR STATUS
              </button>
              <button
                onClick={() => signOut?.()}
                className="text-zinc-500 hover:text-white font-black uppercase italic text-sm tracking-widest px-8 py-4 transition-colors"
              >
                SAIR DO SISTEMA
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topThree = groups.slice(0, 3);
  const remainingGroups = groups.slice(3);
  const maxPoints = Math.max(...groups.map(g => g.totalPoints), 1);

  // RPG Progression Logic
  const pts = profile?.totalPoints || 0;
  const lvl = getUserLevel(pts, theme.levels);
  const pct = getLevelProgress(pts, theme.levels);
  const nextLvl = lvl.level < (theme.levels?.length || 5) ? lvl.level + 1 : null;

  // Meu Grupo Logic
  const myGroupIndex = groups.findIndex(g => g.id === profile?.groupId);
  const myGroup = myGroupIndex !== -1 ? groups[myGroupIndex] : null;
  const myRank = myGroupIndex + 1;
  const nextGroup = myGroupIndex > 0 ? groups[myGroupIndex - 1] : null;
  const pointsToNext = nextGroup && myGroup ? nextGroup.totalPoints - myGroup.totalPoints : 0;

  // Cores dinâmicas da tribo
  const tribePrimary = myGroup?.primaryColor || theme.primaryColor || '#FBBF24';
  const tribeSecondary = myGroup?.secondary_color || '#78350f';

  // Sparkline computation
  const maxXP = weeklyXPData.length > 0 ? Math.max(...weeklyXPData.map(d => d.points), 1) : 1;
  const sparkPoints = weeklyXPData.length > 0 ? weeklyXPData.map((d, i) => {
    const x = (i / (weeklyXPData.length - 1 || 1)) * 60;
    const y = 20 - ((d.points / maxXP) * 20);
    return `${x},${y}`;
  }).join(' ') : "0,20 60,20";

  return (
    <div className="space-y-12 pb-20 overflow-x-hidden w-full">
      {/* HEADER MODULARIZADO (Fase 31) */}
      <DashboardHeader 
        profile={profile}
        lvl={lvl}
        nextLvl={nextLvl}
        pct={pct}
        pts={pts}
        tribePrimary={tribePrimary}
        theme={theme}
        myGroup={myGroup}
        achievements={achievements}
        weeklyXPData={weeklyXPData}
      />
      
      {/* 📸 MURAL DE FOTOS PREMIUM */}
      <PhotoMural />
      
      {/* 🔥 SISTEMA DE OFENSIVAS (STREAKS) */}
      <StreakWidget />

      {/* 📍 CHECK-IN PRESENCIAL (GPS) */}
      <LocationCheckin />

      {/* 📅 PRÓXIMO EVENTO (CALENDÁRIO) */}
      {(isAdmin || theme.showCalendar !== false) && <CalendarWidget />}

      {/* MINHA TRIBO (PREMIUM) */}
      {myGroup && (isAdmin || theme.showMyGroup !== false) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium flex flex-col md:flex-row items-center justify-between gap-8 group"
        >
          {/* Background Banner (se existir) */}
          {myGroup.banner_url && (
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <img src={myGroup.banner_url} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-black"></div>
              <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent"></div>
            </div>
          )}

          {/* Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 blur-[120px] rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: tribePrimary }}></div>
          
          <div className="flex items-center gap-8 relative z-10">
            <div 
              className="w-28 h-28 bg-black rounded-4xl border-2 flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-rotate-2"
              style={{ borderColor: tribePrimary, boxShadow: `0 0 30px ${tribePrimary}30` }}
            >
              {myGroup.logoUrl ? (
                <img src={myGroup.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-[1.8rem]" />
              ) : (
                <Users style={{ color: tribePrimary }} size={40} />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-2">Tropa de Elite</p>
              <h3 className="text-5xl font-black uppercase italic text-white leading-none mb-3 tracking-tighter">{myGroup.name}</h3>
              {myGroup.slogan && (
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tribePrimary }}></div>
                   <p className="text-sm font-black italic uppercase tracking-tight text-zinc-400">
                    "{myGroup.slogan}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-10 bg-black/40 backdrop-blur-md px-8 py-6 rounded-4xl border border-zinc-800/50 flex-1 md:flex-none relative z-10">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Global Rank</p>
              <p className="text-5xl font-black italic tracking-tighter leading-none" style={{ color: tribePrimary }}>
                {myRank}º 
              </p>
              <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase">de {groups.length} tribos</p>
            </div>
            <div className="w-px h-16 bg-zinc-800/50"></div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Poder Bélico</p>
              <div className="flex items-baseline gap-1 justify-center">
                <p className="text-5xl font-black italic text-white tracking-tighter leading-none">{myGroup.totalPoints}</p>
                <span className="text-[10px] font-black text-zinc-600 uppercase">pts</span>
              </div>
            </div>
          </div>

          {nextGroup && pointsToNext > 0 && (
            <div className="text-right flex-1 md:flex-none relative z-10 min-w-[200px]">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-tighter">Próximo Alvo: <span style={{ color: tribePrimary }}>+{pointsToNext} XP</span></p>
              <p className="text-[10px] font-black uppercase italic text-zinc-600 tracking-tight">para ultrapassar {nextGroup.name}</p>
              {/* Barra de Perseguição Mini */}
              <div className="w-full h-2 bg-black/50 rounded-full mt-4 overflow-hidden border border-zinc-800/50 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(myGroup.totalPoints / nextGroup.totalPoints) * 100}%` }}
                  className="h-full relative z-10"
                  style={{ backgroundColor: tribePrimary }}
                />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-sweep"></div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ⚔️ ARENA DE DUELOS (COMPONENTE MEMOIZADO) */}
      {(isAdmin || theme.showDuel !== false) && <DuelBanner />}

      {/* IA INTELLIGENCE (FASE 5) */}
      {profile && <AIMissionPanel user={profile} />}

      {/* AÇÕES RÁPIDAS (Fase 31) */}
      <QuickActionCards 
        theme={theme}
        hasReadToday={hasReadToday}
        readingStreak={readingStreak}
        activeReadingPlan={activeReadingPlan}
        navigate={navigate}
        isAdmin={isAdmin}
      />

      {/* RANKING MODULARIZADO (Fase 31) */}
      {(isAdmin || theme.showRanking !== false) && (
        <TribeLeaderboard 
          groups={groups}
          profile={profile}
          navigate={navigate}
          expandedGroupId={expandedGroupId}
          setExpandedGroupId={setExpandedGroupId}
          awardingMemberId={awardingMemberId}
          setAwardingMemberId={setAwardingMemberId}
          quickXPValue={quickXPValue}
          setQuickXPValue={setQuickXPValue}
          handleQuickAward={handleQuickAward}
          processingAward={processingAward}
          theme={theme}
        />
      )}

      {/* MISSÕES E CONQUISTAS (COMPONENTE MEMOIZADO) */}
      {(isAdmin || theme.showActivities !== false || theme.showFeed !== false) && (
        <MissionsGrid
          activities={activities}
          recentLogs={recentLogs}
          profileId={profile?.id}
          achievements={achievements}
          userBadges={userBadges}
        />
      )}

      <AnimatePresence>
        {showAnniversaryPopup && profile && (
          <AnniversaryPopup 
            name={profile.name} 
            onClose={() => setShowAnniversaryPopup(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
