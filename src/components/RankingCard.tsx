import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Medal, Zap, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Group } from '../types';

interface RankingCardProps {
  group: Group;
  rank: number;
  index: number;
  history?: any[];
  isUpdating?: boolean;
  onLogoClick?: (url: string) => void;
}

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

export const RankingCard: React.FC<RankingCardProps> = ({ group, rank, index, history = [], isUpdating, onLogoClick }) => {
  // Determine trend based on history
  const latest = history.length > 0 ? history[history.length - 1].value : 0;
  const previous = history.length > 1 ? history[history.length - 2].value : 0;
  const trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';

  // Badges Logic
  const isOnFire = history.length >= 3 && history.slice(-3).every((day: any) => day.value > 0);
  const isElite = (group.totalPoints || 0) >= 5000;
  const isAscension = history.length >= 2 && (latest - previous >= 50);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = document.getElementById(`card-${group.id}`);
    if (!node) return;
    try {
      const dataUrl = await htmlToImage.toPng(node, { quality: 0.95, backgroundColor: '#09090b', style: { transform: 'scale(1)', margin: '0' } });
      const link = document.createElement('a');
      link.download = `Ranking-${group.name.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  return (
    <motion.div
      id={`card-${group.id}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isUpdating ? [1, 1.02, 1] : 1,
        borderColor: isUpdating ? '#FBBF24' : 'rgba(39, 39, 42, 0.5)'
      }}
      transition={{ 
        delay: index * 0.05,
        scale: { duration: 0.5, repeat: isUpdating ? Infinity : 0 }
      }}
      whileHover={{ scale: 1.01, x: 5 }}
      className={`group relative bg-zinc-900/40 backdrop-blur-md border-2 rounded-3xl p-4 md:p-6 transition-all flex items-center gap-4 md:gap-8 overflow-hidden ${
        isUpdating ? 'shadow-[0_0_30px_rgba(251,191,36,0.2)]' : 'border-zinc-800/50'
      }`}
    >
      {/* Update Pulse Indicator */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"
          />
        )}
      </AnimatePresence>
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Rank Number */}
      <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 shrink-0">
        <div className="absolute inset-0 bg-zinc-800 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform" />
        <span className="relative text-2xl md:text-3xl font-black italic text-zinc-500 group-hover:text-primary transition-colors">
          {rank}
        </span>
      </div>

      {/* Tribe Visual / Logo Placeholder */}
      <div 
        onClick={() => {
          if (group.logoUrl && onLogoClick) onLogoClick(group.logoUrl);
        }}
        className={`hidden sm:flex w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black border border-zinc-800 items-center justify-center shrink-0 overflow-hidden relative ${group.logoUrl ? 'cursor-pointer hover:border-white transition-colors hover:scale-105' : ''}`}
      >
        {group.logoUrl ? (
          <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div 
            className="w-full h-full opacity-20"
            style={{ backgroundColor: group.primaryColor || '#FBBF24' }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white/20 uppercase italic">
            {group.name.substring(0, 1)}
          </span>
        </div>
      </div>

      {/* Info Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg md:text-2xl font-black uppercase italic text-white leading-none truncate">
            {group.name}
          </h3>
          <div className="shrink-0 px-2 py-0.5 rounded-md bg-black/40 border border-zinc-800 flex items-center gap-1">
            {trend === 'up' && <TrendingUp size={10} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={10} className="text-rose-500" />}
            {trend === 'stable' && <Minus size={10} className="text-zinc-600" />}
          </div>
          
          {/* Badges */}
          <div className="hidden sm:flex items-center gap-1.5">
            {isOnFire && <span title="On Fire: Pontuando há 3 dias seguidos!" className="text-lg drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] cursor-help hover:scale-125 transition-transform">🔥</span>}
            {isElite && <span title="Elite Ouro: Mais de 5000 pontos!" className="text-lg drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] cursor-help hover:scale-125 transition-transform">💎</span>}
            {isAscension && <span title="Ascensão Rápida: Ganhou mais de 50 XP hoje!" className="text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] cursor-help hover:scale-125 transition-transform">🚀</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-black uppercase tracking-widest text-zinc-500">
            <Users size={14} className="text-zinc-600" />
            <span>{group.memberCount} <span className="hidden xs:inline">Membros</span></span>
          </div>
          <div className="h-1 w-1 rounded-full bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-black uppercase tracking-widest text-zinc-500">
            <Medal size={14} className="text-zinc-600" />
            <span>{group.leaderId ? 'Líder Ativo' : 'S/ Líder'}</span>
          </div>
        </div>
      </div>

      {/* Sparkline Performance (Desktop Only for cleanliness) */}
      <div className="hidden lg:block w-24 h-12 shrink-0">
         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.length > 0 ? history : [{value: 10}, {value: 30}, {value: 20}, {value: 45}]}>
               <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
               <Line 
                 type="monotone" 
                 dataKey="value" 
                 stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : '#FBBF24'} 
                 strokeWidth={3} 
                 dot={false} 
                 isAnimationActive={false}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>

      {/* Points Area */}
      <div className="text-right shrink-0 min-w-[80px]">
        <div className="flex items-center justify-end gap-2 text-primary mb-1">
          <Zap size={14} fill="currentColor" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">XP Arena</span>
        </div>
        <div className="text-3xl md:text-4xl font-black italic text-white leading-none group-hover:text-primary transition-colors">
          {group.totalPoints}
        </div>
      </div>

      {/* Action Hover / Export Button */}
      <button 
        onClick={handleShare}
        title="Exportar Cartão"
        className="hidden xl:flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all hover:bg-primary hover:text-black text-white z-10 cursor-pointer"
      >
        <Share2 size={18} fill="currentColor" />
      </button>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-size-[100%_2px,3px_100%]" />
    </motion.div>
  );
};

export default RankingCard;
