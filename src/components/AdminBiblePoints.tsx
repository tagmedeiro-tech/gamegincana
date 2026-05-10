import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Save, RotateCcw, Zap, Trophy, CheckCircle2, BookMarked, Scroll } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { READING_PLANS } from '../lib/ReadingPlanService';

// ─── TIPOS ──────────────────────────────────────────────────────────────────

export interface BiblePointsConfig {
  devotional_points: number;        // pontos por concluir o devocional diário
  free_reading_points: number;      // pontos por marcar um capítulo como lido (leitura livre)
  quiz_bonus_per_correct: number;   // bônus por cada resposta certa no quiz pós-leitura
  reading_plans: Record<string, {   // por planId
    points_per_day: number;
    bonus_points: number;
  }>;
}

const DEFAULTS: BiblePointsConfig = {
  devotional_points: 20,
  free_reading_points: 10,
  quiz_bonus_per_correct: 5,
  reading_plans: Object.fromEntries(
    READING_PLANS.map(p => [p.id, { points_per_day: p.pointsPerDay, bonus_points: p.bonusPoints }])
  ),
};

const CONFIG_KEY = 'bible_points';

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useBiblePointsConfig(): BiblePointsConfig {
  const [config, setConfig] = useState<BiblePointsConfig>(DEFAULTS);

  useEffect(() => {
    supabase.from('config').select('value').eq('key', CONFIG_KEY).single()
      .then(({ data }) => {
        if (data?.value) setConfig({ ...DEFAULTS, ...data.value as BiblePointsConfig });
      });

    const channelId = `bible_points_realtime_${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: `key=eq.${CONFIG_KEY}` }, (payload) => {
        const val = (payload.new as { value?: BiblePointsConfig }).value;
        if (val) setConfig({ ...DEFAULTS, ...val });
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);

  return config;
}

// ─── COMPONENTE ADMIN ────────────────────────────────────────────────────────

export default function AdminBiblePoints() {
  const [config, setConfig] = useState<BiblePointsConfig>(DEFAULTS);
  const [original, setOriginal] = useState<BiblePointsConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('config').select('value').eq('key', CONFIG_KEY).single()
      .then(({ data }) => {
        if (data?.value) {
          const merged = { ...DEFAULTS, ...data.value as BiblePointsConfig };
          setConfig(merged);
          setOriginal(merged);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('config')
      .upsert({ key: CONFIG_KEY, value: config }, { onConflict: 'key' });
    if (!error) {
      setOriginal(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleReset = () => setConfig(DEFAULTS);

  const setBase = (field: keyof Omit<BiblePointsConfig, 'reading_plans'>, value: number) => {
    setConfig(c => ({ ...c, [field]: value }));
  };

  const setPlanPoints = (planId: string, field: 'points_per_day' | 'bonus_points', value: number) => {
    setConfig(c => ({
      ...c,
      reading_plans: {
        ...c.reading_plans,
        [planId]: { ...c.reading_plans[planId], [field]: value },
      },
    }));
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(original);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-primary mb-2">
            <BookOpen size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Pontuação Bíblica</span>
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">
            Módulo <span className="text-primary">Bíblia</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold mt-2 uppercase tracking-widest">
            Gerencie pontos do devocional, leituras e planos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl font-black uppercase text-xs transition-all border-2 border-zinc-700"
          >
            <RotateCcw size={16} /> Padrões
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all border-2 ${
              saved
                ? 'bg-green-500 border-green-500 text-black'
                : isDirty
                ? 'bg-primary border-primary text-black hover:bg-white shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {saved ? <><CheckCircle2 size={16} /> Salvo!</> : saving ? 'Salvando...' : <><Save size={16} /> Salvar Configurações</>}
          </button>
        </div>
      </div>

      {/* Seção 1: Leituras Base */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-zinc-800">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30">
            <BookOpen size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic">Leituras Diárias</h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase">Pontos por interação bíblica individual</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              field: 'devotional_points' as const,
              label: '🙏 Devocional Diário',
              desc: 'Pontos por concluir o devocional pessoal do dia',
              color: 'text-primary border-primary/30 bg-primary/5',
              icon: <Zap size={16} className="text-primary" />,
            },
            {
              field: 'free_reading_points' as const,
              label: '📖 Leitura Livre',
              desc: 'Pontos por marcar qualquer capítulo como lido',
              color: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
              icon: <BookMarked size={16} className="text-blue-400" />,
            },
            {
              field: 'quiz_bonus_per_correct' as const,
              label: '🧠 Quiz — Bônus/Acerto',
              desc: 'XP extra por cada resposta correta no quiz',
              color: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
              icon: <Trophy size={16} className="text-purple-400" />,
            },
          ].map(item => (
            <motion.div
              key={item.field}
              whileHover={{ scale: 1.01 }}
              className={`bg-black/40 border-2 rounded-3xl p-5 ${item.color}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {item.icon}
                <p className="font-black text-xs uppercase tracking-widest">{item.label}</p>
              </div>
              <p className="text-zinc-600 text-[10px] mb-4 leading-relaxed">{item.desc}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={config[item.field]}
                  onChange={e => setBase(item.field, parseInt(e.target.value) || 0)}
                  className="w-24 bg-black border-2 border-zinc-700 focus:border-primary rounded-xl py-3 px-4 text-white font-black text-center outline-none text-xl transition-all"
                />
                <span className="text-zinc-500 font-black text-sm uppercase">pts</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Seção 2: Planos de Leitura */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-zinc-800">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30">
            <Scroll size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic">Planos de Leitura</h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase">Pontos diários e bônus de conclusão por plano</p>
          </div>
        </div>

        <div className="space-y-3">
          {READING_PLANS.map(plan => {
            const planConfig = config.reading_plans[plan.id] ?? { points_per_day: plan.pointsPerDay, bonus_points: plan.bonusPoints };
            const defaultCfg = DEFAULTS.reading_plans[plan.id];
            const isDirtyPlan = planConfig.points_per_day !== defaultCfg.points_per_day || planConfig.bonus_points !== defaultCfg.bonus_points;

            return (
              <div
                key={plan.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 border-2 border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 transition-all"
              >
                {/* Info do plano */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-zinc-800 border-2 border-zinc-700" style={{ borderColor: plan.color + '40' }}>
                    {plan.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white uppercase italic text-sm">{plan.name}</h3>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full border" style={{ color: plan.color, borderColor: plan.color + '40', backgroundColor: plan.color + '15' }}>
                        {plan.totalDays} dias
                      </span>
                      {isDirtyPlan && (
                        <span className="text-[9px] bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-black uppercase">Editado</span>
                      )}
                    </div>
                    <p className="text-zinc-600 text-[11px] truncate">{plan.description}</p>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Por dia</p>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={planConfig.points_per_day}
                        onChange={e => setPlanPoints(plan.id, 'points_per_day', parseInt(e.target.value) || 0)}
                        className="w-16 bg-black border-2 border-zinc-700 focus:border-primary rounded-xl py-2 px-2 text-white font-black text-center outline-none text-sm transition-all"
                      />
                      <span className="text-zinc-600 text-[9px] font-black">pts</span>
                    </div>
                  </div>

                  <div className="text-zinc-700 font-black">+</div>

                  <div className="text-center">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Bônus Final</p>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={9999}
                        value={planConfig.bonus_points}
                        onChange={e => setPlanPoints(plan.id, 'bonus_points', parseInt(e.target.value) || 0)}
                        className="w-20 bg-black border-2 border-primary/30 focus:border-primary rounded-xl py-2 px-2 text-primary font-black text-center outline-none text-sm transition-all"
                      />
                      <span className="text-primary text-[9px] font-black">pts</span>
                    </div>
                  </div>

                  {isDirtyPlan && (
                    <button
                      onClick={() => {
                        setPlanPoints(plan.id, 'points_per_day', defaultCfg.points_per_day);
                        setPlanPoints(plan.id, 'bonus_points', defaultCfg.bonus_points);
                      }}
                      title="Restaurar padrão"
                      className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-white flex items-center justify-center transition-all"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resumo Visual */}
      <section className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-8">
        <h3 className="text-sm font-black text-white uppercase italic mb-6">📊 Resumo de Pontuação</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Devocional/dia', value: config.devotional_points, color: 'text-primary' },
            { label: 'Leitura livre', value: config.free_reading_points, color: 'text-blue-400' },
            { label: 'Quiz/acerto', value: config.quiz_bonus_per_correct, color: 'text-purple-400' },
            {
              label: 'Maior bônus plano',
              value: Math.max(...READING_PLANS.map(p => config.reading_plans[p.id]?.bonus_points ?? p.bonusPoints)),
              color: 'text-green-400'
            },
          ].map(item => (
            <div key={item.label} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black italic ${item.color}`}>+{item.value}</p>
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Banner de aviso de salvamento pendente */}
      {isDirty && !saving && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border-4 border-primary rounded-full px-8 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(251,191,36,0.3)] z-50"
        >
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-white font-black uppercase text-xs tracking-widest">Alterações não salvas</span>
          <button onClick={handleSave} className="bg-primary text-black px-5 py-2 rounded-full font-black uppercase text-xs hover:bg-white transition-all">
            Salvar
          </button>
        </motion.div>
      )}
    </div>
  );
}
