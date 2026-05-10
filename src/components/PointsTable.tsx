import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Search, Info } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ActivityDefinition, ActivityCategory } from '../types';
import { ActivityService, CATEGORY_LABELS } from '../lib/ActivityService';
import LoadingSpinner from './LoadingSpinner';

export default function PointsTable() {
  const [activities, setActivities] = useState<ActivityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'all'>('all');

  useEffect(() => {
    ActivityService.getAll().then(data => {
      setActivities(data.filter(a => a.is_active));
      setLoading(false);
    });
  }, []);

  const filtered = activities.filter(a => {
    const matchCategory = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Agrupar por categoria
  const grouped = filtered.reduce<Record<string, ActivityDefinition[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as ActivityCategory[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-[3rem] p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Zap size={20} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gincana da Tribo</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Tabela de <span className="text-primary">Pontuações</span>
            </h2>
            <p className="text-zinc-500 text-sm font-bold mt-2 max-w-lg">
              Veja quantos pontos cada atividade vale e planeje sua semana para subir no ranking! 🏆
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-black border-2 border-zinc-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white">{activities.length}</p>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Atividades</p>
            </div>
            <div className="bg-primary rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-black">{activities.reduce((s, a) => s + a.current_points, 0)}</p>
              <p className="text-[9px] text-black/70 font-black uppercase tracking-widest">Pts Disponíveis</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Buscar atividade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border-2 border-zinc-800 focus:border-primary rounded-2xl py-4 pl-12 pr-5 text-white font-bold outline-none transition-all placeholder:text-zinc-600 text-sm"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeCategory === 'all' ? 'bg-primary border-primary text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
          }`}
        >
          🎯 Todas
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as ActivityCategory)}
            className={`px-4 py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeCategory === key ? 'bg-primary border-primary text-black' : `${meta.color} hover:border-primary/50`
            }`}
          >
            {meta.icon} {meta.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <LoadingSpinner message="Carregando Tabela de Honra..." size="md" />
      ) : (
        <div className="space-y-8">
          {(activeCategory === 'all' ? categories : [activeCategory]).map(cat => {
            const items = grouped[cat] ?? filtered.filter(a => a.category === cat);
            if (!items?.length) return null;
            const meta = CATEGORY_LABELS[cat];

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Category Header */}
                <div className={`flex items-center gap-3 mb-4 px-2`}>
                  <span className="text-2xl">{meta.icon}</span>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{meta.label}</h3>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${meta.color}`}>
                    {items.length} atividades
                  </span>
                </div>

                {/* Activity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.sort((a, b) => b.current_points - a.current_points).map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 flex items-start gap-4 group transition-all"
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${meta.color}`}>
                        {(() => {
                          const IconComp = (LucideIcons as any)[activity.icon] || Zap;
                          return <IconComp size={24} />;
                        })()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-white text-sm uppercase italic tracking-tight leading-tight">
                            {activity.title}
                          </h4>
                          {/* Points Badge */}
                          <div className="shrink-0 flex items-center gap-1 bg-black border-2 border-primary/50 rounded-xl px-3 py-1">
                            <Zap size={10} className="text-primary" fill="currentColor" />
                            <span className="text-primary font-black text-sm">{activity.current_points}</span>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-[10px] font-bold mt-1 leading-relaxed">{activity.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {activity.max_per_week && (
                            <span className="text-[8px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-black uppercase">
                              máx {activity.max_per_week}x/semana
                            </span>
                          )}
                          {activity.requires_proof && (
                            <span className="text-[8px] bg-amber-900/30 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full font-black uppercase">
                              requer comprovação
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <Info size={40} className="text-zinc-700" />
              <p className="text-zinc-500 font-black uppercase italic text-sm tracking-widest">Nenhuma atividade encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
