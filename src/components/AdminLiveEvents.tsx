/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Group, Activity } from '../types';
import { Search, Trophy, Zap, Users, Star, CheckCircle, AlertCircle, Megaphone, Send, Loader2, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../lib/NotificationService';
import { useToast } from '../context/ToastContext';

export default function AdminLiveEvents() {
  const { success, error: toastError, info } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [customPoints, setCustomPoints] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupPoints, setGroupPoints] = useState<string>('');
  
  // Custom Date/Time
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getLocalTimeString = () => new Date().toTimeString().slice(0, 5);
  
  const [customDate, setCustomDate] = useState<string>(getLocalDateString());
  const [customTime, setCustomTime] = useState<string>(getLocalTimeString());
  const [groupReason, setGroupReason] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    try {
      const { data } = await supabase
        .from('point_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, groupsRes, activitiesRes] = await Promise.all([
          supabase.from('profiles').select('*').order('name'),
          supabase.from('groups').select('*').order('name'),
          supabase.from('activities').select('*').order('title')
        ]);

        if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
        if (groupsRes.data) setGroups(groupsRes.data as Group[]);
        if (activitiesRes.data) {
          const acts = activitiesRes.data as Activity[];
          setActivities(acts);
          // Pré-selecionar atividade de culto se existir
          const cultAct = acts.find(a => a.title.toLowerCase().includes('culto') || a.category === 'EVENTO');
          if (cultAct) {
            setSelectedActivityId(cultAct.id);
            setCustomPoints(cultAct.points.toString());
            setCustomReason(cultAct.title);
          }
        }
        await fetchLogs();
      } catch (err) {
        console.error("Error fetching live data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [isFocused, setIsFocused] = useState(false);

  const normalizeText = (text: string | null | undefined) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  useEffect(() => {
    // Se o campo estiver vazio, mostramos os primeiros 50 usuários
    if (!searchTerm.trim()) {
      setFilteredUsers(users.slice(0, 50));
    } else {
      const term = normalizeText(searchTerm);
      const filtered = users.filter(u => 
        normalizeText(u.name).includes(term) || 
        normalizeText(u.email).includes(term)
      );
      setFilteredUsers(filtered.slice(0, 50));
    }
  }, [searchTerm, users]);

  const handleAwardPoints = async (userId: string, groupId: string | undefined, points: number, reason: string) => {
    if (!groupId) {
      info("Sem Tribo", "Este membro não possui um grupo vinculado!");
      return;
    }
    setProcessing(true);
    try {
      let finalReason = reason;
      if (customDate && customTime) {
        const [, month, day] = customDate.split('-'); // Format is YYYY-MM-DD
        const timestamp = `[${day}/${month} ${customTime}]`;
        finalReason = `${timestamp} ${reason}`;
      } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const timestamp = `[${dateStr} ${timeStr}]`;
        finalReason = `${timestamp} ${reason}`;
      }

      // 1. Registrar via RPC (Pontos para Membro + Grupo)
      const { error: rpcError } = await supabase.rpc('increment_points', {
        user_id: userId,
        group_id: groupId,
        pts: points,
        reason: finalReason
      });

      if (rpcError) throw rpcError;

      // 2. Registrar participação (Dinamica de atividades)
      if (selectedActivityId) {
        await supabase.from('participations').insert({
          userId: userId,
          groupId: groupId,
          activityId: selectedActivityId,
          status: 'approved',
          pointsEarned: points,
          proofUrl: 'Registrado via Painel de Culto Live'
        });
      }

      success("Vitória Registrada!", `+${points} pontos para ${users.find(u => u.id === userId)?.name}`);
      setSearchTerm('');
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível registrar os pontos.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGroupOnlyPoints = async (groupId: string, points: number, reason: string) => {
    setProcessing(true);
    try {
      let finalReason = reason;
      if (customDate && customTime) {
        const [, month, day] = customDate.split('-');
        const timestamp = `[${day}/${month} ${customTime}]`;
        finalReason = `${timestamp} ${reason}`;
      } else {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const timestamp = `[${dateStr} ${timeStr}]`;
        finalReason = `${timestamp} ${reason}`;
      }

      // Registrar pontos apenas para o grupo
      const { error } = await supabase
        .from('groups')
        .update({ totalPoints: groups.find(g => g.id === groupId)!.totalPoints + points })
        .eq('id', groupId);

      if (error) throw error;

      // Logar a transação
      await supabase.from('point_logs').insert({
        '"groupId"': groupId,
        points: points,
        reason: finalReason
      });

      success("Bônus de Grupo", `+${points} pontos para ${groups.find(g => g.id === groupId)?.name}`);
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível registrar os pontos para o grupo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementMsg.trim()) return;
    setProcessing(true);
    try {
      await NotificationService.notifyAll(
        'announcement',
        '📢 AVISO GERAL',
        announcementMsg
      );
      success("Megafone Disparado", "Alerta disparado para todos os membros!");
      setAnnouncementMsg('');
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível disparar o aviso.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && users.length === 0) return <div className="p-12 text-center text-primary font-black animate-pulse">CARREGANDO ARENA...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header>
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
          <Zap className="text-primary fill-current" />
          <span>Gestão Live: Noite de Culto</span>
        </h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic mt-1">Marque pontos em tempo real durante as dinâmicas</p>
      </header>


      {/* 📅 CONFIGURAÇÃO DE DATA E HORA DOS LANÇAMENTOS */}
      <div className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Calendar size={80} className="text-primary" />
        </div>
        <div className="flex-1 flex flex-col relative z-10">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Data e Hora de Referência</h3>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] italic mt-0.5">Use para lançamentos retroativos de cultos ou dinâmicas.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3 relative z-10">
          <div className="relative group flex-1 sm:flex-none">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full sm:w-40 bg-black border-2 border-zinc-800 focus:border-primary pl-10 pr-4 py-3 rounded-xl text-white font-black text-xs sm:text-sm outline-none transition-all appearance-none cursor-pointer hover:border-zinc-700"
            />
          </div>
          <div className="relative group flex-1 sm:flex-none">
            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full sm:w-32 bg-black border-2 border-zinc-800 focus:border-primary pl-10 pr-4 py-3 rounded-xl text-white font-black text-xs sm:text-sm outline-none transition-all appearance-none cursor-pointer hover:border-zinc-700"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 👤 GESTÃO INDIVIDUAL */}
        <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem] relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Star size={100} className="text-primary" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20">
              <Star size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Vitória Individual</h3>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Buscar Membro</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  name="arena_member_search_v2"
                  id="arena_member_search_v2"
                  value={searchTerm}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedUser(null);
                  }}
                  autoComplete="one-time-code"
                  placeholder="Nome ou e-mail..."
                  className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 pl-12 rounded-2xl text-white font-bold outline-none transition-all"
                />
              </div>

              {/* Resultados Rápidos */}
              {isFocused && !selectedUser && filteredUsers.length > 0 && (
                <div className="absolute z-100 left-0 right-0 mt-2 bg-zinc-800 border-2 border-primary rounded-2xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
                  {filteredUsers.map(u => (
                    <button 
                      key={u.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchTerm(u.name);
                        setSelectedUser(u);
                        setIsFocused(false);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[10px] font-black uppercase text-primary border border-zinc-700">{u.name.charAt(0)}</div>
                        <div>
                          <p className="text-white font-black uppercase text-xs">{u.name}</p>
                          <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">{groups.find(g => g.id === u.groupId)?.name || 'Sem Grupo'}</p>
                        </div>
                      </div>
                      <CheckCircle size={16} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Vincular Atividade (Opcional)</label>
              <select 
                value={selectedActivityId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedActivityId(val);
                  if (val) {
                    const act = activities.find(a => a.id === val);
                    if (act) {
                      setCustomPoints(act.points.toString());
                      setCustomReason(act.title);
                    }
                  } else {
                    setCustomPoints('');
                    setCustomReason('');
                  }
                }}
                className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-bold outline-none"
              >
                <option value="">Sem Atividade Específica</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.title} ({a.points} XP)</option>
                ))}
              </select>
            </div>

            {/* Quick Actions para o usuário selecionado */}
            {selectedUser && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 pt-4 border-t border-zinc-800">
                <p className="text-[10px] font-black uppercase text-primary text-center">Atribuir Vitória para {selectedUser.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map(pts => (
                    <button
                      key={pts}
                      disabled={processing}
                      onClick={async () => {
                        await handleAwardPoints(selectedUser.id, selectedUser.groupId, pts, `Vitória no Culto: Dinâmica Individual (+${pts} pts)`);
                        setSelectedUser(null);
                        setSearchTerm('');
                      }}
                      className="bg-zinc-800 hover:bg-primary hover:text-black p-4 rounded-2xl font-black italic transition-all flex flex-col items-center justify-center gap-1 border-2 border-transparent hover:border-white shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-xl">+{pts}</span>
                      <span className="text-[8px] uppercase tracking-widest">XP</span>
                    </button>
                  ))}
                </div>

                {/* Campos Personalizados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-600 ml-2">Motivo Personalizado</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Resposta Difícil, Comportamento..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary p-3 rounded-xl text-white font-bold text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-600 ml-2">XP Customizado</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Qtd"
                        value={customPoints}
                        onChange={e => setCustomPoints(e.target.value)}
                        className="w-24 bg-zinc-800 border-2 border-zinc-700 focus:border-primary p-3 rounded-xl text-white font-black text-xs outline-none"
                      />
                      <button
                        disabled={processing || !customPoints}
                        onClick={async () => {
                          const pts = parseInt(customPoints);
                          const reason = customReason.trim() || `Vitória na Arena Live (+${pts} pts)`;
                          await handleAwardPoints(selectedUser.id, selectedUser.groupId, pts, reason);
                          setSelectedUser(null);
                          setSearchTerm('');
                          if (!selectedActivityId) {
                            setCustomPoints('');
                            setCustomReason('');
                          }
                        }}
                        className="flex-1 bg-primary text-black font-black uppercase italic text-[10px] rounded-xl hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                      >
                        Lançar Pontos
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* 🏰 GESTÃO DE TRIBO (VITORIA COLETIVA) */}
        <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem] relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy size={100} className="text-primary" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20">
              <Trophy size={24} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Vitória da Tribo</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Selecionar Tribo Vencedora</label>
              <div className="grid grid-cols-2 gap-3">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setGroupPoints('100'); // Valor padrão sugerido
                      setGroupReason('Vitória Coletiva da Tribo no Culto');
                    }}
                    disabled={processing}
                    className={`border-2 p-4 rounded-2xl text-left group/btn active:scale-95 transition-all disabled:opacity-50 ${selectedGroupId === g.id ? 'bg-primary border-white' : 'bg-black border-zinc-800 hover:border-primary'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border ${selectedGroupId === g.id ? 'bg-white border-primary' : 'bg-zinc-900 border-zinc-700'}`}>
                        {g.logoUrl ? <img src={g.logoUrl} alt="" className="w-full h-full object-cover" /> : <Users size={16} className={selectedGroupId === g.id ? 'text-primary' : 'text-zinc-500'} />}
                      </div>
                      <p className={`font-black uppercase text-[10px] ${selectedGroupId === g.id ? 'text-black' : 'text-white group-hover/btn:text-primary'}`}>{g.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Painel de Lançamento da Tribo */}
            <AnimatePresence>
              {selectedGroupId && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 pt-6 border-t border-zinc-800 overflow-hidden">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Vincular Atividade (Opcional)</label>
                        <select 
                          className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-bold text-sm outline-none"
                          onChange={(e) => {
                            const act = activities.find(a => a.id === e.target.value);
                            if (act) {
                              setGroupPoints(act.points.toString());
                              setGroupReason(`Vitória Coletiva: ${act.title}`);
                            }
                          }}
                        >
                          <option value="">Sem Atividade Específica</option>
                          {activities.map(a => (
                            <option key={a.id} value={a.id}>{a.title} ({a.points} XP)</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Motivo da Vitória da Tribo</label>
                        <input 
                          type="text" 
                          value={groupReason}
                          onChange={e => setGroupReason(e.target.value)}
                          placeholder="Ex: Venceram o Cabo de Guerra..."
                          className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-bold text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-zinc-500 ml-1">Pontos (XP)</label>
                        <input 
                          type="number" 
                          value={groupPoints}
                          onChange={e => setGroupPoints(e.target.value)}
                          className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-black text-sm outline-none text-center"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-end">
                        <button
                          disabled={processing || !groupPoints}
                          onClick={async () => {
                            await handleGroupOnlyPoints(selectedGroupId, parseInt(groupPoints), groupReason);
                            setSelectedGroupId(null);
                            setGroupPoints('');
                            setGroupReason('');
                          }}
                          className="w-full h-[58px] bg-white hover:bg-primary text-black font-black uppercase italic text-xs rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                        >
                          Confirmar Vitória Coletiva
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-3xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-primary shrink-0 mt-1" />
                <p className="text-zinc-400 text-[10px] font-bold uppercase leading-relaxed italic">
                  Esta ação credita pontos <span className="text-primary">apenas para o saldo da tribo</span>, sem afetar o XP individual dos membros. Ideal para gincanas coletivas.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 📢 MEGAFONE GERAL */}
      <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Megaphone size={100} className="text-primary" />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20">
            <Megaphone size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Megafone da Arena</h3>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic">Dispare um alerta que acende o "Sininho de Ouro" de todos</p>
          </div>
        </div>

        <div className="flex gap-4">
          <input 
            type="text"
            value={announcementMsg}
            onChange={(e) => setAnnouncementMsg(e.target.value)}
            placeholder="Ex: A Prova Relâmpago acaba de ser liberada!"
            className="flex-1 bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-bold outline-none transition-all"
          />
          <button
            disabled={processing || !announcementMsg.trim()}
            onClick={handleSendAnnouncement}
            className="bg-primary text-black px-8 rounded-2xl font-black uppercase italic flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Disparar
          </button>
        </div>
      </section>

      {/* HISTÓRICO RÁPIDO (ÚLTIMOS LANÇAMENTOS) */}
      <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-6 flex items-center gap-2">
          <History size={18} className="text-zinc-600" />
          Últimos Lançamentos
        </h3>
        {recentLogs.length === 0 ? (
          <div className="text-zinc-700 font-black uppercase italic text-xs text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl">
            Nenhum lançamento recente.
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log: any) => {
              const uName = users.find(u => u.id === log['userId'])?.name || 'Membro';
              const gName = groups.find(g => g.id === log['groupId'])?.name || 'Tribo';
              const isGroupOnly = !log['userId'];
              const date = new Date(log.created_at);
              const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={log.id} className="bg-black/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-800 text-zinc-500 font-black text-[10px] px-2 py-1 rounded-md shrink-0">
                      {time}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-snug">
                        {isGroupOnly ? <span className="text-primary italic">VANTAGEM DA TRIBO</span> : uName}
                      </p>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{log.reason}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary font-black italic">+{log.points} XP</p>
                    <p className="text-zinc-600 text-[9px] font-black uppercase">{gName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function History({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
