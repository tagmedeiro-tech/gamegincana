import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, AlertTriangle, Calendar, Trash2, ShieldAlert, Trophy, Zap, Info, BookOpen, Clock, History, Target, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../context/ToastContext';

export default function AdminSeasonManager() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    resetPoints: true,
    resetLogs: true,
    resetActivities: true,
    resetBible: false,
    useWaitingRoom: true
  });
  const [currentSchedule, setCurrentSchedule] = useState<{ status: string, date: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  
  const { success, error, info } = useToast();

  const fetchSchedule = useCallback(async () => {
    const { data } = await supabase.from('config').select('value').eq('key', 'app').single();
    if (data?.value) {
      const val = data.value as any;
      setCurrentSchedule({
        status: val.gincanaStatus || 'active',
        date: val.gincanaStartDate || new Date().toISOString()
      });
      if (val.gincanaStartDate) {
        setStartDate(new Date(val.gincanaStartDate).toISOString().slice(0, 16));
      }
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (currentSchedule?.status !== 'waiting') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(currentSchedule.date).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSchedule]);

  const handleStartGincana = async () => {
    if (confirmText !== 'INICIAR GINCANA') {
      error('Palavra-chave incorreta!');
      return;
    }

    setLoading(true);
    try {
      // 1. Zerar pontos dos usuários e grupos diretamente com filtro (dummy where)
      // Adicionamos .not('id', 'is', null) para satisfazer a exigência de um WHERE clause
      const { error: userError } = await supabase
        .from('profiles')
        .update({ totalPoints: 0, coins: 0 })
        .not('id', 'is', null);

      if (userError) throw userError;

      const { error: groupError } = await supabase
        .from('groups')
        .update({ totalPoints: 0 })
        .not('id', 'is', null);

      if (groupError) throw groupError;

      // 1.1 Limpar Histórico (point_logs)
      if (options.resetLogs) {
        await supabase.from('point_logs').delete().not('id', 'is', null);
      }

      // 1.2 Limpar Participações e Mural (participations, feed_posts, comments, reactions)
      if (options.resetActivities) {
        await supabase.from('participations').delete().not('id', 'is', null);
        await supabase.from('post_reactions').delete().not('id', 'is', null);
        await supabase.from('post_comments').delete().not('id', 'is', null);
        await supabase.from('feed_posts').delete().not('id', 'is', null);
      }

      // 1.3 Resetar Bíblia (bible_completions)
      if (options.resetBible) {
        await supabase.from('bible_completions').delete().not('id', 'is', null);
      }

      // 2. Atualizar a data de início no Config
      const { data: currentConfig } = await supabase.from('config').select('value').eq('key', 'app').single();
      
      const newStatus = options.useWaitingRoom ? 'waiting' : 'active';
      
      const newConfig = { 
        ...(currentConfig?.value as any || {}), 
        gincanaStartDate: new Date(startDate).toISOString(),
        gincanaStatus: newStatus
      };

      await supabase.from('config').update({ value: newConfig }).eq('key', 'app');

      // 3. Notificar todos se for 'active' imediato
      if (newStatus === 'active') {
        await supabase.from('feed_posts').insert({
          authorId: 'system',
          postType: 'announcement',
          title: '🚀 A GINCANA COMEÇOU!',
          content: `Atenção Tribos! A nova temporada da Gincana TRIBO IDE começou oficialmente em ${new Date(startDate).toLocaleString()}. Todos os pontos foram zerados. QUE VENÇA A MELHOR TRIBO! 🔥`,
          visibility: 'public'
        });
      }

      await fetchSchedule();
      success(newStatus === 'active' ? 'Gincana iniciada!' : 'Contagem regressiva iniciada!');
      setShowConfirm(false);
      setConfirmText('');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Erro ao iniciar gincana');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'active' | 'waiting') => {
    setLoading(true);
    try {
      const { data: currentConfig } = await supabase.from('config').select('value').eq('key', 'app').single();
      const newConfig = { 
        ...(currentConfig?.value as any || {}), 
        gincanaStatus: status,
        gincanaStartDate: status === 'waiting' ? new Date(startDate).toISOString() : (currentConfig?.value as any)?.gincanaStartDate
      };

      await supabase.from('config').update({ value: newConfig }).eq('key', 'app');
      
      if (status === 'active') {
        await supabase.from('feed_posts').insert({
          authorId: 'system',
          postType: 'announcement',
          title: '🚀 A GINCANA COMEÇOU!',
          content: `Atenção Tribos! O administrador adiantou o início e a gincana está OFICIALMENTE ATIVA! Todos os campos de batalha liberados! 🔥`,
          visibility: 'public'
        });
      }

      await fetchSchedule();
      success(status === 'active' ? 'Gincana ativada agora!' : 'Início prorrogado/alterado!');
    } catch (err: any) {
      error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header Informativo */}
      <div className="bg-linear-to-br from-primary/10 to-transparent border-4 border-primary/20 p-6 md:p-8 rounded-[32px] md:rounded-[40px] relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
          <Trophy size={140} className="text-primary md:w-[160px]" />
        </div>
        
        <div className="relative z-10 space-y-3 md:space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 text-primary">
            <Zap size={20} className="fill-primary" />
            <span className="font-black uppercase italic tracking-widest text-[10px] md:text-sm">Controle de Temporada</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic leading-none text-white">
            Preparar para o <span className="text-primary">Start!</span>
          </h2>
          <p className="text-zinc-400 font-bold leading-relaxed text-xs md:text-base">
            Esta ferramenta permite reiniciar a competição. Ao dar o "Start", o sistema zerará as pontuações e marcará o início oficial no Dashboard para todos os membros.
          </p>
        </div>
      </div>

      {/* Countdown Card (Só aparece se estiver em 'waiting') */}
      <AnimatePresence>
        {currentSchedule?.status === 'waiting' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border-4 border-primary/40 p-6 md:p-10 rounded-[32px] md:rounded-[40px] relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-primary">
                    <Clock size={20} className="animate-pulse" />
                    <span className="font-black uppercase italic tracking-widest text-xs">Contagem Regressiva Ativa</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic">A Gincana começa em:</h3>
                  
                  <div className="flex gap-3 justify-center md:justify-start">
                    {[
                      { l: 'd', v: timeLeft.d },
                      { l: 'h', v: timeLeft.h },
                      { l: 'm', v: timeLeft.m },
                      { l: 's', v: timeLeft.s }
                    ].map(t => (
                      <div key={t.l} className="flex flex-col items-center">
                        <div className="bg-black border-2 border-zinc-800 w-12 h-14 md:w-16 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <span className="text-xl md:text-3xl font-black text-primary font-mono">{String(t.v).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-zinc-600 mt-2">{t.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                  <button 
                    onClick={() => handleUpdateStatus('active')}
                    disabled={loading}
                    className="bg-primary text-black font-black uppercase italic py-4 px-6 rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Play size={18} fill="black" />
                    Iniciar Agora
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('waiting')}
                    disabled={loading}
                    className="bg-zinc-800 text-white font-black uppercase italic py-4 px-6 rounded-2xl hover:bg-zinc-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 border-2 border-zinc-700"
                  >
                    <Calendar size={18} />
                    Alterar Horário
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Configurações de Reset */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border-4 border-zinc-800 p-6 md:p-8 rounded-[32px] md:rounded-[40px] space-y-6 md:space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                 <Calendar className="text-primary" size={20} />
               </div>
               <div>
                 <h3 className="text-lg md:text-xl font-black uppercase italic text-white leading-none">Agendamento</h3>
                 <p className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Data oficial de início</p>
               </div>
            </div>

            <div className="space-y-3">
              <label className="block text-zinc-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest ml-1">Data e Hora de Início</label>
              <input 
                type="datetime-local" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black border-4 border-zinc-800 p-4 md:p-5 rounded-2xl md:rounded-3xl text-white font-black italic text-lg md:text-xl focus:border-primary outline-hidden transition-all appearance-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2">
              {[
                { id: 'resetPoints', label: 'Zerar Pontos', icon: Trash2 },
                { id: 'resetLogs', label: 'Limpar Histórico', icon: History },
                { id: 'resetActivities', label: 'Limpar Participações', icon: Target },
                { id: 'resetBible', label: 'Resetar Bíblia', icon: BookOpen },
                { id: 'useWaitingRoom', label: 'Sala de Espera', icon: Clock }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof options] }))}
                  className={`flex items-center justify-between p-4 rounded-xl md:rounded-2xl border-2 transition-all ${
                    options[opt.id as keyof typeof options]
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* @ts-ignore */}
                    <opt.icon size={14} />
                    <span className="text-[10px] md:text-[11px] font-black uppercase italic">{opt.label}</span>
                  </div>
                  <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${options[opt.id as keyof typeof options] ? 'bg-primary border-primary text-black' : 'border-zinc-600'}`}>
                    {options[opt.id as keyof typeof options] && <Check size={10} strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="space-y-6">
          <div className="bg-linear-to-b from-red-950/40 to-transparent border-4 border-red-900/50 p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col items-center text-center gap-6 h-full">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-900/20 border-4 border-red-500/30 flex items-center justify-center animate-pulse">
              <ShieldAlert size={32} className="text-red-500 md:w-[40px]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black uppercase italic text-white leading-none">Botão Nuclear</h3>
              <p className="text-red-500/70 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-relaxed px-2">
                Esta ação é irreversível. Todas as tribos voltarão ao zero.
              </p>
            </div>

            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full py-5 md:py-6 rounded-2xl md:rounded-3xl bg-red-600 text-white font-black italic uppercase tracking-tighter text-xl md:text-2xl hover:bg-red-500 active:scale-95 transition-all shadow-[0_20px_40px_rgba(220,38,38,0.3)] flex items-center justify-center gap-3"
            >
              <Play size={20} className="fill-white md:w-[24px]" />
              Start Gincana
            </button>

            <div className="flex items-center gap-2 text-zinc-600">
               <Info size={12} />
               <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest italic">Apenas Super-Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border-4 border-red-600 w-full max-w-lg rounded-[40px] p-10 space-y-8 shadow-[0_50px_100px_rgba(220,38,38,0.2)]"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-3xl bg-red-600/10 border-2 border-red-600/30 text-red-500 mb-2">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-4xl font-black uppercase italic text-white leading-none">Confirmação Crítica</h3>
                <p className="text-zinc-500 font-bold text-sm">
                  Para zerar os pontos e iniciar a nova temporada, digite <span className="text-white">INICIAR GINCANA</span> abaixo.
                </p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DIGITE AQUI..."
                  className="w-full bg-black border-4 border-zinc-800 p-5 rounded-3xl text-white font-black italic text-xl text-center focus:border-red-600 outline-hidden transition-all placeholder:text-zinc-800"
                />

                <div className="flex flex-col gap-3">
                  <button 
                    disabled={confirmText !== 'INICIAR GINCANA' || loading}
                    onClick={handleStartGincana}
                    className="w-full py-5 rounded-3xl bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black italic uppercase tracking-tighter text-xl transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'CONFIRMAR RESET MESTRE'}
                  </button>
                  
                  <button 
                    disabled={loading}
                    onClick={() => setShowConfirm(false)}
                    className="w-full py-5 rounded-3xl bg-transparent text-zinc-500 hover:text-white font-black italic uppercase tracking-tighter text-sm transition-all"
                  >
                    CANCELAR
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
