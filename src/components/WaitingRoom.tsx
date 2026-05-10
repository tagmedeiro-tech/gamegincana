import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Shield, Zap, Flame, Crown, Clock, Star, Send, MessageCircle, Heart, X } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  startDate: string;
  status?: 'active' | 'pending' | 'waiting';
  onFinish?: () => void;
}

export default function WaitingRoom({ startDate, status, onFinish }: Props) {
  const theme = useAppTheme();
  const { profile, user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [isFinished, setIsFinished] = useState(false);
  
  // Hype Wall State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [groups, setGroups] = useState<{id: string, name: string, logoUrl?: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = new Date(startDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsFinished(true);
        if (onFinish) onFinish();
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, onFinish]);

  // Hype Wall Realtime & Presence
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .is('groupId', null) // Usa o canal Global para o Hype Wall
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setMessages(data.reverse());
    };

    const fetchGroups = async () => {
      const { data } = await supabase.from('groups').select('id, name, logoUrl');
      if (data) setGroups(data);
    };

    fetchMessages();
    fetchGroups();

    const channel = supabase.channel(`waiting_room_hype_${Math.random().toString(36).substring(2, 9)}`);

    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
        // Filtros SQL em tempo real falham com NULL, faremos o filtro manual abaixo
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        
        // Só adiciona se for uma mensagem global (groupId null)
        if (newMsg.groupId === null) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg].slice(-30);
          });
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          senderId: user.id,
          senderName: profile.name,
          text: newMessage,
          groupId: null // Enviando para o canal Global
        }]);
      
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error("Error sending hype message:", err);
    } finally {
      setSending(false);
    }
  };

  // Memorizar as faíscas para evitar que resetem a cada segundo (re-render do timer)
  const sparks = React.useMemo(() => [...Array(40)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    width: 1 + Math.random() * 2,
    height: 4 + Math.random() * 6,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 10,
    drift: Math.random() * 50 - 25
  })), []);

  if (isFinished && status !== 'pending') {
    return (
      <div className="fixed inset-0 z-200 bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"
            />
            <Trophy size={120} className="text-primary relative z-10 mx-auto" />
          </div>
          <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
            A ARENA ESTÁ <span className="text-primary block">ABERTA!</span>
          </h1>
          <button 
            onClick={() => window.location.reload()}
            className="px-12 py-5 rounded-full bg-primary text-black font-black uppercase italic tracking-widest text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(251,191,36,0.4)]"
          >
            ENTRAR NA GUERRA
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-200 bg-[#050505] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
      {/* Background FX: Faíscas Caindo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            initial={{ 
              opacity: 0, 
              y: -50,
            }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              y: ['0vh', '110vh'],
              x: [0, spark.drift] 
            }}
            transition={{ 
              duration: spark.duration, 
              repeat: Infinity,
              ease: "linear",
              delay: spark.delay
            }}
            className="absolute bg-primary shadow-[0_0_8px_rgba(251,191,36,0.8)] rounded-full"
            style={{
              left: spark.left,
              width: spark.width,
              height: spark.height,
            }}
          />
        ))}
        {/* Glow dinâmico no centro */}
        <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent opacity-30" />
      </div>

      {/* Main Content (Left/Center) */}
      <div className="flex-none lg:flex-1 flex flex-col items-center justify-center p-8 py-20 lg:py-8 relative z-10 min-h-[70vh] lg:min-h-0">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex p-4 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border-2 border-zinc-800 mb-6 shadow-2xl">
             <Zap size={32} className="text-primary fill-primary" />
          </div>
          <h2 className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Portal de Acesso</h2>
          <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter mt-2">
            {theme.appName}
          </h1>
        </motion.div>

        {/* Countdown */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {[
            { label: 'Dias', val: timeLeft.d },
            { label: 'Horas', val: timeLeft.h },
            { label: 'Min', val: timeLeft.m },
            { label: 'Seg', val: timeLeft.s }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 md:w-32 h-24 md:h-40 bg-zinc-950/80 backdrop-blur-xl border-4 border-zinc-900 rounded-4xl md:rounded-4xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-4xl md:text-7xl font-black italic text-white font-mono">{String(item.val).padStart(2, '0')}</span>
              </div>
              <span className="mt-4 text-zinc-500 font-black uppercase tracking-widest text-[10px]">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Versus Battle Card */}
        {groups.length >= 2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 w-full max-w-3xl px-4 relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8"
          >
            {/* Tribo 1 */}
            <div className="w-full md:flex-1 relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-zinc-900/40 backdrop-blur-md border-2 border-zinc-800 p-6 md:p-8 rounded-[3rem] text-center relative z-10 shadow-2xl overflow-hidden group-hover:border-primary/50 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="w-24 h-24 md:w-28 md:h-28 bg-black rounded-3xl border-4 border-primary flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(251,191,36,0.2)] overflow-hidden relative">
                   {groups[0].logoUrl ? (
                     <img src={groups[0].logoUrl} alt={groups[0].name} className="w-full h-full object-cover" />
                   ) : (
                     <Shield size={48} className="text-primary" />
                   )}
                   <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-transparent pointer-events-none" />
                </div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl md:text-3xl leading-none mb-2">{groups[0].name}</h3>
                <div className="inline-block px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                   <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Tribo Convocada</p>
                </div>
              </motion.div>
            </div>

            {/* VS Badge */}
            <div className="relative z-20 my-2 md:my-0">
              <motion.div 
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [12, 15, 12]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 md:w-24 md:h-24 bg-black border-4 border-primary rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.6)] z-10 relative"
              >
                <span className="text-3xl md:text-5xl font-black italic text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">VS</span>
              </motion.div>
              <div className="absolute inset-0 bg-primary blur-3xl opacity-30 animate-pulse" />
              
              {/* Decorative Lines (Hidden on mobile) */}
              <div className="absolute top-1/2 left-full w-20 h-[2px] bg-linear-to-r from-primary to-transparent hidden md:block" />
              <div className="absolute top-1/2 right-full w-20 h-[2px] bg-linear-to-l from-primary to-transparent hidden md:block" />
            </div>

            {/* Tribo 2 */}
            <div className="w-full md:flex-1 relative group">
              <div className="absolute -inset-4 bg-zinc-400/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-zinc-900/40 backdrop-blur-md border-2 border-zinc-800 p-6 md:p-8 rounded-[3rem] text-center relative z-10 shadow-2xl overflow-hidden group-hover:border-zinc-500 transition-all duration-500"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16 blur-2xl" />
                <div className="w-24 h-24 md:w-28 md:h-28 bg-black rounded-3xl border-4 border-zinc-700 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden relative">
                   {groups[1].logoUrl ? (
                     <img src={groups[1].logoUrl} alt={groups[1].name} className="w-full h-full object-cover" />
                   ) : (
                     <Crown size={48} className="text-zinc-600" />
                   )}
                   <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent pointer-events-none" />
                </div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl md:text-3xl leading-none mb-2">{groups[1].name}</h3>
                <div className="inline-block px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Preparada para a Luta</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Status Message */}
        <div className="mt-16 text-center space-y-4 max-w-lg mb-12">
          <div className="flex items-center justify-center gap-3 text-primary bg-primary/10 border border-primary/20 px-6 py-2 rounded-full mx-auto w-fit animate-pulse">
            <Clock size={16} />
            <span className="font-black uppercase italic tracking-widest text-xs">
              {status === 'pending' ? 'Aguardando Aprovação...' : 'Sincronizando Temporada...'}
            </span>
          </div>
          <p className="text-zinc-400 font-bold text-sm leading-relaxed">
            {status === 'pending' 
              ? 'Seu cadastro está em análise. Um administrador liberará seu acesso em breve!'
              : 'Guerreiros de todas as tribos estão se mobilizando. Prepare seu coração e sua Bíblia, a batalha está prestes a começar!'}
          </p>
        </div>

        {/* Bottom Bar Mobile Only */}
        <div className="lg:hidden flex items-center gap-3 text-zinc-500 mb-12">
           <Users size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Guerreiros Conectados: <span className="text-primary">{onlineCount}</span></span>
        </div>
      </div>

      {/* Hype Wall (Right Sidebar) */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-96 flex-none bg-zinc-950/50 backdrop-blur-3xl border-t-4 lg:border-t-0 lg:border-l-4 border-zinc-900 flex flex-col relative z-20 min-h-[500px] lg:min-h-0"
      >
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Flame size={18} className="text-primary" />
             </div>
             <h3 className="text-white font-black uppercase italic tracking-tighter">Mural de Hype</h3>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-emerald-500 uppercase">{onlineCount} Online</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4 opacity-50">
              <MessageCircle size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Comece o Hype!<br/>Mande uma mensagem</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">{msg.senderName}</span>
                   <span className="text-[8px] text-zinc-600 font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl rounded-tl-none">
                   <p className="text-xs font-bold text-zinc-300 leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={scrollRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-black/40 border-t border-zinc-900">
           <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mande seu Hype..."
                className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-primary rounded-xl px-4 py-3 pr-12 text-xs font-bold text-white outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
              >
                {sending ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
              </button>
           </form>
           <p className="mt-3 text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center">Prepare-se para a Batalha!</p>
        </div>
      </motion.div>
    </div>
  );
}
