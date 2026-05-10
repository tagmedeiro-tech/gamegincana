import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Lock, CheckCircle2, ChevronRight, ArrowUpRight, Star } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';
import LevelIcon from './LevelIcon';

export default function LevelTable() {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const userPoints = profile?.totalPoints || 0;
  const currentLevelRef = useRef<HTMLDivElement>(null);
  
  const levels = [...(theme.levels || [])].sort((a, b) => a.level - b.level); // Mostrar do menor pro maior (progressivo)

  useEffect(() => {
    // Scroll suave para o nível atual após um pequeno delay para a animação inicial
    const timer = setTimeout(() => {
      currentLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* ─── HEADER DESIGN ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-primary rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Jornada de Poder</span>
        </div>
        <h3 className="text-3xl font-black uppercase italic text-white leading-tight tracking-tighter">
          Caminho de <span className="text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">Evolução</span>
        </h3>
      </div>

      {/* ─── LISTA DE NÍVEIS ──────────────────────────────────────────────────────── */}
      <div className="space-y-6 max-h-[480px] md:max-h-[600px] overflow-y-auto px-6 -mx-6 pr-8 custom-scrollbar relative overflow-x-visible pb-12">
        {levels.map((lvl, index) => {
          const isCurrent = userPoints >= lvl.minPoints && (lvl.maxPoints === Infinity || userPoints < (lvl.maxPoints || Infinity));
          const isUnlocked = userPoints >= lvl.minPoints;
          const isNext = !isUnlocked && (index === 0 || userPoints >= (levels[index - 1]?.minPoints || 0));

          return (
            <motion.div
              key={lvl.level}
              ref={isCurrent ? currentLevelRef : null}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group overflow-visible"
            >
              {/* Linha Conectora Estilizada (Atrás dos badges) */}
              {index < levels.length - 1 && (
                <div className={`absolute left-12 top-16 bottom-[-24px] w-0.5 z-0 ${isUnlocked ? 'bg-primary/40' : 'bg-zinc-800'}`} />
              )}

              <div className={`
                relative z-10 transition-all duration-500 rounded-4xl border-2 overflow-hidden
                ${isCurrent 
                  ? 'bg-primary/10 border-primary shadow-[0_0_40px_rgba(251,191,36,0.15)]' 
                  : isUnlocked 
                  ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' 
                  : 'bg-zinc-900/30 border-zinc-900/50 opacity-60 grayscale-[0.5]'
                }
              `}>
                {/* Efeito de Brilho Interno para o Nível Atual */}
                {isCurrent && (
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent animate-pulse" />
                )}

                <div className="p-4 md:p-5 flex items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-1">
                    {/* Badge de Nível (Premium) */}
                    <div className="relative shrink-0 z-20">
                      <div 
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 shadow-lg relative`}
                        style={{ 
                          backgroundColor: isUnlocked ? '#111' : '#09090b', 
                          borderColor: isUnlocked ? lvl.color : '#222',
                          boxShadow: isUnlocked ? `0 0 20px ${lvl.color}20` : 'none'
                        }}
                      >
                        <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ backgroundColor: isUnlocked ? lvl.color : 'transparent' }} />
                        <div className="relative z-10 flex flex-col items-center">
                          <LevelIcon name={lvl.icon} size={20} color={isUnlocked ? lvl.color : '#444'} />
                          <span className={`text-[9px] md:text-[10px] font-black italic -mt-1 uppercase tracking-tighter ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                            LVL {lvl.level}
                          </span>
                        </div>
                      </div>
                      
                      {/* Check de Desbloqueado */}
                      {isUnlocked && !isCurrent && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-black rounded-full p-1 border-2 border-zinc-900">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className={`font-black uppercase italic text-sm md:text-lg tracking-tight transition-colors ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {lvl.title}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-primary text-black text-[7px] md:text-[8px] font-black uppercase rounded-full animate-bounce shrink-0">
                            ATUAL
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-black tracking-widest border transition-colors ${
                          isUnlocked ? 'bg-black/40 border-zinc-800 text-zinc-300' : 'bg-black/20 border-zinc-900/50 text-zinc-700'
                        }`}>
                          <Zap size={10} className={isUnlocked ? 'text-primary' : 'text-zinc-800'} fill="currentColor" />
                          <span>
                            {lvl.minPoints.toLocaleString()} 
                            {(!lvl.maxPoints || lvl.maxPoints === Infinity) ? ' +' : ` - ${lvl.maxPoints.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Status / Cadeado */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-primary">
                          <Star size={12} fill="currentColor" />
                        </div>
                      </div>
                    ) : isUnlocked ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800/50 flex items-center justify-center text-green-500/50">
                        <ChevronRight size={14} md={18} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-black/40 border border-zinc-800/50 flex items-center justify-center relative">
                        <Lock size={14} className="text-zinc-800" />
                        {isNext && (
                           <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de Progresso Interna (Se for o nível atual) */}
                {isCurrent && lvl.maxPoints && lvl.maxPoints !== Infinity && (
                  <div className="h-1 bg-black/40 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((userPoints - lvl.minPoints) / (lvl.maxPoints - lvl.minPoints)) * 100}%` }}
                      className="absolute inset-y-0 left-0 bg-linear-to-r from-primary/50 to-primary"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── FOOTER CARD (PREMIUM) ────────────────────────────────────────────────── */}
      <div className="mt-8 group relative overflow-hidden rounded-3xl bg-zinc-900 border-2 border-zinc-800 p-5 hover:border-primary/30 transition-all duration-500">
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
          <Trophy size={100} className="text-primary" />
        </div>
        
        <div className="relative z-10 flex gap-4 items-start">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary shrink-0">
            <Shield size={24} />
          </div>
          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase italic text-white flex items-center gap-2">
              Privilégios de Evolução
              <ArrowUpRight size={14} className="text-primary" />
            </h5>
            <p className="text-[10px] text-zinc-400 font-bold leading-relaxed tracking-wide">
              Mantenha sua jornada ativa! Cada novo marco desbloqueia <span className="text-primary">multiplicadores exclusivos</span>, acesso a itens raros na loja e maior prestígio no Mural da Tribo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


