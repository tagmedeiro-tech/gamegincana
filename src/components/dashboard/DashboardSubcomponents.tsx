/**
 * DashboardSubcomponents.tsx
 * Subcomponentes extraídos do Dashboard.tsx para reduzir o arquivo de 1350 linhas
 * e prevenir re-renders em cascata com React.memo.
 */
import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Zap, Star, Trophy, ChevronRight, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Activity, Achievement } from '../../types';
import { audio } from '../../lib/AudioEngine';
import AchievementList from '../AchievementList';
import PointHistory from '../PointHistory';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface RecentLog {
  id: string;
  points: number;
  reason: string;
  profiles?: { name: string } | { name: string }[] | null;
}

// ─── DUEL BANNER ─────────────────────────────────────────────────────────────

export const DuelBanner = memo(function DuelBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium group p-0! border-red-900/50! bg-red-950/10"
    >
      <div className="absolute inset-0 bg-linear-to-r from-red-950/20 via-transparent to-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full group-hover:bg-red-600/20 transition-all" />

      <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-black rounded-3xl border-2 border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] transition-colors duration-300">
            <Shield className="text-red-500 animate-pulse" size={40} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em]">Sistema de Elite</p>
            </div>
            <h3 className="text-4xl font-black uppercase italic text-white leading-none tracking-tighter">Arena de Duelos</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mt-2 italic tracking-widest">Batalha em Tempo Real por Território e Honra</p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <Link
            to="/dashboard/duel"
            className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-tighter border-b-4 border-red-800 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-colors duration-200 flex items-center gap-3 w-full justify-center md:w-auto shadow-xl shadow-red-900/40"
          >
            <Zap size={20} fill="currentColor" />
            <span>Desafiar Oponente</span> <ChevronRight size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-zinc-600">Recompensa Máxima:</span>
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">+100 XP + Honra</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── MISSIONS GRID ────────────────────────────────────────────────────────────

interface MissionsGridProps {
  activities: Activity[];
  recentLogs: RecentLog[];
  profileId?: string;
  achievements: Achievement[];
  userBadges: any[];
}

export const MissionsGrid = memo(function MissionsGrid({ activities, recentLogs, profileId, achievements, userBadges }: MissionsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* LEFT: Missions */}
      <div className="lg:col-span-3 space-y-8">
        {activities.length > 0 && (
          <div className="bg-primary text-black p-10 rounded-[3rem] relative overflow-hidden shadow-2xl group cursor-pointer hover:scale-[1.01] transition-colors duration-300">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={24} fill="currentColor" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">Missão Épica</p>
              </div>
              <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-tight mb-4">{activities[0].title}</h3>
              <p className="font-bold italic text-base mb-8 max-w-md text-black/70">{activities[0].description}</p>
              <Link
                to="/dashboard/activities"
                onClick={() => {
                  try {
                    audio.playCollect();
                  } catch (e) {}
                }}
                className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl font-black uppercase italic text-sm tracking-tighter hover:bg-zinc-900 transition-colors duration-200 shadow-xl"
              >
                <span>ACEITAR DESAFIO </span><ChevronRight size={18} />
              </Link>
            </div>
            <Trophy size={350} className="absolute -right-20 -bottom-20 text-black/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        )}

        <div className="bg-zinc-900 border-4 border-zinc-800 p-10 rounded-[3rem]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tight italic text-white flex items-center gap-4">
              <Star className="text-primary" fill="currentColor" /><span>Próximos Desafios</span>
            </h3>
            <Link to="/dashboard/activities" className="text-[10px] font-black uppercase text-zinc-600 hover:text-primary transition-colors duration-200">Ver todos</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.slice(1).map((activity) => {
              const daysLeft = activity.expiresAt
                ? Math.ceil((new Date(activity.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                : null;
              const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0;

              return (
                <div
                  key={activity.id}
                  className={`bg-black/40 p-6 rounded-3xl border-2 transition-colors duration-300 group relative overflow-hidden ${isUrgent ? 'border-red-500/50 hover:border-red-500' : 'border-zinc-800 hover:border-primary'}`}
                >
                  {isUrgent && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl z-10">
                      URGENTE - Falta {daysLeft} dia{daysLeft === 1 ? '' : 's'}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-black transition-colors">{activity.category}</span>
                    <span className={`font-black italic ${isUrgent ? 'text-red-500' : 'text-primary'}`}>+{activity.points}</span>
                  </div>
                  <h4 className="font-black text-white italic uppercase text-xl leading-tight mb-4 relative z-10">{activity.title}</h4>
                  <Link to="/dashboard/activities" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors relative z-10">
                    <span>SABER MAIS </span><ChevronRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Conquistas + Live Feed + Histórico */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[3rem]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight italic text-white flex items-center gap-3">
              <Award className="text-primary" /><span>Conquistas</span>
            </h3>
          </div>
          <div className="relative max-h-[450px] overflow-y-auto no-scrollbar -mx-2 px-2">
            <style dangerouslySetInnerHTML={{ __html: `
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            <AchievementList achievements={achievements} userBadges={userBadges} />
          </div>
        </div>

        <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[3rem]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight italic text-white flex items-center gap-3">
              <Zap className="text-primary" /><span>Live Feed</span>
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Ao Vivo</span>
            </div>
          </div>
          <div className="space-y-4">
            {recentLogs.map((log) => {
              const name = log.profiles && !Array.isArray(log.profiles) ? log.profiles.name : 'Alguém';
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-black/40 border-2 border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-black text-zinc-400">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-300">
                      <span className="text-white font-black italic">{name}</span> ganhou{' '}
                      <span className="text-primary font-black">+{log.points} XP</span>
                    </p>
                    <p className="text-[10px] font-black uppercase text-zinc-500 mt-1">{log.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[3rem]">
          <PointHistory userId={profileId} />
        </div>
      </div>
    </div>
  );
});
