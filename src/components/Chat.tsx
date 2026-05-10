import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from '../types';
import { useAuth } from '../context/useAuth';
import { Send, MessageCircle, Users, Trash2, Globe, Smile, Heart, Pencil, Check, X as XIcon, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Skeleton from './Skeleton';
import { Link } from 'react-router-dom';

interface ChatProps {
  groupId?: string;
}

const EMOJI_SET = [
  '🙏', '🔥', '🛡️', '📖', '🏅', '🚀', '🌟', '🙌', '🎯', '🤝', 
  '😂', '😍', '😎', '💪', '⚡', '🏆', '🌈', '🎉', '💡', '✅',
  '❤️', '✨', '👑', '🕊️', '🔔'
];

export default function Chat({ groupId: propGroupId }: ChatProps) {
  const { profile, user } = useAuth();
  const [chatMode, setChatMode] = useState<'group' | 'global'>('group');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeGroupId = chatMode === 'global' ? null : (propGroupId || profile?.groupId || 'leões');

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const groupId = activeGroupId;

    let mounted = true;
    const fetchMessages = async () => {
      if (mounted) setLoading(true);
      try {
        let query = supabase
          .from('messages')
          .select('*');
        
        if (groupId === null) {
          query = query.is('groupId', null);
        } else {
          query = query.eq('groupId', groupId);
        }
        
        const { data: messagesData, error: msgError } = await query
          .order('created_at', { ascending: true })
          .limit(100);

        if (msgError) throw msgError;
        if (!messagesData) return;

        // Buscar perfis dos remetentes de forma independente
        const senderIds = [...new Set(messagesData.map((m: any) => m.senderId))].filter(Boolean);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, avatarUrl')
          .in('id', senderIds);

        const profileMap = new Map();
        profilesData?.forEach(p => profileMap.set(p.id, p));

        // Mesclar dados
        const enrichedMessages = messagesData.map(m => ({
          ...m,
          profiles: profileMap.get(m.senderId)
        }));

        if (mounted) {
          setMessages(enrichedMessages as any);
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();

    // Inscrição em tempo real
    let channel: RealtimeChannel | null = null;
    
    if (groupId !== undefined) {
      channel = supabase
        .channel(`chat:${groupId || 'global'}:${Math.random()}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: groupId === null ? undefined : `groupId=eq.${groupId}` 
        }, async (payload) => {
          if (!mounted) return;
          const newMsg = payload.new as ChatMessage;

          // Filtro manual para o modo Global
          if (groupId === null && newMsg.groupId !== null) return;

          // Buscar perfil para a nova mensagem
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, avatarUrl')
            .eq('id', newMsg.senderId)
            .single();

          const enrichedMsg = {
            ...newMsg,
            profiles: profileData
          };

          setMessages(prev => {
            if (prev.some(m => m.id === enrichedMsg.id)) return prev;
            return [...prev, enrichedMsg as any];
          });
          
          setTimeout(() => {
            if (mounted) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
          filter: groupId === null ? undefined : `groupId=eq.${groupId}` 
        }, (payload) => {
          if (!mounted) return;
          const updatedMsg = payload.new as ChatMessage;
          
          // Filtro manual para o modo Global
          if (groupId === null && updatedMsg.groupId !== null) return;

          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'messages' 
        }, (payload) => {
          if (mounted) {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
        .subscribe();
    }

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeGroupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          senderId: user.id,
          senderName: profile.name,
          text: newMessage,
          groupId: activeGroupId
        }]);
      
      if (error) throw error;
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleLikeMessage = async (message: ChatMessage) => {
    if (!user) return;
    
    const currentLikes = message.likes || [];
    const isLiked = currentLikes.includes(user.id);
    
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== user.id)
      : [...currentLikes, user.id];

    try {
      const { error } = await supabase
        .from('messages')
        .update({ likes: newLikes })
        .eq('id', message.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error liking message:", error);
    }
  };

  const handleClearChat = async () => {
    if (profile?.role !== 'admin') return;
    setConfirmClear(false);
    try {
      let query = supabase.from('messages').delete();
      if (activeGroupId === null) {
        // Canal global: mensagens com groupId nulo
        query = query.is('groupId', null);
      } else {
        // Canal da tribo: usar o nome da coluna SEM aspas duplas literais no SDK
        query = (query as any).eq('groupId', activeGroupId);
      }
      
      const { error } = await query;
      if (error) throw error;
      
      setMessages([]);
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (profile?.role !== 'admin') return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ text: trimmed, edited: true })
        .eq('id', messageId);
      if (error) throw error;
      // Atualiza o estado local imediatamente (Optimistic UI)
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: trimmed, edited: true } : m));
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-black tracking-tight leading-none uppercase text-white italic">Bate-Papo</h2>
          <div className="text-primary font-black mt-2 italic uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="flex items-center justify-center w-4 h-4">
              {chatMode === 'global' ? <Globe key="globe-h" size={14} /> : <Users key="users-h" size={14} />}
            </span>
            <span>
              {chatMode === 'global' ? 'Mural Global' : `Mural da Tribo: ${(activeGroupId || '').toUpperCase()}`}
            </span>
          </div>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl border border-red-500/20 transition-all duration-300 font-black uppercase italic tracking-tighter text-xs shadow-lg"
          >
            <Trash2 size={14} />
            Limpar Mural
          </button>
        )}
      </header>

      {/* MODAL: CONFIRMAÇÃO DE LIMPEZA */}
      {confirmClear && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setConfirmClear(false)} />
          <div className="relative bg-zinc-950 border-4 border-red-600 rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Limpar Mural?</h3>
                <p className="text-zinc-400 text-sm mt-2 font-medium leading-relaxed">
                  Todas as mensagens do mural <strong className="text-white">{chatMode === 'global' ? 'Global' : 'da Tribo'}</strong> serão apagadas permanentemente.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-black uppercase text-xs hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs hover:bg-white hover:text-red-600 transition-all"
                >
                  Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-zinc-900 rounded-3xl border-4 border-primary overflow-hidden shadow-[0_20px_50px_rgba(251,191,36,0.1)]">
        {/* Chat Header com Seletor */}
        <div className="bg-primary/10 border-b-2 border-primary/20 p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg">
              {chatMode === 'global' ? <Globe key="globe-sm" size={20} /> : <MessageCircle key="msg-sm" size={20} />}
            </div>
            <div>
              <p className="text-white font-black uppercase italic tracking-tighter leading-none">
                {chatMode === 'global' ? 'Chat Geral' : 'Chat da Tribo'}
              </p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Conectado ao mural</p>
            </div>
          </div>

          <div className="flex bg-black/60 p-1 rounded-xl border border-zinc-800 shadow-inner">
             <button 
               onClick={() => setChatMode('group')}
               className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                 chatMode === 'group' 
                   ? 'bg-primary text-black shadow-lg scale-105' 
                   : 'text-zinc-500 hover:text-white'
               }`}
             >
               Minha Tribo
             </button>
             <button 
               onClick={() => setChatMode('global')}
               className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                 chatMode === 'global' 
                   ? 'bg-primary text-black shadow-lg scale-105' 
                   : 'text-zinc-500 hover:text-white'
               }`}
             >
               Global
             </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pt-10 px-6 pb-6 scroll-smooth custom-scrollbar relative">
          
          {loading ? (
            <div className="space-y-6 p-2">
              {/* Skeleton de mensagens alternando lado */}
              {[false, true, false, false, true].map((isRight, i) => (
                <div key={i} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} gap-2`}>
                  <Skeleton className={`h-3 ${isRight ? 'w-20' : 'w-24'}`} />
                  <Skeleton
                    className={`h-14 rounded-2xl ${isRight ? 'rounded-tr-none w-64' : 'rounded-tl-none w-52'}`}
                  />
                </div>
              ))}
            </div>
          ) : !loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4 opacity-50">
              <MessageCircle size={48} />
              <p className="font-black italic uppercase tracking-widest text-sm text-center">
                Nenhuma mensagem no mural {chatMode === 'global' ? 'Global' : 'da Tribo'} ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isSystem = msg.senderId === 'system';
                  const isMe = msg.senderId === user?.id;

                  if (isSystem) {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center my-6"
                      >
                         <div className="bg-linear-to-r from-yellow-500/20 via-yellow-500/40 to-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl px-6 py-3 shadow-[0_0_30px_rgba(251,191,36,0.2)] max-w-[90%] text-center">
                            <p className="text-yellow-500 font-black italic uppercase tracking-widest text-[10px] mb-1">Destaque da Gincana</p>
                            <p className="text-white font-bold text-xs italic leading-relaxed">{msg.text}</p>
                         </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start group`}
                    >
                      {/* AVATAR DO REMETENTE */}
                      {!isSystem && (
                        <Link to={`/dashboard/profile/${msg.senderId}`} className="shrink-0 mt-1 relative block group/avatar">
                          {msg.profiles?.role === 'leader' && (
                            <motion.div 
                              animate={{ 
                                y: [0, -3, 0],
                              }}
                              transition={{ 
                                duration: 3, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                              }}
                              className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            >
                              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full animate-pulse"></div>
                              <img 
                                src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif" 
                                alt="Coroa 3D" 
                                className="w-5 h-5 relative z-10 scale-125 object-contain"
                              />
                            </motion.div>
                          )}
                          <div className={`w-9 h-9 rounded-xl border-2 overflow-hidden shadow-lg transition-transform group-hover/avatar:scale-110 ${isMe ? 'border-primary' : 'border-zinc-700'} ${msg.profiles?.role === 'leader' ? 'border-primary shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''}`}>
                            <img 
                              src={msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} 
                              alt={msg.senderName} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                            />
                          </div>
                        </Link>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <div className={`flex items-center gap-1.5 ${isMe ? 'order-2' : ''}`}>
                          {msg.profiles?.role === 'leader' && (
                            <Crown size={10} className="text-primary drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" fill="currentColor" />
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            isMe ? 'text-zinc-500' : msg.profiles?.role === 'leader' ? 'text-primary' : 'text-zinc-400'
                          }`}>
                            {msg.senderName}
                            {msg.profiles?.role === 'leader' && <span className="ml-1 opacity-50 italic text-[7px] hidden sm:inline"> (Líder)</span>}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 ${isMe ? 'order-1' : 'order-3'}`}>
                          {/* Botão Editar: visivel para o proprio autor ou admin */}
                          {(isMe || profile?.role === 'admin') && editingId !== msg.id && msg.senderId !== 'system' && (
                            <button
                              onClick={() => startEdit(msg)}
                              className="hover:text-primary transition-colors p-1 rounded opacity-0 group-hover:opacity-100 hover:opacity-100"
                              title="Editar mensagem"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                          {profile?.role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="hover:text-red-500 transition-colors p-1 rounded opacity-30 hover:opacity-100"
                              title="Excluir mensagem"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                          <button
                            onClick={() => handleLikeMessage(msg)}
                            className={`flex items-center gap-1 transition-all duration-300 ${
                              msg.likes?.includes(user?.id || '') ? 'text-red-500 opacity-100' : 'text-zinc-500 opacity-30 hover:opacity-100'
                            }`}
                          >
                            <Heart size={10} className={msg.likes?.includes(user?.id || '') ? 'fill-current' : ''} />
                            {msg.likes && msg.likes.length > 0 && (
                              <span className="text-[8px] font-black">{msg.likes.length}</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Balão: modo edição OU modo visualização */}
                      {editingId === msg.id ? (
                        <div className={`max-w-[80%] w-full rounded-2xl shadow-xl ${
                          isMe ? 'bg-primary/20 border-2 border-primary rounded-tr-none' : 'bg-zinc-800 border-2 border-primary rounded-tl-none'
                        }`}>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditMessage(msg.id); }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            rows={2}
                            className="w-full bg-transparent px-5 pt-3 pb-1 text-white font-bold text-sm outline-none resize-none leading-relaxed"
                          />
                          <div className="flex items-center justify-end gap-2 px-3 pb-2">
                            <span className="text-[9px] text-zinc-500 font-bold mr-auto">Enter para salvar • Esc para cancelar</span>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:text-white transition-all">
                              <XIcon size={12} />
                            </button>
                            <button onClick={() => handleEditMessage(msg.id)} className="p-1.5 rounded-lg bg-primary text-black hover:bg-white transition-all">
                              <Check size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-xl relative group ${
                          isMe 
                            ? 'bg-primary text-black rounded-tr-none' 
                            : 'bg-zinc-800 text-white rounded-tl-none border-2 border-zinc-700'
                        }`}>
                          <p className="font-bold text-sm leading-relaxed wrap-break-word">{msg.text}</p>
                          <div className={`flex items-center gap-2 mt-1 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`text-[8px] opacity-40 font-bold ${
                              isMe ? 'text-black' : 'text-white'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(msg as any).edited && (
                              <span className={`text-[7px] font-bold opacity-50 italic ${
                                isMe ? 'text-black' : 'text-zinc-400'
                              }`}>editado</span>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area com Emoji Picker Estilo WhatsApp */}
        <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t-2 border-zinc-800/50 flex gap-4 relative">
          
          {/* Popover de Emojis */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-28 left-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 grid grid-cols-5 gap-2 max-w-[280px]"
              >
                <div className="absolute inset-0 bg-yellow-500/5 blur-xl rounded-full -z-10"></div>
                {EMOJI_SET.map(emoji => (
                  <button 
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                    }}
                    className="text-2xl hover:scale-125 transition-all p-2 duration-200"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={chatMode === 'global' ? "Fale com todos..." : "Fale com sua tribo..."}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-black border-4 border-zinc-800 focus:border-primary rounded-2xl px-6 py-4 pr-14 text-white font-bold outline-none transition-all placeholder:text-zinc-700 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 p-2 hover:scale-110 ${
                showEmojiPicker ? 'text-primary' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Smile size={24} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary text-black px-8 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shrink-0"
          >
            <span className="hidden md:inline">ENVIAR</span> <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
