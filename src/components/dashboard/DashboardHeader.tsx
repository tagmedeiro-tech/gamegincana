import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Star, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import LevelIcon from '../LevelIcon';
import { Achievement } from '../../types';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  profile: any;
  lvl: {
    level: number;
    title: string;
    icon: string;
    color: string;
  };
  nextLvl: number | null;
  pct: number;
  pts: number;
  tribePrimary: string;
  theme: any;
  myGroup: any;
  achievements: Achievement[];
  weeklyXPData: {date: string, points: number}[];
}

const DashboardHeader = React.memo(({ 
  profile, 
  lvl, 
  nextLvl, 
  pct, 
  pts, 
  tribePrimary, 
  theme, 
  myGroup, 
  achievements,
  weeklyXPData
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  
  const { sparkPoints, maxXP } = useMemo(() => {
    const max = weeklyXPData.length > 0 ? Math.max(...weeklyXPData.map(d => d.points), 1) : 1;
    const points = weeklyXPData.length > 0 ? weeklyXPData.map((d, i) => {
      const x = (i / (weeklyXPData.length - 1 || 1)) * 60;
      const y = 20 - ((d.points / max) * 15);
      return `${x},${y}`;
    }).join(' ') : "0,20 60,20";
    
    return { sparkPoints: points, maxXP: max };
  }, [weeklyXPData]);

  return (
    <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 w-full animate-in fade-in slide-in-from-top-6 duration-1000 pt-2 px-4 relative z-10 overflow-visible">
      
      {/* BRANDING SECTION (RIGHT) - NOW AT TOP ON MOBILE */}
      <motion.div 
        whileHover={{ x: 5 }}
        className="flex items-center gap-6 text-right justify-end order-1 xl:order-2 mt-4 md:mt-0 relative"
      >
        <div className="flex flex-col items-end">
          <h2 className="text-3xl md:text-6xl font-black tracking-tighter leading-none uppercase text-white italic">
             <span>Arena </span><span style={{ color: tribePrimary }}>Ide</span>
          </h2>
          <div className="flex items-center justify-end gap-2 md:gap-3 mt-1 md:mt-2">
            <span className="hidden md:block h-px w-6 bg-zinc-800" />
            <p className="text-zinc-500 font-black uppercase tracking-widest md:tracking-[0.2em] text-[7px] md:text-[10px]">
              {theme.churchName} <span className="text-zinc-800 mx-1">•</span> Temporada {new Date().getFullYear()}
            </p>
          </div>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="w-20 h-20 md:w-24 md:h-24 bg-zinc-950 rounded-4xl flex items-center justify-center shadow-2xl border-4 relative z-10 cursor-pointer"
          style={{ borderColor: tribePrimary, boxShadow: `0 0 30px ${tribePrimary}20` }}
        >
          {myGroup?.logoUrl || theme.logoUrl ? (
            <img src={myGroup?.logoUrl || theme.logoUrl} alt="Logo" className="w-[80%] h-[80%] object-cover rounded-2xl" />
          ) : (
            <Shield size={32} style={{ color: tribePrimary }} />
          )}
          <div className="absolute -top-2 -right-2 bg-primary text-black p-1.5 rounded-lg shadow-lg rotate-12">
             <Trophy size={12} className="fill-current" />
          </div>
        </motion.div>
      </motion.div>

      {/* STATUS CARD (LEFT) - ULTRA PREMIUM GLASS */}
      <div className="relative group flex-1 xl:flex-none w-full order-2 xl:order-1">
        <div className="absolute -inset-1 bg-linear-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-[2.5rem] opacity-20 group-hover:opacity-40 transition-opacity blur-sm" />
        
        <div className="relative bg-zinc-950/80 backdrop-blur-2xl border-2 border-zinc-800/50 p-4 md:p-6 rounded-[2.4rem] shadow-3xl overflow-hidden transition-all duration-500 group-hover:border-zinc-700/50">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
            {/* AVATAR & BASIC INFO */}
            <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/dashboard/profile/${profile.id}`)}
                className="relative shrink-0 cursor-pointer group/avatar"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 p-1 rounded-[1.8rem] bg-zinc-900 border-2 border-zinc-800 shadow-2xl relative z-10 overflow-hidden transition-colors group-hover/avatar:border-primary">
                   <img 
                     src={profile?.avatar_url || profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'guerreiro'}`} 
                     alt={profile?.name} 
                     className="w-full h-full object-cover rounded-[1.2rem]" 
                   />
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 w-7 h-7 md:w-9 md:h-9 rounded-lg border-2 border-zinc-950 flex items-center justify-center shadow-lg z-20"
                  style={{ backgroundColor: lvl.color }}
                >
                  <LevelIcon name={lvl.icon} size={12} color="#000" />
                </div>
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Guerreiro</p>
                  <Sparkles size={8} className="text-primary" />
                </div>
                <h4 className="text-xl md:text-3xl font-black text-white uppercase italic leading-none tracking-tighter truncate">
                  {profile?.name}
                </h4>
                <div className="mt-2">
                  <p className="inline-block text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800" style={{ color: lvl.color }}>
                    {lvl.title} <span className="opacity-40">•</span> NV.{lvl.level}
                  </p>
                </div>
              </div>
            </div>

            {/* PROGRESS BAR SECTION */}
            <div className="w-full sm:flex-1 space-y-2">
              <div className="flex justify-between items-end px-1">
                 <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">XP Progress</span>
                 <span className="text-[9px] font-black italic text-zinc-500">
                    {pct}% <span className="text-zinc-700">→</span> <span style={{ color: lvl.color }}>NV.{nextLvl || 'MAX'}</span>
                 </span>
              </div>
              <div className="h-1.5 bg-zinc-900 rounded-full border border-zinc-800 p-px overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full rounded-full relative"
                  style={{ backgroundColor: lvl.color }}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-sweep" />
                </motion.div>
              </div>
            </div>

            {/* SCORE SECTION */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center px-4 sm:px-0 sm:pl-8 sm:border-l-2 sm:border-zinc-800/50 gap-2 cursor-default group/scorebox"
            >
              <div className="text-left sm:text-center transition-transform group-hover/scorebox:scale-105">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-0.5 leading-none">Score</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl md:text-5xl font-black text-white uppercase italic leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover/scorebox:text-primary transition-colors">
                    {pts}
                   </span>
                   <span className="text-primary font-black text-[10px] md:text-sm uppercase italic">PTS</span>
                </div>
              </div>

              <div className="relative group/spark transition-all group-hover/scorebox:opacity-100 opacity-60">
                <div className="flex items-center gap-1.5 mb-1 justify-end sm:justify-center opacity-40">
                  <TrendingUp size={8} className="text-zinc-500" />
                  <span className="text-[7px] font-black uppercase text-zinc-500 tracking-widest">Activity</span>
                </div>
                <svg width="60" height="20" className="overflow-visible drop-shadow-[0_0_5px_rgba(251,191,36,0.15)]">
                  <defs>
                    <linearGradient id="headerSparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={tribePrimary} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={tribePrimary} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={`0,20 ${sparkPoints} 60,20`} fill="url(#headerSparkGradient)" />
                  <polyline points={sparkPoints} fill="none" stroke={tribePrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
