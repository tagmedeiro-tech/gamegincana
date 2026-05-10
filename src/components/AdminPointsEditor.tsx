import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Search, ToggleLeft, ToggleRight, Edit3, Check, RotateCcw, 
  Zap, AlertCircle, Plus, X, Trash2, Coins, Save,
  BookOpen, Users, UserPlus, UserCheck, Heart, Trophy, Calendar, Crown, 
  MessageSquare, Layout, Sparkles, Target, Star, Shield, Gem, Gift
} from 'lucide-react';
import { ActivityDefinition, ActivityCategory } from '../types';
import { ActivityService, CATEGORY_LABELS } from '../lib/ActivityService';
import LoadingSpinner from './LoadingSpinner';

// Formulário padrão para nova atividade
const emptyForm = (): Omit<ActivityDefinition, 'id' | 'created_at' | 'updated_at'> => ({
  key: '',
  title: '',
  description: '',
  category: 'presenca',
  default_points: 10,
  current_points: 10,
  icon: '⭐',
  max_per_week: null,
  is_active: true,
  requires_proof: false,
  coin_reward: 0,
});

// Mapeamento de nomes de ícones para componentes Lucide
const ICON_MAP: Record<string, any> = {
  BookOpen, Users, UserPlus, UserCheck, Heart, Trophy, Calendar, Crown,
  MessageSquare, Layout, Sparkles, Target, Star, Shield, Gem, Gift, Zap, Coins
};

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  // Se for um emoji (caractere especial), renderiza como texto
  const isEmoji = /\p{Emoji}/u.test(name);
  
  if (!isEmoji && ICON_MAP[name]) {
    const IconComponent = ICON_MAP[name];
    return <IconComponent className={className} size={20} />;
  }
  
  return <span className={className}>{name || '⭐'}</span>;
};

export default function AdminPointsEditor() {
  const [activities, setActivities] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activityForm, setActivityForm] = useState(emptyForm());
  const [processing, setProcessing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    ActivityService.getAll().then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!activityForm.title.trim() || !activityForm.key.trim()) return;
    setProcessing(true);
    
    if (editingId) {
      const ok = await ActivityService.update(editingId, {
        ...activityForm,
        default_points: activityForm.current_points
      });
      if (ok) {
        setActivities(prev => prev.map(a => a.id === editingId ? { ...a, ...activityForm, default_points: activityForm.current_points } : a));
        setSavedIds(prev => new Set(prev).add(editingId));
        setTimeout(() => setSavedIds(prev => { const s = new Set(prev); s.delete(editingId); return s; }), 2000);
        setShowModal(false);
        setEditingId(null);
      }
    } else {
      const key = activityForm.key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const created = await ActivityService.create({ ...activityForm, key, default_points: activityForm.current_points });
      if (created) {
        setActivities(prev => [...prev, created]);
        setActivityForm(emptyForm());
        setShowModal(false);
      }
    }
    setProcessing(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remover esta atividade? Esta ação não pode ser desfeita.')) return;
    const ok = await ActivityService.remove(id);
    if (ok) setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleEditStart = (activity: ActivityDefinition) => {
    setEditingId(activity.id);
    setActivityForm({
      key: activity.key,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      default_points: activity.default_points,
      current_points: activity.current_points,
      icon: activity.icon,
      max_per_week: activity.max_per_week,
      is_active: activity.is_active,
      requires_proof: activity.requires_proof,
      coin_reward: activity.coin_reward || 0,
    });
    setShowModal(true);
  };

  const handleToggle = async (activity: ActivityDefinition) => {
    const newState = !activity.is_active;
    const ok = await ActivityService.toggleActive(activity.id, newState);
    if (ok) {
      setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, is_active: newState } : a));
    }
  };

  const handleReset = async (activity: ActivityDefinition) => {
    const ok = await ActivityService.update(activity.id, { current_points: activity.default_points });
    if (ok) {
      setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, current_points: activity.default_points } : a));
    }
  };

  const filtered = activities.filter(a => {
    const matchCategory = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)] as (ActivityCategory | 'all')[];

  const totalActive = activities.filter(a => a.is_active).length;
  const totalPoints = activities.filter(a => a.is_active).reduce((sum, a) => sum + a.current_points, 0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
      {/* ── HEADER & STATS ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Settings size={18} className="animate-spin-slow" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary/80 text-nowrap">Gestão de Recompensas</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-tight md:leading-none">
            Tabela de <span className="text-primary drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">Pontuações</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm md:text-base max-w-lg leading-relaxed">
            Configure o equilíbrio da gincana ajustando XP e moedas para cada atividade ministerial.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 shrink-0 w-full lg:w-auto">
          <div className="group bg-zinc-900/50 backdrop-blur-xl border-2 border-zinc-800 p-4 md:p-6 rounded-3xl md:rounded-4xl flex-1 transition-all hover:border-zinc-700">
            <p className="text-3xl md:text-4xl font-black text-white group-hover:scale-105 transition-transform origin-left">{totalActive}</p>
            <p className="text-[8px] md:text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1 md:mt-2">Atividades</p>
          </div>
          <div className="group bg-primary border-2 border-primary p-4 md:p-6 rounded-3xl md:rounded-4xl flex-1 shadow-[0_10px_30px_rgba(251,191,36,0.2)] transition-all hover:-translate-y-1">
            <p className="text-3xl md:text-4xl font-black text-black group-hover:scale-105 transition-transform origin-left">{totalPoints}</p>
            <p className="text-[8px] md:text-[10px] font-black uppercase text-black/60 tracking-[0.2em] mt-1 md:mt-2">XP Disponível</p>
          </div>
        </div>
      </div>

      {/* ── FILTROS & BUSCA ── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-transparent rounded-[2.5rem] md:rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-zinc-900/80 backdrop-blur-2xl border-2 border-zinc-800 rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 space-y-6 md:space-y-8 shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="relative group/search">
            <div className="absolute inset-0 bg-primary/5 rounded-xl md:rounded-2xl blur-xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-5 md:left-6 text-zinc-600 group-focus-within/search:text-primary transition-colors pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="Pesquisar atividade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/60 border-2 border-zinc-800 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl md:rounded-2xl py-4 md:py-5 pl-14 md:pl-16 pr-5 text-white font-bold outline-none transition-all placeholder:text-zinc-700 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Horizontal Scrolling Categories */}
          <div className="relative">
            {/* Fade overlays for scrolling indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-zinc-900/80 to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-zinc-900/80 to-transparent z-10 pointer-events-none md:hidden" />
            
            <div className="flex overflow-x-auto pb-2 -mx-2 px-4 gap-2 scrollbar-hide scroll-smooth">
              {categories.map(cat => {
                const meta = cat === 'all' ? { label: 'Todas', icon: '🎯', color: 'text-white bg-zinc-800 border-zinc-700' } : CATEGORY_LABELS[cat];
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`group relative px-5 md:px-7 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border-2 text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 active:scale-90 ${
                      isActive ? 'bg-primary border-primary text-black scale-105 shadow-xl shadow-primary/20' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 relative z-10">
                      <span className="text-base md:text-xl transition-transform group-hover:scale-125 duration-300">{meta.icon}</span>
                      <span className="whitespace-nowrap italic">{meta.label}</span>
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── LISTA DE ATIVIDADES ── */}
      {loading ? (
        <LoadingSpinner message="Sincronizando Banco de Dados..." size="md" />
      ) : (
        <div className="grid gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((activity, i) => {
              const cat = CATEGORY_LABELS[activity.category];
              const isSaved = savedIds.has(activity.id);
              const isModified = activity.current_points !== activity.default_points;

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                  className={`group relative bg-zinc-900/40 backdrop-blur-sm border-2 rounded-3xl md:rounded-4xl p-4 md:p-6 flex flex-col xl:flex-row xl:items-center gap-4 md:gap-6 transition-all hover:bg-zinc-900/60 ${
                    !activity.is_active ? 'opacity-40 border-zinc-800' : 'border-zinc-800/50 hover:border-primary/30'
                  }`}
                >
                  {/* Header Mobile: Icon + Title */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl border-2 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden transition-transform group-hover:scale-105 ${cat.color}`}>
                      <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors"></div>
                      <DynamicIcon name={activity.icon} className="text-xl md:text-2xl relative z-10" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-black text-white uppercase italic tracking-tight text-sm md:text-lg group-hover:text-primary transition-colors line-clamp-1">{activity.title}</h3>
                        <div className="flex gap-1 md:gap-2">
                          {activity.requires_proof && (
                            <span className="text-[7px] md:text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-black uppercase tracking-widest whitespace-nowrap">
                              Prova
                            </span>
                          )}
                          {isModified && (
                            <span className="text-[7px] md:text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg font-black uppercase tracking-widest whitespace-nowrap">
                              Editado
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-zinc-500 text-xs font-medium line-clamp-1">{activity.description}</p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center justify-between xl:justify-end gap-3 md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/50">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex flex-col items-center gap-0.5 bg-yellow-500/5 border border-yellow-500/10 px-3 md:px-4 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl min-w-[60px] md:min-w-[80px]">
                        <div className="flex items-center gap-1.5 text-yellow-500">
                          <Coins size={12} className="md:w-3.5 md:h-3.5" />
                          <span className="font-black text-xs md:text-sm">{activity.coin_reward || 0}</span>
                        </div>
                        <span className="text-[7px] md:text-[8px] font-black uppercase opacity-40 text-yellow-500">Moedas</span>
                      </div>

                      <button
                        onClick={() => handleEditStart(activity)}
                        className={`group/btn relative flex flex-col items-center gap-0.5 border-2 px-4 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl min-w-[80px] md:min-w-[100px] transition-all hover:scale-105 active:scale-95 ${
                          isSaved ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-black/60 border-zinc-800 hover:border-primary text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Zap size={12} className={`${isSaved ? 'text-green-500' : 'text-primary'} md:w-3.5 md:h-3.5`} />
                          <span className="font-black text-xs md:text-sm">{activity.current_points}</span>
                          <Edit3 size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity ml-1 text-primary hidden md:block" />
                        </div>
                        <span className={`text-[7px] md:text-[8px] font-black uppercase opacity-40 ${isSaved ? 'text-green-500' : 'text-zinc-400'}`}>
                          {isSaved ? 'Salvo!' : 'Pontos XP'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 md:pl-6 md:border-l md:border-zinc-800">
                      <button
                        onClick={() => handleEditStart(activity)}
                        className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                        title="Editar Atividade"
                      >
                        <Edit3 size={14} className="md:w-4 md:h-4" />
                      </button>

                      <button
                        onClick={() => handleToggle(activity)}
                        className={`w-11 md:w-14 h-8 md:h-10 rounded-lg md:rounded-xl border-2 flex items-center px-1 transition-all ${
                          activity.is_active ? 'bg-primary/10 border-primary/30 justify-end' : 'bg-zinc-800 border-zinc-700 justify-start'
                        }`}
                      >
                        <motion.div layout className={`w-5 md:w-6 h-5 md:h-6 rounded-md md:rounded-lg shadow-lg ${activity.is_active ? 'bg-primary' : 'bg-zinc-600'}`} />
                      </button>

                      <button
                        onClick={() => handleRemove(activity.id)}
                        className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-red-500/5 hover:bg-red-500 border-2 border-red-500/10 hover:border-red-500 text-red-500 hover:text-black flex items-center justify-center transition-all"
                      >
                        <Trash2 size={14} className="md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 md:py-20 gap-4 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800">
                <Search size={28} />
              </div>
              <p className="text-zinc-500 font-black uppercase italic text-[10px] md:text-xs tracking-widest px-8">Nenhuma atividade encontrada para esta busca</p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── BOTÃO FLUTUANTE ── */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setEditingId(null);
          setActivityForm(emptyForm());
          setShowModal(true);
        }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 md:w-20 md:h-20 bg-primary rounded-2xl md:rounded-4xl flex items-center justify-center shadow-[0_15px_40px_rgba(251,191,36,0.4)] z-50 text-black border-2 md:border-4 border-black"
      >
        <Plus size={28} md:size={36} strokeWidth={3} />
      </motion.button>

      {/* ── MODAL CRIAR/EDITAR ── */}
      <AnimatePresence>
        {showModal && (
          <div key="activity-modal" className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 md:bg-black/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-zinc-900 border-2 border-zinc-800 rounded-4xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-8 md:mb-10">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none">
                    {editingId ? 'Editar' : 'Nova'} <span className="text-primary">Atividade</span>
                  </h2>
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">Personalize regras e recompensas</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <X size={20} md:size={24} />
                </button>
              </div>

              <div className="grid gap-5 md:gap-6">
                {/* Visual Identity */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Ícone</label>
                      <input
                        type="text"
                        placeholder="⭐"
                        value={activityForm.icon}
                        onChange={e => setActivityForm(f => ({ ...f, icon: e.target.value }))}
                        className="w-20 md:w-24 bg-black border-2 border-zinc-800 focus:border-primary rounded-xl md:rounded-2xl py-4 md:py-5 px-3 text-2xl md:text-3xl text-center outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 md:space-y-2 md:hidden">
                      <label className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Nome</label>
                      <input
                        type="text"
                        placeholder="Nome da Atividade"
                        value={activityForm.title}
                        onChange={e => setActivityForm(f => ({ 
                          ...f, 
                          title: e.target.value, 
                          key: editingId ? f.key : e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') 
                        }))}
                        className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl md:rounded-2xl py-4 px-5 text-white font-black outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="hidden md:block flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Nome da Atividade</label>
                    <input
                      type="text"
                      placeholder="Ex: Culto de Jovens"
                      value={activityForm.title}
                      onChange={e => setActivityForm(f => ({ 
                        ...f, 
                        title: e.target.value, 
                        key: editingId ? f.key : e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') 
                      }))}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-2xl py-5 px-6 text-white font-black outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Key (Read-only if editing) */}
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Identificador Único (Slug)</label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!!editingId}
                      value={activityForm.key}
                      onChange={e => setActivityForm(f => ({ ...f, key: e.target.value }))}
                      className="w-full bg-black/40 border-2 border-zinc-800 focus:border-primary rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-zinc-500 font-mono text-[10px] md:text-sm outline-none transition-all disabled:opacity-50"
                    />
                    {editingId && <Sparkles size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700" />}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Descrição</label>
                  <textarea
                    rows={2}
                    placeholder="Regras para pontuar..."
                    value={activityForm.description}
                    onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl md:rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-white font-bold outline-none transition-all resize-none text-sm"
                  />
                </div>

                {/* Values Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">Categoria</label>
                    <select
                      value={activityForm.category}
                      onChange={e => setActivityForm(f => ({ ...f, category: e.target.value as ActivityCategory }))}
                      className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl md:rounded-2xl py-4 md:py-5 px-4 text-white font-black outline-none transition-all text-[11px] md:text-xs appearance-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-primary tracking-widest px-1">XP Base</label>
                    <div className="relative">
                      <Zap size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <input
                        type="number"
                        min={0}
                        value={activityForm.current_points}
                        onChange={e => setActivityForm(f => ({ ...f, current_points: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black border-2 border-primary/20 focus:border-primary rounded-xl md:rounded-2xl py-4 md:py-5 pl-10 md:pl-12 pr-4 text-primary font-black text-center outline-none transition-all text-sm md:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase text-yellow-500 tracking-widest px-1">Moedas</label>
                    <div className="relative">
                      <Coins size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                      <input
                        type="number"
                        min={0}
                        value={activityForm.coin_reward}
                        onChange={e => setActivityForm(f => ({ ...f, coin_reward: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black border-2 border-yellow-500/20 focus:border-yellow-500 rounded-xl md:rounded-2xl py-4 md:py-5 pl-10 md:pl-12 pr-4 text-yellow-500 font-black text-center outline-none transition-all text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Config Flags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 py-2 md:py-4">
                  <div className="bg-black/60 border-2 border-zinc-800 rounded-xl md:rounded-2xl p-3 md:p-4 flex md:flex-col items-center md:items-stretch justify-between md:justify-center gap-2">
                    <label className="text-[8px] md:text-[9px] font-black uppercase text-zinc-600 tracking-widest">Limite Semanal</label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={activityForm.max_per_week ?? ''}
                      onChange={e => setActivityForm(f => ({ ...f, max_per_week: e.target.value ? parseInt(e.target.value) : null }))}
                      className="bg-transparent border-b-2 border-zinc-800 focus:border-primary text-white font-black text-center outline-none transition-all py-1 w-16 md:w-full"
                    />
                  </div>

                  <button
                    onClick={() => setActivityForm(f => ({ ...f, requires_proof: !f.requires_proof }))}
                    className={`group relative rounded-xl md:rounded-2xl border-2 py-3 md:py-4 px-4 font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all ${
                      activityForm.requires_proof ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex md:flex-col items-center justify-center gap-2 md:gap-1">
                      <Shield size={14} md:size={16} className={activityForm.requires_proof ? 'text-amber-500' : 'text-zinc-700'} />
                      <span>{activityForm.requires_proof ? 'Com Prova' : 'Sem Prova'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActivityForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`group relative rounded-xl md:rounded-2xl border-2 py-3 md:py-4 px-4 font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all ${
                      activityForm.is_active ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'bg-red-500/10 border-red-500/50 text-red-500'
                    }`}
                  >
                    <div className="flex md:flex-col items-center justify-center gap-2 md:gap-1">
                      <Sparkles size={14} md:size={16} className={activityForm.is_active ? 'text-primary' : 'text-red-500'} />
                      <span>{activityForm.is_active ? 'Ativa' : 'Inativa'}</span>
                    </div>
                  </button>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-2 md:mt-4">
                   <button
                    onClick={() => setShowModal(false)}
                    className="order-2 md:order-1 flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-widest transition-all text-sm md:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={processing || !activityForm.title.trim()}
                    className="order-1 md:order-2 flex-2 bg-primary text-black py-4 md:py-5 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-widest hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm md:text-base"
                  >
                    {processing ? (
                      <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Save size={18} md:size={20} strokeWidth={3} /> {editingId ? 'Confirmar' : 'Criar Atividade'}</>  
                    )}
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
