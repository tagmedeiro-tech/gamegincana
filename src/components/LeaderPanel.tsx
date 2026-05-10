import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { Group, Badge, Cell, Activity } from '../types';
import { 
  Settings, Award, Users, Plus, Save, 
  Trash2, MapPin, Calendar, Upload, ChevronDown,
  CheckCircle, XCircle, ExternalLink, Clock, Eye, Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../lib/NotificationService';
import { AchievementService, ACHIEVEMENT_DEFINITIONS } from '../lib/AchievementService';
import { useToast } from '../context/ToastContext';
import PostModerationPanel from './feed/PostModerationPanel';
import Trophy3D from './Trophy3D';
import * as LucideIcons from 'lucide-react';

type TabType = 'layout' | 'cells' | 'validations' | 'achievements' | 'mural';

// Interface para a participação com dados estendidos (Join do Supabase)
interface PendingParticipation {
  id: string;
  userId: string;
  groupId: string;
  activityId: string;
  status: 'pending' | 'approved' | 'rejected';
  proofUrl: string;
  created_at: string;
  activities: Activity;
  profiles: {
    name: string;
    email: string;
  };
}

export default function LeaderPanel() {
  const { profile } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('layout');
  const [group, setGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🛡️ Permissões: Definidas no corpo do componente para uso global no JSX
  const canEdit = profile?.role === 'admin' || (selectedGroupId === profile?.groupId);

  // Validations State com tipagem estrita
  const [pendingParticipations, setPendingParticipations] = useState<PendingParticipation[]>([]);
  const [members, setMembers] = useState<{id: string, name: string}[]>([]);
  const [selectedAwardUser, setSelectedAwardUser] = useState('');
  const [selectedAwardKey, setSelectedAwardKey] = useState('first_task');
  const [awarding, setAwarding] = useState(false);

  // Group Settings State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slogan: '',
    primaryColor: '#FBBF24',
    secondaryColor: '#78350f',
    logoUrl: '',
    banner_url: '',
    instagram: '',
    youtube: ''
  });

  // Badges State
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: 'Award', points: 10, description: '' });

  // Cells State
  const [cells, setCells] = useState<Cell[]>([]);
  const [newCell, setNewCell] = useState({ name: '', meetingDay: 'Sexta-feira', location: '' });

  // System Achievements State (Admin only)
  const [systemAchievements, setSystemAchievements] = useState<any[]>([]);
  const [editingAchievement, setEditingAchievement] = useState<any | null>(null);

  // Load all groups for admin or initial group for leader
  useEffect(() => {
    async function init() {
      if (profile?.role === 'admin' || profile?.role === 'leader') {
        const { data } = await supabase.from('groups').select('*').order('name');
        setAllGroups(data || []);
        if (data && data.length > 0 && !selectedGroupId) {
          // Se for líder, tenta selecionar a dele primeiro, se não, a primeira da lista
          const myTribe = data.find(g => g.id === profile.groupId);
          setSelectedGroupId(myTribe ? myTribe.id : data[0].id);
        }
      }
    }
    init();
  }, [profile, selectedGroupId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!selectedGroupId) {
        if (isMounted) setLoading(false);
        return;
      }

      // 🛡️ Segurança: Líder vê tudo, canEdit é calculado no corpo do componente

      try {
        const { data: gData, error: gError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', selectedGroupId)
          .single();

        if (gError) throw gError;
        
        if (isMounted) {
          setGroup(gData);
          setFormData({
            name: gData.name,
            description: gData.description || '',
            slogan: gData.slogan || '',
            primaryColor: gData.primaryColor || '#FBBF24',
            secondaryColor: gData.secondary_color || '#78350f',
            logoUrl: gData.logoUrl || '',
            banner_url: gData.banner_url || '',
            instagram: gData.instagram || '',
            youtube: gData.youtube || ''
          });
        }

        const { data: bData } = await supabase
          .from('badges')
          .select('*')
          .eq('"groupId"', selectedGroupId);
        if (isMounted) setBadges(bData || []);

        const isAllGroups = selectedGroupId === 'all' && profile?.role === 'admin';
        
        // 🚀 Busca paralela para máxima performance no painel
        const [cDataRes, pDataRes, mDataRes] = await Promise.all([
          isAllGroups 
            ? supabase.from('cells').select('*')
            : supabase.from('cells').select('*').eq('"groupId"', selectedGroupId),
          
          // ⚠️ Join Direto: busca a participação com atividade e perfil do autor
          isAllGroups
            ? supabase.from('participations').select('*, activities(*), profiles(name, email)').eq('status', 'pending').order('created_at', { ascending: false })
            : supabase.from('participations').select('*, activities(*), profiles(name, email)').eq('"groupId"', selectedGroupId).eq('status', 'pending').order('created_at', { ascending: false }),
          
          isAllGroups
            ? supabase.from('profiles').select('id, name, email').order('name')
            : supabase.from('profiles').select('id, name, email').eq('"groupId"', selectedGroupId).order('name')
        ]);

        if (isMounted) {
          setCells(cDataRes.data || []);
          setMembers(mDataRes.data || []);

          // Mapeamento simplificado pois agora o profile vem no join
          const participationsWithProfiles = (pDataRes.data || []).map((p: any) => ({
            ...p,
            // Garante compatibilidade com a interface e fallback se o join falhar
            profiles: p.profiles || { name: 'Membro Externo', email: '' }
          }));
          
          setPendingParticipations(participationsWithProfiles as unknown as PendingParticipation[]);
        }

        // Carregar conquistas do sistema se for admin/líder
        // Estratégia: ACHIEVEMENT_DEFINITIONS é a fonte de verdade.
        // Se houver overrides no Supabase (isActive, nome editado), eles prevalecem.
        if (profile?.role === 'admin' || profile?.role === 'leader') {
          const { data: systemData } = await supabase
            .from('system_achievements')
            .select('*');

          // Monta o mapa de overrides do banco por key
          const dbOverrides: Record<string, any> = {};
          (systemData || []).forEach((row: any) => {
            dbOverrides[row.key] = row;
          });

          // Mescla: ACHIEVEMENT_DEFINITIONS como base + overrides do banco
          const merged = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => ({
            id: dbOverrides[key]?.id || key,
            key,
            name: dbOverrides[key]?.name ?? def.name,
            description: dbOverrides[key]?.description ?? def.description,
            points: dbOverrides[key]?.points ?? def.points,
            icon: dbOverrides[key]?.icon ?? def.icon,
            rarity: dbOverrides[key]?.rarity ?? def.rarity,
            color: dbOverrides[key]?.color ?? def.color,
            triggerType: dbOverrides[key]?.triggerType ?? (key.includes('login') ? 'LOGIN_STREAK' : key.includes('devotional') ? 'DEVOTIONAL_STREAK' : 'AUTOMATIC'),
            howToConquer: dbOverrides[key]?.howToConquer ?? def.howToConquer,
            isActive: dbOverrides[key]?.isActive ?? true,
          }));

          if (isMounted) {
            console.log(`[LeaderPanel] Carregados ${merged.length} troféus do sistema.`);
            setSystemAchievements(merged);
          }
        }
      } catch (err) {
        console.error("Error fetching leader data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => { isMounted = false; };
  }, [selectedGroupId]);

  const handleValidation = async (participation: PendingParticipation, status: 'approved' | 'rejected') => {
    try {
      let coinsToAward = 0;
      let multiplier = 1;

      if (status === 'approved') {
        // 💰 Buscar Multiplicador nas Configurações
        const { data: configData } = await supabase.from('config').select('value').eq('key', 'app').single();
        if (configData?.value) {
          multiplier = (configData.value as any).coinMultiplier || 1;
        }
        coinsToAward = Math.floor(participation.activities.points * multiplier);
      }

      let updateQuery = supabase
        .from('participations')
        .update({ 
          status, 
          '"pointsEarned"': status === 'approved' ? participation.activities.points : 0 
        })
        .eq('id', participation.id);

      // 🛡️ Trava extra no banco: se não for admin, só altera da própria tribo
      if (profile?.role !== 'admin') {
        updateQuery = updateQuery.eq('"groupId"', profile?.groupId);
      }

      const { error } = await updateQuery;

      if (error) throw error;

      if (status === 'approved') {
        // 🔔 Notificar Usuário
        await NotificationService.send(
          participation.userId,
          'task_approved',
          'Parabéns! Tarefa Aprovada 🏆',
          `Sua atividade "${participation.activities.title}" foi validada. +${participation.activities.points} XP e +${coinsToAward} Moedas na conta!`,
          `/dashboard/profile/${participation.userId}`,
          profile?.avatar_url || profile?.avatarUrl
        );

        // Incrementar Pontos (XP)
        await supabase.rpc('increment_points', { 
          user_id: participation.userId, 
          group_id: participation.groupId, 
          pts: participation.activities.points,
          reason: `Atividade Aprovada: ${participation.activities.title}`
        });

        // Incrementar Moedas (Manual update as RPC doesn't handle coins yet)
        if (coinsToAward > 0) {
          const { data: userData } = await supabase.from('profiles').select('coins').eq('id', participation.userId).single();
          const currentCoins = userData?.coins || 0;
          await supabase.from('profiles').update({ coins: currentCoins + coinsToAward }).eq('id', participation.userId);
        }

        // ðŸ† Verificar Conquistas AutomÃ¡ticas
        await AchievementService.check(participation.userId);
      } else {
        // ðŸ”” Notificar UsuÃ¡rio
        await NotificationService.send(
          participation.userId,
          'task_rejected',
          'Tarefa Recusada âŒ',
          `Infelizmente seu envio para "${participation.activities.title}" nÃ£o foi aceito. Tente novamente ou fale com seu lÃ­der.`,
          `/dashboard/profile/${participation.userId}`,
          profile?.avatar_url || profile?.avatarUrl
        );
      }

      setPendingParticipations(pendingParticipations.filter(p => p.id !== participation.id));
      if (status === 'approved') {
        success('Validação Concluída', `Atividade aprovada! +${participation.activities.points} XP creditados.`);
      } else {
        info('Atividade Recusada', 'O envio foi rejeitado.');
      }
    } catch (err) {
      console.error("Validation error:", err);
      toastError('Erro na ValidaÃ§Ã£o', 'Houve um problema ao processar a atividade.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroupId) return;

    // ðŸ›¡ï¸ SeguranÃ§a Adicional
    if (profile?.role !== 'admin' && selectedGroupId !== profile?.groupId) {
      toastError("Acesso Negado", "VocÃª nÃ£o tem permissÃ£o.");
      return;
    }

    setSaving(true);
    try {
      const sanitizeFilename = (name: string) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/gi, "_")
          .toLowerCase();
      };

      const fileExt = file.name.split('.').pop();
      const safeId = sanitizeFilename(selectedGroupId);
      const fileName = `${safeId}_${Date.now()}.${fileExt}`;
      const filePath = `tribe_logos/${fileName}`;

      await supabase.storage.createBucket('logos', { public: true });
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logoUrl: publicUrl }));
      
      const { error: dbError } = await supabase
        .from('groups')
        .update({ logoUrl: publicUrl })
        .eq('id', selectedGroupId);

      if (dbError) throw dbError;

      // Post automÃ¡tico no Mural anunciando o novo brasÃ£o
      const { FeedService } = await import('../lib/FeedService');
      await FeedService.autoPostGroupUpdate(profile!.id, selectedGroupId, 'logo', publicUrl).catch(console.error);

      success("BrasÃ£o Atualizado", "O novo escudo da tribo foi salvo.");
    } catch (err) {
      console.error("Logo upload error:", err);
      toastError("Erro no Upload", "NÃ£o foi possÃ­vel enviar o brasÃ£o.");
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroupId) return;

    setSaving(true);
    try {
      const sanitizeFilename = (name: string) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9.]/gi, "_")
          .toLowerCase();
      };

      const fileExt = file.name.split('.').pop();
      const safeId = sanitizeFilename(selectedGroupId);
      const fileName = `banner_${safeId}_${Date.now()}.${fileExt}`;
      const filePath = `tribe_banners/${fileName}`;

      await supabase.storage.createBucket('banners', { public: true });

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('groups')
        .update({ banner_url: publicUrl })
        .eq('id', selectedGroupId);

      if (dbError) throw dbError;
      setFormData(prev => ({ ...prev, banner_url: publicUrl }));
      success("Capa Atualizada", "O banner da tribo foi salvo.");
    } catch (err) {
      console.error("Banner upload error:", err);
      toastError("Erro no Upload", "NÃ£o foi possÃ­vel enviar a capa.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'admin' && selectedGroupId !== profile?.groupId) {
      toastError("Acesso Negado", "VocÃª nÃ£o tem permissÃ£o.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          slogan: formData.slogan,
          primaryColor: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          banner_url: formData.banner_url,
          instagram: formData.instagram,
          youtube: formData.youtube
        })
        .eq('id', selectedGroupId);
      if (error) throw error;
      success("ConfiguraÃ§Ãµes Salvas", "Os detalhes da tribo foram atualizados.");
    } catch (err) {
      console.error("Update error:", err);
      toastError("Erro ao Salvar", "Ocorreu um problema ao salvar as configuraÃ§Ãµes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBadge = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([{ ...newBadge, groupId: selectedGroupId }])
        .select()
        .single();
      if (error) throw error;
      setBadges([...badges, data]);
      setNewBadge({ name: '', icon: 'Award', points: 10, description: '' });
      success("Selo Criado", "O novo selo jÃ¡ estÃ¡ disponÃ­vel.");
    } catch (err) {
      console.error("Badge error:", err);
      toastError("Erro ao Criar", "NÃ£o foi possÃ­vel criar o selo.");
    }
  };

  const handleCreateCell = async () => {
    try {
      const { data, error } = await supabase
        .from('cells')
        .insert([{ ...newCell, groupId: selectedGroupId }])
        .select()
        .single();
      if (error) throw error;
      setCells([...cells, data]);
      setNewCell({ name: '', meetingDay: 'Sexta-feira', location: '' });
      success("CÃ©lula Criada", "A cÃ©lula foi registrada.");
    } catch (err) {
      console.error("Cell error:", err);
      toastError("Erro", "NÃ£o foi possÃ­vel criar a cÃ©lula.");
    }
  };

  const handleManualAward = async () => {
    if (!selectedAwardUser) return info("AtenÃ§Ã£o", "Selecione um guerreiro.");
    if (!selectedAwardKey) return info("AtenÃ§Ã£o", "Selecione uma honraria ou selo.");

    setAwarding(true);
    try {
      if (selectedAwardKey.startsWith('badge_')) {
        const badgeId = selectedAwardKey.replace('badge_', '');
        const badge = badges.find(b => b.id === badgeId);
        if (!badge) throw new Error("Selo nÃ£o encontrado");

        const { error } = await supabase
          .from('user_badges')
          .insert({ '"userId"': selectedAwardUser, '"badgeId"': badgeId, '"awardedBy"': profile.id });

        if (error) {
          if (error.code === '23505') info("JÃ¡ Possui", "Este guerreiro jÃ¡ possui este selo.");
          else throw error;
          return;
        }

        if (badge.points > 0) {
          await supabase.rpc('increment_points', {
            user_id: selectedAwardUser,
            group_id: selectedGroupId,
            pts: badge.points,
            reason: `Selo Recebido: ${badge.name}`
          });
        }

        await NotificationService.send(
          selectedAwardUser,
          'achievement',
          `ðŸ… SELO DA TRIBO: ${badge.name}`,
          `VocÃª recebeu o selo "${badge.name}"! ${badge.description || ''}`,
          `/dashboard/profile/${selectedAwardUser}`,
          profile?.avatar_url || profile?.avatarUrl
        );

        success("Selo Concedido", "O selo da tribo foi entregue com sucesso!");
      } else {
        const { error } = await supabase
          .from('user_achievements')
          .insert({ userId: selectedAwardUser, achievementKey: selectedAwardKey });

        if (error) {
          if (error.code === '23505') info("JÃ¡ Possui", "Este guerreiro jÃ¡ possui esta honraria.");
          else throw error;
          return;
        }

        const user = members.find(m => m.id === selectedAwardUser);
        const def = ACHIEVEMENT_DEFINITIONS[selectedAwardKey];

        if (def) {
          await supabase.rpc('increment_points', {
            user_id: selectedAwardUser,
            group_id: selectedGroupId,
            pts: def.points,
            reason: `Honraria Manual: ${def.name}`
          });

          await NotificationService.send(
            selectedAwardUser,
            'achievement',
            `ðŸ† HONRARIA RECEBIDA: ${def.name}`,
            `O lÃ­der da sua tribo te concedeu uma honraria especial: ${def.description}`,
            `/dashboard/profile/${selectedAwardUser}`,
            profile?.avatar_url || profile?.avatarUrl
          );

          if (def.rarity === 'epic' || def.rarity === 'legendary') {
            await supabase.from('messages').insert({
              senderId: 'system',
              senderName: 'SISTEMA ARENA',
              text: `ðŸ“¢ RECONHECIMENTO! O lÃ­der de ${group?.name} acaba de honrar ${user?.name} com o tÃ­tulo de "${def.name}"!`,
              groupId: 'global'
            });
          }
        }

        success("Honraria Concedida", "A honraria do sistema foi entregue com sucesso!");
      }
    } catch (err) {
      console.error("Honraria Error:", err);
      toastError("Erro", "Não foi possível conceder a honraria. Verifique o console.");
    } finally {
      setAwarding(false);
    }
  };

  const handleUpdateSystemAchievement = async (achievement: any) => {
    if (profile?.role !== 'admin') return;
    
    // Validar pontos para evitar NaN no banco
    const points = Number(achievement.points);
    if (isNaN(points)) {
      toastError("Erro", "O valor dos pontos deve ser um número válido.");
      return;
    }

    setSaving(true);
    try {
      console.log("[LeaderPanel] Atualizando conquista:", achievement.key);
      
      const { error } = await supabase
        .from('system_achievements')
        .upsert({
          key: achievement.key,
          name: achievement.name,
          description: achievement.description,
          points: points,
          icon: achievement.icon || 'Award',
          rarity: achievement.rarity || 'common',
          color: achievement.color || '#94a3b8',
          howToConquer: achievement.howToConquer,
          isActive: achievement.isActive
        }, { onConflict: 'key' });

      if (error) {
        console.error("[LeaderPanel] Erro detalhado do Supabase:", error);
        throw error;
      }
      
      success("Sucesso", "Configuração de honraria atualizada!");
      
      // Atualizar o estado local para refletir a mudança imediatamente sem recarregar a página
      setSystemAchievements(prev => prev.map(sa => 
        sa.key === achievement.key ? { ...sa, ...achievement, points } : sa
      ));

      setEditingAchievement(null);
    } catch (err: any) {
      console.error("Update error object:", err);
      toastError("Erro ao Salvar", err.message || "Falha ao atualizar honraria no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !group) return <div className="p-8 text-white font-black italic uppercase">Carregando painel...</div>;
  if (!profile || (profile.role !== 'leader' && profile.role !== 'admin')) {
    return <div className="p-8 text-red-500 font-black italic uppercase">Acesso negado.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-5xl font-black tracking-tighter leading-none uppercase text-white italic">Painel do Líder</h2>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-primary font-black italic uppercase tracking-widest text-xs">
                {profile.role === 'admin' ? 'Modo Administrador' : (selectedGroupId === profile.groupId ? `Sua Tribo: ${group?.name}` : `Visualizando: ${group?.name}`)}
              </p>
              {(profile.role === 'admin' || profile.role === 'leader') && allGroups.length > 0 && (
                <div className="relative group">
                  <select 
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-zinc-900 border-2 border-zinc-800 rounded-lg px-3 py-1 text-[10px] font-black uppercase text-white outline-none focus:border-primary appearance-none pr-8 cursor-pointer"
                  >
                    {profile.role === 'admin' && (
                      <option value="all">🌍 Todas as Tribos</option>
                    )}
                    {allGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex bg-zinc-900 border-4 border-zinc-800 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === 'layout'} onClick={() => setActiveTab('layout')} icon={<Settings size={18}/>} label="Layout" />
          <TabButton active={activeTab === 'validations'} onClick={() => setActiveTab('validations')} icon={<CheckCircle size={18}/>} label="Validações" />
          <TabButton active={activeTab === 'cells'} onClick={() => setActiveTab('cells')} icon={<Users size={18}/>} label="Células" />
          <TabButton active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} icon={<Award size={18}/>} label="Premiações & Selos" />
          <TabButton active={activeTab === 'mural'} onClick={() => setActiveTab('mural')} icon={<MessageSquare size={18}/>} label="Mural" />
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'layout' && (
            <motion.div
              key="layout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="card-premium space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                  <Users className="text-primary" /> Células da Tribo
                </h3>
                
                <div className="space-y-6">
                  {/* Brasão e Capa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Brasão Oficial</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-black border-2 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
                          {formData.logoUrl ? (
                            <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Upload size={24} className="text-zinc-700" />
                          )}
                        </div>
                        <label className="flex-1">
                          <div className={`bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase italic px-4 py-3 rounded-xl cursor-pointer transition-all text-center border-2 border-zinc-800 hover:border-primary text-[10px] tracking-widest shadow-lg ${!canEdit ? 'opacity-50 pointer-events-none' : ''}`}>
                            {saving ? 'Subindo...' : 'Mudar Brasão'}
                          </div>
                          {canEdit && <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={saving} />}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Capa da Tribo (Banner)</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-black border-2 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
                          {formData.banner_url ? (
                            <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="text-zinc-700" />
                          )}
                        </div>
                        <label className="flex-1">
                          <div className="bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase italic px-4 py-3 rounded-xl cursor-pointer transition-all text-center border-2 border-zinc-800 hover:border-primary text-[10px] tracking-widest shadow-lg">
                            Mudar Capa
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBannerUpload(e)} disabled={saving} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateGroup} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Grito de Guerra (Slogan)</label>
                      <input 
                        type="text"
                        value={formData.slogan}
                        onChange={e => setFormData({...formData, slogan: e.target.value})}
                        className="w-full bg-black/50 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-primary transition-all"
                        placeholder="Ex: Força e Honra!"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Cor Principal</label>
                        <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-full h-12 bg-black border-4 border-zinc-800 rounded-xl cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Cor de Sotaque</label>
                        <input type="color" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} className="w-full h-12 bg-black border-4 border-zinc-800 rounded-xl cursor-pointer" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Instagram (User)</label>
                        <input type="text" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary" placeholder="@tribo" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">YouTube (Canal)</label>
                        <input type="text" value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})} className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary" placeholder="Canal Tribo" />
                      </div>
                    </div>
                    <button 
                      disabled={saving || !canEdit}
                      className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase italic tracking-tighter hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                    >
                      <Save size={20} /> {saving ? 'Salvando...' : (canEdit ? 'Salvar Alterações' : 'Somente Leitura')}
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                   Visualização
                </h3>
                <div 
                  className="bg-zinc-900 border-4 rounded-[40px] p-8 shadow-2xl relative overflow-hidden transition-colors duration-500"
                  style={{ borderColor: formData.primaryColor }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-white rounded-bl-full" style={{ backgroundColor: formData.primaryColor }}></div>
                  <div className={`mb-6 flex items-center justify-center overflow-hidden ${!formData.logoUrl ? 'w-24 h-24 rounded-3xl border-4 shadow-lg' : 'w-auto h-28'}`} 
                    style={{ 
                      borderColor: formData.primaryColor, 
                      backgroundColor: formData.logoUrl ? 'transparent' : 'black' 
                    }}>
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="h-full w-auto object-contain" />
                    ) : (
                      group?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <h4 className="text-4xl font-black uppercase italic text-white mb-2">{group?.name || 'Tribo Selecionada'}</h4>
                  <p className="text-zinc-400 font-bold leading-relaxed">{formData.description || 'Sem descrição definida.'}</p>
                  
                  <div className="mt-8 flex gap-4">
                     <div className="bg-black/50 p-4 rounded-2xl flex-1 border-2 border-zinc-800">
                        <span className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Membros</span>
                        <span className="text-2xl font-black text-white">{group?.memberCount || 0}</span>
                     </div>
                     <div className="bg-black/50 p-4 rounded-2xl flex-1 border-2 border-zinc-800">
                        <span className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Pontos</span>
                        <span className="text-2xl font-black text-white">{group?.totalPoints || 0}</span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'validations' && (profile?.role === 'admin' || profile?.role === 'leader') && (
            <motion.div
              key="validations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-3xl">
                <h3 className="text-2xl font-black uppercase italic text-white mb-2">Aprovações Pendentes</h3>
                <p className="text-zinc-500 font-bold text-sm italic">Avalie os envios e libere os pontos para sua tribo.</p>
              </div>

              {pendingParticipations.length === 0 ? (
                <div className="p-20 text-center bg-zinc-900 border-4 border-dashed border-zinc-800 rounded-[40px]">
                   <Clock className="mx-auto text-zinc-800 mb-4" size={48} />
                   <p className="text-zinc-600 font-black uppercase italic text-xl">Nada para validar no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingParticipations.map(part => (
                    <div key={part.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-[32px] space-y-4 hover:border-primary transition-all group">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-black uppercase italic text-white">{part.activities.title}</h4>
                            <p className="text-primary font-black uppercase text-[10px] tracking-widest">{part.profiles.name}</p>
                          </div>
                          <span className="bg-black px-3 py-1 rounded-full text-primary font-black italic text-xs border border-zinc-800">
                            +{part.activities.points} pts
                          </span>
                       </div>

                       {part.proofUrl && (
                         <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-zinc-800">
                            {part.proofUrl.startsWith('http') && (part.proofUrl.includes('.jpg') || part.proofUrl.includes('.png') || part.proofUrl.includes('.webp')) ? (
                              <img src={part.proofUrl} alt="Prova" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                 <Eye className="text-zinc-700 mb-2" size={32} />
                                 <p className="text-zinc-500 font-bold text-[10px] uppercase leading-tight italic">{part.proofUrl}</p>
                                 <a href={part.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">
                                    <ExternalLink size={12} /> Ver Link Externo
                                 </a>
                              </div>
                            )}
                         </div>
                       )}

                       {canEdit && (
                         <div className="flex gap-3">
                            <button 
                              onClick={() => handleValidation(part, 'approved')}
                              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} /> Aprovar
                            </button>
                            <button 
                              onClick={() => handleValidation(part, 'rejected')}
                              className="flex-1 bg-zinc-800 hover:bg-red-600 text-zinc-500 hover:text-white font-black uppercase italic py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={18} /> Recusar
                            </button>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}



          {activeTab === 'mural' && (
            <motion.div
              key="mural"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <PostModerationPanel 
                groupId={profile?.role === 'admin' ? selectedGroupId : profile?.groupId} 
                isAdmin={profile?.role === 'admin'} 
              />
            </motion.div>
          )}

          {activeTab === 'cells' && (
            <motion.div
              key="cells"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-3xl">
                <h3 className="text-2xl font-black uppercase italic text-white mb-6">Cadastrar Nova Célula</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input 
                    placeholder="Nome da Célula"
                    value={newCell.name}
                    onChange={e => setNewCell({...newCell, name: e.target.value})}
                    className="bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  />
                  <select 
                    value={newCell.meetingDay}
                    onChange={e => setNewCell({...newCell, meetingDay: e.target.value})}
                    className="bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  >
                    <option>Segunda-feira</option>
                    <option>Terça-feira</option>
                    <option>Quarta-feira</option>
                    <option>Quinta-feira</option>
                    <option>Sexta-feira</option>
                    <option>Sábado</option>
                    <option>Domingo</option>
                  </select>
                  <input 
                    placeholder="Localização"
                    value={newCell.location}
                    onChange={e => setNewCell({...newCell, location: e.target.value})}
                    className="bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none md:col-span-1"
                  />
                  <button 
                    onClick={handleCreateCell}
                    className="bg-primary text-black py-3 rounded-xl font-black uppercase italic hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {cells.map(cell => (
                  <div key={cell.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl flex items-center justify-between hover:bg-zinc-800/50 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border-2 border-zinc-800 text-primary">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase italic text-white">{cell.name}</h4>
                        <div className="flex gap-4 mt-1">
                          <span className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-1">
                            <Calendar size={12} /> {cell.meetingDay}
                          </span>
                          <span className="text-zinc-500 text-[10px] font-black uppercase flex items-center gap-1">
                            <MapPin size={12} /> {cell.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="bg-zinc-800 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'achievements' && (
            <motion.div
              key="manual_achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-3xl">
                <h3 className="text-2xl font-black uppercase italic text-white mb-2">Conceder Troféu ou Selo</h3>
                <p className="text-zinc-500 font-bold text-sm italic">Reconheça guerreiros que foram além do esperado concedendo troféus oficiais do sistema ou selos da sua tribo.</p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">1. Selecionar Guerreiro</label>
                    <select 
                      value={selectedAwardUser}
                      onChange={e => setSelectedAwardUser(e.target.value)}
                      className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary"
                    >
                      <option value="">Selecione um membro...</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">2. Escolher Medalha/Selo</label>
                    <select 
                      value={selectedAwardKey}
                      onChange={e => setSelectedAwardKey(e.target.value)}
                      className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary"
                    >
                      <optgroup label="Medalhas do Sistema">
                        {Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => (
                          <option key={key} value={key}>
                            {def.rarity === 'legendary' ? '🏆' : def.rarity === 'epic' ? '🛡️' : '🎖️'} {def.name}
                          </option>
                        ))}
                      </optgroup>
                      {badges.length > 0 && (
                        <optgroup label="Selos da Tribo (Personalizados)">
                          {badges.map(badge => (
                            <option key={`badge_${badge.id}`} value={`badge_${badge.id}`}>
                              {badge.icon === 'Award' ? '🏆' : badge.icon === 'Star' ? '⭐' : badge.icon === 'Heart' ? '❤️' : badge.icon === 'Zap' ? '⚡' : '🛡️'} {badge.name} (+{badge.points} XP)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button 
                      onClick={handleManualAward}
                      disabled={awarding || !selectedAwardUser || !selectedAwardKey}
                      className="w-full bg-primary text-black py-4 rounded-xl font-black uppercase italic hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      <Plus size={20} /> {awarding ? 'Concedendo...' : 'Conceder Troféu'}
                    </button>
                  </div>

                  {selectedAwardKey && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="md:col-span-3 flex items-center gap-6 bg-black/40 p-6 rounded-4xl border-2 border-zinc-800 overflow-hidden relative group"
                    >
                       <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-black/60 rounded-3xl border border-white/5 relative z-10 shadow-2xl">
                          <Trophy3D 
                            icon={selectedAwardKey.startsWith('badge_') ? (badges.find(b => `badge_${b.id}` === selectedAwardKey)?.icon || 'Award') : (ACHIEVEMENT_DEFINITIONS[selectedAwardKey]?.icon || 'Award')} 
                            rarity={selectedAwardKey.startsWith('badge_') ? 'rare' : (ACHIEVEMENT_DEFINITIONS[selectedAwardKey]?.rarity as any || 'common')} 
                            size={60} 
                            isFloating={true}
                          />
                       </div>
                       <div className="flex-1 relative z-10">
                          <h4 className="text-white font-black uppercase italic text-xl leading-tight tracking-tighter">
                            {selectedAwardKey.startsWith('badge_') ? badges.find(b => `badge_${b.id}` === selectedAwardKey)?.name : ACHIEVEMENT_DEFINITIONS[selectedAwardKey]?.name}
                          </h4>
                          <p className="text-zinc-500 text-[11px] font-bold italic mt-2 leading-relaxed max-w-xl">
                            "{selectedAwardKey.startsWith('badge_') ? (badges.find(b => `badge_${b.id}` === selectedAwardKey)?.description || 'Reconhecimento de honra e mérito da tribo.') : ACHIEVEMENT_DEFINITIONS[selectedAwardKey]?.description}"
                          </p>
                       </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-3xl mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase italic text-white mb-2">Gestão de Troféus do Sistema (Admin)</h3>
                  <p className="text-zinc-500 font-bold text-sm italic">Configure os critérios globais de honra da Arena.</p>
                </div>
              </div>

              {(profile?.role === 'admin' || profile?.role === 'leader') && (
                <>
                  <div className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-3xl mt-8">
                    <h4 className="text-xl font-black uppercase italic text-white">Criar Novo Selo de Mérito</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Selo</label>
                        <input 
                          placeholder="Ex: Visitante VIP"
                          value={newBadge.name}
                          onChange={e => setNewBadge({...newBadge, name: e.target.value})}
                          className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pontos Bônus</label>
                        <input 
                          type="number"
                          placeholder="Pontos"
                          value={newBadge.points}
                          onChange={e => setNewBadge({...newBadge, points: Number(e.target.value)})}
                          disabled={profile?.role !== 'admin'}
                          className={`w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none ${
                            profile?.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : 'focus:border-primary'
                          }`}
                        />
                        {profile?.role !== 'admin' && (
                          <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Somente admins definem pontos</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estilo/Ícone</label>
                        <select 
                          value={newBadge.icon}
                          onChange={e => setNewBadge({...newBadge, icon: e.target.value})}
                          className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none"
                        >
                          <option value="Award">🏆 Troféu</option>
                          <option value="Star">⭐ Estrela</option>
                          <option value="Heart">❤️ Dedicação</option>
                          <option value="Zap">⚡ Energia</option>
                          <option value="Shield">🛡️ Proteção</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição do Motivo (Opcional)</label>
                        <input 
                          placeholder="Ex: Pelo esforço e dedicação contínua..."
                          value={newBadge.description || ''}
                          onChange={e => setNewBadge({...newBadge, description: e.target.value})}
                          className="w-full bg-black border-4 border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none"
                        />
                      </div>

                      <button 
                        onClick={handleCreateBadge}
                        disabled={!canEdit}
                        className="bg-primary text-black py-4 rounded-xl font-black uppercase italic hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale md:col-span-1"
                      >
                        <Plus size={20} /> {canEdit ? 'Criar Selo' : 'Bloqueado'}
                      </button>
                    </div>
                  </div>

                  {badges.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {badges.map(badge => (
                        <div key={badge.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl relative overflow-hidden group hover:border-primary transition-all">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                             <Award size={40} className="text-primary" />
                          </div>
                          <h4 className="text-xl font-black uppercase italic text-white leading-tight">{badge.name}</h4>
                          <p className="text-primary font-black text-sm">{badge.points} Pontos</p>
                          {badge.description && <p className="text-zinc-400 text-[10px] font-bold mt-2 leading-snug">{badge.description}</p>}
                          {canEdit && (
                            <div className="mt-4 flex gap-2">
                               <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase px-3 py-1 rounded-lg">Editar</button>
                               <button className="text-[10px] bg-red-950/30 hover:bg-red-900 text-red-500 font-black uppercase px-3 py-1 rounded-lg">Excluir</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {profile?.role === 'admin' && systemAchievements.length > 0 && (
                <div className="mt-12 space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-zinc-800"></div>
                      <h3 className="text-xl font-black uppercase italic text-zinc-500 tracking-tighter">Gestão de Troféus do Sistema (Admin)</h3>
                      <div className="h-[2px] flex-1 bg-zinc-800"></div>
                   </div>

                   {[
                     { label: '🟢 FÁCIL', rarities: ['common'] as string[], color: '#22c55e', borderCls: 'border-green-900/40' },
                     { label: '🔵 MÉDIO', rarities: ['rare'] as string[], color: '#3b82f6', borderCls: 'border-blue-900/40' },
                     { label: '🔴 DIFÍCIL', rarities: ['epic', 'legendary'] as string[], color: '#a855f7', borderCls: 'border-purple-900/40' },
                   ].map(sector => {
                     const list = systemAchievements.filter((sa: any) => sector.rarities.includes(sa.rarity));
                     if (list.length === 0) return null;
                     return (
                       <div key={sector.label} className="space-y-4">
                         <div className="flex items-center gap-3">
                           <div className="h-px w-6" style={{ background: sector.color }} />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: sector.color }}>
                             {sector.label} &mdash; {list.length} troféus
                           </span>
                           <div className="h-px flex-1" style={{ background: `${sector.color}30` }} />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {list.map((sa: any) => (
                             <div key={sa.id}
                                  className={`bg-zinc-950 p-5 shadow-inner border ${sector.borderCls} flex flex-col relative group hover:border-zinc-600 transition-all`}
                                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                               <div className="absolute inset-[3px] bg-linear-to-b from-zinc-900 to-zinc-950 border-t border-l border-zinc-800/30 z-0 pointer-events-none"
                                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }} />
                               <div className="flex justify-between items-start mb-3 relative z-10">
                                 <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                                     <svg width="0" height="0" className="absolute">
                                       <defs>
                                         <linearGradient id={`ag-${sa.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                           <stop offset="0%" stopColor="#FDE68A" />
                                           <stop offset="50%" stopColor="#F59E0B" />
                                           <stop offset="100%" stopColor="#B45309" />
                                         </linearGradient>
                                       </defs>
                                     </svg>
                                     <div className="group-hover:scale-110 transition-transform duration-500">
                                       {(() => {
                                         const Ic = (LucideIcons as any)[sa.icon || 'Award'] || LucideIcons.Award;
                                         return <Ic size={28} strokeWidth={1.5} style={{ stroke: `url(#ag-${sa.id})` }} />;
                                       })()}
                                     </div>
                                   </div>
                                   <div>
                                     <h4 className="text-base font-black uppercase tracking-tight leading-none text-white">{sa.name}</h4>
                                     <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">{sa.triggerType}</p>
                                   </div>
                                 </div>
                                 <button onClick={() => setEditingAchievement(sa)}
                                   className="text-primary hover:bg-primary/10 p-1.5 transition-all relative z-20"
                                   style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}>
                                   <Settings size={14} />
                                 </button>
                               </div>
                               <div className="flex justify-between items-end relative z-10 bg-black/40 px-3 py-1.5 border-t border-l border-zinc-800/50 mt-1"
                                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">XP: <span className="text-primary">{sa.points}</span></span>
                                 <span className={`text-[9px] font-black uppercase tracking-widest ${sa.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                   {sa.isActive ? 'Ativo' : 'Inativo'}
                                 </span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })}
                </div>
              )}

              <div className="bg-zinc-950/30 p-12 border-4 border-dashed border-zinc-900 rounded-[40px] text-center mt-8">
                 <Award className="mx-auto text-zinc-800 mb-4" size={48} />
                 <p className="text-zinc-600 font-black uppercase italic text-xl">O reconhecimento é o combustível do guerreiro.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {editingAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-lg relative shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
            >
              <div 
                className="absolute inset-[4px] bg-linear-to-b from-zinc-900 to-zinc-950 border-t border-l border-zinc-800/50 z-0 pointer-events-none"
                style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
              />

              <button 
                onClick={() => setEditingAchievement(null)}
                className="absolute top-0 right-6 w-12 h-8 bg-zinc-900 border-b border-x border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-all flex items-center justify-center z-20 shadow-lg"
                style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
              >
                <XCircle size={16} className="mb-1" />
              </button>

              <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto scrollbar-hide p-6 sm:p-8 pt-10">
                <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-6 text-center">
                  EDITAR Troféu
                </h3>
                
                <div className="flex justify-center mb-8 bg-black/40 py-8 relative overflow-hidden z-10 border-t border-l border-zinc-800/30"
                     style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                   <div className="absolute inset-[2px] bg-zinc-900/50 pointer-events-none" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} />
                   
                   <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full scale-150 pointer-events-none" />
                   <div className="relative z-10 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                     {(() => {
                        // Garantir que o nome do ícone esteja no formato correto (PascalCase)
                        const iconName = editingAchievement.icon || 'Award';
                        const ModalIcon = (LucideIcons as any)[iconName] || LucideIcons.Award;
                        return <ModalIcon size={100} strokeWidth={1.5} className="text-yellow-500" />;
                     })()}
                   </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-zinc-400 tracking-widest px-2">Nome da Conquista</label>
                    <input 
                      value={editingAchievement.name}
                      onChange={e => setEditingAchievement({...editingAchievement, name: e.target.value})}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Descrição/Objetivo</label>
                    <textarea 
                      value={editingAchievement.description}
                      onChange={e => setEditingAchievement({...editingAchievement, description: e.target.value})}
                      rows={2}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 resize-none transition-colors"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Critério de Desbloqueio (Como Conquistar)</label>
                    <textarea 
                      value={editingAchievement.howToConquer || ''}
                      onChange={e => setEditingAchievement({...editingAchievement, howToConquer: e.target.value})}
                      rows={2}
                      placeholder="Ex: Complete 10 tarefas oficiais da tribo."
                      className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 resize-none transition-colors placeholder:text-zinc-700"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Pontos Bônus</label>
                      <input 
                        type="number"
                        value={editingAchievement.points}
                        onChange={e => setEditingAchievement({...editingAchievement, points: Number(e.target.value)})}
                        className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors"
                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Status</label>
                      <select 
                        value={editingAchievement.isActive ? 'true' : 'false'}
                        onChange={e => setEditingAchievement({...editingAchievement, isActive: e.target.value === 'true'})}
                        className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors"
                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3 relative z-10">
                  <button 
                    onClick={() => setEditingAchievement(null)}
                    className="flex-1 bg-zinc-900 border-t border-l border-zinc-800 text-zinc-400 py-4 font-black uppercase tracking-widest hover:text-white transition-all"
                    style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleUpdateSystemAchievement(editingAchievement)}
                    disabled={saving}
                    className="flex-1 bg-yellow-500 text-black py-4 font-black uppercase tracking-tighter hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50"
                    style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter transition-all whitespace-nowrap ${
        active ? 'bg-primary text-black' : 'text-zinc-500 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}
