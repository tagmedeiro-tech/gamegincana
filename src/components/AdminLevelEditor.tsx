import React, { useState, useEffect, useCallback, memo } from 'react';
import { Trophy, Plus, Trash2, Save, Palette, Hash, Type, ArrowUpCircle, Sword, Medal, Award, Crown, Star, Zap, Shield, Gem, Flame, Target, Flag, RefreshCw, Skull, Ghost, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAppTheme } from '../hooks/useAppTheme';
import { useToast } from '../context/ToastContext';
import { UserLevel } from '../types';
import LoadingSpinner from './LoadingSpinner';
import LevelIcon from './LevelIcon';

const AVAILABLE_ICONS = [
  { id: 'Trophy', icon: Trophy },
  { id: 'Medal', icon: Medal },
  { id: 'Award', icon: Award },
  { id: 'Crown', icon: Crown },
  { id: 'Star', icon: Star },
  { id: 'Zap', icon: Zap },
  { id: 'Shield', icon: Shield },
  { id: 'Gem', icon: Gem },
  { id: 'Flame', icon: Flame },
  { id: 'Target', icon: Target },
  { id: 'Flag', icon: Flag },
  { id: 'Sword', icon: Sword },
  { id: 'Skull', icon: Skull },
  { id: 'Ghost', icon: Ghost },
];

const LevelItemCard = memo(({ 
  lvl, 
  index, 
  handleRemoveLevel, 
  handleUpdateLevel 
}: { 
  lvl: UserLevel, 
  index: number, 
  handleRemoveLevel: (i: number) => void, 
  handleUpdateLevel: (i: number, f: keyof UserLevel, v: any) => void 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ borderColor: lvl.color || '#3f3f46' }}
      className="bg-zinc-950 border-4 border-zinc-900 p-5 md:p-6 rounded-[2.5rem] md:rounded-[32px] flex flex-col items-start gap-6 group relative overflow-hidden"
    >
      <div className="flex flex-row items-center gap-4 md:gap-6 w-full">
        <div 
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border-4 shadow-xl"
          style={{ backgroundColor: `${lvl.color}20`, borderColor: lvl.color, color: lvl.color }}
        >
          <LevelIcon name={lvl.icon} size={24} color={lvl.color} />
          <span className="text-[10px] font-black italic -mt-1">{lvl.level}</span>
        </div>

        <div className="flex-1">
           <h4 className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">{lvl.title || 'Sem Título'}</h4>
           <p className="text-[10px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">Configuração do Rank</p>
        </div>

        <button 
          onClick={() => handleRemoveLevel(index)}
          className="md:hidden p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">
            <Type size={10} /> Título do Rank
          </label>
          <input 
            type="text" 
            value={lvl.title || ''}
            onChange={(e) => handleUpdateLevel(index, 'title', e.target.value)}
            className="w-full bg-zinc-900 border-2 border-zinc-800 p-3.5 rounded-xl text-white font-bold focus:border-primary outline-hidden text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">
            <ArrowUpCircle size={10} /> Pontos Mínimos
          </label>
          <input 
            type="number" 
            value={lvl.minPoints ?? ''}
            onChange={(e) => handleUpdateLevel(index, 'minPoints', parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-900 border-2 border-zinc-800 p-3.5 rounded-xl text-white font-bold focus:border-primary outline-hidden text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">
            <Hash size={10} /> Pontos Máximos
          </label>
          <input 
            type="text" 
            value={lvl.maxPoints === Infinity ? 'MAX' : (lvl.maxPoints ?? '')}
            onChange={(e) => handleUpdateLevel(index, 'maxPoints', e.target.value === 'MAX' ? Infinity : (parseInt(e.target.value) || 0))}
            className="w-full bg-zinc-900 border-2 border-zinc-800 p-3.5 rounded-xl text-white font-bold focus:border-primary outline-hidden text-sm"
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest italic ml-1">
            <Palette size={10} /> Estética e Troféu
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="relative group/color">
                <input 
                  type="color" 
                  value={lvl.color}
                  onChange={(e) => handleUpdateLevel(index, 'color', e.target.value)}
                  className="w-12 h-12 bg-zinc-900 border-2 border-zinc-800 rounded-xl cursor-pointer appearance-none"
                />
                <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-white/10" style={{ backgroundColor: lvl.color }} />
              </div>
              <input 
                type="text" 
                value={(lvl.color || '#71717A').toUpperCase()}
                onChange={(e) => handleUpdateLevel(index, 'color', e.target.value)}
                className="flex-1 bg-zinc-900 border-2 border-zinc-800 p-3.5 rounded-xl text-white font-mono text-[10px] focus:border-primary outline-hidden"
              />
            </div>

              <div className="flex gap-2 items-center bg-zinc-900 border-2 border-zinc-800 rounded-xl p-2 overflow-x-auto scrollbar-hide">
                 {AVAILABLE_ICONS.map((item) => (
                   <motion.button
                     key={item.id}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => handleUpdateLevel(index, 'icon', item.id)}
                     className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                       lvl.icon === item.id 
                        ? 'bg-zinc-800 border-2 border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                        : 'border-2 border-transparent hover:border-zinc-700'
                     }`}
                   >
                     <LevelIcon name={item.id} size={20} color={lvl.icon === item.id ? lvl.color : '#3f3f46'} />
                   </motion.button>
                 ))}
              </div>
          </div>
        </div>
      </div>

      <button 
        onClick={() => handleRemoveLevel(index)}
        className="hidden md:flex absolute top-6 right-6 p-4 bg-zinc-900 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border-2 border-transparent hover:border-red-500/50"
      >
        <Trash2 size={20} />
      </button>
    </motion.div>
  );
});

export default function AdminLevelEditor() {
  const theme = useAppTheme();
  const { success, error, info } = useToast();
  const [levels, setLevels] = useState<UserLevel[]>(theme.levels || []);
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Auto-Save Draft
  useEffect(() => {
    const draft = localStorage.getItem('draft_admin_levels');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (JSON.stringify(parsedDraft) !== JSON.stringify(theme.levels)) {
          setHasDraft(true);
        }
      } catch (e) {
        localStorage.removeItem('draft_admin_levels');
      }
    }
  }, [theme.levels]);

  useEffect(() => {
    if (levels.length > 0 && JSON.stringify(levels) !== JSON.stringify(theme.levels)) {
      localStorage.setItem('draft_admin_levels', JSON.stringify(levels));
    }
  }, [levels, theme.levels]);

  const handleRestoreDraft = () => {
    const draft = localStorage.getItem('draft_admin_levels');
    if (draft) {
      setLevels(JSON.parse(draft));
      setHasDraft(false);
      info('Rascunho Restaurado', 'As alterações não salvas foram recuperadas.');
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('draft_admin_levels');
    setLevels(theme.levels || []);
    setHasDraft(false);
  };

  const handleAddLevel = useCallback(() => {
    setLevels(prev => {
      const nextLevel = prev.length + 1;
      const lastLevel = prev[prev.length - 1];
      
      const newLevel: UserLevel = {
        level: nextLevel,
        title: `Novo Rank ${nextLevel}`,
        minPoints: lastLevel ? (lastLevel.maxPoints === Infinity ? lastLevel.minPoints + 500 : lastLevel.maxPoints + 1) : 0,
        maxPoints: Infinity,
        color: '#71717A',
        icon: 'Trophy'
      };

      const updatedLevels = prev.map((l, i) => {
        if (i === prev.length - 1 && l.maxPoints === Infinity) {
          return { ...l, maxPoints: l.minPoints + 499 };
        }
        return l;
      });

      return [...updatedLevels, newLevel];
    });
  }, []);

  const handleGenerate50 = useCallback(() => {
    const newLevels: UserLevel[] = [];
    const titles = [
      'Recruta', 'Soldado', 'Cabo', 'Sargento', 'Tenente', 'Capitão', 'Major', 'Coronel', 'General', 'Marechal',
      'Sentinela', 'Guardião', 'Vigilante', 'Protetor', 'Defensor', 'Paladino', 'Templário', 'Cavaleiro', 'Barão', 'Visconde',
      'Conde', 'Marquês', 'Duque', 'Príncipe', 'Rei', 'Imperador', 'Soberano', 'Ancestral', 'Imortal', 'Divindade',
      'Guerreiro', 'Caçador', 'Assassino', 'Bárbaro', 'Monge', 'Clérigo', 'Mago', 'Arquimago', 'Feiticeiro', 'Necromante',
      'Lenda', 'Mito', 'Avatar', 'Titã', 'Colosso', 'Elite', 'Vanguarda', 'Mestre', 'Grão-Mestre', 'Supremo'
    ];

    const colors = ['#71717A', '#94A3B8', '#FBBF24', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#EF4444'];
    const icons = AVAILABLE_ICONS.map(i => i.id);

    for (let i = 1; i <= 50; i++) {
      const minPts = i === 1 ? 0 : Math.floor(Math.pow(i - 1, 2.5) * 40);
      const nextMinPts = i === 50 ? Infinity : Math.floor(Math.pow(i, 2.5) * 40);
      const maxPts = i === 50 ? Infinity : nextMinPts - 1;

      newLevels.push({
        level: i,
        title: titles[i - 1] || `Rank ${i}`,
        minPoints: minPts,
        maxPoints: maxPts,
        color: colors[(Math.floor((i-1)/7)) % colors.length],
        icon: i > 45 ? 'Skull' : i > 40 ? 'Ghost' : icons[(Math.floor((i-1)/4)) % icons.length]
      });
    }
    setLevels(newLevels);
    // Nota: success é dependência do useCallback
    success("50 Níveis Gerados!", "A hierarquia foi expandida com sucesso. Não esqueça de Salvar.");
  }, [success]);

  const handleRemoveLevel = useCallback((index: number) => {
    setLevels(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index).map((l, i) => ({
        ...l,
        level: i + 1
      }));
    });
  }, []);

  const handleUpdateLevel = useCallback((index: number, field: keyof UserLevel, value: any) => {
    setLevels(prev => {
      const newLevels = [...prev];
      newLevels[index] = { ...newLevels[index], [field]: value };
      return newLevels;
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Re-idrata sessão caso aba estivesse inativa para evitar erro 401 ou abort
      await supabase.auth.getSession();

      const { data: currentConfig } = await supabase.from('config').select('value').eq('key', 'app').single();
      const newConfig = { 
        ...(currentConfig?.value as any || {}), 
        levels: levels 
      };

      const { error: saveError } = await supabase.from('config').update({ value: newConfig }).eq('key', 'app');
      if (saveError) throw saveError;

      success('Níveis salvos com sucesso!');
      localStorage.removeItem('draft_admin_levels');
      setHasDraft(false);
    } catch (err: any) {
      console.error(err);
      error('Falha ao salvar', err.message || 'Erro de conexão ou timeout. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-4 border-zinc-800">
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <Trophy size={20} className="fill-primary" />
            <span className="font-black uppercase italic tracking-widest text-[10px] md:text-sm">Progressão de Rank</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white leading-none">Editor de <span className="text-primary">Níveis</span></h2>
          <p className="text-zinc-500 font-bold text-xs md:text-sm">Configure os marcos de pontuação e títulos para a evolução dos membros.</p>
        </div>

        <div className="flex flex-col gap-3">
          {hasDraft && (
            <div className="flex bg-amber-500/10 border-2 border-amber-500/20 rounded-xl overflow-hidden p-1 gap-1">
              <button 
                onClick={handleRestoreDraft}
                className="flex-1 px-4 py-2 text-[10px] md:text-xs font-black uppercase italic tracking-widest text-amber-500 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Restaurar Rascunho
              </button>
              <button 
                onClick={handleClearDraft}
                className="px-4 py-2 text-[10px] md:text-xs font-black uppercase italic text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Descartar
              </button>
            </div>
          )}
          <div className="flex flex-row gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={handleGenerate50}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-zinc-950 text-primary border-2 border-primary/20 rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest text-[10px] md:text-xs hover:bg-primary/10 transition-all whitespace-nowrap"
            >
              <RefreshCw size={16} />
              Gerar 50 Níveis
            </button>
            <button 
              onClick={handleAddLevel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-zinc-800 text-white rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest text-[10px] md:text-xs hover:bg-zinc-700 transition-all border-b-4 border-zinc-950 whitespace-nowrap"
            >
              <Plus size={16} />
              Add Nível
            </button>
            <button 
              disabled={loading}
              onClick={handleSave}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 md:py-4 bg-primary text-black rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest text-[10px] md:text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(251,191,36,0.2)] border-b-4 border-amber-600 whitespace-nowrap"
            >
              {loading ? <LoadingSpinner size="sm" /> : <><Save size={16} /> Salvar Tudo</>}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {levels.map((lvl, index) => (
            <LevelItemCard
              key={lvl.level}
              lvl={lvl}
              index={index}
              handleRemoveLevel={handleRemoveLevel}
              handleUpdateLevel={handleUpdateLevel}
            />
          ))}
        </AnimatePresence>

        {levels.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-[40px] border-4 border-dashed border-zinc-800">
             <Trophy size={48} className="text-zinc-800 mx-auto mb-4" />
             <p className="text-zinc-600 font-black uppercase italic">Nenhum nível definido</p>
          </div>
        )}
      </div>
    </div>
  );
}
