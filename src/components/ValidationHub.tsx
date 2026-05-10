import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Clock, Search, 
  ImageIcon, User, Calendar, ShieldCheck,
  Eye, CheckSquare
} from 'lucide-react';
import { ValidationService, PendingMission } from '../lib/ValidationService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ValidationHub() {
  const [missions, setMissions] = useState<PendingMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'event' | 'activity'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { success, error, info } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const data = await ValidationService.getPendingAll();
      setMissions(data);
    } catch (err) {
      console.error(err);
      error("Erro", "Falha ao carregar pendências.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (mission: PendingMission, status: 'approved' | 'rejected') => {
    setProcessingId(mission.id);
    try {
      await ValidationService.validate(mission, status, profile?.avatar_url || profile?.avatarUrl);
      setMissions(prev => prev.filter(m => m.id !== mission.id));
      if (status === 'approved') {
        success("Aprovado!", `+${mission.points} XP para ${mission.userName}.`);
      } else {
        info("Recusado", "A prova foi rejeitada.");
      }
    } catch (err) {
      console.error(err);
      error("Erro", "Falha ao processar validação.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    if (filteredMissions.length === 0) return;
    
    setIsProcessingBulk(true);
    let count = 0;
    try {
      for (const mission of filteredMissions) {
        await ValidationService.validate(mission, 'approved', profile?.avatar_url || profile?.avatarUrl);
        count++;
      }
      setMissions(prev => prev.filter(m => !filteredMissions.find(fm => fm.id === m.id)));
      success("Operação Concluída", `${count} missões foram aprovadas com sucesso!`);
    } catch (err) {
      console.error(err);
      error("Erro Parcial", "Ocorreu um erro durante a aprovação em massa.");
      loadMissions(); 
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.userName.toLowerCase().includes(search.toLowerCase()) ||
                         m.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  // Guard: spinner apenas no primeiro carregamento (sem dados em cache)
  if (loading && missions.length === 0) return <LoadingSpinner message="Sincronizando Tribunal..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Tribunal de Validação</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">
              Controle de <span className="text-primary drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">Provas</span>
            </h1>
            <p className="text-zinc-500 font-bold mt-4 max-w-xl text-sm md:text-base leading-relaxed">
              Analise as conquistas da tribo, valide evidências fotográficas e 
              recompense os guerreiros com XP e reconhecimento em tempo real.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 backdrop-blur-xl border-2 border-zinc-800 p-2 rounded-4xl flex flex-col md:flex-row items-center gap-4 shadow-2xl"
        >
          <div className="flex items-center gap-6 px-6 py-2 border-b md:border-b-0 md:border-r border-zinc-800 w-full md:w-auto">
            <div className="text-center">
              <p className="text-4xl font-black text-white leading-none">{missions.length}</p>
              <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">Pendentes</p>
            </div>
            <div className="h-10 w-px bg-zinc-800 hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-black text-primary leading-none">
                {missions.reduce((acc, m) => acc + m.points, 0).toLocaleString()}
              </p>
              <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">XP em Jogo</p>
            </div>
          </div>

          <div className="relative group w-full md:w-72 px-4 md:px-2">
            <Search className="absolute left-6 md:left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar guerreiro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all placeholder:text-zinc-700"
            />
          </div>
        </motion.div>
      </div>

      {/* ── FILTROS E AÇÕES EM MASSA ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/30 p-4 rounded-3xl border border-zinc-800/50">
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-zinc-800">
          {(['all', 'event', 'activity'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterType === type 
                ? 'bg-primary text-black shadow-[0_5px_15px_rgba(251,191,36,0.2)]' 
                : 'text-zinc-500 hover:text-white'
              }`}
            >
              {type === 'all' ? 'Todas' : type === 'event' ? 'Missões' : 'Atividades'}
            </button>
          ))}
        </div>

        {filteredMissions.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApproveAll}
            disabled={isProcessingBulk}
            className="w-full md:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase italic text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all"
          >
            {isProcessingBulk ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckSquare size={20} />
            )}
            <span>Aprovar {filteredMissions.length} Provas com 1 Clique</span>
          </motion.button>
        )}
      </div>

      {/* ── GRID DE CARDS ── */}
      <AnimatePresence mode="popLayout">
        {filteredMissions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-[4rem]"
          >
            <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center text-zinc-800 relative">
              <Clock size={48} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-zinc-700 rounded-full"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Área Limpa</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhuma prova pendente para este filtro.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMissions.map((mission, idx) => (
              <motion.div
                key={mission.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-zinc-900 border-2 border-zinc-800 rounded-[3rem] overflow-hidden hover:border-primary/40 transition-all flex flex-col shadow-2xl hover:shadow-primary/5"
              >
                <div className="p-6 flex items-start justify-between border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-primary border border-zinc-700 shadow-inner group-hover:scale-110 transition-transform">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white uppercase italic tracking-tight line-clamp-1">{mission.userName}</h4>
                      <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5">
                        <Calendar size={12} className="text-zinc-600" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          {new Date(mission.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black italic shadow-[0_5px_15px_rgba(251,191,36,0.1)]">
                      +{mission.points} XP
                    </div>
                  </div>
                </div>

                <div className="relative aspect-video bg-black overflow-hidden group/image">
                  {mission.proofUrl ? (
                    <>
                      <img 
                        src={mission.proofUrl} 
                        alt="Prova" 
                        className="w-full h-full object-cover transition-all duration-700 group-hover/image:scale-110 group-hover/image:opacity-40"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all scale-75 group-hover/image:scale-100">
                        <button 
                          onClick={() => setSelectedImage(mission.proofUrl)}
                          className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
                        >
                          <Eye size={24} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-950">
                      <ImageIcon size={48} className="animate-pulse" />
                      <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Sem evidência visual</span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-1.5 backdrop-blur-md border rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl ${
                      mission.type === 'event' 
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' 
                      : 'bg-blue-500/20 border-blue-500/30 text-blue-500'
                    }`}>
                      {mission.type === 'event' ? '🏆 Missão Tribal' : '🎯 Atividade Diária'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Título da Conquista</p>
                    <h3 className="text-xl font-black text-white uppercase italic leading-tight group-hover:text-primary transition-colors">
                      {mission.title}
                    </h3>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAction(mission, 'approved')}
                      disabled={!!processingId || isProcessingBulk}
                      className="flex-3 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.15)]"
                    >
                      <CheckCircle2 size={20} strokeWidth={3} />
                      <span className="text-xs font-black uppercase italic tracking-tighter">Aprovar Agora</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAction(mission, 'rejected')}
                      disabled={!!processingId || isProcessingBulk}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 disabled:opacity-50 text-zinc-500 rounded-2xl flex items-center justify-center transition-all border border-zinc-700/50"
                    >
                      <XCircle size={20} />
                    </motion.button>
                  </div>
                </div>

                {processingId === mission.id && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-10 space-y-4"
                  >
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Processando XP...</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)]"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Fullscreen" className="w-full h-full object-contain bg-zinc-950" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-8 right-8 w-14 h-14 bg-black/50 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all shadow-2xl backdrop-blur-md"
              >
                <XCircle size={32} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
