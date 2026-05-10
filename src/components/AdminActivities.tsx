/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, ActivityDefinition } from '../types';
import { Plus, Trash2, Edit3, Upload, Image as ImageIcon, BookOpen, Save, Zap, Coins, RefreshCw, QrCode, Printer, CalendarIcon, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BIBLE_BOOKS } from '../lib/BibleService';
import { NotificationService } from '../lib/NotificationService';
import { useToast } from '../context/ToastContext';
import { AppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/useAuth';

export default function AdminActivities() {
  const { success, error: toastError, info } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [definitions, setDefinitions] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [config, setConfig] = useState<AppTheme | null>(null);
  const [savingDevotional, setSavingDevotional] = useState(false);
  const { profile } = useAuth();
  const [viewingQRCode, setViewingQRCode] = useState<Activity | null>(null);
  
  const [scheduleOnCalendar, setScheduleOnCalendar] = useState(false);
  const [calendarConfig, setCalendarConfig] = useState({
    event_date: new Date().toISOString().split('T')[0],
    start_time: '20:00',
    is_recurring: false,
    recurrence_pattern: { freq: 'weekly' as const, days: [] as number[] }
  });
  
  const [formData, setFormData] = useState<Partial<Activity>>({
    title: '',
    description: '',
    points: 10,
    category: 'ESPIRITUAL',
    type: 'presencial',
    status: 'active',
    requires_acceptance: false,
    validationType: 'manual'
  });

  const refreshActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*');
      
      if (!error) {
        setActivities(data as Activity[]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialLoad = async () => {
      try {
        const [actRes, defRes, confRes] = await Promise.all([
          supabase.from('activities').select('*'),
          supabase.from('activity_definitions').select('*').eq('is_active', true),
          supabase.from('config').select('value').eq('key', 'app').single()
        ]);
          
        if (!actRes.error && mounted) {
          setActivities(actRes.data as Activity[]);
        }
        if (defRes.data && mounted) {
          setDefinitions(defRes.data as ActivityDefinition[]);
        }
        if (confRes.data && mounted) {
          setConfig(confRes.data.value as AppTheme);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    initialLoad();
    
    return () => { mounted = false; };
  }, []);

  const handleSaveDevotional = async () => {
    if (!config) return;
    setSavingDevotional(true);
    try {
      const { error } = await supabase
        .from('config')
        .upsert([{ key: 'app', value: config }]);
      
      if (error) throw error;
      success("Configurações Salvas", "A configuração do Devocional Automático foi salva com sucesso.");
    } catch (err) {
      console.error(err);
      toastError("Erro ao Salvar", "Ocorreu um erro ao salvar o devocional.");
    } finally {
      setSavingDevotional(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `act-${Date.now()}`;
    try {
      const payload: any = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      };

      if (payload.type === 'qr_code' && !payload.secret_payload) {
        payload.secret_payload = `tribo-qr-${Math.random().toString(36).substring(2, 10)}`;
      }

      const { data: actData, error } = await supabase
        .from('activities')
        .upsert([payload])
        .select()
        .single();
      
      if (error) throw error;

      if (scheduleOnCalendar && profile) {
         // Delete any existing calendar events linked to this activity
         await supabase.from('calendar_events').delete().eq('linked_activity_id', actData.id);
         
         // Create new calendar event automatically synced
         await supabase.from('calendar_events').insert({
            title: actData.title,
            description: actData.description || '',
            event_date: calendarConfig.event_date,
            start_time: calendarConfig.start_time,
            type: actData.category === 'EVENTO' ? 'live' : 'gincana',
            points_reward: actData.points,
            created_by: profile.id,
            is_recurring: calendarConfig.is_recurring,
            recurrence_pattern: calendarConfig.is_recurring ? calendarConfig.recurrence_pattern : null,
            requires_proof: true,
            linked_activity_id: actData.id
         });
      }

      if (!editingId && formData.requires_acceptance) {
        await NotificationService.notifyAll('task_submit', 'NOVA MISSÃO LIBERADA!', `Uma nova missão foi lançada: ${formData.title}`);
      }

      setFormData({ title: '', description: '', points: 10, category: 'ESPIRITUAL', type: 'presencial', status: 'active', requires_acceptance: false, validationType: 'manual' });
      setShowForm(false);
      setEditingId(null);
      refreshActivities();
      success(editingId ? "Tarefa Atualizada" : "Tarefa Criada", "A atividade foi salva com sucesso.");
    } catch (error) {
      console.error(error);
      toastError("Erro ao Salvar", "Não foi possível salvar a atividade.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      info("Formato Inválido", "Selecione uma imagem válida (PNG, JPG, WEBP).");
      return;
    }

    setUploadingImage(true);
    try {
      await supabase.storage.createBucket('activities', { public: true });
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `challenge-${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('activities')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('activities').getPublicUrl(path);
      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      success("Upload Completo", "A arte do desafio foi enviada com sucesso.");
    } catch (err) {
      console.error(err);
      toastError("Erro no Upload", "Não foi possível fazer upload da arte.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (act: Activity) => {
    setFormData(act);
    setEditingId(act.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setActivities(activities.filter(a => a.id !== id));
      success("Tarefa Excluída", "A atividade foi removida com sucesso.");
    } catch {
      toastError("Erro", "Não foi possível excluir a atividade.");
    }
  };

  // Guard: spinner apenas no primeiro carregamento (sem dados em cache)
  if (loading && activities.length === 0) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Gerenciar Desafios</h2>
              <p className="text-zinc-500 font-bold italic text-[10px] uppercase tracking-widest">Crie desafios para os membros marcarem pontos</p>
            </div>
            <button 
              onClick={() => { setShowForm(!showForm); setEditingId(null); }}
              className="bg-primary text-black px-6 py-3 rounded-full font-black uppercase italic tracking-tighter hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="flex items-center gap-2">
                NOVA TAREFA <Plus size={20} />
              </span>
            </button>
          </div>

      {/* 📖 CONFIGURAÇÃO DO DEVOCIONAL AUTOMÁTICO */}
      {config && (
        <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <BookOpen size={120} className="text-primary" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Devocional Automático</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">A Bíblia avança 1 capítulo automaticamente todo dia</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600">Modo de Leitura</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setConfig({
                    ...config,
                    autoDevotional: {
                      ...(config.autoDevotional || { startDate: '', startBookId: 'GEN', startChapter: 1, points: 15, enabled: true }),
                      mode: 'linear'
                    }
                  })}
                  className={`p-4 rounded-2xl border-2 font-black uppercase italic text-xs transition-all ${config.autoDevotional?.mode !== 'random' ? 'bg-primary border-primary text-black' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                  <span>Sequencial</span>
                </button>
                <button 
                  onClick={() => setConfig({
                    ...config,
                    autoDevotional: {
                      ...(config.autoDevotional || { startDate: '', startBookId: 'GEN', startChapter: 1, points: 15, enabled: true }),
                      mode: 'random'
                    }
                  })}
                  className={`p-4 rounded-2xl border-2 font-black uppercase italic text-xs transition-all ${config.autoDevotional?.mode === 'random' ? 'bg-primary border-primary text-black' : 'bg-black border-zinc-800 text-zinc-500'}`}
                >
                  <span>Aleatório (Fundamentos)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Pontos (XP)</label>
                  <input 
                    type="number" 
                    value={config.autoDevotional?.points ?? 15}
                    onChange={e => setConfig({
                      ...config,
                      autoDevotional: {
                        ...(config.autoDevotional || { startDate: '', startBookId: 'GEN', startChapter: 1, enabled: true, mode: 'linear' }),
                        points: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  />
               </div>
              <button 
                onClick={handleSaveDevotional}
                disabled={savingDevotional}
                className="bg-primary text-black h-[52px] rounded-xl font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 px-6 disabled:opacity-50"
              >
                {savingDevotional ? <span>SALVANDO...</span> : <><Save size={18} /> <span>SALVAR</span></>}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="devotionalEnabled"
              checked={!!config.autoDevotional?.enabled}
              onChange={e => setConfig({
                ...config,
                autoDevotional: {
                  ...(config.autoDevotional || { startDate: new Date().toISOString().split('T')[0], startBookId: 'GEN', startChapter: 1, points: 15, enabled: true, mode: 'linear' }),
                  enabled: e.target.checked
                }
              })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="devotionalEnabled" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer">Habilitar Atividade de Devocional no Dashboard</label>
          </div>
        </section>
      )}

      {/* ⚡ CONFIGURAÇÃO DO BÔNUS DE LOGIN (PRESENÇA DIGITAL) */}
      {config && (
        <section className="bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={120} className="text-primary" />
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border-2 border-primary/20">
              <Zap size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Bônus de Presença Digital</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Pontos automáticos ao entrar no app (1x por dia)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="bg-black/30 p-5 rounded-2xl border-2 border-zinc-800">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Pontuação (XP)</label>
                <div className="flex items-center gap-4">
                   <input 
                    type="number" 
                    value={config.dailyLoginBonus?.points ?? 5}
                    onChange={e => setConfig({
                      ...config,
                      dailyLoginBonus: {
                        ...(config.dailyLoginBonus || { enabled: true }),
                        points: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none text-xl"
                  />
                  <div className="text-primary font-black italic">XP</div>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleSaveDevotional}
                disabled={savingDevotional}
                className="w-full bg-primary text-black h-[74px] rounded-2xl font-black uppercase italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 px-6 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {savingDevotional ? <span>SALVANDO...</span> : <><Save size={24} /> <span>SALVAR CONFIGURAÇÃO</span></>}
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${config.dailyLoginBonus?.enabled ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                <Zap size={20} fill={config.dailyLoginBonus?.enabled ? "currentColor" : "none"} />
              </div>
              <div>
                <p className="text-white font-black uppercase italic tracking-tighter">Status do Bônus Diário</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">O sistema verificará o login uma vez a cada 24h</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setConfig({
                ...config,
                dailyLoginBonus: {
                  ...(config.dailyLoginBonus || { points: 5 }),
                  enabled: !config.dailyLoginBonus?.enabled
                }
              })}
              className={`w-16 h-8 rounded-full relative transition-all ${config.dailyLoginBonus?.enabled ? 'bg-primary' : 'bg-zinc-800'}`}
            >
              <motion.div 
                animate={{ x: config.dailyLoginBonus?.enabled ? 36 : 4 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </section>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900 border-4 border-primary p-8 rounded-3xl mb-8 overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-black/30 p-5 rounded-2xl border-2 border-zinc-800 border-l-4 border-l-primary">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  Vincular a uma Pontuação Oficial (Opcional)
                </label>
                <select 
                  value={formData.definitionId || ''}
                  onChange={e => {
                    const defId = e.target.value;
                    if (defId) {
                      const def = definitions.find(d => d.id === defId);
                      if (def) {
                        setFormData({...formData, definitionId: defId, title: def.title, description: def.description, points: def.default_points, category: def.category});
                      }
                    } else {
                      setFormData({...formData, definitionId: undefined});
                    }
                  }}
                  className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                >
                  <option value="">Nenhum Vínculo (Desafio Avulso)</option>
                  {definitions.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.default_points} XP)</option>
                  ))}
                </select>
                <p className="text-zinc-500 text-[10px] font-bold mt-2 italic">Ao selecionar, o título, a descrição e os pontos serão preenchidos automaticamente.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Título da Atividade</label>
                  <input 
                    type="text" required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Trazer 1 quilo de alimento"
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Pontos</label>
                  <input 
                    type="number" required
                    value={formData.points}
                    onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Descrição</label>
                <textarea 
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="ESPIRITUAL">Espiritual</option>
                    <option value="AÇÃO SOCIAL">Ação Social</option>
                    <option value="CRIATIVIDADE">Criatividade</option>
                    <option value="EVENTO">Evento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as 'presencial' | 'online' | 'qr_code'})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                    <option value="qr_code">📷 QR Code (Presença Física)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Status</label>
                  <select 
                     value={formData.status}
                     onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'archived'})}
                     className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="active">Ativa</option>
                    <option value="archived">Arquivada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Modo de Validação</label>
                  <select 
                    value={formData.validationType}
                    onChange={e => setFormData({...formData, validationType: e.target.value as 'auto' | 'manual'})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="manual">👤 Moderado (Líder Aprova)</option>
                    <option value="auto">⚡ Automático (Ganhou, Ganhou)</option>
                  </select>
                </div>
              </div>

              {/* ⏳ MISSÃO POR TEMPO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/40 rounded-2xl border-2 border-zinc-800">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Tipo de Missão</label>
                  <select
                    value={formData.missionType || 'normal'}
                    onChange={e => setFormData({...formData, missionType: e.target.value as 'normal' | 'flash' | 'weekly' | 'special'})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  >
                    <option value="normal">🎯 Normal (Sem Prazo)</option>
                    <option value="flash">⚡ Relâmpago (24h)</option>
                    <option value="weekly">📅 Semanal (7 dias)</option>
                    <option value="special">⭐ Especial (Data Livre)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    Expira Em (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt ? formData.expiresAt.substring(0, 16) : ''}
                    onChange={e => setFormData({...formData, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                    className="w-full bg-black border-2 border-zinc-800 focus:border-primary p-3 rounded-xl text-white font-bold outline-none"
                  />
                  {formData.missionType === 'flash' && (
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 24);
                        setFormData({...formData, expiresAt: d.toISOString()});
                      }}
                      className="mt-1 text-[9px] text-primary font-black uppercase tracking-widest hover:underline"
                    >
                      ⚡ Definir para +24h automaticamente
                    </button>
                  )}
                </div>
              </div>

              {/* 🤝 ACEITE OBRIGATÓRIO */}
              {formData.type !== 'qr_code' && (
                <div className="bg-primary/10 border-2 border-primary/20 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-primary">Modo Desafio (Exigir Aceite)</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      Membros precisam clicar em "Aceitar" antes de enviar a prova
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, requires_acceptance: !formData.requires_acceptance })}
                    className={`w-14 h-8 rounded-full relative transition-all ${formData.requires_acceptance ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                    <motion.div 
                      animate={{ x: formData.requires_acceptance ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              )}

              {/* 🖼️ ARTE DO DESAFIO */}
              <div className="bg-black/30 p-5 rounded-2xl border-2 border-zinc-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <ImageIcon size={14} /> Arte do Desafio (Opcional)
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-black rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Arte" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData({...formData, imageUrl: undefined})} className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><Trash2 size={12} /></button>
                      </>
                    ) : (
                      <ImageIcon size={32} className="text-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-2 max-w-[220px]">
                      {uploadingImage ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Upload size={14} />}
                      {uploadingImage ? 'Enviando...' : 'Fazer Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <p className="text-zinc-500 text-[10px] font-bold mt-3">Formatos recomendados: PNG, JPG ou WEBP.<br/>Tamanho máximo: 2MB.</p>
                  </div>
                </div>
              </div>

              {/* 📅 AGENDAR NO CALENDÁRIO */}
              <div className="bg-zinc-800/30 p-5 rounded-2xl border-2 border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
                      <CalendarIcon size={16} className="text-primary" /> Agendar no Calendário
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      Faça esta atividade aparecer automaticamente na Agenda da Tribo
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setScheduleOnCalendar(!scheduleOnCalendar)}
                    className={`w-14 h-8 rounded-full relative transition-all ${scheduleOnCalendar ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                    <motion.div 
                      animate={{ x: scheduleOnCalendar ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {scheduleOnCalendar && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-zinc-800"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Data do Evento</label>
                          <input 
                            type="date" 
                            value={calendarConfig.event_date}
                            onChange={e => setCalendarConfig({...calendarConfig, event_date: e.target.value})}
                            className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Horário</label>
                          <input 
                            type="time" 
                            value={calendarConfig.start_time}
                            onChange={e => setCalendarConfig({...calendarConfig, start_time: e.target.value})}
                            className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <button 
                          type="button"
                          onClick={() => setCalendarConfig({...calendarConfig, is_recurring: !calendarConfig.is_recurring})}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between group flex-1 ${
                            calendarConfig.is_recurring 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-black border-zinc-800 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Repetir</span>
                            <span className="text-xs font-bold text-white uppercase">Semanalmente</span>
                          </div>
                          <div className={`w-8 h-4 rounded-full relative transition-all ${calendarConfig.is_recurring ? 'bg-primary' : 'bg-zinc-800'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${calendarConfig.is_recurring ? 'left-4' : 'left-0.5'}`}></div>
                          </div>
                        </button>
                      </div>

                      {calendarConfig.is_recurring && (
                        <div className="pt-2">
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Dias da Semana</label>
                          <div className="flex justify-between items-center gap-2">
                            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day, i) => {
                              const isSelected = calendarConfig.recurrence_pattern.days.includes(i);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    const days = calendarConfig.recurrence_pattern.days;
                                    const newDays = days.includes(i) ? days.filter(d => d !== i) : [...days, i];
                                    setCalendarConfig({...calendarConfig, recurrence_pattern: {...calendarConfig.recurrence_pattern, days: newDays}});
                                  }}
                                  className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all border-2 ${
                                    isSelected 
                                      ? 'bg-primary border-primary text-black' 
                                      : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white'
                                  }`}
                                >
                                  {day[0]}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary text-black py-4 rounded-xl font-black uppercase italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all">
                  {editingId ? 'ATUALIZAR DESAFIO' : 'CRIAR DESAFIO'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 bg-zinc-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {activities.map((act) => (
          <div key={act.id} className="card-premium flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-2xl shadow-xl transition-transform group-hover:scale-110 ${act.status === 'active' ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {act.points}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="badge-premium">{act.category}</span>
                  {act.status === 'archived' && <span className="text-[8px] bg-red-500/20 border border-red-500/50 text-red-500 px-2 py-0.5 rounded-full font-black uppercase">Arquivada</span>}
                  {act.requires_acceptance && <span className="text-[8px] bg-blue-500/20 border border-blue-500/50 text-blue-400 px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1"><Zap size={8} fill="currentColor" /> Desafio Ativo</span>}
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{act.title}</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase italic max-w-md line-clamp-1">{act.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setViewingQRCode(act)}
                    title="Visualizar QR Code na Tela"
                    className="p-3 bg-primary text-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    <QrCode size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '', 'width=600,height=600');
                      if (!printWindow) return;
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>QR Code - ${act.title}</title>
                            <style>
                              body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000; }
                              .card { border: 4px solid #000; border-radius: 20px; padding: 40px; text-align: center; }
                              h1 { text-transform: uppercase; font-style: italic; font-size: 32px; margin-bottom: 10px; }
                              p { font-weight: bold; color: #666; margin-bottom: 30px; font-size: 18px; }
                              .qr { padding: 20px; border: 4px solid #000; border-radius: 10px; display: inline-block; margin-bottom: 20px; }
                              .footer { font-size: 14px; color: #999; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
                            </style>
                          </head>
                          <body>
                            <div class="card">
                              <h1>${act.title}</h1>
                              <p>Escaneie no aplicativo da Tribo para ganhar ${act.points} XP</p>
                              <div class="qr" id="qr-container"></div>
                              <div class="footer">GINCANA DA TRIBO</div>
                            </div>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                            <script>
                              new QRCode(document.getElementById("qr-container"), {
                                  text: "${act.secret_payload}",
                                  width: 256,
                                  height: 256,
                                  colorDark : "#000000",
                                  colorLight : "#ffffff",
                                  correctLevel : QRCode.CorrectLevel.H
                              });
                              setTimeout(() => { window.print(); }, 500);
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }}
                    title="Imprimir QR Code"
                    className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-white hover:text-black transition-all"
                  >
                    <Printer size={18} />
                  </button>
                </div>
              <button 
                onClick={async () => {
                  const newState = !act.requires_acceptance;
                  const { error } = await supabase.from('activities').update({ requires_acceptance: newState }).eq('id', act.id);
                  if (!error) {
                    refreshActivities();
                    if (newState) {
                      await NotificationService.notifyAll('task_submit', 'NOVA MISSÃO LIBERADA!', `Uma nova missão foi lançada: ${act.title}`);
                    }
                  }
                }}
                title={act.requires_acceptance ? "Remover dos Desafios" : "Disponibilizar como Desafio"}
                className={`p-3 rounded-xl transition-all ${act.requires_acceptance ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 hover:text-blue-400 hover:bg-black'}`}
              >
                <Zap size={18} fill={act.requires_acceptance ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={() => handleEdit(act)}
                className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-primary hover:bg-black transition-all"
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(act.id)}
                className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-red-500 hover:bg-black transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        </div>
      </motion.div>
      <AnimatePresence>
        {viewingQRCode && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[50px] max-w-sm w-full flex flex-col items-center text-black shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              
              <button 
                onClick={() => setViewingQRCode(null)}
                className="absolute top-6 right-6 text-zinc-300 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 bg-black text-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <QrCode size={32} />
              </div>

              <h3 className="text-2xl font-black uppercase italic mb-1 text-center leading-none">{viewingQRCode.title}</h3>
              <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest mb-8 text-center px-4">Aponte o celular para validar a presença</p>
              
              <div className="p-6 bg-zinc-50 rounded-[40px] border-4 border-zinc-100 shadow-inner mb-8">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(viewingQRCode.secret_payload || '')}`}
                  alt="QR Code" 
                  className="w-56 h-56 mix-blend-multiply" 
                  onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                  style={{ opacity: 0, transition: 'opacity 0.5s ease' }}
                />
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">QR Code Ativo e Pronto</span>
                </div>
                
                <button 
                  onClick={() => setViewingQRCode(null)}
                  className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  CONCLUÍDO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
