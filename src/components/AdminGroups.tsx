/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Group, UserProfile } from '../types';
import { Plus, Trash2, Crown, Shield, Loader2, Edit2, Check, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';

export default function AdminGroups() {
  const { success, error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', leaderId: '' });
  
  // States para edição do nome
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // States para edição de pontos
  const [editingPointsGroupId, setEditingPointsGroupId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState("");

  async function fetchData() {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*');
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      
      if (!groupsError && groupsData) setGroups(groupsData as Group[]);
      if (!usersError && usersData) setUsers(usersData.map(u => ({ uid: u.id, ...u }) as UserProfile));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) return;

    setProcessing(true);
    try {
      const id = newGroup.name.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('groups')
        .insert([{
          id,
          name: newGroup.name,
          leaderId: newGroup.leaderId || null,
          totalPoints: 0,
          memberCount: 0
        }]);
      
      if (error) throw error;
      
      if (newGroup.leaderId) {
        await supabase
          .from('profiles')
          .update({ 
            role: 'leader',
            groupId: id
          })
          .eq('id', newGroup.leaderId);
      }

      setNewGroup({ name: '', leaderId: '' });
      setShowAddForm(false);
      setLoading(true);
      fetchData();
      success("Tribo Criada", `A tribo ${newGroup.name} foi registrada.`);
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível criar a tribo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateGroupName = async (groupId: string) => {
    if (!editingName.trim()) {
      setEditingGroupId(null);
      return;
    }
    
    // Se o nome for o mesmo, apenas fechar o editor
    const currentGroup = groups.find(g => g.id === groupId);
    if (currentGroup?.name === editingName.trim()) {
      setEditingGroupId(null);
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: editingName.trim() })
        .eq('id', groupId);
      
      if (error) throw error;
      
      setGroups(groups.map(g => g.id === groupId ? { ...g, name: editingName.trim() } : g));

      // Post automático no Mural anunciando o novo nome
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { FeedService } = await import('../lib/FeedService');
        await FeedService.autoPostGroupUpdate(user.id, groupId, 'name', editingName.trim()).catch(console.error);
      }

      success("Nome Atualizado", "O nome da tribo foi alterado com sucesso.");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível atualizar o nome da tribo.");
    } finally {
      setProcessing(false);
      setEditingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tribo? Isso NÃO excluirá os membros, mas eles ficarão sem grupo.")) return;
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
      setGroups(groups.filter(g => g.id !== groupId));
      success("Tribo Removida", "A tribo foi excluída com sucesso.");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível excluir a tribo.");
    }
  };

  const handleUpdateGroupPoints = async (groupId: string) => {
    const newPoints = parseInt(editingPoints);
    if (isNaN(newPoints) || newPoints < 0) {
      setEditingPointsGroupId(null);
      return;
    }

    const currentGroup = groups.find(g => g.id === groupId);
    if (currentGroup?.totalPoints === newPoints) {
      setEditingPointsGroupId(null);
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ totalPoints: newPoints })
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.map(g => g.id === groupId ? { ...g, totalPoints: newPoints } : g));
      success("Pontos Atualizados", `Pontuação da tribo ajustada para ${newPoints} pts.`);
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível atualizar os pontos.");
    } finally {
      setProcessing(false);
      setEditingPointsGroupId(null);
    }
  };

  const handleUpdateLeader = async (groupId: string, leaderId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ leaderId: leaderId || null })
        .eq('id', groupId);
      
      if (error) throw error;

      if (leaderId) {
        await supabase
          .from('profiles')
          .update({ role: 'leader' })
          .eq('id', leaderId);
      }
      setGroups(groups.map(g => g.id === groupId ? { ...g, leaderId } : g));
      success("Líder Atualizado", "As permissões da tribo foram ajustadas.");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível atualizar o líder.");
    }
  };

  // Guard: spinner apenas no primeiro carregamento (sem dados em cache)
  if (loading && groups.length === 0) return <LoadingSpinner message="Preparando as Tribos..." size="md" />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-primary">Gerenciar Tribos</h2>
          <p className="text-zinc-500 font-bold italic text-[10px] md:text-xs uppercase tracking-widest mt-1">Crie e administre as equipes da gincana</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-black px-6 py-3 rounded-full font-black uppercase italic tracking-tighter active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 w-full md:w-auto shrink-0"
        >
          NOVA TRIBO <Plus size={20} />
        </button>
      </header>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border-4 border-primary p-6 md:p-8 rounded-3xl mb-8 shadow-2xl">
              <form onSubmit={handleCreateGroup} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nome da Tribo</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Leões de Judá"
                    value={newGroup.name}
                    onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Líder (Opcional)</label>
                  <select 
                    value={newGroup.leaderId || ''}
                    onChange={e => setNewGroup({...newGroup, leaderId: e.target.value})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Selecione um líder...</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button disabled={processing} type="submit" className="flex-1 flex justify-center items-center gap-2 bg-primary text-black py-3 rounded-xl font-black uppercase italic tracking-tighter active:scale-95 transition-all disabled:opacity-50">
                    {processing ? <Loader2 className="animate-spin" size={20} /> : null}
                    {processing ? "CRIANDO..." : "CRIAR"}
                  </button>
                  <button disabled={processing} type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-50 transition-colors">Cancelar</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-zinc-900 border-4 border-zinc-800 p-5 md:p-8 rounded-[28px] md:rounded-[32px] relative overflow-hidden group hover:border-primary/50 transition-all flex flex-col h-full">
            <div className="flex items-start justify-between relative z-10 flex-1">
              <div className="flex items-start gap-3 md:gap-4 w-full pr-2">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl md:rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-xl shrink-0 mt-1">
                  <Shield className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Inline Edit Logic */}
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateGroupName(group.id);
                          if (e.key === 'Escape') setEditingGroupId(null);
                        }}
                        className="bg-black border-2 border-primary p-2 rounded-lg text-lg md:text-2xl font-black text-white uppercase italic tracking-tighter outline-none w-full"
                      />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => handleUpdateGroupName(group.id)} className="p-1.5 bg-green-500/20 text-green-500 rounded-md hover:bg-green-500 hover:text-black transition-colors" title="Salvar">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingGroupId(null)} className="p-1.5 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500 hover:text-black transition-colors" title="Cancelar">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 group/title">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none wrap-break-word line-clamp-2 mt-1">{group.name}</h3>
                      <button 
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditingName(group.name);
                        }}
                        className="p-1.5 bg-zinc-800/50 text-zinc-400 hover:text-white rounded-md transition-all active:scale-95 shrink-0"
                        title="Editar Nome"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="inline-flex items-center gap-1.5 mt-2 bg-zinc-950 border border-zinc-800/50 py-1 px-2 rounded-lg max-w-full">
                    <Crown size={12} className="text-primary shrink-0" />
                    <select 
                      value={group.leaderId || ''}
                      onChange={(e) => handleUpdateLeader(group.id, e.target.value)}
                      className="bg-transparent border-none p-0 text-[9px] md:text-xs font-black uppercase text-primary outline-none cursor-pointer truncate"
                    >
                      <option value="" className="bg-zinc-950">Sem Líder</option>
                      {users.map(u => (
                        <option key={u.uid} value={u.uid} className="bg-zinc-950">{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {editingGroupId !== group.id && (
                <button 
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                  title="Excluir Tribo"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 relative z-10 shrink-0">
              <div className="bg-black/40 p-3 md:p-5 rounded-2xl border-l-4 border-primary shadow-inner flex flex-col justify-center">
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-zinc-500 mb-0.5 leading-tight">Membros</p>
                <p className="text-xl md:text-3xl font-black text-white italic leading-none">{group.memberCount}</p>
              </div>
              <div className="bg-black/40 p-3 md:p-5 rounded-2xl border-l-4 border-primary shadow-inner flex flex-col justify-center overflow-hidden">
                <p className="text-[8px] sm:text-[10px] font-black uppercase text-zinc-500 mb-0.5 leading-tight truncate">Pontuação Total</p>
                {editingPointsGroupId === group.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      autoFocus
                      min={0}
                      value={editingPoints}
                      onChange={(e) => setEditingPoints(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateGroupPoints(group.id);
                        if (e.key === 'Escape') setEditingPointsGroupId(null);
                      }}
                      className="w-full bg-black border-2 border-primary p-1 rounded-lg text-lg font-black text-primary italic outline-none"
                    />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => handleUpdateGroupPoints(group.id)} className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500 hover:text-black transition-colors" title="Salvar"><Check size={12} /></button>
                      <button onClick={() => setEditingPointsGroupId(null)} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-black transition-colors" title="Cancelar"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingPointsGroupId(group.id); setEditingPoints(String(group.totalPoints)); }}
                    className="flex items-baseline gap-1 group/pts hover:opacity-80 transition-opacity text-left"
                    title="Clique para editar os pontos"
                  >
                    <p className="text-xl md:text-3xl font-black text-primary italic leading-none">{group.totalPoints}</p>
                    <span className="text-[10px] md:text-sm font-black text-primary italic">pts</span>
                    <Zap size={10} className="text-zinc-600 group-hover/pts:text-primary transition-colors ml-1 mb-0.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 opacity-[0.03] transform group-hover:scale-110 transition-transform text-white pointer-events-none">
              <Shield size={200} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
