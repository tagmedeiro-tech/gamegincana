import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Flame, Trophy, ChevronRight, Sparkles, Target, History, BookOpen } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { ACHIEVEMENT_DEFINITIONS } from '../lib/AchievementService';

const LOGIN_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
const DEVOTIONAL_MILESTONES = [7, 14, 30, 60];

const getStreakColor = (days: number) => {
  if (days >= 100) return 'from-purple-500 to-indigo-500 shadow-purple-500/50';
  if (days >= 60) return 'from-red-500 to-orange-500 shadow-red-500/50';
  if (days >= 30) return 'from-orange-500 to-yellow-500 shadow-orange-500/50';
  if (days >= 7) return 'from-yellow-400 to-primary shadow-primary/50';
  return 'from-zinc-400 to-white shadow-white/20';
};

const getNextMilestone = (current: number, milestones: number[]) => {
  return milestones.find(m => m > current) || milestones[milestones.length - 1];
};

export default function StreakWidget() {
  const { profile } = useAuth();

  if (!profile) return null;

  const streakLogin = (profile as any).streakLogin || 0;
  const streakDevotional = (profile as any).streakDevotional || 0;

  const nextLogin = getNextMilestone(streakLogin, LOGIN_MILESTONES);
  const nextDev = getNextMilestone(streakDevotional, DEVOTIONAL_MILESTONES);

  const loginPct = Math.min(100, (streakLogin / nextLogin) * 100);
  const devPct = Math.min(100, (streakDevotional / nextDev) * 100);

  const userAchievements = (profile as any).user_achievements || [];
  // Bug fix: trophy.icon é o NOME do componente Lucide (ex: 'Flame'), não um emoji
  // Mapeamos para emoji baseado na raridade do troféu
  const rarityEmoji: Record<string, string> = {
    legendary: '🏆', epic: '🛡️', rare: '🏅', common: '🎖️'
  };
  const streakTrophies = userAchievements
    .map((ua: any) => {
      const def = ACHIEVEMENT_DEFINITIONS[ua.achievementKey];
      if (!def) return null;
      const isStreakTrophy = def.name.includes('Ofensiva') || def.name.includes('Streak') ||
        def.name.includes('Chama') || def.name.includes('Fiel') ||
        def.name.includes('Discípulo') || def.name.includes('Guardião') || def.name.includes('Faísca');
      if (!isStreakTrophy) return null;
      return { ...def, emoji: rarityEmoji[def.rarity] || '🎖️' };
    })
    .filter(Boolean);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group rounded-4xl md:rounded-[3.5rem] p-[2px] md:p-[3px] overflow-hidden"
    >
      {/* Dynamic Border Gradient */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/50 via-orange-500/50 to-primary/50 animate-shimmer opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative bg-zinc-950/90 backdrop-blur-3xl rounded-[1.9rem] md:rounded-[3.4rem] p-5 md:p-10 space-y-8 md:space-y-10">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-0 right-0 w-64 md:w-80 h-64 md:h-80 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center border-2 border-zinc-800 shadow-2xl relative z-10">
                <Flame size={28} className="text-primary animate-bounce-slow" />
              </div>
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-primary" />
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">Status de Elite</p>
              </div>
              <h3 className="text-3xl md:text-5xl font-black italic text-white uppercase leading-none tracking-tighter">
                Ofensivas <span className="text-primary text-xl md:text-3xl align-top">🔥</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {streakTrophies.length > 0 && (
                <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-800 hover:border-primary/50 transition-all cursor-default">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Trophy size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Conquistas</p>
                    <p className="text-sm font-black text-white uppercase tracking-tighter leading-none">{streakTrophies.length} Troféus</p>
                  </div>
                </div>
             )}
             <div className="bg-zinc-900/50 px-5 py-3 rounded-2xl border border-zinc-800 flex items-center gap-3">
                <History size={16} className="text-zinc-500" />
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Resiliência</p>
                  <p className="text-sm font-black text-white uppercase tracking-tighter leading-none">100%</p>
                </div>
             </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Card 1: Presença (Login) */}
          <div className="relative group/card">
            <div className="absolute -inset-4 bg-primary/5 rounded-4xl blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
            
            <div className="relative space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Zap size={12} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Login Semanal</span>
                  </div>
                  <h4 className="text-2xl font-black italic text-zinc-200 uppercase tracking-tight">Presença Digital</h4>
                </div>
                <div className="text-right">
                  <div className="relative inline-block">
                    <motion.span 
                      key={streakLogin}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-5xl md:text-7xl font-black italic tracking-tighter leading-none bg-linear-to-b bg-clip-text text-transparent ${getStreakColor(streakLogin)}`}
                    >
                      {streakLogin}
                    </motion.span>
                    <div className="absolute -inset-4 bg-primary/5 blur-2xl opacity-30 pointer-events-none" />
                  </div>
                  <p className="text-[11px] font-black text-zinc-600 uppercase italic tracking-widest mt-1">Dias Seguidos</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <Target size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Próximo: {nextLogin} Dias</span>
                  </div>
                  <span className="text-xs font-black italic text-primary tracking-tighter">{Math.round(loginPct)}%</span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full border border-zinc-800 p-0.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${loginPct}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-linear-to-r from-primary to-yellow-300 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-sweep" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Devocional */}
          <div className="relative group/card">
            <div className="absolute -inset-4 bg-orange-500/5 rounded-4xl blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
            
            <div className="relative space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <BookOpen size={12} className="text-orange-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Leitura Bíblica</span>
                  </div>
                  <h4 className="text-2xl font-black italic text-zinc-200 uppercase tracking-tight">Fogo Devocional</h4>
                </div>
                <div className="text-right">
                  <div className="relative inline-block">
                    <motion.span 
                      key={streakDevotional}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-5xl md:text-7xl font-black italic tracking-tighter leading-none bg-linear-to-b bg-clip-text text-transparent ${getStreakColor(streakDevotional)}`}
                    >
                      {streakDevotional}
                    </motion.span>
                    <div className="absolute -inset-4 bg-orange-500/5 blur-2xl opacity-30 pointer-events-none" />
                  </div>
                  <p className="text-[11px] font-black text-zinc-600 uppercase italic tracking-widest mt-1">Dias Seguidos</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <Target size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Próximo: {nextDev} Dias</span>
                  </div>
                  <span className="text-xs font-black italic text-orange-500 tracking-tighter">{Math.round(devPct)}%</span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full border border-zinc-800 p-0.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${devPct}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-linear-to-r from-orange-600 to-red-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-sweep" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer: Troféus */}
        {streakTrophies.length > 0 && (
          <div className="pt-8 border-t border-zinc-800/50 flex flex-wrap gap-3 items-center justify-center lg:justify-start">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mr-2 flex items-center gap-2">
              <Trophy size={14} className="text-primary/40" /> Honrarias de Ofensiva:
            </span>
            <div className="flex flex-wrap gap-2">
              {streakTrophies.slice(0, 5).map((trophy: any, i: number) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-2 hover:border-primary/40 transition-all cursor-help group/trophy"
                  title={trophy.description}
                >
                  <span className="text-sm">{trophy.emoji}</span>
                  <span className="text-[10px] font-black uppercase text-zinc-300 group-hover/trophy:text-white transition-colors">{trophy.name}</span>
                </motion.div>
              ))}
              {streakTrophies.length > 5 && (
                <div className="px-3 py-2 bg-zinc-800/30 rounded-xl flex items-center">
                  <span className="text-[10px] font-black text-zinc-500">+{streakTrophies.length - 5}</span>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => window.location.hash = '#conquistas'}
              className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-white transition-colors tracking-widest"
            >
              Ver Tudo <ChevronRight size={14} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
