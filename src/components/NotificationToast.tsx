import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, ShoppingBag, Info, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Notification } from '../types';

import { useAudio } from '../context/AudioContext';

export default function NotificationToast() {
  const { user } = useAuth();
  const { playNotification } = useAudio();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`toast-notifications-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setActiveToast(newNotif);
        playNotification();
        
        // Auto-fechar após 6 segundos
        setTimeout(() => {
          setActiveToast(current => current?.id === newNotif.id ? null : current);
        }, 6000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_submit': return <Zap className="text-primary" />;
      case 'task_approved': return <Trophy className="text-green-500" />;
      case 'task_rejected': return <X className="text-red-500" />;
      case 'redemption': return <ShoppingBag className="text-blue-500" />;
      case 'achievement': return <Trophy className="text-yellow-500" />;
      case 'announcement': return <Zap className="text-primary" fill="currentColor" />;
      default: return <Info className="text-primary" />;
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-200 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="pointer-events-auto bg-black border-4 border-primary rounded-4xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group"
          >
            {/* Background animação */}
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
               <motion.div 
                 initial={{ width: '100%' }}
                 animate={{ width: 0 }}
                 transition={{ duration: 6, ease: "linear" }}
                 className="h-full bg-primary"
               />
            </div>

            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0 border-2 border-zinc-800 overflow-hidden">
               {activeToast.content.includes('[avatar:') ? (
                 <img 
                   src={activeToast.content.match(/\[avatar:(.+?)\]/)?.[1]} 
                   className="w-full h-full object-cover" 
                   alt="Avatar"
                 />
               ) : (
                 getIcon(activeToast.type)
               )}
            </div>

            <div className="flex-1 min-w-0">
               <h5 className="text-xs font-black uppercase italic text-primary leading-tight">{activeToast.title}</h5>
               <p className="text-[10px] text-white font-bold mt-1 line-clamp-2">
                 {activeToast.content.replace(/\[avatar:.+?\]/, '').trim()}
               </p>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-3 -mr-2 text-zinc-500 hover:text-white transition-colors relative z-20"
              aria-label="Fechar Notificação"
            >
               <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
