/**
 * AdminSystemPoints.tsx
 * Painel unificado para editar TODAS as pontuações automáticas do sistema.
 *
 * Seções cobertas:
 *  1. Login Diário          → config.app.dailyLoginBonus.points
 *  2. Mural / Feed          → config.mural_points (MuralPointsConfig)
 *  3. Bíblia & Devocional   → config.bible_points (BiblePointsConfig)
 *  4. Planos de Leitura     → dentro de bible_points.reading_plans
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, BookOpen, MessageSquare, Scroll, Save, RotateCcw,
  CheckCircle2, LogIn, Trophy, BookMarked, Star, Users,
  ChevronDown, ChevronUp, Swords, Coins
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { READING_PLANS } from '../lib/ReadingPlanService';
import { DEFAULT_MURAL_POINTS, MuralPointsConfig } from '../types';
import type { BiblePointsConfig } from './AdminBiblePoints';
import BibleQuiz from './BibleQuiz';
import { DevotionalService } from '../lib/DevotionalService';
import { useBiblePointsConfig } from './AdminBiblePoints';
import { AutomationService } from '../lib/AutomationService';
import PostComposer from './feed/PostComposer';
import LoadingSpinner from './LoadingSpinner';
import AdminPointsEditor from './AdminPointsEditor';

// ─── DEFAULTS ───────────────────────────────────────────────────────────────

const DEFAULT_BIBLE: BiblePointsConfig = {
  devotional_points: 20,
  free_reading_points: 10,
  quiz_bonus_per_correct: 5,
  reading_plans: Object.fromEntries(
    READING_PLANS.map(p => [p.id, { points_per_day: p.pointsPerDay, bonus_points: p.bonusPoints }])
  ),
};

const DEFAULT_APP_CONFIG = {
  dailyLoginBonus: { enabled: true, points: 5 },
  coinMultiplier: 1,
};

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  color = 'text-primary',
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 pb-4 border-b-2 border-zinc-800 text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border bg-black/30 ${color.replace('text-', 'border-')}/30`}>
          <span className={color}>{icon}</span>
        </div>
        <div>
          <h2 className="text-base font-black text-white uppercase italic">{title}</h2>
          <p className="text-zinc-600 text-[10px] font-black uppercase">{subtitle}</p>
        </div>
      </div>
      <span className="text-zinc-600 shrink-0">
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </span>
    </button>
  );
}

function NumberInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  accentClass = 'focus:border-primary',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  accentClass?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className={`w-20 bg-black border-2 border-zinc-700 ${accentClass} rounded-xl py-2.5 px-3 text-white font-black text-center outline-none text-lg transition-all`}
      />
      <span className="text-zinc-500 font-black text-xs uppercase">pts</span>
    </div>
  );
}

function PointRow({
  emoji,
  label,
  desc,
  value,
  onChange,
  accentClass,
  labelClass,
}: {
  emoji: string;
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  accentClass?: string;
  labelClass?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">{emoji}</span>
          <p className={`font-black text-sm uppercase italic ${labelClass ?? 'text-white'}`}>{label}</p>
        </div>
        <p className="text-zinc-600 text-[10px] leading-relaxed">{desc}</p>
      </div>
      <NumberInput value={value} onChange={onChange} accentClass={accentClass} />
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function AdminSystemPoints() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Estados por seção
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG);
  const [muralConfig, setMuralConfig] = useState<MuralPointsConfig>(DEFAULT_MURAL_POINTS);
  const [bibleConfig, setBibleConfig] = useState<BiblePointsConfig>(DEFAULT_BIBLE);

  // Originais para detecção de mudança
  const [origApp, setOrigApp] = useState(DEFAULT_APP_CONFIG);
  const [origMural, setOrigMural] = useState<MuralPointsConfig>(DEFAULT_MURAL_POINTS);
  const [origBible, setOrigBible] = useState<BiblePointsConfig>(DEFAULT_BIBLE);

  // Navegação interna
  const [activeTab, setActiveTab] = useState<'config' | 'tables'>('config');

  // Controle de expansão de seções
  const [expanded, setExpanded] = useState({ login: true, mural: true, bible: true, plans: true, duel: true });
  const toggle = (key: keyof typeof expanded) =>
    setExpanded(p => ({ ...p, [key]: !p[key] }));

  // Carregar configs
  useEffect(() => {
    (async () => {
      const [appRes, muralRes, bibleRes] = await Promise.all([
        supabase.from('config').select('value').eq('key', 'app').single(),
        supabase.from('config').select('value').eq('key', 'mural_points').single(),
        supabase.from('config').select('value').eq('key', 'bible_points').single(),
      ]);

      if (appRes.data?.value) {
        const merged = { ...DEFAULT_APP_CONFIG, ...(appRes.data.value as any) };
        setAppConfig(merged); setOrigApp(merged);
      }
      if (muralRes.data?.value) {
        const merged = { ...DEFAULT_MURAL_POINTS, ...(muralRes.data.value as MuralPointsConfig) };
        setMuralConfig(merged); setOrigMural(merged);
      }
      if (bibleRes.data?.value) {
        const merged = { ...DEFAULT_BIBLE, ...(bibleRes.data.value as BiblePointsConfig) };
        setBibleConfig(merged); setOrigBible(merged);
      }
      setLoading(false);
    })();
  }, []);

  const isDirtyApp   = JSON.stringify(appConfig)   !== JSON.stringify(origApp);
  const isDirtyMural = JSON.stringify(muralConfig)  !== JSON.stringify(origMural);
  const isDirtyBible = JSON.stringify(bibleConfig)  !== JSON.stringify(origBible);
  const isAnyDirty   = isDirtyApp || isDirtyMural || isDirtyBible;

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ops: Promise<any>[] = [];

    if (isDirtyApp)
      ops.push(Promise.resolve(supabase.from('config').upsert({ key: 'app', value: appConfig }, { onConflict: 'key' })));
    if (isDirtyMural)
      ops.push(Promise.resolve(supabase.from('config').upsert({ key: 'mural_points', value: muralConfig }, { onConflict: 'key' })));
    if (isDirtyBible)
      ops.push(Promise.resolve(supabase.from('config').upsert({ key: 'bible_points', value: bibleConfig }, { onConflict: 'key' })));

    await Promise.all(ops);

    setOrigApp(appConfig);
    setOrigMural(muralConfig);
    setOrigBible(bibleConfig);
    setSavedKey('all');
    setTimeout(() => setSavedKey(null), 2500);
    setSaving(false);
  }, [appConfig, muralConfig, bibleConfig, isDirtyApp, isDirtyMural, isDirtyBible]);

  const handleReset = () => {
    setAppConfig(DEFAULT_APP_CONFIG);
    setMuralConfig(DEFAULT_MURAL_POINTS);
    setBibleConfig(DEFAULT_BIBLE);
  };

  if (loading) return <LoadingSpinner message="Carregando Configurações..." size="md" />;

  return (
    <div className="space-y-6 pb-24">
      {/* NAVEGAÇÃO INTERNA */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 border-b-4 border-zinc-900 pb-2 mb-8">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 rounded-t-xl font-black uppercase italic tracking-tighter transition-all ${
            activeTab === 'config' 
              ? 'bg-zinc-900 text-primary border-t-4 border-l-4 border-r-4 border-primary' 
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Pontos Automáticos
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-6 py-3 rounded-t-xl font-black uppercase italic tracking-tighter transition-all ${
            activeTab === 'tables' 
              ? 'bg-zinc-900 text-primary border-t-4 border-l-4 border-r-4 border-primary' 
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          Tabelas de Pontuação
        </button>
      </div>

      {activeTab === 'tables' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <AdminPointsEditor />
        </motion.div>
      )}

      {activeTab === 'config' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 💰 MULTIPLICADOR PREMIUM */}
          <div className="card-premium group border-yellow-500/20! bg-yellow-500/2 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-black rounded-2xl border-2 border-yellow-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)] group-hover:scale-110 transition-transform">
                <Coins className="text-yellow-500" size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1">Configuração de Recompensa</p>
                <h3 className="text-2xl font-black uppercase italic text-white leading-none tracking-tighter">Multiplicador Automático</h3>
                <p className="text-[10px] font-bold text-yellow-500/60 uppercase mt-1 italic">Converte XP em Moedas instantaneamente na aprovação</p>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-zinc-800 group-hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  value={appConfig.coinMultiplier ?? 1}
                  onChange={e => setAppConfig({ ...appConfig, coinMultiplier: parseFloat(e.target.value) || 0 })}
                  className="bg-zinc-900 text-white font-black italic text-2xl w-24 px-4 py-2 rounded-xl outline-none border-2 border-zinc-800 focus:border-yellow-500 transition-all text-center"
                />
                <div>
                   <p className="text-white font-black italic text-lg leading-none">MOEDAS</p>
                   <p className="text-[10px] font-black text-zinc-500 uppercase">por 1 XP</p>
                </div>
              </div>
            </div>
          </div>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <Zap size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Motor de Recompensas</span>
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">
            Pontos do <span className="text-primary">Sistema</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold mt-2 uppercase tracking-widest">
            Gerencie todas as pontuações automáticas da plataforma
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl font-black uppercase text-xs transition-all border-2 border-zinc-700"
          >
            <RotateCcw size={16} /> Restaurar Padrões
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isAnyDirty}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all border-2 ${
              savedKey === 'all'
                ? 'bg-green-500 border-green-500 text-black'
                : isAnyDirty
                ? 'bg-primary border-primary text-black hover:bg-white shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {savedKey === 'all'
              ? <><CheckCircle2 size={16} /> Salvo!</>
              : saving
              ? 'Salvando...'
              : <><Save size={16} /> Salvar Tudo</>}
          </button>
        </div>
      </div>

      {/* ── SEÇÃO 1: Login Diário ────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-5">
        <SectionHeader
          icon={<LogIn size={18} />}
          title="Login Diário"
          subtitle="Bônus automático por acessar a plataforma"
          color="text-green-400"
          expanded={expanded.login}
          onToggle={() => toggle('login')}
        />
        <AnimatePresence initial={false}>
          {expanded.login && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/30 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⚡</span>
                      <p className="font-black text-sm uppercase italic text-green-400">Bônus de Presença</p>
                    </div>
                    <p className="text-zinc-600 text-[10px]">Pontos concedidos uma vez por dia ao entrar na plataforma</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setAppConfig(c => ({ ...c, dailyLoginBonus: { ...c.dailyLoginBonus, enabled: !c.dailyLoginBonus.enabled } }))}
                        className={`w-10 h-6 rounded-full border-2 transition-all relative ${appConfig.dailyLoginBonus.enabled ? 'bg-green-500 border-green-500' : 'bg-zinc-800 border-zinc-700'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${appConfig.dailyLoginBonus.enabled ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-[10px] font-black uppercase ${appConfig.dailyLoginBonus.enabled ? 'text-green-400' : 'text-zinc-600'}`}>
                        {appConfig.dailyLoginBonus.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </label>
                    <NumberInput
                      value={appConfig.dailyLoginBonus.points}
                      onChange={v => setAppConfig(c => ({ ...c, dailyLoginBonus: { ...c.dailyLoginBonus, points: v } }))}
                      accentClass="focus:border-green-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SEÇÃO 2: Mural / Feed ──────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-5">
        <SectionHeader
          icon={<MessageSquare size={18} />}
          title="Mural & Feed"
          subtitle="XP por interações sociais no mural da tribo"
          color="text-purple-400"
          expanded={expanded.mural}
          onToggle={() => toggle('mural')}
        />
        <AnimatePresence initial={false}>
          {expanded.mural && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <PointRow emoji="📸" label="Publicar Post" desc="XP por publicar foto, texto ou conteúdo no mural"
                  value={muralConfig.postPoints}
                  onChange={v => setMuralConfig(c => ({ ...c, postPoints: v }))}
                  accentClass="focus:border-purple-400" labelClass="text-purple-400" />
                <PointRow emoji="📖" label="Estudo Bíblico" desc="XP por publicar um estudo bíblico estruturado"
                  value={muralConfig.studyPoints}
                  onChange={v => setMuralConfig(c => ({ ...c, studyPoints: v }))}
                  accentClass="focus:border-purple-400" labelClass="text-purple-400" />
                <PointRow emoji="💬" label="Comentário" desc="XP por comentar na postagem de outro membro"
                  value={muralConfig.commentPoints}
                  onChange={v => setMuralConfig(c => ({ ...c, commentPoints: v }))}
                  accentClass="focus:border-purple-400" labelClass="text-purple-400" />
                <PointRow emoji="🔥" label="Bônus de Reação" desc="XP bônus quando um post atinge o limiar de reações"
                  value={muralConfig.reactionBonusPoints}
                  onChange={v => setMuralConfig(c => ({ ...c, reactionBonusPoints: v }))}
                  accentClass="focus:border-purple-400" labelClass="text-purple-400" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="font-black text-xs uppercase italic text-zinc-400 mb-1">Limite de Comentários/dia</p>
                    <p className="text-zinc-600 text-[10px] mb-3">Máx de comentários que concedem XP por dia</p>
                    <NumberInput value={muralConfig.commentMaxDaily}
                      onChange={v => setMuralConfig(c => ({ ...c, commentMaxDaily: v }))}
                      max={50} accentClass="focus:border-purple-400" />
                  </div>
                  <div className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="font-black text-xs uppercase italic text-zinc-400 mb-1">Limiar de Reações (bônus)</p>
                    <p className="text-zinc-600 text-[10px] mb-3">Qtd mínima de reações para conceder o bônus ao autor</p>
                    <NumberInput value={muralConfig.reactionBonusThreshold}
                      onChange={v => setMuralConfig(c => ({ ...c, reactionBonusThreshold: v }))}
                      max={100} accentClass="focus:border-purple-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SEÇÃO 3: Bíblia & Devocional ──────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-5">
        <SectionHeader
          icon={<BookOpen size={18} />}
          title="Bíblia & Devocional"
          subtitle="Pontos por leitura, devocional e quiz bíblico"
          color="text-primary"
          expanded={expanded.bible}
          onToggle={() => toggle('bible')}
        />
        <AnimatePresence initial={false}>
          {expanded.bible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <PointRow emoji="🙏" label="Devocional Diário" desc="XP ao concluir o devocional pessoal guiado do dia"
                  value={bibleConfig.devotional_points}
                  onChange={v => setBibleConfig(c => ({ ...c, devotional_points: v }))}
                  labelClass="text-primary" />
                <PointRow emoji="📗" label="Leitura Livre de Capítulo" desc="XP ao marcar qualquer capítulo como lido no leitor"
                  value={bibleConfig.free_reading_points}
                  onChange={v => setBibleConfig(c => ({ ...c, free_reading_points: v }))}
                  labelClass="text-blue-400" accentClass="focus:border-blue-400" />
                <PointRow emoji="🧠" label="Quiz — Bônus por Acerto" desc="XP extra por cada resposta correta no quiz pós-leitura"
                  value={bibleConfig.quiz_bonus_per_correct}
                  onChange={v => setBibleConfig(c => ({ ...c, quiz_bonus_per_correct: v }))}
                  labelClass="text-purple-400" accentClass="focus:border-purple-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      {/* ── SEÇÃO 4: Planos de Leitura ───────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-5">
        <SectionHeader
          icon={<Scroll size={18} />}
          title="Planos de Leitura"
          subtitle="Pontos diários e bônus de conclusão por plano"
          color="text-amber-400"
          expanded={expanded.plans}
          onToggle={() => toggle('plans')}
        />
        <AnimatePresence initial={false}>
          {expanded.plans && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {READING_PLANS.map(plan => {
                  const cfg = bibleConfig.reading_plans[plan.id] ?? { points_per_day: plan.pointsPerDay, bonus_points: plan.bonusPoints };
                  return (
                    <div key={plan.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 transition-all"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-zinc-800 border-2" style={{ borderColor: plan.color + '40' }}>
                        {plan.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white uppercase italic text-sm">{plan.name}</h3>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
                            style={{ color: plan.color, borderColor: plan.color + '40', backgroundColor: plan.color + '15' }}>
                            {plan.totalDays} dias
                          </span>
                        </div>
                        <p className="text-zinc-600 text-[11px] truncate">{plan.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Por dia</p>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={200} value={cfg.points_per_day}
                              onChange={e => {
                                const v = parseInt(e.target.value) || 0;
                                setBibleConfig(c => ({ ...c, reading_plans: { ...c.reading_plans, [plan.id]: { ...cfg, points_per_day: v } } }));
                              }}
                              className="w-16 bg-black border-2 border-zinc-700 focus:border-amber-400 rounded-xl py-2 px-2 text-white font-black text-center outline-none text-sm transition-all"
                            />
                            <span className="text-zinc-600 text-[9px] font-black">pts</span>
                          </div>
                        </div>
                        <div className="text-zinc-700 font-black text-lg">+</div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Bônus Final</p>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={9999} value={cfg.bonus_points}
                              onChange={e => {
                                const v = parseInt(e.target.value) || 0;
                                setBibleConfig(c => ({ ...c, reading_plans: { ...c.reading_plans, [plan.id]: { ...cfg, bonus_points: v } } }));
                              }}
                              className="w-20 bg-black border-2 border-primary/30 focus:border-primary rounded-xl py-2 px-2 text-primary font-black text-center outline-none text-sm transition-all"
                            />
                            <span className="text-primary text-[9px] font-black">pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>


      {/* ── SEÇÃO 5: Duelo Sagrado ───────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-5">
        <SectionHeader
          icon={<Swords size={18} />}
          title="Duelo Sagrado"
          subtitle="Regras de batalha e premiação dos duelos bíblicos"
          color="text-red-400"
          expanded={expanded.duel}
          onToggle={() => toggle('duel')}
        />
        <AnimatePresence initial={false}>
          {expanded.duel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-6 pt-4">
                {/* Configurações de Dinâmica */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="font-black text-[10px] uppercase text-zinc-500 mb-2">Perguntas por Duelo</p>
                    <NumberInput 
                      value={(appConfig as any).duelSettings?.totalQuestions ?? 10}
                      onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), totalQuestions: v } }))}
                      accentClass="focus:border-red-400" 
                    />
                  </div>
                  <div className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="font-black text-[10px] uppercase text-zinc-500 mb-2">Tempo p/ Resposta (s)</p>
                    <NumberInput 
                      value={(appConfig as any).duelSettings?.questionTime ?? 20}
                      onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), questionTime: v } }))}
                      accentClass="focus:border-red-400" 
                    />
                  </div>
                  <div className="bg-black/30 border border-zinc-800 rounded-2xl p-4">
                    <p className="font-black text-[10px] uppercase text-zinc-500 mb-2">Espera Questão (ms)</p>
                    <NumberInput 
                      value={(appConfig as any).duelSettings?.waitTimeBetweenQuestions ?? 1500}
                      onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), waitTimeBetweenQuestions: v } }))}
                      accentClass="focus:border-red-400" 
                    />
                  </div>
                </div>

                {/* Pontos de Vitória */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-1">
                      <Trophy size={14} className="text-red-400" />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Recompensa em Pontos (XP)</span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <PointRow emoji="🥇" label="Vitória" desc="Pontos por vencer o duelo"
                        value={(appConfig as any).duelSettings?.winPoints ?? 60}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), winPoints: v } }))}
                        accentClass="focus:border-green-500" labelClass="text-green-500" />
                      <PointRow emoji="🤝" label="Empate" desc="Pontos para ambos em empate"
                        value={(appConfig as any).duelSettings?.drawPoints ?? 30}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), drawPoints: v } }))}
                        accentClass="focus:border-yellow-500" labelClass="text-yellow-500" />
                      <PointRow emoji="🥉" label="Derrota" desc="Pontos de participação"
                        value={(appConfig as any).duelSettings?.lossPoints ?? 15}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), lossPoints: v } }))}
                        accentClass="focus:border-red-500" labelClass="text-red-500" />
                   </div>
                </div>

                {/* Moedas */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-1">
                      <Coins size={14} className="text-yellow-500" />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Recompensa em Moedas</span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <PointRow emoji="💰" label="Vitória" desc="Moedas por vencer"
                        value={(appConfig as any).duelSettings?.winCoins ?? 20}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), winCoins: v } }))}
                        accentClass="focus:border-yellow-500" labelClass="text-yellow-500" />
                      <PointRow emoji="🪙" label="Empate" desc="Moedas em empate"
                        value={(appConfig as any).duelSettings?.drawCoins ?? 10}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), drawCoins: v } }))}
                        accentClass="focus:border-yellow-500" labelClass="text-yellow-500" />
                      <PointRow emoji="💸" label="Derrota" desc="Moedas de participação"
                        value={(appConfig as any).duelSettings?.lossCoins ?? 5}
                        onChange={v => setAppConfig(c => ({ ...c, duelSettings: { ...((c as any).duelSettings || {}), lossCoins: v } }))}
                        accentClass="focus:border-yellow-500" labelClass="text-yellow-500" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Resumo visual ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8">
        <h3 className="text-sm font-black text-white uppercase italic mb-6 flex items-center gap-2">
          <Star size={16} className="text-primary" /> Resumo Atual
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Login/dia',       value: appConfig.dailyLoginBonus.points,       color: 'text-green-400' },
            { label: 'Post Mural',      value: muralConfig.postPoints,                 color: 'text-purple-400' },
            { label: 'Estudo Bíblico',  value: muralConfig.studyPoints,                color: 'text-purple-400' },
            { label: 'Comentário',      value: muralConfig.commentPoints,              color: 'text-purple-400' },
            { label: 'Devocional',      value: bibleConfig.devotional_points,          color: 'text-primary' },
            { label: 'Leitura/cap.',    value: bibleConfig.free_reading_points,        color: 'text-blue-400' },
          ].map(item => (
            <div key={item.label} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black italic ${item.color}`}>+{item.value}</p>
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

        </motion.div>
      )}

      {/* ── Banner de salvamento pendente ─────────────────────────────────── */}
      <AnimatePresence>
        {isAnyDirty && !saving && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border-4 border-primary rounded-full px-8 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(251,191,36,0.3)] z-50"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-white font-black uppercase text-xs tracking-widest">Alterações não salvas</span>
            <button onClick={handleSave}
              className="bg-primary text-black px-5 py-2 rounded-full font-black uppercase text-xs hover:bg-white transition-all">
              Salvar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
