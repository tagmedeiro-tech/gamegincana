import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS } from '../lib/AchievementService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { FeedService } from '../lib/FeedService';
import { useToast } from '../context/ToastContext';
import { Share2, Loader2 } from 'lucide-react';

export default function AchievementCelebration() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [newAchievement, setNewAchievement] = useState<any | null>(null);
  const [show, setShow] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscrever a novas conquistas em tempo real
    const channel = supabase
      .channel(`achievements-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `userId=eq.${user.id}`
        },
        (payload) => {
          const def = ACHIEVEMENT_DEFINITIONS[payload.new.achievementKey];
          if (def) {
            setNewAchievement({ ...payload.new, ...def });
            setShow(true);
            // Auto-hide após 8 segundos
            setTimeout(() => setShow(false), 8000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `userId=eq.${user.id}`
        },
        async (payload) => {
          // Para badges personalizados, precisamos buscar a definição no banco
          const { data } = await supabase
            .from('badges')
            .select('*')
            .eq('id', payload.new.badgeId)
            .single();
          
          if (data) {
            setNewAchievement({
              name: data.name,
              description: data.description || 'Selo de mérito da tribo!',
              points: data.points,
              icon: data.icon,
              rarity: 'rare',
              isBadge: true
            });
            setShow(true);
            setTimeout(() => setShow(false), 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Reset do estado ao fechar
  useEffect(() => {
    if (!show) {
      setTimeout(() => {
        setShared(false);
        setSharing(false);
      }, 500);
    }
  }, [show]);

  const handleShare = async () => {
    if (!user || !newAchievement || sharing || shared) return;
    setSharing(true);
    try {
      const ok = await FeedService.createPost({
        authorId: user.id,
        groupId: profile?.groupId,
        postType: 'achievement',
        achievementKey: newAchievement.achievementKey,
        achievementLabel: newAchievement.name,
        achievementIcon: newAchievement.icon,
        caption: `Acabei de desbloquear: ${newAchievement.name}! 🏆🔥 #GincanaDaTribo`,
        visibility: 'public'
      });

      if (ok) {
        setShared(true);
        success("Mural Atualizado", "Sua conquista foi compartilhada com a tribo!");
      }
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível compartilhar no mural.");
    } finally {
      setSharing(false);
    }
  };

  if (!newAchievement) return null;

  const Icon = (LucideIcons as any)[newAchievement.icon] || LucideIcons.Award;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-100 pointer-events-none flex items-center justify-center p-4">
          {/* Backdrop Blur controlado */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
            onClick={() => setShow(false)}
          />

          {/* Partículas de Brilho */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  scale: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-2 h-2 bg-primary rounded-full blur-[2px]"
              />
            ))}
          </div>

          {/* Card Principal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            className="relative bg-zinc-950 border-4 border-primary/50 p-10 rounded-[50px] shadow-[0_0_100px_rgba(251,191,36,0.2)] max-w-sm w-full text-center pointer-events-auto"
          >
            {/* Efeito Radiante de Fundo */}
            <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent rounded-[46px] pointer-events-none" />

            <motion.div 
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="w-24 h-24 bg-linear-to-br from-primary to-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-8 border-4 border-white/20"
            >
              <Icon size={48} className="text-black" strokeWidth={3} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h5 className="text-primary font-black uppercase italic tracking-[0.2em] text-xs mb-2">Novo Desbloqueio!</h5>
              <h2 className="text-4xl font-black text-white uppercase italic leading-none tracking-tighter mb-4">
                {newAchievement.name}
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                <p className="text-zinc-400 font-bold text-sm leading-tight italic">
                  "{newAchievement.description}"
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="h-px w-8 bg-zinc-800" />
                <span className="text-amber-500 font-black italic text-xl">+{newAchievement.points} XP</span>
                <div className="h-px w-8 bg-zinc-800" />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleShare}
                  disabled={sharing || shared}
                  className={`w-full py-4 rounded-2xl font-black uppercase italic transition-all flex items-center justify-center gap-2 border-2 ${
                    shared 
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-default' 
                      : 'bg-primary border-primary text-black hover:scale-105 shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50'
                  }`}
                >
                  {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                  {shared ? 'Compartilhado no Mural' : 'Compartilhar no Mural'}
                </button>

                <button 
                  onClick={() => setShow(false)}
                  className="w-full bg-zinc-900 border-2 border-zinc-800 text-white py-4 rounded-2xl font-black uppercase italic hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Continuar Jornada
                </button>
              </div>
            </motion.div>

            {/* Selo de Raridade */}
            <div className="absolute -top-4 -right-4 bg-primary text-black font-black uppercase italic px-4 py-2 rounded-xl text-[10px] shadow-lg border-2 border-black rotate-12">
               {newAchievement.rarity || 'Troféu'}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
