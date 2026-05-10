import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, Star, TrendingUp, TrendingDown, Minus, Medal, Share2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import * as htmlToImage from 'html-to-image';
import { Group } from '../types';

interface RankingPodiumProps {
  groups: Group[];
  performanceData?: Record<string, any[]>;
  recentUpdate?: string | null;
  onLogoClick?: (url: string) => void;
}

export const RankingPodium: React.FC<RankingPodiumProps> = ({ groups, performanceData = {}, recentUpdate, onLogoClick }) => {
  const top3 = groups.slice(0, 3);
  if (top3.length === 0) return null;

  const getTrend = (groupId: string) => {
    const history = performanceData[groupId] || [];
    if (history.length < 2) return 'stable';
    const latest = history[history.length - 1].value;
    const previous = history[history.length - 2].value;
    return latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
  };

  return (
    <div className="flex md:grid md:grid-cols-3 gap-6 items-end mb-12 relative px-2 overflow-x-auto pb-6 md:pb-0 scrollbar-hide snap-x">
      {/* 2nd Place */}
      {top3[1] && (
        <PodiumCard 
          group={top3[1]} 
          rank={2} 
          trend={getTrend(top3[1].id)} 
          history={performanceData[top3[1].id]}
          isUpdating={recentUpdate === top3[1].id}
          className="min-w-[280px] md:min-w-0 order-2 md:order-1 h-[360px] md:h-[400px] snap-center" 
          delay={0.2}
          color="#94a3b8" 
          onLogoClick={onLogoClick}
        />
      )}

      {/* 1st Place */}
      {top3[0] && (
        <PodiumCard 
          group={top3[0]} 
          rank={1} 
          trend={getTrend(top3[0].id)} 
          history={performanceData[top3[0].id]}
          isUpdating={recentUpdate === top3[0].id}
          className="min-w-[300px] md:min-w-0 order-1 md:order-2 h-[420px] md:h-[480px] z-10 snap-center" 
          delay={0}
          isWinner
          color="#FBBF24" 
          onLogoClick={onLogoClick}
        />
      )}

      {/* 3rd Place */}
      {top3[2] && (
        <PodiumCard 
          group={top3[2]} 
          rank={3} 
          trend={getTrend(top3[2].id)} 
          history={performanceData[top3[2].id]}
          isUpdating={recentUpdate === top3[2].id}
          className="min-w-[260px] md:min-w-0 order-3 md:order-3 h-[320px] md:h-[360px] snap-center" 
          delay={0.4}
          color="#c2410c" 
          onLogoClick={onLogoClick}
        />
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = data.name ? new Date(data.name).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Dia Base';
    return (
      <div className="bg-zinc-900/90 border border-zinc-700 px-3 py-2 rounded-xl backdrop-blur-md shadow-2xl z-100">
        <p className="text-[10px] uppercase text-zinc-500 font-black mb-1 tracking-widest">{dateStr}</p>
        <p className="text-sm font-black italic" style={{ color: payload[0].stroke }}>+{data.value} XP</p>
      </div>
    );
  }
  return null;
};

interface PodiumCardProps {
  group: Group;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  className?: string;
  delay?: number;
  isWinner?: boolean;
  color: string;
  history?: any[];
  isUpdating?: boolean;
  onLogoClick?: (url: string) => void;
}

function PodiumCard({ group, rank, trend, className, delay = 0, isWinner, color, history = [], isUpdating, onLogoClick }: PodiumCardProps) {
  const latest = history.length > 0 ? history[history.length - 1].value : 0;
  const previous = history.length > 1 ? history[history.length - 2].value : 0;
  const isOnFire = history.length >= 3 && history.slice(-3).every((day: any) => day.value > 0);
  const isElite = (group.totalPoints || 0) >= 5000;
  const isAscension = history.length >= 2 && (latest - previous >= 50);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = document.getElementById(`podium-card-${group.id}`);
    if (!node) return;
    try {
      const dataUrl = await htmlToImage.toPng(node, { quality: 0.95, backgroundColor: '#09090b', style: { transform: 'scale(1)', margin: '0' } });
      const link = document.createElement('a');
      link.download = `Podio-${group.name.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  return (
    <motion.div
      id={`podium-card-${group.id}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isUpdating ? [1, 1.05, 1] : 1,
        borderColor: isUpdating ? color : isWinner ? '#FBBF24' : 'rgba(39, 39, 42, 1)'
      }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay,
        scale: { duration: 0.5, repeat: isUpdating ? Infinity : 0 }
      }}
      className={`relative group rounded-[3.5rem] border-4 flex flex-col items-center justify-end p-8 transition-all overflow-hidden bg-zinc-950/40 backdrop-blur-2xl ${className} ${
        isWinner ? 'border-primary shadow-[0_0_80px_rgba(251,191,36,0.15)]' : 'border-zinc-800'
      } ${isUpdating ? 'shadow-[0_0_50px_rgba(251,191,36,0.3)]' : ''}`}
    >
      {/* Update Glow */}
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-primary pointer-events-none"
        />
      )}
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }}
      />

      {/* Share Button Hover */}
      <button 
        onClick={handleShare}
        className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-zinc-500 hover:text-white hover:bg-primary/20 hover:scale-110 transition-all z-50 cursor-pointer opacity-0 group-hover:opacity-100"
        title="Exportar Imagem"
      >
        <Share2 size={16} />
      </button>

      {/* Inner Container: Centered Flex Column for balanced spacing */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 md:gap-4">
        
        {/* Top: Rank Indicator */}
        <div className="flex flex-col items-center">
           {isWinner ? (
             <motion.div
               animate={{ 
                 rotate: [0, 5, -5, 0], 
                 scale: [1, 1.15, 1],
                 filter: [
                   'drop-shadow(0 0 10px rgba(251,191,36,0.5))',
                   'drop-shadow(0 0 30px rgba(251,191,36,0.8))',
                   'drop-shadow(0 0 10px rgba(251,191,36,0.5))'
                 ]
               }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="text-primary mb-2"
             >
               <Crown size={isWinner ? 64 : 40} fill="currentColor" />
             </motion.div>
           ) : (
             <div className="p-2 md:p-3 rounded-2xl bg-zinc-800/80 border-2 border-zinc-700 text-zinc-400 mb-1 shadow-inner">
               <Trophy size={20} />
             </div>
           )}
           <div 
             className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none"
             style={{ color, textShadow: `0 0 20px ${color}40` }}
           >
             #{rank}
           </div>
        </div>

        {/* Middle: Sparkline & Logo */}
        <div className="w-full relative flex flex-col items-center justify-center min-h-[100px] mb-2">
          {/* Sparkline Background Effect */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 w-full opacity-40 pointer-events-none">
             <ResponsiveContainer width="100%" height={64}>
                <AreaChart data={history.length > 0 ? history : [{value: 10}, {value: 30}, {value: 20}, {value: 45}]}>
                   <defs>
                     <linearGradient id={`colorValue-${group.id}`} x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                       <stop offset="95%" stopColor={color} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                   <Area 
                     type="monotone" 
                     dataKey="value" 
                     stroke={color} 
                     strokeWidth={3} 
                     fillOpacity={1} 
                     fill={`url(#colorValue-${group.id})`}
                     isAnimationActive={false}
                   />
                </AreaChart>
             </ResponsiveContainer>
          </div>

          {/* Tribe Logo */}
          <div className="z-20">
            <div 
              onClick={() => {
                if (group.logoUrl && onLogoClick) onLogoClick(group.logoUrl);
              }}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black border-[3px] flex items-center justify-center overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] relative transition-transform ${group.logoUrl ? 'cursor-pointer hover:scale-105 hover:border-white' : ''}`}
              style={{ borderColor: color }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
              {group.logoUrl ? (
                <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full opacity-20"
                  style={{ backgroundColor: color }}
                />
              )}
              {!group.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white/50 uppercase italic">
                    {group.name.substring(0, 1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Info & Points */}
        <div className="w-full flex flex-col items-center">
          {/* Tribe Name */}
          <h3 
            className="text-lg md:text-2xl font-black uppercase italic text-white leading-none mb-3 line-clamp-2 px-1 w-full text-center tracking-tighter"
            style={{ textShadow: '0 0 30px rgba(255,255,255,0.2)' }}
          >
            {group.name}
          </h3>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 w-full">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              {trend === 'up' && <TrendingUp size={12} className="text-emerald-400" />}
              {trend === 'down' && <TrendingDown size={12} className="text-rose-400" />}
              {trend === 'stable' && <Minus size={12} className="text-zinc-500" />}
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Trend</span>
            </div>
            
            {/* Badges */}
            <div className="flex items-center gap-1">
              {isOnFire && <span title="On Fire" className="text-[14px] animate-pulse">🔥</span>}
              {isElite && <span title="Elite" className="text-[14px] animate-bounce">💎</span>}
              {isAscension && <span title="Ascensão" className="text-[14px] animate-pulse">🚀</span>}
            </div>
          </div>

          {/* Big Points */}
          <div className="bg-black/60 rounded-4xl p-4 md:p-6 border-2 border-white/5 hover:border-primary/40 transition-all w-full shadow-2xl relative overflow-hidden text-center group/points">
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover/points:opacity-100 transition-opacity" />
            <div 
              className="relative text-4xl md:text-6xl font-black italic text-white leading-none tracking-tighter"
              style={{ textShadow: `0 0 20px ${color}30` }}
            >
              {group.totalPoints}
            </div>
            <div className="relative text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mt-2">
              PONTOS ACUMULADOS
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Particle Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
        <motion.div 
          animate={{ x: [-100, 400] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-full w-24 blur-sm"
          style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }}
        />
      </div>
    </motion.div>
  );
};

export default RankingPodium;
