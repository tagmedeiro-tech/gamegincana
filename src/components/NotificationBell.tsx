import React, { useState, useEffect, useId } from 'react';
import { Bell, Check, Trash2, Clock, Zap, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const IMPORTANT_TYPES = ['task_submit', 'task_approved', 'task_rejected', 'redemption', 'announcement', 'login', 'achievement', 'duel_challenge'];

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'important' | 'system'>('important');
  const channelId = useId();

  // ... (fetch logic remains same)
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Housekeeping: Remove notificações com mais de 30 dias para o usuário atual
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setNotifications(prev => {
          // Mescla os dados do fetch com os que já podem ter chegado via Realtime
          const merged = [...data, ...prev];
          // Remove duplicatas por ID
          const unique = Array.from(new Map(merged.map(n => [n.id, n])).values());
          // Ordena por data e limita a 50
          return unique
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 50);
        });
      }
    };

    // Listener para fechar com ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.id}-${channelId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev].slice(0, 50);
        });
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, channelId]);

  const markAsRead = async (id: string) => {
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user?.id);
    if (error) {
      console.error('Error marking as read:', error);
      setNotifications(originalNotifications); // Rollback
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Marca como lida se ainda não estiver
    if (!n.read) {
      await markAsRead(n.id);
    }

    // 2. Fecha o painel
    setIsOpen(false);

    // 3. Determina o destino
    if (n.link) {
      navigate(n.link);
      return;
    }

    // Fallback baseado no tipo
    switch (n.type) {
      case 'task_submit':
        // Se for novo cadastro, leva para o Admin de Usuários filtrando por Pendentes
        navigate('/dashboard/admin/users', { state: { filter: 'pending' } });
        break;
      case 'login':
        profile?.role === 'admin' ? navigate('/dashboard/admin/users') : navigate('/dashboard/leader');
        break;
      case 'task_approved':
      case 'task_rejected':
      case 'achievement':
        navigate(`/dashboard/profile/${profile?.id}`);
        break;
      case 'redemption':
        profile?.role === 'admin' ? navigate('/dashboard/admin/store') : navigate(`/dashboard/profile/${profile?.id}`);
        break;
      case 'announcement':
        navigate('/dashboard');
        break;
      default:
        // Se for um tipo desconhecido, apenas fecha
        break;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const originalNotifications = [...notifications];
    const currentList = activeTab === 'important' 
      ? notifications.filter(n => IMPORTANT_TYPES.includes(n.type))
      : notifications.filter(n => !IMPORTANT_TYPES.includes(n.type));
    
    const ids = currentList.filter(n => !n.read).map(n => n.id);
    if (ids.length === 0) return;

    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids).eq('user_id', user.id);
    if (error) {
      console.error('Error marking all as read:', error);
      setNotifications(originalNotifications); // Rollback
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user?.id);
    if (error) console.error('Error deleting notification:', error);
  };

  const clearTab = async () => {
    if (!user) return;
    const currentList = activeTab === 'important' 
      ? notifications.filter(n => IMPORTANT_TYPES.includes(n.type))
      : notifications.filter(n => !IMPORTANT_TYPES.includes(n.type));
    
    const ids = currentList.map(n => n.id);
    if (ids.length === 0) return;

    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    const { error } = await supabase.from('notifications').delete().in('id', ids).eq('user_id', user.id);
    if (error) console.error('Error clearing tab:', error);
  };

  // Filtragem
  const importantNotifs = notifications.filter(n => IMPORTANT_TYPES.includes(n.type));
  const systemNotifs = notifications.filter(n => !IMPORTANT_TYPES.includes(n.type));
  
  const currentNotifs = activeTab === 'important' ? importantNotifs : systemNotifs;
  
  // O contador vermelho será sempre apenas das importantes para evitar flood
  const unreadImportant = importantNotifs.filter(n => !n.read).length;
  const unreadSystem = systemNotifs.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3.5 rounded-2xl transition-all active:scale-95 ${
          isOpen 
            ? 'bg-primary text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border-2 border-zinc-800'
        } ${unreadImportant > 0 && !isOpen ? 'border-primary/50 text-primary hover:text-primary' : ''}`}
      >
        <Bell size={20} className={isOpen ? 'fill-black' : ''} />
        {unreadImportant > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-[#09090b] animate-bounce shadow-lg shadow-red-500/20">
            {unreadImportant > 99 ? '99+' : unreadImportant}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-40 bg-black/60 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed left-4 right-4 top-24 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-4 w-auto sm:w-[400px] bg-[#0a0a0b] border border-zinc-800/80 rounded-4xl shadow-[0_40px_100px_-10px_rgba(0,0,0,0.9)] z-50 overflow-hidden flex flex-col max-h-[calc(100vh-7rem)] sm:max-h-[85vh]"
            >
              {/* Header com Abas */}
              <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 pt-3 px-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3">
                  <button 
                    onClick={() => setActiveTab('important')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 ${
                      activeTab === 'important' 
                        ? 'bg-primary text-black shadow-[0_0_20px_rgba(251,191,36,0.2)]' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    <Zap size={16} className={activeTab === 'important' ? 'fill-black' : ''} /> 
                    <span>Ouro</span>
                    {unreadImportant > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'important' ? 'bg-black text-primary' : 'bg-primary text-black'}`}>{unreadImportant}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('system')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 ${
                      activeTab === 'system' 
                        ? 'bg-zinc-800 text-white border border-zinc-700' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    <Activity size={16} /> 
                    <span>Radar</span>
                    {unreadSystem > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'system' ? 'bg-black text-white' : 'bg-zinc-800 text-white'}`}>{unreadSystem}</span>}
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 border-b border-zinc-800/50 bg-black/40 flex items-center justify-between sticky top-0 z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {activeTab === 'important' ? 'Ações Necessárias' : 'Feed do Sistema'}
                </h4>
                <div className="flex items-center gap-3">
                  {currentNotifs.filter(n => !n.read).length > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] font-black uppercase text-primary hover:text-white transition-colors flex items-center gap-1 active:scale-95">
                      <Check size={12} /> Lidas
                    </button>
                  )}
                  {currentNotifs.length > 0 && (
                    <button onClick={clearTab} className="text-[10px] font-black uppercase text-zinc-600 hover:text-red-500 transition-colors flex items-center gap-1 active:scale-95">
                      <Trash2 size={12} /> Apagar Tudo
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {currentNotifs.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
                      <Bell size={24} className="text-zinc-700" />
                    </div>
                    <div>
                      <p className="text-zinc-400 font-black italic text-sm uppercase">Nenhum aviso por aqui</p>
                      <p className="text-zinc-600 text-xs font-bold mt-1">Você está em dia com a tribo.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {currentNotifs.map((n) => {
                      const avatarMatch = n.content.match(/\[avatar:(.+?)\]/);
                      const avatarUrl = avatarMatch ? avatarMatch[1] : null;
                      const cleanContent = n.content.replace(/\[avatar:.+?\]/, '').trim();

                      return (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-5 group transition-all relative overflow-hidden border-b border-zinc-800/50 last:border-0 cursor-pointer ${n.read ? 'opacity-60 hover:bg-zinc-900/50' : 'bg-linear-to-r from-primary/5 to-transparent hover:bg-primary/10'}`}
                        >
                          {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>}
                          <div className="flex gap-4 pl-2">
                            {/* AVATAR DA NOTIFICAÇÃO */}
                            <div className="shrink-0 pt-1">
                              <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg ${n.read ? 'border-zinc-800' : 'border-primary/30 shadow-primary/10'}`}>
                                <img 
                                  src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.title}`} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 flex-1 min-w-0">
                              <p className={`text-[13px] font-black uppercase italic leading-tight truncate ${n.read ? 'text-zinc-400' : 'text-primary'}`}>{n.title}</p>
                              <p className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-3">{cleanContent}</p>
                              <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-zinc-600 uppercase">
                                <Clock size={12} />
                                <span>{new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                               {!n.read && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} 
                                   className="w-8 h-8 bg-primary text-black rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                 >
                                   <Check size={16} />
                                 </button>
                               )}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} 
                                 className="w-8 h-8 text-zinc-600 rounded-xl flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-colors"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
