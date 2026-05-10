import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity } from 'lucide-react';

export interface TickerLog {
  id: string;
  points: number;
  created_at: string;
  groupName: string;
}

interface BattleTickerProps {
  logs: TickerLog[];
}

export default function BattleTicker({ logs }: BattleTickerProps) {
  if (!logs || logs.length === 0) return null;

  // Duplicate logs to create an infinite marquee effect
  const displayLogs = [...logs, ...logs, ...logs];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t-2 border-zinc-900 h-10 flex items-center overflow-hidden z-50">
      <div className="flex items-center gap-2 px-4 bg-primary text-black h-full font-black uppercase italic text-xs shrink-0 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)] relative">
        <Activity size={14} className="animate-pulse" />
        Live Feed
        <div className="absolute top-0 -right-4 w-4 h-full bg-primary skew-x-[-20deg]" />
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <motion.div 
          animate={{ x: [0, -1500] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap items-center px-8"
        >
          {displayLogs.map((log, i) => {
            const time = new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={`${log.id}-${i}`} className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 mr-12">
                <span className="text-zinc-600">[{time}]</span>
                <span className="text-white italic truncate max-w-[150px] md:max-w-none">{log.groupName}</span>
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded-sm">
                  <Zap size={10} fill="currentColor" />
                  +{log.points} XP
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
