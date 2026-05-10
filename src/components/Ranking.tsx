import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Shield, Zap, Sparkles, Filter, ChevronRight, Crown, X, Medal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Group } from '../types';
import Skeleton from './Skeleton';
import LevelTable from './LevelTable';
import RankingPodium from './RankingPodium';
import RankingCard from './RankingCard';
import BattleTicker, { TickerLog } from './BattleTicker';
import PointsTable from './PointsTable';

export default function Ranking() {
  const { revalidateCount } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'top'>('all');

  const [performanceData, setPerformanceData] = useState<Record<string, any[]>>({});
  const [recentUpdate, setRecentUpdate] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [tickerLogs, setTickerLogs] = useState<TickerLog[]>([]);

  useEffect(() => {
    const fetchRanking = async (updatedId?: string) => {
      try {
        // ⚡ Guard de TTL (60s): evita re-fetch desnecessário ao remontar o componente
        if (!updatedId) {
          const lastFetch = parseInt(sessionStorage.getItem('ranking_last_fetch') || '0');
          const hasRecentData = Date.now() - lastFetch < 60000;
          if (hasRecentData && groups.length > 0) return;
          setLoading(true);
        }
        // 1. Fetch Groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*, "totalPoints", "memberCount"');
        
        if (groupsError) throw groupsError;
        let finalGroups = (groupsData || []) as Group[];

        // Apply Time Filter
        if (filter === 'top') {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: monthLogs } = await supabase
            .from('point_logs')
            .select('"groupId", points')
            .gte('created_at', startOfMonth.toISOString());

          if (monthLogs) {
            finalGroups = finalGroups.map(g => {
              const monthTotal = monthLogs
                .filter(l => (l as any).groupId === g.id)
                .reduce((sum, l) => sum + (l as any).points, 0);
              return { ...g, totalPoints: monthTotal };
            });
          }
        }

        // Sort groups
        finalGroups.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        setGroups(finalGroups);

        if (updatedId) {
          setRecentUpdate(updatedId);
          setTimeout(() => setRecentUpdate(null), 3000);
        }

        // 2. Fetch Recent Performance (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: logsData, error: logsError } = await supabase
          .from('point_logs')
          .select('id, "groupId", points, created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (!logsError && logsData) {
          // 🚀 Otimização: Agrupar logs por dia e grupo primeiro para evitar loops aninhados pesados
          const logsByGroupAndDate: Record<string, Record<string, number>> = {};
          
          logsData.forEach((l: any) => {
            const dateStr = l.created_at?.split('T')[0];
            if (!dateStr || !l.groupId) return;
            
            if (!logsByGroupAndDate[l.groupId]) {
              logsByGroupAndDate[l.groupId] = {};
            }
            logsByGroupAndDate[l.groupId][dateStr] = (logsByGroupAndDate[l.groupId][dateStr] || 0) + (l.points || 0);
          });

          // Process Sparkline Data
          const perfMap: Record<string, any[]> = {};
          finalGroups.forEach(g => {
            const groupLogs = logsByGroupAndDate[g.id] || {};
            const days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              // Bug fix: toISOString() em UTC pode diferir da data local — usa sv locale
              const dateStr = d.toLocaleDateString('sv');
              return { name: dateStr, value: groupLogs[dateStr] || 0 };
            });
            perfMap[g.id] = days;
          });
          setPerformanceData(perfMap);

          // Process Ticker Logs
          const recentLogs = [...logsData]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15);
          
          const enrichedLogs: TickerLog[] = recentLogs.map((l: any) => {
            const g = finalGroups.find(gr => gr.id === l.groupId);
            return {
              id: l.id,
              points: l.points || 0,
              created_at: l.created_at,
              groupName: g?.name || 'Tribo Desconhecida'
            };
          });
          setTickerLogs(enrichedLogs);
        }
      } catch (err) {
        console.error("Error fetching ranking data:", err);
      } finally {
        setLoading(false);
        sessionStorage.setItem('ranking_last_fetch', Date.now().toString());
      }
    };

    fetchRanking();

    const channel = supabase
      .channel(`ranking_v4_${Math.random().toString(36).substring(2, 11)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups' }, (payload) => {
        try {
          // Realtime sempre busca sem cache (dado mudou de verdade)
          sessionStorage.removeItem('ranking_last_fetch');
          fetchRanking(payload.new.id);
        } catch (e) {
          console.error("Realtime update error:", e);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // ⚠️ revalidateCount REMOVIDO: causa re-fetch a cada navegação. Realtime cobre atualizações reais.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const totalXp = groups.reduce((acc, g) => acc + (g.totalPoints || 0), 0);
  const totalWarriors = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);

  const top3 = groups.slice(0, 3);
  const others = groups.slice(3);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 px-4 relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header Premium */}
      <header className="relative flex flex-col items-center text-center pt-8 pb-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.4)]">
            <Trophy size={42} className="text-black" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Live Feedback</span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Sync Ativo</span>
             </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none uppercase select-none">
            Hall da <span className="text-primary text-glow-primary">Elite</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-px w-12 bg-zinc-800" />
            <p className="text-zinc-500 font-black uppercase tracking-[0.4em] italic text-[10px] md:text-xs">
              Monitoramento Tático em Tempo Real
            </p>
            <div className="h-px w-12 bg-zinc-800" />
          </div>

          {/* Global Stats Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-8"
          >
            {loading && groups.length === 0 ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="h-16 w-32 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
               ))
            ) : (
              <>
                <div className="flex flex-col items-center py-3 px-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-md min-w-[140px] shadow-inner">
                   <div className="text-2xl md:text-3xl font-black italic text-primary">{totalXp.toLocaleString()}</div>
                   <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">XP Global Farmado</div>
                </div>
                <div className="flex flex-col items-center py-3 px-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-md min-w-[140px] shadow-inner">
                   <div className="text-2xl md:text-3xl font-black italic text-white">{totalWarriors.toLocaleString()}</div>
                   <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Guerreiros Ativos</div>
                </div>
                <div className="hidden sm:flex flex-col items-center py-3 px-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-md min-w-[140px] shadow-inner">
                   <div className="text-2xl md:text-3xl font-black italic text-white">{groups.length}</div>
                   <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Tribos em Combate</div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </header>

      {/* Podium Zone (Top 3) */}
      <section className="relative">
         <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex items-center gap-3">
              <Crown className="text-primary" size={24} />
              <h2 className="text-xl font-black uppercase italic text-white tracking-tight">Olimpo das Tribos</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                Geral
              </button>
              <button 
                onClick={() => setFilter('top')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === 'top' ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                Melhores do Mês
              </button>
            </div>
         </div>

         {loading && groups.length === 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-72">
             <Skeleton className="h-full rounded-[3rem]" />
             <Skeleton className="h-full rounded-[3rem]" />
             <Skeleton className="h-full rounded-[3rem]" />
           </div>
         ) : (
           <RankingPodium groups={groups} performanceData={performanceData} recentUpdate={recentUpdate} onLogoClick={setSelectedLogo} />
         )}
      </section>

      {/* Battle List & Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-3 mb-6 px-4">
            <Target className="text-zinc-500" size={20} />
            <h2 className="text-lg font-black uppercase italic text-zinc-500 tracking-tight">Frente de Batalha</h2>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>

          <div className="space-y-4">
            {others.length > 0 ? (
              others.map((group, index) => (
                <RankingCard 
                  key={group.id} 
                  group={group} 
                  rank={index + 4} 
                  index={index} 
                  history={performanceData[group.id]}
                  isUpdating={recentUpdate === group.id}
                  onLogoClick={setSelectedLogo}
                />
              ))
            ) : groups.length <= 3 && groups.length > 0 ? (
              <div className="relative group text-center py-24 bg-zinc-950/40 rounded-[3.5rem] border-2 border-dashed border-zinc-800/50 backdrop-blur-xl overflow-hidden">
                 <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-700">
                       <Medal size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-black uppercase italic text-zinc-500 tracking-tighter">O Olimpo está Completo</p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Todas as tribos ativas alcançaram o Top 3</p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-800">
                 <p className="text-zinc-600 font-black uppercase italic text-xl">Aguardando mobilização das tribos...</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 h-fit mb-24">
           {/* Level Hierarchy */}
           <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-zinc-900/80 border-4 border-zinc-800 rounded-[2.5rem] p-8"
           >
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <Shield className="text-primary" size={24} />
                  <h3 className="text-xl font-black uppercase italic text-white leading-none">Hierarquia da Arena</h3>
                </div>
                
                <LevelTable />

                <div className="mt-8 pt-8 border-t border-zinc-800">
                   <div 
                      onClick={() => setShowPointsModal(true)}
                      className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800 group hover:border-primary/50 transition-colors cursor-pointer"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-zinc-900 text-primary">
                            <Zap size={18} fill="currentColor" />
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase text-white">Como Pontuar?</p>
                            <p className="text-[10px] font-bold text-zinc-500">Veja as regras da guerra</p>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-700 group-hover:text-primary transition-colors" />
                   </div>
                </div>
              </div>
           </motion.div>

           {/* Global Stats Mock */}
           <div className="bg-linear-to-br from-zinc-900 to-black border-2 border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <Sparkles className="text-primary" size={18} />
                 <h4 className="text-sm font-black uppercase text-zinc-400">Status Global</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-3xl font-black italic text-white">{groups.reduce((acc, g) => acc + (g.totalPoints || 0), 0)}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">XP Total Gerada</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-3xl font-black italic text-white">{groups.length}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Tribos em Combate</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-12 flex flex-col xl:flex-row items-center justify-between gap-6 px-4 pt-10 pb-20 border-t border-zinc-900">
         <div className="flex flex-col md:flex-row items-center gap-3 text-zinc-600 text-center md:text-left">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
               Sincronizado com Supabase Realtime <br className="md:hidden" /> <span className="hidden md:inline">•</span> {new Date().toLocaleTimeString()}
            </span>
         </div>
         <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-right">
               <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest whitespace-nowrap">Temporada Atual</p>
               <p className="text-sm font-black text-white italic whitespace-nowrap">2026 • ARENA IDE</p>
            </div>
            <div className="h-px w-full sm:w-px sm:h-10 bg-zinc-800" />
            <div className="bg-primary/10 border border-primary/20 px-6 py-2 rounded-xl text-center whitespace-nowrap">
               <p className="text-[10px] font-black uppercase text-primary tracking-widest">Estado da Guerra</p>
               <p className="text-sm font-black text-white italic">EM ANDAMENTO</p>
            </div>
         </div>
      </footer>

      <BattleTicker logs={tickerLogs} />

      {/* Logo Viewer Modal */}
      <AnimatePresence>
        {selectedLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLogo(null)}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-2xl w-full aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedLogo(null)}
                className="absolute top-4 right-4 p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors z-50"
              >
                <X size={24} />
              </button>
              <img 
                src={selectedLogo} 
                alt="Tribo" 
                className="w-full h-full object-contain rounded-3xl drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points Rules Modal */}
      <AnimatePresence>
        {showPointsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pt-20 overflow-y-auto custom-scrollbar"
            onClick={() => setShowPointsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-2 md:p-6 shadow-2xl my-8 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPointsModal(false)}
                className="absolute top-4 right-4 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition-colors z-50"
              >
                <X size={20} />
              </button>
              
              <div className="max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
                 <PointsTable />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

