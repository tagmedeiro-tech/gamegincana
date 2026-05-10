import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement } from '../types';
import { ACHIEVEMENT_DEFINITIONS } from '../lib/AchievementService';
import Trophy3D from './Trophy3D';
import * as LucideIcons from 'lucide-react';
import { Medal, Lock, Info, X } from 'lucide-react';

interface AchievementListProps {
  achievements?: Achievement[];
  userBadges?: any[];
}

export default function AchievementList({ achievements = [], userBadges = [] }: AchievementListProps) {
  const [selectedTrophy, setSelectedTrophy] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mapear conquistas do sistema que o usuário JÁ GANHOU
  const unlockedSystemKeys = new Set(achievements.map(a => a.achievementKey));
  
  // 1. TROFÉUS DO SISTEMA (Catálogo Completo)
  const systemCatalog = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => {
    const userEarned = achievements.find(a => a.achievementKey === key);
    return {
      ...def,
      key,
      id: userEarned?.id || `locked_${key}`,
      date: userEarned?.created_at || null,
      type: 'system',
      unlocked: unlockedSystemKeys.has(key),
      howToConquer: def.howToConquer
    };
  });

  // 2. SELOS DA TRIBO (Apenas os que o usuário ganhou)
  const safeUserBadges = Array.isArray(userBadges) ? userBadges : [];
  const tribeBadges = safeUserBadges.map(ub => {
    const b = ub.badges || {};
    return {
      name: b.name || 'Selo Desconhecido',
      description: b.description || 'Honraria especial concedida pelo líder.',
      points: b.points || 0,
      icon: b.icon || 'Award',
      rarity: 'rare' as const,
      id: ub.id,
      date: ub.created_at,
      type: 'tribe',
      unlocked: true
    };
  });

  // Unificar e ordenar: Desbloqueados primeiro, depois por raridade
  const allRecognition = [...systemCatalog, ...tribeBadges].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });

  // Setores de Dificuldade
  const sectors = [
    {
      id: 'facil',
      title: 'SETOR VERDE: DESAFIOS BÁSICOS (FÁCIL)',
      colorClass: 'text-green-500',
      items: allRecognition.filter(a => a.rarity === 'common')
    },
    {
      id: 'medio',
      title: 'SETOR AZUL: GUERREIRO AVANÇADO (MÉDIO)',
      colorClass: 'text-blue-500',
      items: allRecognition.filter(a => a.rarity === 'rare')
    },
    {
      id: 'dificil',
      title: 'SETOR VERMELHO: LENDAS DA ARENA (DIFÍCIL)',
      colorClass: 'text-red-500',
      items: allRecognition.filter(a => a.rarity === 'epic' || a.rarity === 'legendary')
    }
  ];

  return (
    <div className="space-y-12">
      {sectors.map((sector, sIdx) => {
        if (sector.items.length === 0) return null;

        return (
          <div key={sector.id} className="space-y-6">
             {/* Header do Setor Premium */}
             <div className="relative pt-12 pb-6 px-4">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <div className={`w-full h-px bg-linear-to-r from-transparent via-${sector.colorClass.split('-')[1]}-500 to-transparent`} />
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                   <div className={`flex items-center gap-4 px-6 py-2 bg-zinc-900/80 backdrop-blur-md border-x-2 border-t-2 border-zinc-800 rounded-t-2xl shadow-2xl relative overflow-hidden group`}>
                      <div className={`absolute inset-0 bg-${sector.colorClass.split('-')[1]}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`} />
                      
                      {(() => {
                        const SectorIcon = sector.id === 'facil' ? LucideIcons.Zap : sector.id === 'medio' ? LucideIcons.Shield : LucideIcons.Crown;
                        return <SectorIcon size={16} className={sector.colorClass} />;
                      })()}
                      
                      <h3 className={`text-[10px] sm:text-xs font-black uppercase italic tracking-[0.2em] ${sector.colorClass} drop-shadow-sm`}>
                        {sector.title}
                      </h3>

                      {(() => {
                        const SectorIcon = sector.id === 'facil' ? LucideIcons.Zap : sector.id === 'medio' ? LucideIcons.Shield : LucideIcons.Crown;
                        return <SectorIcon size={16} className={sector.colorClass} />;
                      })()}
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="h-px w-8 sm:w-16 bg-zinc-800" />
                      <div className="px-4 py-1 bg-black/40 border border-zinc-800 rounded-full flex items-center gap-2">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Status do Setor:</span>
                        <span className={`text-[9px] font-black ${sector.colorClass}`}>
                          {sector.items.filter(i => i.unlocked).length}/{sector.items.length} COLETADOS
                        </span>
                      </div>
                      <div className="h-px w-8 sm:w-16 bg-zinc-800" />
                   </div>
                </div>

                {/* Glow de Fundo */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 blur-[80px] opacity-10 pointer-events-none rounded-full bg-${sector.colorClass.split('-')[1]}-500`} />
             </div>

             {/* Grid Metálico do Setor */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-1 pb-4">
               {sector.items.map((item, i) => {
                 const def = item!;
                 const isUnlocked = def.unlocked;
                 const Icon = (LucideIcons as any)[def.icon] || LucideIcons.Award;
                 const gradientId = `card-grad-${def.id}`;

                 return (
                   <motion.div
                     key={def.id}
                     initial={{ opacity: 0, scale: 0.9, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     transition={{ delay: (sIdx * 0.1) + (i * 0.02), type: 'spring', stiffness: 150 }}
                     onClick={() => setSelectedTrophy(def)}
                     className="relative cursor-pointer group"
                   >
                      {/* Definição do Gradiente Metálico para o Ícone da Placa */}
                      <svg width="0" height="0" className="absolute">
                        <defs>
                          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            {isUnlocked ? (
                              <>
                                <stop offset="0%" stopColor="#FDE68A" />
                                <stop offset="50%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#B45309" />
                              </>
                            ) : (
                              <>
                                <stop offset="0%" stopColor="#64748B" />
                                <stop offset="100%" stopColor="#334155" />
                              </>
                            )}
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* PLACA METÁLICA (Card) */}
                      <div 
                        className={`relative flex flex-col items-center pt-8 pb-3 px-2 w-full h-full min-h-[160px] sm:min-h-[180px] transition-all duration-500 ${
                          isUnlocked 
                            ? 'bg-zinc-950 border border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.15)] group-hover:border-yellow-400 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]' 
                            : 'bg-zinc-900/40 border border-zinc-800/50 grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 group-hover:border-zinc-700'
                        }`}
                        style={{ 
                          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' 
                        }}
                      >
                         {/* Relevo interno (Painel profundo) */}
                         <div 
                           className="absolute inset-[3px] bg-linear-to-b from-zinc-900 to-zinc-950 border-t border-l border-zinc-800/30 z-0 pointer-events-none"
                           style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                         />

                         {/* Detalhe Superior: O Cadeado / Notch */}
                         <div 
                           className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center z-20 ${
                             isUnlocked ? 'bg-yellow-500/20 border-b border-yellow-500 shadow-[0_2px_10px_rgba(234,179,8,0.4)] text-yellow-500' : 'bg-zinc-900 border-b border-zinc-700 text-zinc-600'
                           }`}
                           style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
                         >
                            {isUnlocked ? (
                              <Lock size={10} className="mb-1 opacity-80" />
                            ) : (
                              <Lock size={10} className="mb-1" />
                            )}
                         </div>

                         {/* CONTEÚDO DA PLACA */}
                         <div className="relative z-10 flex flex-col items-center justify-between w-full h-full">
                            
                            {/* Ícone Cunhado no Metal */}
                            <div className={`mt-2 mb-4 transition-transform duration-500 group-hover:scale-110 ${isUnlocked ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'}`}>
                              <Icon 
                                size={50} 
                                strokeWidth={1.5}
                                style={{ stroke: `url(#${gradientId})` }} 
                              />
                            </div>

                            {/* Textos */}
                            <div className="flex flex-col items-center w-full mt-auto space-y-3">
                               <h4 className={`text-center font-black uppercase tracking-wider text-[10px] sm:text-[11px] leading-tight px-1 line-clamp-2 ${
                                 isUnlocked ? 'text-zinc-200' : 'text-zinc-500'
                               }`}>
                                 {def.name}
                               </h4>

                               {/* Tag Inferior (Status) */}
                               <div className={`w-full py-1.5 border-t text-center ${
                                 isUnlocked ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-zinc-800 bg-zinc-900/50'
                               }`}>
                                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                                    isUnlocked ? 'text-yellow-500' : 'text-zinc-700'
                                  }`}>
                                    {isUnlocked ? 'Conquistado' : 'Bloqueado'}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 );
               })}
             </div>
          </div>
        );
      })}

      {/* MODAL DE DETALHES DO TROFÉU (Vitrine de Exposição com React Portal) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedTrophy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-zinc-950 p-6 sm:p-10 w-full max-w-sm sm:max-w-md relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center border border-zinc-800"
                style={{ 
                  clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' 
                }}
              >
                {/* Relevo Metálico Interno */}
                <div 
                  className="absolute inset-[4px] bg-linear-to-b from-zinc-900 to-zinc-950 border-t border-l border-zinc-800/50 z-0 pointer-events-none"
                  style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
                />

                {/* Botão Fechar - Estilo Angular */}
                <button 
                  onClick={() => setSelectedTrophy(null)}
                  className="absolute top-0 right-6 w-12 h-8 bg-zinc-900 border-b border-x border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-all flex items-center justify-center z-20 shadow-lg"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
                >
                  <X size={16} className="mb-1" />
                </button>

                <div className="flex flex-col items-center text-center relative z-10 w-full">
                  
                  {/* ÍCONE METÁLICO GIGANTE (Substitui a Esfera de Vidro) */}
                  <div className="h-32 sm:h-40 flex items-center justify-center mb-6 relative">
                     <svg width="0" height="0" className="absolute">
                       <defs>
                         <linearGradient id={`modal-grad-${selectedTrophy.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                           {selectedTrophy.unlocked ? (
                             <>
                               <stop offset="0%" stopColor="#FDE68A" />
                               <stop offset="50%" stopColor="#F59E0B" />
                               <stop offset="100%" stopColor="#B45309" />
                             </>
                           ) : (
                             <>
                               <stop offset="0%" stopColor="#64748B" />
                               <stop offset="100%" stopColor="#334155" />
                             </>
                           )}
                         </linearGradient>
                       </defs>
                     </svg>
                     
                     {/* Glow de Fundo e Ícone */}
                     {selectedTrophy.unlocked && (
                       <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-150 pointer-events-none" />
                     )}
                     
                     <div className={`relative z-10 transition-transform duration-500 hover:scale-110 ${selectedTrophy.unlocked ? 'drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]' : 'drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]'}`}>
                       {(() => {
                          const ModalIcon = (LucideIcons as any)[selectedTrophy.icon] || LucideIcons.Award;
                          return (
                            <ModalIcon 
                              size={100} 
                              strokeWidth={1.5}
                              style={{ stroke: `url(#modal-grad-${selectedTrophy.id})` }} 
                            />
                          );
                       })()}
                     </div>
                  </div>

                  {/* NOME E RARIDADE */}
                  <div className="space-y-3 mb-6">
                    <h3 className={`text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none px-2 ${
                      selectedTrophy.unlocked ? 'text-zinc-200' : 'text-zinc-600'
                    }`}>
                      {selectedTrophy.name}
                    </h3>
                    
                    <div className={`px-4 py-1.5 inline-flex items-center justify-center border-t border-x ${
                      selectedTrophy.unlocked ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`} style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)' }}>
                      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">
                        {selectedTrophy.rarity}
                      </span>
                    </div>
                  </div>

                  {/* CAIXA DE DESCRIÇÃO (Placa Embutida) */}
                  <div 
                    className="bg-zinc-950 p-5 sm:p-6 w-full mb-6 shadow-inner border-t border-l border-zinc-800/50"
                    style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                  >
                    <p className="text-zinc-400 font-bold text-xs sm:text-sm leading-relaxed">
                      {selectedTrophy.description}
                    </p>
                  </div>

                  {/* COMO CONQUISTAR (Instrução Educacional) */}
                  {!selectedTrophy.unlocked && selectedTrophy.howToConquer && (
                    <div 
                      className="bg-primary/5 p-4 w-full mb-6 border border-primary/20 flex items-start gap-3 text-left"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <Info size={18} className="text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Como Conquistar</span>
                        <p className="text-zinc-200 font-black text-xs uppercase italic tracking-tight">
                          {selectedTrophy.howToConquer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STATUS DA CONQUISTA E XP */}
                  <div className="w-full space-y-4">
                    {selectedTrophy.unlocked ? (
                      <div className="text-yellow-500 font-black uppercase flex flex-col items-center gap-1 bg-yellow-500/10 py-3 w-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                           style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Medal size={16} /> CONQUISTADO
                        </div>
                        <span className="text-[9px] text-yellow-500/70 tracking-widest">{new Date(selectedTrophy.date).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className="text-zinc-500 font-black uppercase flex flex-col items-center gap-1 bg-zinc-900/50 py-3 w-full border border-zinc-800/80 shadow-inner"
                           style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Lock size={14} /> BLOQUEADO
                        </div>
                        <span className="text-[8px] text-zinc-600 tracking-widest">PENDENTE NA GINCANA</span>
                      </div>
                    )}
                    
                    {/* XP Tag */}
                    <div className="inline-block mt-2">
                      <span className="text-primary font-black italic text-xl sm:text-3xl tracking-tighter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                        +{selectedTrophy.points} XP
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
