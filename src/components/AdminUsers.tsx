/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, Group, ActivityDefinition } from '../types';
import { UserCog, Trash2, Zap, X, Award, Loader2, ClipboardList, CheckCircle2, Search, Archive, AlertTriangle, Cross, Shield, Heart, MapPin, Sparkles, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from './LoadingSpinner';
import { NotificationService } from '../lib/NotificationService';
import { FeedService } from '../lib/FeedService';

export default function AdminUsers() {
  const { success, error: toastError } = useToast();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modais
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Modal de confirmação customizado (window.confirm é bloqueado em iframes/dev)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void, danger = true) => {
    setConfirmDialog({ open: true, title, message, danger, onConfirm });
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));
  
  // Form States
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const location = useLocation();
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'inactive' | 'archived'>(
    location.state?.filter || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  // Gatilho de atualização
  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        // 🚀 Busca independente com limite estendido para evitar paginação PostgREST (default 1000)
        const [usersRes, groupsRes, defsRes] = await Promise.allSettled([
          supabase.from('profiles').select('*').order('name').limit(2000),
          supabase.from('groups').select('*').order('name'),
          supabase.from('activity_definitions').select('*').eq('is_active', true)
        ]);

        if (!mounted) return;

        // Processamento de Usuários
        if (usersRes.status === 'fulfilled' && usersRes.value.data) {
          // Normalização: perfis sem status são considerados 'active' por padrão
          setUsers(usersRes.value.data.map(u => ({ 
            uid: u.id, 
            ...u, 
            status: u.status || 'active' 
          }) as UserProfile));
        } else if (usersRes.status === 'rejected' || (usersRes.status === 'fulfilled' && usersRes.value.error)) {
          console.error("Erro ao buscar usuários:", usersRes.status === 'fulfilled' ? usersRes.value.error : usersRes.reason);
        }

        // Processamento de Grupos
        if (groupsRes.status === 'fulfilled' && groupsRes.value.data) {
          setGroups(groupsRes.value.data as Group[]);
        }

        // Processamento de Definições
        if (defsRes.status === 'fulfilled' && defsRes.value.data) {
          setDefinitions(defsRes.value.data as ActivityDefinition[]);
        }

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [refreshTrigger]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole as UserProfile['role'] } : u));
      success("Cargo Atualizado", "O papel do usuário foi alterado.");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível atualizar o cargo.");
    }
  };

  const handleUpdateGroup = async (userId: string, groupId: string) => {
    const finalGroupId = groupId === "" || groupId === "none" ? null : groupId;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ groupId: finalGroupId })
        .eq('id', userId);
      
      if (error) throw error;

      if (finalGroupId) {
        const user = users.find(u => u.uid === userId);
        if (user) {
          await FeedService.autoPostNewMember(userId, finalGroupId, user.name).catch(console.error);
        }
      }

      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, groupId: finalGroupId } : u));
      success("Tribo Atualizada", "O guerreiro foi movido para a nova tribo.");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível atualizar a tribo.");
    }
  };

  const handleManualPoints = async () => {
    if (!selectedUser || adjustAmount === 0) return;
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('increment_points', {
        user_id: selectedUser.uid,
        group_id: selectedUser.groupId,
        pts: adjustAmount,
        reason: 'Ajuste Manual do Administrador'
      });

      if (error) throw error;
      
      refresh();
      setShowPointsModal(false);
      setAdjustAmount(0);
      success("Pontos Ajustados", "O saldo do guerreiro foi atualizado.");
      
      // Notificar o usuário
      const adminAvatar = profile?.avatar_url || (profile as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'admin'}`;
      await NotificationService.send(
        selectedUser.uid,
        'announcement',
        '⚡ Ajuste de Poder!',
        `Um administrador realizou um ajuste manual no seu saldo: ${adjustAmount > 0 ? '+' : ''}${adjustAmount} XP.`,
        '/dashboard',
        adminAvatar
      );
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível ajustar os pontos.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toastError("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_password', {
        target_user_id: selectedUser.uid,
        new_password: newPassword
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message || "Permissão negada");

      success("Senha Atualizada", `A senha de ${selectedUser.name} foi alterada com sucesso.`);
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      console.error(err);
      toastError("Erro", "Falha ao alterar senha. Verifique se a RPC foi instalada.");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualActivity = async () => {
    if (!selectedUser || !selectedActivityId) return;
    const def = definitions.find(d => d.id === selectedActivityId);
    if (!def) return;

    setProcessing(true);
    try {
      const { error: partError } = await supabase
        .from('participations')
        .insert({
          userId: selectedUser.uid,
          groupId: selectedUser.groupId,
          activityId: def.id,
          status: 'approved',
          pointsEarned: def.current_points,
          proofUrl: 'Lançamento Manual (Admin)'
        });

      if (partError) throw partError;

      const { error: rpcError } = await supabase.rpc('increment_points', {
        user_id: selectedUser.uid,
        group_id: selectedUser.groupId,
        pts: def.current_points,
        reason: `Atividade Manual: ${def.title}`
      });

      if (rpcError) throw rpcError;

      refresh();
      setShowActivityModal(false);
      setSelectedActivityId('');
      success("Atividade Concluída", `Atividade "${def.title}" atribuída com sucesso!`);

      // Notificar o usuário
      const adminAvatar = profile?.avatar_url || (profile as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'admin'}`;
      await NotificationService.send(
        selectedUser.uid,
        'achievement',
        '🏆 Missão Atribuída!',
        `Um administrador atribuiu a atividade "${def.title}" diretamente ao seu perfil. +${def.current_points} XP conquistados!`,
        '/dashboard',
        adminAvatar
      );
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível atribuir a atividade.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);
      
      if (error) throw error;

      const approvedUser = users.find(u => u.uid === userId);
      if (approvedUser) {
        await FeedService.autoPostNewMember(userId, approvedUser.groupId, approvedUser.name).catch(console.error);
      }

      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'active' } : u));
      
      // Notificar o usuário aprovado
      const adminAvatar = profile?.avatar_url || (profile as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'admin'}`;
      
      await NotificationService.send(
        userId,
        'task_approved',
        '🛡️ ACESSO LIBERADO!',
        'Sua inscrição foi aprovada! Bem-vindo à arena, guerreiro.',
        '/dashboard',
        adminAvatar
      );

      success("Usuário Aprovado", "O acesso foi liberado com sucesso!");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível aprovar o usuário.");
    }
  };

  const handlePermanentDelete = (userId: string) => {
    showConfirm(
      '⚠️ Excluir Permanentemente',
      'Todos os dados deste guerreiro (pontos, participações, histórico) serão apagados permanentemente. Esta ação é irreversível!',
      async () => {
        closeConfirm();
        setProcessing(true);
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (profileError) throw profileError;

          // Banir no Auth para revogar acesso (nao-critico se falhar)
          try {
            await supabase.rpc('ban_user_in_auth', { user_id: userId });
          } catch (banErr: any) {
            console.warn('ban_user_in_auth:', banErr.message);
          }

          setUsers(prev => prev.filter(u => u.uid !== userId));
          success('Guerreiro Excluído', 'O cadastro foi removido da arena.');
        } catch (error: any) {
          console.error('Erro ao excluir:', error);
          toastError('Erro', error.message || 'Verifique se você tem permissão de Admin.');
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleSoftDelete = (userId: string) => {
    showConfirm(
      'Arquivar Guerreiro',
      'O guerreiro não aparecerá nos rankings, mas todos os dados serão preservados. Você pode reativá-lo depois.',
      async () => {
        closeConfirm();
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ status: 'archived', deleted_at: new Date().toISOString() })
            .eq('id', userId);

          if (error) throw error;
          setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'archived' } : u));
          success('Guerreiro Arquivado', 'O perfil foi movido para a aba de arquivados.');
        } catch (error: any) {
          console.error(error);
          toastError('Erro', error.message || 'Não foi possível arquivar o usuário.');
        }
      }
    );
  };

  const handleReactivate = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          deleted_at: null
        })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'active' } : u));
      success("Guerreiro Reativado", "O perfil voltou à ativa!");
    } catch (error) {
      console.error(error);
      toastError("Erro", "Não foi possível reativar o usuário.");
    }
  };

  const handleGenerateAvatars = async () => {
    const usersWithoutAvatar = users.filter(u => !u.avatar_url && !(u as any).avatarUrl);
    if (usersWithoutAvatar.length === 0) {
      success("Identidades Prontas", "Todos os guerreiros já possuem identidade visual!");
      return;
    }

    setProcessing(true);
    try {
      let updatedCount = 0;
      for (const u of usersWithoutAvatar) {
        const diceBearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`;
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatarUrl: diceBearUrl 
          })
          .eq('id', (u as any).uid || u.id);
        
        if (!error) updatedCount++;
      }
      
      refresh();
      success("Identidades Forjadas", `${updatedCount} novos avatares foram gerados com sucesso!`);
    } catch (err) {
      console.error(err);
      toastError("Erro", "Falha ao gerar identidades visuais.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const uStatus = (u as any).status || 'active';
    
    // 1. Filtro de Status
    if (filter === 'active') {
       if (uStatus !== 'active') return false;
    } else if (filter === 'pending') {
       if (uStatus !== 'pending') return false;
    } else if (filter === 'inactive') {
       if (uStatus !== 'inactive') return false;
    } else if (filter === 'archived') {
       if (uStatus !== 'archived') return false;
    }
    // No 'all', mostramos quase tudo, exceto arquivados (a menos que explicitamente filtrado)
    if (filter === 'all' && uStatus === 'archived') return false;
    
    // 2. Filtro de Grupo
    if (groupFilter !== 'all' && u.groupId !== groupFilter) return false;

    // 3. Busca por Nome/Email
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }

    return true;
  });

  // Guard: spinner apenas no primeiro carregamento (sem dados em cache)
  if (loading && users.length === 0) return <LoadingSpinner message="Mobilizando Guerreiros..." size="md" />;

  return (
    <div className="space-y-6">
      {/* CSS Injetado para garantir que a barra de scroll desapareça e o visual permaneça premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-primary leading-none">Painel Admin</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-zinc-600 font-bold italic text-[10px] sm:text-xs uppercase tracking-widest">Gerenciar Membros • {users.length} Guerreiros</p>
            <button 
              onClick={handleGenerateAvatars}
              disabled={processing}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-black transition-all active:scale-95 disabled:opacity-50"
              title="Gerar avatares automáticos para quem não tem foto"
            >
              {processing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              Gerar Identidades
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center flex-1 w-full max-w-5xl">
          {/* BARRA DE BUSCA */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar guerreiro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border-2 border-zinc-900 focus:border-primary rounded-xl sm:rounded-2xl pl-12 pr-4 py-3 sm:py-3.5 font-bold text-white outline-none transition-all placeholder:text-zinc-700 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* FILTRO DE GRUPO */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full sm:w-44 bg-black/40 border-2 border-zinc-900 rounded-xl sm:rounded-2xl px-4 py-3 font-black uppercase italic text-[10px] tracking-widest text-zinc-400 outline-none focus:border-primary transition-all appearance-none cursor-pointer shadow-xl"
            >
              <option value="all" className="bg-zinc-900 text-white">TODAS AS TRIBOS</option>
              {groups.map(g => (
                <option key={g.id} value={g.id} className="bg-zinc-900 text-white">{g.name.toUpperCase()}</option>
              ))}
            </select>

            {/* FILTRO DE STATUS */}
            <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl sm:rounded-2xl border-2 border-zinc-900 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { id: 'all', label: 'Todos', color: 'primary' },
                { id: 'active', label: 'Ativos', color: 'green-500' },
                { id: 'pending', label: 'Pendentes', color: 'orange-500', count: users.filter(u => (u as any).status === 'pending').length },
                { id: 'archived', label: 'Arquivados', color: 'zinc-700' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFilter(f.id as any)} 
                  className={`relative flex-1 min-w-[90px] sm:min-w-[110px] text-[9px] sm:text-[10px] px-4 py-3 rounded-lg sm:rounded-xl font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                    filter === f.id 
                      ? f.id === 'all' ? 'bg-primary text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]' : `bg-${f.color} text-white shadow-lg` 
                      : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {f.label}
                  {f.count ? (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black ${filter === f.id ? 'bg-black text-white' : 'bg-primary text-black'}`}>{f.count}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 font-bold italic uppercase">Nenhum guerreiro encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.uid} className={`bg-zinc-900 shadow-xl rounded-2xl p-4 md:p-6 group transition-all hover:scale-[1.01] flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-l-4 border-primary ${user.status === 'pending' ? 'ring-2 ring-orange-500/20' : ''} relative overflow-hidden`}>
              
              {/* User Info */}
              <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden relative z-10">
                <div className="w-12 h-12 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center text-primary font-black text-xl relative shrink-0 border border-zinc-800 group-hover:border-primary/50 transition-colors shadow-xl">
                  <img 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl" 
                    alt={user.name}
                  />
                  {user.status === 'pending' && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-zinc-900 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-black text-white uppercase italic truncate text-sm sm:text-base md:text-lg leading-none tracking-tight">{user.name}</p>
                    {user.status === 'pending' && (
                      <span className="bg-orange-500/10 text-orange-500 text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border border-orange-500/20 shrink-0">Pendente</span>
                    )}
                    {user.status === 'archived' && (
                      <span className="bg-zinc-800 text-zinc-500 text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border border-zinc-700 shrink-0">Arquivado</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold truncate mt-1 tracking-tight">{user.email}</p>
                </div>
              </div>

              {/* Configs (Role & Group) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full xl:w-auto shrink-0 relative z-10">
                <div className="relative">
                  <select 
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                    className="w-full bg-black/60 border-2 border-zinc-800 rounded-xl px-3 py-2.5 text-[9px] sm:text-xs font-black uppercase text-primary focus:border-primary outline-none appearance-none cursor-pointer transition-colors shadow-inner"
                  >
                    <option value="participant" className="bg-zinc-900 text-white">Guerreiro</option>
                    <option value="leader" className="bg-zinc-900 text-white">Líder</option>
                    <option value="admin" className="bg-zinc-900 text-white">Admin</option>
                  </select>
                </div>
                
                <div className="relative">
                  <select 
                    value={user.groupId || ''}
                    onChange={(e) => handleUpdateGroup(user.uid, e.target.value)}
                    className="w-full bg-black/60 border-2 border-zinc-800 rounded-xl px-3 py-2.5 text-[9px] sm:text-xs font-black uppercase text-white focus:border-primary outline-none appearance-none cursor-pointer truncate shadow-inner min-w-[120px]"
                  >
                    <option value="" className="bg-zinc-900 text-white">Sem Tribo</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id} className="bg-zinc-900 text-white">{g.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Points and Actions */}
              <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6 w-full xl:w-auto mt-2 xl:mt-0 pt-4 xl:pt-0 border-t border-zinc-800/50 xl:border-t-0 shrink-0 relative z-10">
                <div className="flex flex-col items-start xl:items-end">
                   <div className="text-xl sm:text-2xl font-black text-primary italic leading-none tracking-tighter">
                     {user.totalPoints || 0}<span className="text-[9px] sm:text-[10px] text-zinc-600 ml-1 uppercase not-italic">xp</span>
                   </div>
                   <p className="text-[7px] sm:text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Poder Acumulado</p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {user.status === 'pending' ? (
                    <button 
                      onClick={() => handleApproveUser(user.uid)}
                      className="bg-green-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black uppercase italic text-[10px] sm:text-xs hover:bg-white hover:text-black active:scale-95 transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(22,163,74,0.3)] border-t border-white/20"
                    >
                      <Zap size={14} className="fill-current" /> 
                      <span className="hidden sm:inline">Liberar Acesso</span>
                      <span className="sm:hidden">Aprovar</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowPointsModal(true); }}
                        className="p-2.5 sm:p-3 bg-zinc-800/80 text-yellow-500 rounded-xl hover:bg-yellow-500 hover:text-black active:scale-95 transition-all shadow-xl border border-white/5"
                        title="Ajustar Pontos"
                      >
                        <Zap size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowActivityModal(true); }}
                        className="p-2.5 sm:p-3 bg-zinc-800/80 text-primary rounded-xl hover:bg-primary hover:text-black active:scale-95 transition-all shadow-xl border border-white/5"
                        title="Atribuir Atividade"
                      >
                        <Award size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowDossierModal(true); }}
                        className="p-2.5 sm:p-3 bg-zinc-800/80 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-black active:scale-95 transition-all shadow-xl border border-white/5"
                        title="Dossiê do Membro"
                      >
                        <ClipboardList size={18} />
                      </button>
                      {profile?.role === 'admin' && (
                        <button 
                          onClick={() => { setSelectedUser(user); setShowPasswordModal(true); setNewPassword(''); }}
                          className="p-2.5 sm:p-3 bg-zinc-800/80 text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white active:scale-95 transition-all shadow-xl border border-white/5 hidden sm:flex"
                          title="Alterar Senha"
                        >
                          <Key size={18} />
                        </button>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center gap-1 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-zinc-800">
                    {user.status === 'archived' ? (
                      <>
                        <button 
                          onClick={() => handleReactivate(user.uid)}
                          className="p-2.5 sm:p-3 text-green-500 hover:bg-green-500/10 rounded-xl active:scale-95 transition-all"
                          title="Reativar Guerreiro"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(user.uid)}
                          className="p-2.5 sm:p-3 text-red-500 hover:bg-red-500/10 rounded-xl active:scale-95 transition-all"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleSoftDelete(user.uid)}
                          className="p-2.5 sm:p-3 text-zinc-600 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl active:scale-95 transition-colors"
                          title="Arquivar Guerreiro"
                        >
                          <Archive size={18} />
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(user.uid)}
                          className="p-2.5 sm:p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl active:scale-95 transition-colors"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL: CONFIRMAÇÃO DE AÇÃO DESTRUTIVA */}
      <AnimatePresence>
        {confirmDialog.open && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={closeConfirm}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`relative bg-zinc-950 border-4 ${confirmDialog.danger ? 'border-red-600' : 'border-orange-500'} rounded-3xl p-8 w-full max-w-sm shadow-2xl`}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmDialog.danger ? 'bg-red-600/20' : 'bg-orange-500/20'}`}>
                  <AlertTriangle size={32} className={confirmDialog.danger ? 'text-red-500' : 'text-orange-400'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{confirmDialog.title}</h3>
                  <p className="text-zinc-400 text-sm mt-2 font-medium leading-relaxed">{confirmDialog.message}</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={closeConfirm}
                    className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-black uppercase text-xs hover:bg-zinc-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${confirmDialog.danger ? 'bg-red-600 text-white hover:bg-white hover:text-red-600' : 'bg-orange-500 text-black hover:bg-white hover:text-orange-600'}`}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AJUSTE DE PONTOS */}
      <AnimatePresence>
        {showPointsModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPointsModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-950 border-2 sm:border-4 border-yellow-500 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ajustar Pontos</h3>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{selectedUser.name}</p>
                </div>
                <button onClick={() => setShowPointsModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Quantidade (Positivo ou Negativo)</label>
                  <input 
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value))}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-yellow-500 p-4 rounded-2xl text-3xl font-black text-center text-yellow-500 outline-none"
                  />
                  <div className="flex gap-2 mt-4">
                    {[+10, +50, -10, -50].map(v => (
                      <button key={v} onClick={() => setAdjustAmount(prev => prev + v)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-xs font-black text-white">
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleManualPoints}
                  disabled={processing || adjustAmount === 0}
                  className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <><Loader2 className="animate-spin" size={20} /> Processando...</> : "Confirmar Ajuste"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: ATRIBUIR ATIVIDADE */}
        {showActivityModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowActivityModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-950 border-2 sm:border-4 border-primary rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Atribuir Atividade</h3>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{selectedUser.name}</p>
                </div>
                <button onClick={() => setShowActivityModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Selecione a Atividade Concluída</label>
                  <select 
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-4 rounded-2xl text-white font-bold outline-none"
                  >
                    <option value="">Escolha uma atividade...</option>
                    {definitions.map(def => (
                      <option key={def.id} value={def.id}>{def.icon} {def.title} (+{def.current_points} XP)</option>
                    ))}
                  </select>
                </div>

                {selectedActivityId && (
                  <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-primary mb-1">Pontuação Automática</p>
                    <p className="text-white font-bold italic">{definitions.find(d => d.id === selectedActivityId)?.description}</p>
                  </div>
                )}

                <button 
                  onClick={handleManualActivity}
                  disabled={processing || !selectedActivityId}
                  className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <><Loader2 className="animate-spin" size={20} /> Lançando...</> : "Lançar Atividade e Pontos"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: DOSSIÊ DO MEMBRO */}
        {showDossierModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDossierModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-950 border-2 sm:border-4 border-blue-500 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-blue-500 text-blue-500 font-black text-xl overflow-hidden shrink-0">
                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" /> : selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Dossiê</h3>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">{selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowDossierModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-4">
                {/* Batismo */}
                <div className="flex items-center gap-4 p-4 bg-black rounded-2xl border-2 border-zinc-800">
                  <Cross size={24} className={selectedUser.isBaptized ? "text-blue-500" : "text-zinc-700"} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Batismo</p>
                    <p className={`font-bold italic ${selectedUser.isBaptized ? 'text-white' : 'text-zinc-600'}`}>
                      {selectedUser.isBaptized ? 'Sim, é Batizado(a)' : 'Ainda não é batizado(a)'}
                    </p>
                  </div>
                </div>

                {/* Engajamento */}
                <div className="flex items-center gap-4 p-4 bg-black rounded-2xl border-2 border-zinc-800">
                  {selectedUser.isServing ? (
                    <Shield size={24} className="text-green-500" />
                  ) : selectedUser.wantsToServe ? (
                    <Heart size={24} className="text-primary" />
                  ) : (
                    <Shield size={24} className="text-zinc-700" />
                  )}
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Serviço Ministerial</p>
                    <p className={`font-bold italic ${selectedUser.isServing ? 'text-green-400' : selectedUser.wantsToServe ? 'text-primary' : 'text-zinc-600'}`}>
                      {selectedUser.isServing ? 'Já serve em um ministério' : selectedUser.wantsToServe ? 'Tem interesse em servir' : 'Não serve / Sem interesse'}
                    </p>
                  </div>
                </div>

                {/* Área de Interesse/Serviço */}
                {(selectedUser.isServing || selectedUser.wantsToServe) && (
                  <div className="p-4 bg-zinc-800/50 rounded-2xl border-2 border-zinc-700/50">
                    <div className="flex items-start gap-3 mb-2">
                      <MapPin size={16} className="text-zinc-400 mt-1" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Área de Atuação</p>
                        <p className="text-white font-black italic">{selectedUser.serviceArea ? selectedUser.serviceArea.toUpperCase() : 'NÃO INFORMADA'}</p>
                      </div>
                    </div>
                    {selectedUser.praiseInstrument && (
                      <div className="pl-7">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Talento / Instrumento</p>
                        <p className="text-zinc-300 font-bold">{selectedUser.praiseInstrument}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Whatsapp CTA */}
                {selectedUser.whatsapp && (
                  <a 
                    href={`https://wa.me/55${selectedUser.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-[#25D366]/10 text-[#25D366] border-2 border-[#25D366]/30 rounded-2xl font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all"
                  >
                    Chamar no WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: MUDAR SENHA */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-950 border-4 border-purple-500 rounded-3xl p-8 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Alterar Senha</h3>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{selectedUser.name}</p>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nova Senha (Mín. 6 caracteres)</label>
                  <input 
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full bg-black border-2 border-zinc-800 focus:border-purple-500 px-4 py-3 rounded-2xl text-white font-bold outline-none"
                  />
                </div>

                <button 
                  onClick={handleUpdatePassword}
                  disabled={processing || newPassword.length < 6}
                  className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <><Loader2 className="animate-spin" size={20} /> Salvando...</> : "Definir Nova Senha"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
