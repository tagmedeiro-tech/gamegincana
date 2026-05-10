import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle2, Circle, Trophy, Zap, Calendar, ChevronRight, X, Lock, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { READING_PLANS, ReadingPlanService, PlanDefinition, UserPlan, DailyPortion } from '../lib/ReadingPlanService';
import { NotificationService } from '../lib/NotificationService';
import { useBiblePointsConfig } from './AdminBiblePoints';
import { useToast } from '../context/ToastContext';
import { createPortal } from 'react-dom';
import BibleViewer from './BibleViewer';
import { useSearchParams } from 'react-router-dom';
import Skeleton from './Skeleton';
import { useReadingPlansData } from '../hooks/useReadingPlansData';

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

export default function ReadingPlans() {
  const { profile, refreshProfile, triggerRevalidate } = useAuth();
  const { userPlans, isLoading: plansLoading, mutate: mutatePlans } = useReadingPlansData(profile?.id);
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);
  const [view, setView] = useState<'list' | 'active' | 'history'>('list');
  const { error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showReader, setShowReader] = useState(false);
  const [readerBook, setReaderBook] = useState<string | null>(null);
  const [readerChapter, setReaderChapter] = useState<number>(1);
  const [planToAbandon, setPlanToAbandon] = useState<string | null>(null);

  // Sincroniza plano ativo quando os dados chegam do SWR
  useEffect(() => {
    if (userPlans.length > 0) {
      const active = userPlans.find(p => p.status === 'active');
      if (active) {
        setActivePlan(active);
        if (view === 'list') setView('active');
      }
    }
  }, [userPlans]);

  const openReader = (bookId: string, chapter: number) => {
    setReaderBook(bookId);
    setReaderChapter(chapter);
    setShowReader(true);
    
    // Atualiza a URL em background sem bloquear a UI
    setTimeout(() => {
      setSearchParams({ 
        ...Object.fromEntries(searchParams),
        reader: 'true',
        book: bookId,
        chapter: chapter.toString()
      });
    }, 100);
  };

  const closeReader = () => {
    setShowReader(false);
    const newParams = Object.fromEntries(searchParams);
    delete newParams.reader;
    delete newParams.book;
    delete newParams.chapter;
    setSearchParams(newParams);
  };

  // Sincroniza se vier de link externo
  useEffect(() => {
    const r = searchParams.get('reader') === 'true';
    const b = searchParams.get('book');
    const c = parseInt(searchParams.get('chapter') || '1');
    if (r && b) {
      setReaderBook(b);
      setReaderChapter(c);
      setShowReader(true);
    }
  }, [searchParams]);

  const handleJoinPlan = async (plan: PlanDefinition) => {
    if (!profile) return;

    // 🧹 Limpa um possível plano anterior abandonado
    await supabase.from('user_reading_plans')
      .delete()
      .eq('user_id', profile.id)
      .eq('plan_id', plan.id)
      .eq('status', 'abandoned');

    const { data, error } = await supabase
      .from('user_reading_plans')
      .insert({ user_id: profile.id, plan_id: plan.id, started_at: new Date().toISOString().split('T')[0] })
      .select('id, plan_id, started_at, status')
      .single();
    if (error) { toastError('Erro', 'Não foi possível iniciar o plano. Tente novamente.'); return; }
    const newPlan: UserPlan = { id: data.id, planId: data.plan_id, startedAt: data.started_at, status: 'active', completedDays: [] };
    setActivePlan(newPlan);
    setView('active');
    mutatePlans();
  };

  const confirmAbandonPlan = async () => {
    if (!planToAbandon) return;
    const planId = planToAbandon;
    setPlanToAbandon(null);
    await supabase.from('user_reading_plans').update({ status: 'abandoned' }).eq('id', planId);
    setActivePlan(null);
    setView('list');
    mutatePlans();
  };

  return (
    <div className="pb-20">
      {/* ── PORTAL DO LEITOR (Sempre disponível, mesmo em loading de planos) ── */}
      {/* ── PORTAL DO LEITOR (Sempre disponível, mesmo em loading de planos) ── */}
      {createPortal(
        <AnimatePresence>
          {showReader && (
            <motion.div 
              key="bible-reader-modal"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-9999 bg-black flex flex-col overflow-hidden"
            >
              {/* Header customizado do modal */}
              <div className="flex items-center justify-between p-4 lg:px-8 border-b-2 border-zinc-800 bg-zinc-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border-2 border-primary/40">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-black uppercase italic leading-none">Leitor Bíblico</h2>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Modo Plano de Leitura</p>
                  </div>
                </div>
                <button 
                  onClick={closeReader}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black px-4 py-2.5 rounded-2xl font-black uppercase italic text-[10px] transition-all active:scale-95 border-2 border-transparent hover:border-primary/50"
                >
                  <X size={16} /> Fechar e Voltar ao Plano
                </button>
              </div>

              {/* Conteúdo do Leitor */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-12 bg-black custom-scrollbar">
                <div key={`reader-${readerBook}-${readerChapter}`} className="max-w-7xl mx-auto">
                  <BibleViewer 
                    initialBook={readerBook} 
                    initialChapter={readerChapter} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── MODAL DE ABANDONAR PLANO ── */}
      <AnimatePresence>
        {planToAbandon && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPlanToAbandon(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-zinc-900 border-2 border-red-500/50 rounded-3xl overflow-hidden shadow-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500 mx-auto mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic mb-2">Abandonar Plano?</h3>
              <p className="text-zinc-400 text-sm mb-8">Tem certeza? Se você abandonar agora, seu progresso será totalmente perdido.</p>
              <div className="flex gap-3">
                <button onClick={() => setPlanToAbandon(null)} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase tracking-tighter text-sm hover:bg-zinc-700 transition-all">Cancelar</button>
                <button onClick={confirmAbandonPlan} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black uppercase tracking-tighter text-sm hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">Sim, Abandonar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────────────────────────────────────────── */}
      {plansLoading && userPlans.length === 0 ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-16 w-full max-w-xl" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl overflow-hidden">
                <div className="h-1.5 w-full bg-zinc-700/50" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <header className="mb-10 relative">
            {plansLoading && userPlans.length > 0 && (
              <div className="absolute -top-6 right-0 flex items-center gap-2 text-[8px] font-black uppercase text-primary animate-pulse">
                <div className="w-2 h-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Sincronizando...
              </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Formação Espiritual</p>
            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
              Plano de<span className="text-primary block">Leitura</span>
            </h1>
            <p className="text-zinc-500 font-bold italic text-sm mt-3">Comprometa-se com a Palavra. Ganhe XP. Fortaleça sua tribo.</p>
          </header>

          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <PlanList userPlans={userPlans} onJoin={handleJoinPlan} onResume={(p) => { setActivePlan(p); setView('active'); }} />
              </motion.div>
            )}
            {view === 'active' && activePlan && (
              <motion.div key="active" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ActivePlanView
                  userPlan={activePlan}
                  onBack={() => setView('list')}
                  onAbandon={setPlanToAbandon}
                  onOpenReader={openReader}
                  onDayComplete={(dayNum) => {
                    setActivePlan(prev => prev ? { ...prev, completedDays: [...prev.completedDays, dayNum] } : prev);
                    mutatePlans();
                    refreshProfile();
                    triggerRevalidate();
                  }}
                  profile={profile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── LISTA DE PLANOS ──────────────────────────────────────────────────────────

function PlanList({ userPlans, onJoin, onResume }: {
  userPlans: UserPlan[];
  onJoin: (plan: PlanDefinition) => void;
  onResume: (plan: UserPlan) => void;
}) {
  const difficultyLabel = { easy: 'Iniciante', medium: 'Intermediário', hard: 'Avançado' };
  const difficultyColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {READING_PLANS.map((plan, i) => {
        const userPlan = userPlans.find(up => up.planId === plan.id);
        const isActive = userPlan?.status === 'active';
        const isCompleted = userPlan?.status === 'completed';
        const pct = userPlan ? ReadingPlanService.getProgressPercent(userPlan.completedDays.length, plan.totalDays) : 0;
        const hasAnyActive = userPlans.some(up => up.status === 'active');
        const isLocked = !isActive && !isCompleted && hasAnyActive;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`relative bg-zinc-900 border-4 rounded-4xl overflow-hidden transition-all ${isActive ? 'border-primary shadow-[0_0_40px_rgba(251,191,36,0.2)]' : isCompleted ? 'border-green-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}
          >
            {/* Barra de cor topo */}
            <div className="h-1.5 w-full" style={{ backgroundColor: plan.color }} />

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-3xl">{plan.icon}</span>
                  <h3 className="text-xl font-black text-white uppercase italic mt-2 leading-none">{plan.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: plan.color }}>{plan.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">Dificuldade</p>
                  <p className="text-[10px] font-black uppercase" style={{ color: difficultyColor[plan.difficulty] }}>{difficultyLabel[plan.difficulty]}</p>
                </div>
              </div>

              <p className="text-zinc-500 text-xs leading-relaxed">{plan.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Dias', value: plan.totalDays },
                  { label: 'XP/dia', value: `+${plan.pointsPerDay}` },
                  { label: 'Bônus', value: `+${plan.bonusPoints}` },
                ].map(s => (
                  <div key={s.label} className="bg-black/40 rounded-xl p-2 text-center border border-zinc-800">
                    <p className="text-white font-black text-sm italic">{s.value}</p>
                    <p className="text-zinc-600 text-[9px] font-black uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progresso se já iniciado */}
              {userPlan && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black text-zinc-500 uppercase">Progresso</span>
                    <span className="text-[9px] font-black text-primary">{userPlan.completedDays.length}/{plan.totalDays} dias</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: plan.color }} />
                  </div>
                </div>
              )}

              {/* Ação */}
              {isCompleted ? (
                <div className="flex items-center gap-2 justify-center py-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span className="text-green-400 font-black text-xs uppercase">Concluído!</span>
                </div>
              ) : isActive ? (
                <button onClick={() => onResume(userPlan!)} className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3 rounded-xl font-black uppercase italic text-sm hover:bg-white active:scale-95 transition-all">
                  <Zap size={16} /> Continuar Plano
                </button>
              ) : isLocked ? (
                <div className="flex items-center gap-2 justify-center py-2 text-zinc-600">
                  <Lock size={14} />
                  <span className="text-[10px] font-black uppercase">Conclua o plano ativo primeiro</span>
                </div>
              ) : (
                <button onClick={() => onJoin(plan)} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-black uppercase italic text-sm active:scale-95 transition-all border-2 border-transparent hover:border-primary/40">
                  <BookOpen size={16} /> Iniciar Plano
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── PLANO ATIVO ───────────────────────────────────────────────────────────────

function ActivePlanView({ userPlan, onBack, onAbandon, onDayComplete, profile, onOpenReader }: {
  userPlan: UserPlan;
  onBack: () => void;
  onAbandon: (id: string) => void;
  onDayComplete: (day: number) => void;
  profile: { id: string; groupId?: string; name?: string; avatar_url?: string; avatarUrl?: string } | null;
  onOpenReader: (bookId: string, chapter: number) => void;
}) {
  const plan = ReadingPlanService.getPlanById(userPlan.planId);
  const biblePoints = useBiblePointsConfig();
  if (!plan) return null;

  // Pontos configurados pelo admin, com fallback nos defaults do plano
  const pointsPerDay = biblePoints.reading_plans[plan.id]?.points_per_day ?? plan.pointsPerDay;
  const bonusPoints = biblePoints.reading_plans[plan.id]?.bonus_points ?? plan.bonusPoints;

  const currentDay = userPlan.completedDays.length >= plan.totalDays 
    ? plan.totalDays 
    : userPlan.completedDays.length + 1;
  const expectedDay = Math.min(ReadingPlanService.getCurrentDay(userPlan.startedAt), plan.totalDays);
  const daysLate = expectedDay - currentDay;
  const isLate = daysLate > 0 && !userPlan.completedDays.includes(currentDay);
  const todayPortion = ReadingPlanService.getDayPortion(plan, currentDay);
  const todayDone = userPlan.completedDays.includes(currentDay);
  const pct = ReadingPlanService.getProgressPercent(userPlan.completedDays.length, plan.totalDays);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { error: toastError } = useToast();

  const handleConfirm = async () => {
    if (!profile || isConfirming || todayDone) return;
    setIsConfirming(true);
    try {
      // Re-idrata a sessão para garantir que após longo período de leitura a sessão está viva
      await supabase.auth.getSession();

      const { data, error } = await supabase.rpc('complete_reading_plan_day', {
        p_user_plan_id: userPlan.id,
        p_user_id: profile.id,
        p_group_id: profile.groupId || null,
        p_day_number: currentDay,
        p_total_days: plan.totalDays,
        p_points_per_day: pointsPerDay,
        p_bonus_points: bonusPoints,
      });
      if (error) throw error;
      if (data?.success) {
        onDayComplete(currentDay);
        setShowSuccess(true);
        const actorAvatar = profile.avatar_url || (profile as any).avatarUrl;
        if (data.bonus_given) {
          await NotificationService.send(profile.id, 'achievement', `${plan.icon} Plano Concluído!`, `Parabéns! Você completou "${plan.name}" e ganhou +${bonusPoints} pts de bônus para sua tribo!`, undefined, actorAvatar);
        } else {
          await NotificationService.send(profile.id, 'achievement', 'Porção Lida! 📖', `Dia ${currentDay}/${plan.totalDays} — +${pointsPerDay} pts. Continue firme!`, undefined, actorAvatar);
        }
      }
    } catch (err) { console.error(err); toastError('Erro', 'Não foi possível registrar a leitura.'); }
    finally { setIsConfirming(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 bg-zinc-900 border-2 border-zinc-800 hover:border-primary rounded-2xl text-zinc-400 hover:text-primary active:scale-95 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Plano Ativo</p>
          <h2 className="text-2xl font-black text-white uppercase italic">{plan.icon} {plan.name}</h2>
        </div>
        <button onClick={() => onAbandon(userPlan.id)} className="text-[9px] font-black uppercase text-zinc-700 hover:text-red-500 transition-colors">Abandonar</button>
      </div>

      {/* Progresso Geral */}
      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-6 mb-2 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Status da Jornada</p>
            <h4 className="text-white font-black italic text-2xl uppercase leading-none">
              Dia {currentDay} <span className="text-primary text-xs ml-1 tracking-widest">/ {plan.totalDays}</span>
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Progresso Total</p>
            <p className="text-primary font-black italic text-3xl leading-none">{pct}%</p>
          </div>
        </div>
        
        <div className="h-4 bg-black/50 rounded-full border-2 border-zinc-800 p-0.5 overflow-hidden relative z-10">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${pct}%` }}
             transition={{ duration: 1.2, ease: "circOut" }}
             className="h-full rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)]"
             style={{ backgroundColor: plan.color }}
           />
        </div>
        
        <div className="flex justify-between mt-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{userPlan.completedDays.length} dias concluídos</span>
          </div>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">{plan.totalDays - userPlan.completedDays.length} missões restantes</span>
        </div>
      </div>

      {/* Porção de Hoje */}
      <div className={`bg-zinc-900 border-4 rounded-4xl p-8 relative overflow-hidden ${todayDone ? 'border-green-500/50' : 'border-primary shadow-[0_0_40px_rgba(251,191,36,0.15)]'}`}>
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <BookOpen size={80} />
        </div>

        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 ${isLate ? 'text-red-500' : 'text-primary'}`}>
          {isLate ? 'LEITURA EM ATRASO' : `Dia ${currentDay} de ${plan.totalDays}`}
        </p>
        <h3 className={`text-3xl font-black uppercase italic mb-2 ${isLate ? 'text-red-400' : 'text-white'}`}>
          Leitura de Hoje
        </h3>

        {isLate && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm font-bold italic">
              Atenção: Você está {daysLate} dia{daysLate > 1 ? 's' : ''} atrasado no cronograma! Complete esta leitura para voltar ao ritmo e destravar as próximas missões.
            </p>
          </div>
        )}

        {todayPortion && (
          <div className="space-y-4 mb-8">
            {todayPortion.readings.map((r) => (
              <div key={r.bookId} className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-6 bg-zinc-950 p-6 rounded-3xl border-2 border-zinc-800 group-hover:border-primary/50 transition-all">
                  <div className="w-16 h-16 bg-black rounded-2xl border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
                    <BookOpen size={32} className="text-primary" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Missão de Leitura</p>
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase italic truncate">
                      {r.bookName} <span className="text-primary">
                        {r.chapters.length === 1
                          ? r.chapters[0]
                          : `${r.chapters[0]}–${r.chapters[r.chapters.length - 1]}`}
                      </span>
                    </h4>
                    <p className="text-zinc-500 text-xs font-bold italic mt-1">Contém {r.chapters.length} capítulo{r.chapters.length > 1 ? 's' : ''} para sua meditação.</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenReader(r.bookId, r.chapters[0]);
                    }}
                    className="w-full md:w-auto bg-primary text-black px-10 py-4 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3 relative z-20"
                  >
                    <Zap size={20} /> ABRIR BÍBLIA DIGITAL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recompensa */}
          <div className="flex items-center gap-3 mb-6 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Zap size={18} className="text-primary shrink-0" />
            <p className="text-primary font-black text-sm"><span>+{pointsPerDay} pts</span> ao confirmar • Bônus final: <span>+{bonusPoints} pts</span></p>
          </div>

        {/* Botão de confirmação */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3 py-2">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <p className="text-green-400 font-black uppercase italic tracking-wider">Leitura Confirmada! +{pointsPerDay} pts</p>
            </motion.div>
          ) : todayDone ? (
            <motion.div key="done" className="flex items-center justify-center gap-3 py-4">
              <CheckCircle2 size={24} className="text-green-400" />
              <p className="text-green-400 font-black uppercase italic">Porção de hoje concluída!</p>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              onClick={handleConfirm}
              disabled={isConfirming}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-primary text-black py-5 rounded-2xl font-black uppercase italic text-lg tracking-tighter shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:bg-white transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={24} />
              {isConfirming ? 'Registrando...' : `Confirmar Leitura de Hoje (+${pointsPerDay} pts)`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Histórico */}
      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl overflow-hidden">
        <button onClick={() => setShowHistory(h => !h)} className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/50 transition-all">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-primary" />
            <span className="font-black uppercase italic text-white">Histórico de Leituras</span>
          </div>
          <ChevronRight size={18} className={`text-zinc-500 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {Array.from({ length: Math.min(currentDay, plan.totalDays) }, (_, i) => i + 1).reverse().map(day => {
                  const done = userPlan.completedDays.includes(day);
                  const portion = ReadingPlanService.getDayPortion(plan, day);
                   return (
                    <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'}`}>
                      {done ? <CheckCircle2 size={16} className="text-green-400 shrink-0" /> : <Circle size={16} className="text-zinc-700 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-zinc-500">Dia {day}</p>
                        <p className={`text-xs font-bold truncate ${done ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          {portion ? ReadingPlanService.formatPortion(portion) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {portion && (
                          <button
                            onClick={() => onOpenReader(portion.readings[0].bookId, portion.readings[0].chapters[0])}
                            className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-primary hover:text-black transition-all active:scale-95"
                            title="Ler"
                          >
                            <BookOpen size={14} />
                          </button>
                        )}
                        {done && <span className="text-[9px] font-black text-green-500 uppercase shrink-0">+{pointsPerDay}pts</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recompensa Final */}
      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-6 flex items-center gap-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center border-4 border-primary/30 shrink-0 bg-primary/10">
          <Trophy size={28} className="text-primary" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Recompensa Final ao Concluir</p>
          <p className="text-white font-black uppercase italic text-xl">+{bonusPoints} pts <span className="text-primary">para sua Tribo!</span></p>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 3 }, (_, i) => <Star key={i} size={10} className="text-primary fill-current" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
