import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PartyPopper, Gift, Star, X } from 'lucide-react';

interface AnniversaryPopupProps {
  name: string;
  onClose: () => void;
}

export default function AnniversaryPopup({ name, onClose }: AnniversaryPopupProps) {
  useEffect(() => {
    // Disparo inicial de confete
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="relative max-w-lg w-full bg-zinc-900 border-4 border-pink-500 rounded-[3rem] p-12 text-center shadow-[0_0_100px_rgba(236,72,153,0.3)] overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-pink-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(236,72,153,0.5)]"
        >
          <PartyPopper size={48} className="text-white" />
        </motion.div>

        <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none mb-6">
          FELIZ <span className="text-pink-500">ANIVERSÁRIO</span>
        </h2>

        <p className="text-2xl font-bold text-white mb-4 italic">
          Parabéns, {name}! 🎂
        </p>

        <p className="text-zinc-400 font-medium text-lg mb-10 leading-relaxed">
          Hoje a Arena da Tribo está em festa por sua causa! Que seu novo ciclo seja repleto de vitórias, conquistas e muita presença digital.
        </p>

        <div className="bg-black/50 border-2 border-pink-500/30 rounded-3xl p-6 mb-10 relative overflow-hidden group">
          <div className="flex items-center justify-center gap-4">
            <Gift size={32} className="text-pink-500" />
            <div className="text-left">
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">PRESENTE DA TRIBO</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white">+100</span>
                <span className="text-sm font-black text-zinc-500 uppercase">XP DE BÔNUS</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter hover:bg-pink-500 hover:text-white transition-all shadow-xl active:scale-95"
        >
          RECEBER PRESENTE & CONTINUAR
        </button>

        <div className="mt-6 flex justify-center gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-pink-500 fill-pink-500" />)}
        </div>
      </motion.div>
    </div>
  );
}
