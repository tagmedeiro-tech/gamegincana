/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Settings, Save, Palette, Type, Landmark, Check, Plus, Trash2,
  Shield, Trophy, Cross, Star, Flame, Crown, Zap, Globe, Link,
  MessageCircle, BarChart2, Eye, EyeOff, Layout, Brush, Upload, ImageIcon, X as XIcon, ShoppingBag, BookOpen, CheckSquare, LogIn, Loader2, Scroll, Swords, Users, Coins, Calendar, MapPin, Navigation, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTheme, CustomTab } from '../hooks/useAppTheme';
import { getCurrentLocation } from '../lib/nativeCapabilities';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { useAutoSaveDraft } from '../hooks/useAutoSaveDraft';

const LOGO_OPTIONS = [
  { id: 'landmark', label: 'Igreja', icon: <Landmark size={28} /> },
  { id: 'shield', label: 'Escudo', icon: <Shield size={28} /> },
  { id: 'trophy', label: 'Troféu', icon: <Trophy size={28} /> },
  { id: 'cross', label: 'Cruz', icon: <Cross size={28} /> },
  { id: 'star', label: 'Estrela', icon: <Star size={28} /> },
  { id: 'flame', label: 'Fogo', icon: <Flame size={28} /> },
  { id: 'crown', label: 'Coroa', icon: <Crown size={28} /> },
  { id: 'zap', label: 'Raio', icon: <Zap size={28} /> },
];

const COLOR_PRESETS = [
  { label: 'Ouro', value: '#FBBF24' },
  { label: 'Roxo', value: '#8B5CF6' },
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Verde', value: '#10B981' },
  { label: 'Laranja', value: '#F97316' },
  { label: 'Rosa', value: '#EC4899' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Ciano', value: '#06B6D4' },
];

const TABS_CONFIG = [
  { key: 'settingsTab', label: 'Identidade Visual', icon: <Brush size={16} /> },
  { key: 'modulesTab', label: 'Módulos & Navegação', icon: <Layout size={16} /> },
  { key: 'loginTab', label: 'Página de Login', icon: <LogIn size={16} /> },
  { key: 'tabsTab', label: 'Abas Personalizadas', icon: <Globe size={16} /> },
  { key: 'gpsTab', label: 'Check-in GPS', icon: <MapPin size={16} /> },
];

const DEFAULT_CONFIG: AppTheme = {
  primaryColor: '#FBBF24',
  accentColor: '#F59E0B',
  appName: 'TRIBO IDE',
  churchName: 'Igreja do Evangelho',
  logoType: 'landmark',
  welcomeMessage: 'Bem-vindo à Gincana da Tribo!',
  seasonLabel: 'Temporada 2024',
  showRanking: true,
  showChat: true,
  showBible: true,
  showStore: true,
  showFeed: true,
  showActivities: true,
  showReadingPlans: true,
  showDuel: true,
  showMyGroup: true,
  showCalendar: true,
  showVoxel: true,
  customTabs: [],
  loginTitle: 'Acesso à Tribo',
  loginSubtitle: 'Seja bem-vindo soldado!',
  loginButtonText: 'ENTRAR NA BATALHA',
  registerButtonText: 'Cadastre-se Agora',
  autoDevotional: {
    startDate: new Date().toISOString().split('T')[0],
    startBookId: 'GEN',
    startChapter: 1,
    points: 15,
    enabled: true,
    mode: 'linear'
  },
  duelSettings: {
    totalQuestions: 10,
    questionTime: 20,
    winPoints: 60,
    drawPoints: 30,
    lossPoints: 15,
    winCoins: 20,
    drawCoins: 10,
    lossCoins: 5,
    waitTimeBetweenQuestions: 1500
  }
};

function getLogoIcon(type: string, size = 32) {
  switch (type) {
    case 'shield': return <Shield size={size} className="text-black" />;
    case 'trophy': return <Trophy size={size} className="text-black" />;
    case 'cross': return <Cross size={size} className="text-black" />;
    case 'star': return <Star size={size} className="text-black" />;
    case 'flame': return <Flame size={size} className="text-black" />;
    case 'crown': return <Crown size={size} className="text-black" />;
    case 'zap': return <Zap size={size} className="text-black" />;
    default: return <Landmark size={size} className="text-black" />;
  }
}

export default function AdminSettings() {
  const { signOut } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [config, setConfig] = useState<AppTheme>(DEFAULT_CONFIG);
  const [serverConfig, setServerConfig] = useState<AppTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('settingsTab');
  const [newTab, setNewTab] = useState<Omit<CustomTab, 'id'>>({ label: '', url: '', icon: 'globe', enabled: true });
  const [groups, setGroups] = useState<{id: string, name: string}[]>([]);

  const { hasDraft, setHasDraft, saveDraft, getDraft, clearDraft } = useAutoSaveDraft<AppTheme>('draft_admin_settings', serverConfig);

  useEffect(() => {
    if (serverConfig) saveDraft(config);
  }, [config, saveDraft, serverConfig]);

  const handleRestoreDraft = () => {
    const draft = getDraft();
    if (draft) {
      setConfig(draft);
      setHasDraft(false);
      info('Rascunho Restaurado', 'As alterações não salvas foram recuperadas.');
    }
  };

  const handleClearDraft = () => {
    clearDraft();
    if (serverConfig) setConfig(serverConfig);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await supabase.from('groups').select('id, name').order('name');
        if (data) setGroups(data);
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('value')
          .eq('key', 'app')
          .single();

        if (data?.value && !error) {
          const fetchedConfig = { ...DEFAULT_CONFIG, ...(data.value as AppTheme) };
          setServerConfig(fetchedConfig);
          setConfig(fetchedConfig);
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    const channelId = `admin-settings-sync-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: 'key=eq.app' }, (payload) => {
        const newData = payload.new as { value?: AppTheme };
        if (newData?.value) {
          setConfig({ ...DEFAULT_CONFIG, ...newData.value });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    console.log('Iniciando salvamento de configurações:', config);
    
    try {
      console.log('Dados a serem salvos:', JSON.stringify(config, null, 2));
      
      // Criar um timeout de 10 segundos para não ficar "rodando" pra sempre
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tempo de resposta excedido (Timeout). O servidor do Supabase não respondeu a tempo.')), 10000)
      );

      // Re-idrata sessão caso aba ociosa
      await supabase.auth.getSession();

      const savePromise = supabase
        .from('config')
        .upsert({ 
          key: 'app', 
          value: config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      const result = await Promise.race([savePromise, timeoutPromise]) as any;
      const { error } = result;

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        throw error;
      }
      
      console.log('Configurações salvas com sucesso!');
      clearDraft();
      setServerConfig(config);
      success("Configurações Salvas", "As alterações globais foram aplicadas.");
    } catch (err: any) {
      console.error('Falha ao salvar configurações:', err);
      toastError("Erro ao Salvar", err.message || "Ocorreu um erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/(jpg|jpeg|png|webp|svg\+xml)$/i)) {
      info('Formato Inválido', 'Por favor, selecione uma imagem válida (PNG, JPG, SVG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      info('Arquivo Muito Grande', 'A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    try {
      await supabase.storage.createBucket('logos', { public: true });

      const ext = file.name.split('.').pop() ?? 'png';
      const path = `app-logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
      setConfig(prev => ({ ...prev, logoUrl: `${publicUrl}?t=${Date.now()}` }));
      success('Upload Completo', 'O novo logotipo foi atualizado.');
    } catch (err) {
      console.error(err);
      toastError('Erro no Upload', 'Verifique se o Storage está habilitado no Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const addCustomTab = () => {
    if (!newTab.label || !newTab.url) return;
    const tab: CustomTab = { ...newTab, id: Date.now().toString() };
    setConfig({ ...config, customTabs: [...(config.customTabs || []), tab] });
    setNewTab({ label: '', url: '', icon: 'globe', enabled: true });
  };

  const removeCustomTab = (id: string) => {
    setConfig({ ...config, customTabs: config.customTabs.filter(t => t.id !== id) });
  };

  const toggleCustomTab = (id: string) => {
    setConfig({
      ...config,
      customTabs: config.customTabs.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t)
    });
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Personalização do App</h2>
          <p className="text-zinc-500 font-bold italic">Customize a identidade, módulos e abas da sua gincana</p>
        </div>
        <div className="flex items-center gap-4">
          {hasDraft && (
            <div className="flex bg-amber-500/10 border-2 border-amber-500/20 rounded-xl overflow-hidden p-1 gap-1">
              <button 
                onClick={handleRestoreDraft}
                className="px-4 py-2 text-[10px] md:text-xs font-black uppercase italic tracking-widest text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Restaurar Rascunho
              </button>
              <button 
                onClick={handleClearDraft}
                className="px-4 py-2 text-[10px] md:text-xs font-black uppercase italic text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Descartar
              </button>
            </div>
          )}
          <div className="bg-primary/10 p-3 rounded-xl border-2 border-primary/20 text-primary hidden sm:block">
            <Settings size={32} />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-zinc-900 p-2 rounded-2xl border-2 border-zinc-800">
        {TABS_CONFIG.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-black shadow-lg'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <AnimatePresence mode="wait">

          {/* ─── ABA 1: Identidade Visual ─────────────────────── */}
          {activeTab === 'settingsTab' && (
            <motion.div key="identity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* Nome & Igreja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-bold bg-zinc-900 border-primary space-y-5">
                  <div className="flex items-center gap-2">
                    <Type className="text-primary" size={18} />
                    <h3 className="font-black uppercase italic tracking-tighter text-white">Textos & Identidade</h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nome do Aplicativo</label>
                    <input type="text" value={config.appName}
                      onChange={e => setConfig({ ...config, appName: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nome da Igreja / Instituição</label>
                    <input type="text" value={config.churchName}
                      onChange={e => setConfig({ ...config, churchName: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Mensagem de Boas-vindas</label>
                    <input type="text" value={config.welcomeMessage}
                      onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Rótulo da Temporada</label>
                    <input type="text" value={config.seasonLabel}
                      onChange={e => setConfig({ ...config, seasonLabel: e.target.value })}
                      placeholder="ex: Temporada 2024"
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                </div>

                {/* Cores */}
                <div className="card-bold bg-zinc-900 border-primary space-y-5">
                  <div className="flex items-center gap-2">
                    <Palette className="text-primary" size={18} />
                    <h3 className="font-black uppercase italic tracking-tighter text-white">Cores do Tema</h3>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Cor Primária</label>
                    <div className="flex gap-3 items-center mb-3">
                      <input type="color" value={config.primaryColor}
                        onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" />
                      <input type="text" value={config.primaryColor}
                        onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                        className="flex-1 bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-mono font-bold outline-none uppercase" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {COLOR_PRESETS.map(c => (
                        <button key={c.value} type="button" title={c.label}
                          onClick={() => setConfig({ ...config, primaryColor: c.value })}
                          className={`h-10 rounded-lg transition-all hover:scale-110 ${config.primaryColor === c.value ? 'ring-4 ring-white scale-110' : ''}`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="card-bold bg-zinc-900 border-primary">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="text-primary" size={18} />
                  <h3 className="font-black uppercase italic tracking-tighter text-white">Ícone do Logo</h3>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {LOGO_OPTIONS.map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => setConfig({ ...config, logoType: opt.id })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        config.logoType === opt.id
                          ? 'border-primary bg-primary text-black scale-105'
                          : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {React.cloneElement(opt.icon, { size: 28 })}
                      <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Upload Custom Logo */}
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Ou faça upload de uma imagem personalizada</p>
                  <div className="flex items-start gap-4">
                    {/* Preview of uploaded logo */}
                    {config.logoUrl ? (
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary">
                          <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain bg-zinc-800" />
                        </div>
                        <button type="button"
                          onClick={() => setConfig(prev => ({ ...prev, logoUrl: undefined }))}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-500 transition-all">
                          <XIcon size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 shrink-0">
                        <ImageIcon size={28} />
                      </div>
                    )}

                    <div className="flex-1">
                      <label className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        uploading ? 'border-primary/50 bg-primary/5' : 'border-zinc-700 hover:border-primary hover:bg-primary/5'
                      }`}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                        />
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={24} className="text-zinc-500" />
                            <div className="text-center">
                              <p className="text-[11px] font-black uppercase tracking-widest text-white">Clique para selecionar</p>
                              <p className="text-[10px] font-bold text-zinc-500 mt-1">PNG, JPG, SVG, WEBP • Máx. 2MB</p>
                            </div>
                          </>
                        )}
                      </label>
                      {config.logoUrl && (
                        <p className="text-[10px] text-green-500 font-black mt-2 flex items-center gap-1">
                          <Check size={12} /> Imagem personalizada ativa — sobrepõe o ícone selecionado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-8 bg-zinc-900 border-4 border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500 font-bold italic mb-6 text-center text-[10px] uppercase tracking-widest">Pré-visualização</p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <div className={`flex items-center justify-center overflow-hidden ${!config.logoUrl ? 'w-20 h-20 rounded-2xl shadow-2xl' : 'w-auto h-24'}`}
                    style={{ backgroundColor: config.logoUrl ? 'transparent' : config.primaryColor }}>
                    {config.logoUrl
                      ? <img src={config.logoUrl} alt="Logo" className="h-full w-auto object-contain" />
                      : getLogoIcon(config.logoType, 36)
                    }
                  </div>
                  <div>
                    <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">
                      {config.appName.split(' ')[0]}
                      <span style={{ color: config.primaryColor }}>{' '}{config.appName.split(' ').slice(1).join(' ')}</span>
                    </h4>
                    <p className="text-[9px] font-black tracking-[0.4em] text-zinc-500 uppercase mt-1">{config.churchName}</p>
                    <p className="text-xs font-bold italic text-zinc-600 mt-1">{config.seasonLabel}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ABA 2: Módulos & Navegação ────────────────────── */}
          {activeTab === 'modulesTab' && (
            <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="card-bold bg-zinc-900 border-primary">
                <div className="flex items-center gap-2 mb-6">
                  <Layout className="text-primary" size={18} />
                  <h3 className="font-black uppercase italic tracking-tighter text-white">Módulos Visíveis</h3>
                </div>
                <p className="text-zinc-500 text-sm font-bold mb-6">Controle quais seções aparecem no menu lateral para os participantes.</p>

                <div className="space-y-4">
                  {[
                    { key: 'showRanking', label: 'Ranking das Tribos', desc: 'Exibe a aba de classificação geral das tribos', icon: <BarChart2 size={20} className="text-primary" /> },
                    { key: 'showChat', label: 'Chat Geral', desc: 'Permite que os participantes acessem o chat comunitário', icon: <MessageCircle size={20} className="text-primary" /> },
                    { key: 'showBible', label: 'Leitor Bíblico', desc: 'Disponibiliza acesso à Bíblia e aos desafios de conhecimento', icon: <BookOpen size={20} className="text-primary" /> },
                    { key: 'showStore', label: 'Loja de Prêmios', desc: 'Habilita a vitrine de prêmios que podem ser resgatados com XP', icon: <ShoppingBag size={20} className="text-primary" /> },
                    { key: 'showFeed', label: 'Mural de Atualizações', desc: 'Mostra o feed de atividades e conquistas recentes', icon: <Flame size={20} className="text-primary" /> },
                    { key: 'showActivities', label: 'Aba de Atividades', desc: 'Permite visualização e lançamento manual de atividades', icon: <CheckSquare size={20} className="text-primary" /> },
                    { key: 'showReadingPlans', label: 'Planos de Leitura', desc: 'Habilita o sistema de leitura bíblica diária com XP', icon: <Scroll size={20} className="text-primary" /> },
                    { key: 'showDuel', label: 'Duelo Sagrado', desc: 'Habilita o sistema de batalhas bíblicas em tempo real', icon: <Swords size={20} className="text-primary" /> },
                    { key: 'showMyGroup', label: 'Página Meu Grupo', desc: 'Habilita a aba de detalhes e chat da própria tribo', icon: <Users size={20} className="text-primary" /> },
                    { key: 'showCalendar', label: 'Agenda & Eventos', desc: 'Exibe o calendário oficial de gincanas e lives', icon: <Calendar size={20} className="text-primary" /> },
                    { key: 'showVoxel', label: 'Arena Voxel', desc: 'Habilita o acesso ao metaverso 3D da gincana', icon: <Globe size={20} className="text-primary" /> },
                  ].map(mod => (
                    <div key={mod.key} className="flex items-center justify-between p-5 bg-black rounded-2xl border-2 border-zinc-800 hover:border-zinc-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-xl">{mod.icon}</div>
                        <div>
                          <p className="text-white font-black uppercase text-sm">{mod.label}</p>
                          <p className="text-zinc-500 text-[11px] font-bold">{mod.desc}</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => setConfig({ ...config, [mod.key]: !config[mod.key as keyof AppTheme] })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${
                          config[mod.key as keyof AppTheme]
                            ? 'bg-primary text-black'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {config[mod.key as keyof AppTheme] ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{config[mod.key as keyof AppTheme] ? 'Ativo' : 'Oculto'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ABA LOGIN: Textos de Acesso ────────────────────── */}
          {activeTab === 'loginTab' && (
            <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="card-bold bg-zinc-900 border-primary space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn className="text-primary" size={18} />
                  <h3 className="font-black uppercase italic tracking-tighter text-white">Customização do Login</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Título de Acesso</label>
                    <input type="text" value={config.loginTitle}
                      onChange={e => setConfig({ ...config, loginTitle: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Subtítulo / Mensagem Auxiliar</label>
                    <input type="text" value={config.loginSubtitle}
                      onChange={e => setConfig({ ...config, loginSubtitle: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Texto do Botão de Entrada</label>
                    <input type="text" value={config.loginButtonText}
                      onChange={e => setConfig({ ...config, loginButtonText: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Chamada para Cadastro (Pergunta)</label>
                    <input type="text" value={config.registerPrompt}
                      onChange={e => setConfig({ ...config, registerPrompt: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Texto do Link de Cadastro</label>
                    <input type="text" value={config.registerButtonText}
                      onChange={e => setConfig({ ...config, registerButtonText: e.target.value })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                </div>
                {/* WhatsApp Links Section */}
                <div className="mt-10 pt-10 border-t border-zinc-800 space-y-6">
                   <div className="flex items-center gap-2">
                      <MessageCircle className="text-green-500" size={20} />
                      <h3 className="font-black uppercase italic tracking-tighter text-white">Links de WhatsApp das Tribos</h3>
                   </div>
                   <p className="text-zinc-500 text-xs font-bold italic">Esses links serão exibidos na tela de sucesso após o cadastro do membro.</p>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {groups.map(tribe => (
                        <div key={tribe.id} className="flex flex-col md:flex-row gap-4 items-center bg-black/40 p-4 rounded-2xl border border-zinc-800">
                          <div className="w-full md:w-48 shrink-0">
                             <label className="text-[10px] font-black uppercase text-zinc-600">{tribe.name}</label>
                          </div>
                          <input 
                            type="url" 
                            placeholder="https://chat.whatsapp.com/..."
                            value={config.whatsappLinks?.[tribe.id] || ''}
                            onChange={e => setConfig({
                              ...config,
                              whatsappLinks: {
                                ...(config.whatsappLinks || {}),
                                [tribe.id]: e.target.value
                              }
                            })}
                            className="flex-1 w-full bg-zinc-900 border-2 border-zinc-800 focus:border-green-500/50 p-3 rounded-xl text-white font-bold outline-none"
                          />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Preview Mobile do Login */}
                <div className="mt-10 p-10 bg-black rounded-[3rem] border-4 border-zinc-800 max-w-sm mx-auto shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                   <div className="relative z-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-primary mx-auto flex items-center justify-center">
                        {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover rounded-full" /> : <Shield className="text-primary" />}
                      </div>
                      <h4 className="text-2xl font-black text-white italic uppercase leading-none">{config.loginTitle}</h4>
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{config.loginSubtitle}</p>
                      <div className="h-12 bg-primary rounded-xl flex items-center justify-center text-xs font-black italic">{config.loginButtonText}</div>
                      <div className="pt-4 border-t border-zinc-900">
                        <p className="text-[7px] text-zinc-600 font-black uppercase">{config.registerPrompt}</p>
                        <p className="text-[10px] text-primary font-black uppercase italic">{config.registerButtonText}</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}



          {/* ─── ABA 3: Abas Personalizadas ─────────────────────── */}
          {activeTab === 'tabsTab' && (
            <motion.div key="tabs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="card-bold bg-zinc-900 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="text-primary" size={18} />
                  <h3 className="font-black uppercase italic tracking-tighter text-white">Abas Personalizadas</h3>
                </div>
                <p className="text-zinc-500 text-sm font-bold mb-6">Adicione links externos ou páginas personalizadas ao menu de navegação.</p>

                {/* Add new tab */}
                <div className="p-5 bg-black rounded-2xl border-2 border-dashed border-zinc-700 mb-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nova Aba</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Nome da Aba</label>
                      <input type="text" value={newTab.label} placeholder="ex: Fotos do Evento"
                        onChange={e => setNewTab({ ...newTab, label: e.target.value })}
                        className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">URL do Link</label>
                      <input type="url" value={newTab.url} placeholder="https://..."
                        onChange={e => setNewTab({ ...newTab, url: e.target.value })}
                        className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                    </div>
                  </div>
                  <button type="button" onClick={addCustomTab}
                    disabled={!newTab.label || !newTab.url}
                    className="flex items-center gap-2 bg-primary text-black font-black uppercase text-[11px] tracking-widest px-5 py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <Plus size={16} /> Adicionar Aba
                  </button>
                </div>

                {/* Existing tabs */}
                {(!config.customTabs || config.customTabs.length === 0) ? (
                  <div className="text-center py-10 text-zinc-600">
                    <Globe size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-black uppercase text-sm">Nenhuma aba personalizada criada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.customTabs.map(tab => (
                      <div key={tab.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${tab.enabled ? 'border-primary/30 bg-primary/5' : 'border-zinc-800 bg-black opacity-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/20 p-2 rounded-lg">
                            <Link size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-black uppercase text-sm">{tab.label}</p>
                            <p className="text-zinc-500 text-[11px] font-mono truncate max-w-[200px]">{tab.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleCustomTab(tab.id)}
                            className={`p-2 rounded-lg transition-all ${tab.enabled ? 'text-primary hover:bg-primary/20' : 'text-zinc-600 hover:bg-zinc-800'}`}>
                            {tab.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button type="button" onClick={() => removeCustomTab(tab.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/20 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── ABA 4: Check-in GPS ─────────────────────── */}
          {activeTab === 'gpsTab' && (
            <motion.div key="gps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="card-bold bg-zinc-900 border-primary space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="text-primary" size={18} />
                  <h3 className="font-black uppercase italic tracking-tighter text-white">Configuração de Check-in Presencial</h3>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-black rounded-2xl border-2 border-zinc-800">
                  <div>
                    <p className="text-white font-black uppercase text-sm">Ativar Check-in por GPS</p>
                    <p className="text-zinc-500 text-[11px] font-bold">Habilita o widget de check-in geográfico no dashboard dos usuários.</p>
                  </div>
                  <button type="button"
                    onClick={() => setConfig({ 
                      ...config, 
                      checkinLocation: { ...(config.checkinLocation || { latitude: 0, longitude: 0, radius: 100, label: 'Sede', points: 50, enabled: false }), enabled: !config.checkinLocation?.enabled } 
                    })}
                    className={`px-4 py-2 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all ${
                      config.checkinLocation?.enabled ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {config.checkinLocation?.enabled ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <button
                      type="button"
                      onClick={async () => {
                        const loc = await getCurrentLocation();
                        if (loc) {
                          setConfig({
                            ...config,
                            checkinLocation: {
                              ...(config.checkinLocation || { radius: 100, label: 'Sede', points: 50, enabled: true }),
                              latitude: loc.latitude,
                              longitude: loc.longitude
                            }
                          });
                          success("Localização Capturada", "Coordenadas atualizadas com base na sua posição atual.");
                        } else {
                          toastError("Erro", "Não foi possível obter sua localização. Verifique as permissões.");
                        }
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-800 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-zinc-700 transition-all border border-zinc-700"
                    >
                      <Navigation size={20} />
                      Usar Minha Localização Atual
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Latitude</label>
                    <input type="number" step="any" value={config.checkinLocation?.latitude || 0}
                      onChange={e => setConfig({ ...config, checkinLocation: { ...(config.checkinLocation || { longitude: 0, radius: 100, label: 'Sede', points: 50, enabled: true }), latitude: parseFloat(e.target.value) } })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Longitude</label>
                    <input type="number" step="any" value={config.checkinLocation?.longitude || 0}
                      onChange={e => setConfig({ ...config, checkinLocation: { ...(config.checkinLocation || { latitude: 0, radius: 100, label: 'Sede', points: 50, enabled: true }), longitude: parseFloat(e.target.value) } })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Raio de Alcance (Metros)</label>
                    <input type="number" value={config.checkinLocation?.radius || 100}
                      onChange={e => setConfig({ ...config, checkinLocation: { ...(config.checkinLocation || { latitude: 0, longitude: 0, label: 'Sede', points: 50, enabled: true }), radius: parseInt(e.target.value) } })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Nome do Local</label>
                    <input type="text" value={config.checkinLocation?.label || ''}
                      onChange={e => setConfig({ ...config, checkinLocation: { ...(config.checkinLocation || { latitude: 0, longitude: 0, radius: 100, points: 50, enabled: true }), label: e.target.value } })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Pontos ao Confirmar</label>
                    <input type="number" value={config.checkinLocation?.points || 50}
                      onChange={e => setConfig({ ...config, checkinLocation: { ...(config.checkinLocation || { latitude: 0, longitude: 0, radius: 100, label: 'Sede', enabled: true }), points: parseInt(e.target.value) } })}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none transition-colors" />
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-400 shrink-0 mt-1" />
                  <p className="text-[10px] font-bold text-blue-400/80 leading-relaxed uppercase tracking-widest">
                    Dica: Posicione-se no centro do local do evento e clique em "Usar Minha Localização Atual" para capturar as coordenadas exatas. O raio de 100m costuma ser ideal para igrejas e ginásios.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Save Button */}
        <div className="mt-8">
          <button type="submit" disabled={saving}
            className="w-full py-5 rounded-2xl font-black uppercase italic tracking-tighter text-2xl flex items-center justify-center gap-3 transition-all bg-primary text-black active:scale-95 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={28} /> SALVANDO...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={28} /> APLICAR ALTERAÇÕES
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
