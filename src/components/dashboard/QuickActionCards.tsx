import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BibleService } from '../../lib/BibleService';
import { ReadingPlanService } from '../../lib/ReadingPlanService';

interface QuickActionCardsProps {
  theme: any;
  hasReadToday: boolean;
  readingStreak: number;
  activeReadingPlan: any;
  navigate: any;
  isAdmin?: boolean;
}

const QuickActionCards = React.memo(({
  theme,
  hasReadToday,
  readingStreak,
  activeReadingPlan,
  navigate,
  isAdmin = false
}: QuickActionCardsProps) => {
  return (
    <div className="space-y-8">
      {/* DEVOCIONAL DIÁRIO (AUTOMATIZADO) */}
      {(isAdmin || theme.autoDevotional?.enabled) && (isAdmin || theme.showBible !== false) && (
        (() => {
          const { book, chapter } = BibleService.getDailyChapter({
            startDate: theme.autoDevotional.startDate,
            startBookId: theme.autoDevotional.startBookId,
            startChapter: theme.autoDevotional.startChapter,
            mode: theme.autoDevotional.mode
          });

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div 
                onClick={() => navigate(`/dashboard/bible?book=${book.id}&chapter=${chapter}`)}
                className={`card-premium group flex flex-col md:flex-row items-center gap-8 transition-all duration-500 overflow-hidden cursor-pointer ${
                  hasReadToday 
                    ? 'border-green-500/30! shadow-[0_0_40px_rgba(34,197,94,0.15)]' 
                    : 'hover:border-primary!'
                }`}
              >
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] transition-colors opacity-10 ${
                  hasReadToday ? 'bg-green-500' : 'bg-primary'
                }`}></div>
                
                <div className={`relative z-10 w-24 h-24 bg-black rounded-3xl border-2 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all ${
                  hasReadToday ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-primary shadow-[0_0_50px_rgba(251,191,36,0.2)]'
                }`}>
                   <BookOpen size={48} className={hasReadToday ? 'text-green-500' : 'text-primary'} />
                </div>

                <div className="relative z-10 flex-1 text-center md:text-left">
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                      <span className={`badge-premium ${hasReadToday ? 'text-green-500! border-green-500/20!' : 'text-primary! border-primary/20!'}`}>
                        {hasReadToday ? 'CONCLUÍDO' : 'DEVOCIONAL DIÁRIO'}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Leitura do Dia</span>
                      {readingStreak > 0 && (
                        <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full">
                          <span className="text-[10px]">🔥</span>
                          <span className="text-[9px] font-black text-orange-500 uppercase">{readingStreak} {readingStreak === 1 ? 'Dia' : 'Dias'}</span>
                        </div>
                      )}
                   </div>
                   <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                      <span>{book.name} </span><span className={`italic ${hasReadToday ? 'text-green-500' : 'text-primary'}`}>{chapter}</span>
                   </h3>
                   <p className="text-zinc-400 font-bold italic text-sm md:text-lg">
                     {hasReadToday 
                       ? <span>"XP garantido! O Ciclo Bíblico TRIBO avança amanhã."</span> 
                       : <span>"O Ciclo Bíblico TRIBO avança automaticamente."</span>}
                   </p>
                </div>

                <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
                   <div className="bg-black/50 border-2 border-zinc-800 px-6 py-3 rounded-2xl text-center">
                      <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">RECOMPENSA</p>
                      <p className={`text-2xl font-black italic leading-none ${hasReadToday ? 'text-zinc-500 line-through' : 'text-primary'}`}>
                        +{theme.autoDevotional?.points} XP
                      </p>
                   </div>
                   <div className={`flex items-center gap-2 font-black uppercase italic text-xs tracking-tighter transition-colors ${
                     hasReadToday ? 'text-green-500' : 'text-white group-hover:text-primary'
                   }`}>
                      <span>{hasReadToday ? 'LER NOVAMENTE' : 'LER AGORA'} </span><ChevronRight size={18} />
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })()
      )}

      {/* 📚 PLANO DE LEITURA ATIVO */}
      {activeReadingPlan && (isAdmin || theme.showReadingPlans !== false) && (() => {
        const plan = ReadingPlanService.getPlanById(activeReadingPlan.planId);
        if (!plan) return null;
        
        const currentDay = activeReadingPlan.completedDays.length >= plan.totalDays 
          ? plan.totalDays 
          : activeReadingPlan.completedDays.length + 1;
        const expectedDay = Math.min(ReadingPlanService.getCurrentDay(activeReadingPlan.startedAt), plan.totalDays);
        const daysLate = expectedDay - currentDay;
        const isLate = daysLate > 0 && !activeReadingPlan.completedDays.includes(currentDay);
        const todayPortion = ReadingPlanService.getDayPortion(plan, currentDay);
        const todayDone = activeReadingPlan.completedDays.includes(currentDay);
        const pct = ReadingPlanService.getProgressPercent(activeReadingPlan.completedDays.length, plan.totalDays);
        
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative group"
          >
            <div 
              onClick={() => navigate("/dashboard/reading-plans")}
              className={`card-premium group flex flex-col md:flex-row items-center gap-8 transition-all duration-500 overflow-hidden cursor-pointer ${
                todayDone 
                  ? 'border-green-500/30! shadow-[0_0_40px_rgba(34,197,94,0.15)]' 
                  : isLate
                    ? 'border-red-500/50! shadow-[0_0_40px_rgba(239,68,68,0.2)]'
                    : 'hover:border-primary!'
              }`}
            >
              <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] transition-colors opacity-10 ${
                todayDone ? 'bg-green-500' : isLate ? 'bg-red-500' : ''
              }`} style={(!todayDone && !isLate) ? { backgroundColor: plan.color } : undefined}></div>
              
              <div 
                className={`relative z-10 w-24 h-24 bg-black rounded-3xl border-2 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all ${
                  todayDone ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'shadow-[0_0_50px_rgba(251,191,36,0.1)]'
                }`}
                style={{ borderColor: !todayDone ? plan.color : undefined }}
              >
                 <span className="text-4xl">{plan.icon}</span>
              </div>

              <div className="relative z-10 flex-1 text-center md:text-left">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                    <span className={`badge-premium ${todayDone ? 'text-green-500! border-green-500/20!' : isLate ? 'text-red-500! border-red-500/20!' : ''}`} style={(!todayDone && !isLate) ? { color: plan.color, borderColor: `${plan.color}33` } : undefined}>
                      {todayDone ? 'DIA CONCLUÍDO' : isLate ? 'LEITURA ATRASADA' : `PLANO: ${plan.name.toUpperCase()}`}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Dia {currentDay} de {plan.totalDays}</span>
                    <div className="bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-700">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">{pct}% COMPLETO</span>
                    </div>
                 </div>
                 <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                    {todayPortion ? ReadingPlanService.formatPortion(todayPortion) : 'Leitura de Hoje'}
                 </h3>
                 <p className="text-zinc-400 font-bold italic text-sm md:text-lg mb-4">
                   {todayDone 
                     ? <span>"Meta cumprida! Mantenha a constância na Palavra."</span> 
                     : isLate
                       ? <span className="text-red-400">"Você está {daysLate} dia{daysLate > 1 ? 's' : ''} atrasado! Recupere sua leitura agora."</span>
                       : <span>"Sua porção diária está pronta. Ganhe +{plan.pointsPerDay} XP."</span>}
                 </p>
                 
                 <div className="w-full max-w-[200px] h-1.5 bg-black/40 rounded-full overflow-hidden border border-zinc-800/50 hidden md:block">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${pct}%` }}
                     className="h-full rounded-full"
                     style={{ backgroundColor: plan.color }}
                   />
                 </div>
              </div>

              <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
                 {!todayDone && todayPortion && (
                   <Link 
                     to={`/dashboard/reading-plans?reader=true&book=${todayPortion.readings[0].bookId}&chapter=${todayPortion.readings[0].chapters[0]}`}
                     onClick={(e) => e.stopPropagation()}
                     className="btn-primary px-8 py-3 rounded-xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 group/btn"
                   >
                     <span>LER AGORA</span>
                     <BookOpen size={18} className="group-hover/btn:rotate-12 transition-transform" />
                   </Link>
                 )}
                 
                 <div className="bg-black/50 border-2 border-zinc-800 px-6 py-3 rounded-2xl text-center">
                    <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">RECOMPENSA</p>
                    <p className={`text-2xl font-black italic leading-none ${todayDone ? 'text-zinc-500 line-through' : 'text-primary'}`}>
                      +{plan.pointsPerDay} XP
                    </p>
                 </div>
                 <div className={`flex items-center gap-2 font-black uppercase italic text-xs tracking-tighter transition-colors ${
                   todayDone ? 'text-green-500' : 'text-white group-hover:text-primary'
                 }`}>
                    <span>{todayDone ? 'VER HISTÓRICO' : 'ABRIR PLANO'} </span><ChevronRight size={18} />
                 </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
});

QuickActionCards.displayName = 'QuickActionCards';

export default QuickActionCards;
