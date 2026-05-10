import React, { useEffect, useState } from 'react';
import { AIService, DailyMission } from '../lib/AIService';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { Sparkles, Target, ShieldCheck, ChevronRight } from 'lucide-react';

interface AIMissionPanelProps {
  user: UserProfile;
}

export const AIMissionPanel: React.FC<AIMissionPanelProps> = ({ user }) => {
  const navigate = useNavigate();
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [advice, setAdvice] = useState<{ advice: string; tag: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAIContent = async () => {
      try {
        setLoading(true);
        
        // Timeout de segurança de 5 segundos para não prender a UI
        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000));
        
        const [daily, mentorship] = await Promise.race([
          Promise.all([
            AIService.getDailyMission(user),
            AIService.getMentorshipAdvice(user)
          ]),
          timeoutPromise.then(() => [null, null])
        ]) as [DailyMission | null, { advice: string; tag: string } | null];
        
        if (!mounted) return;
        
        if (daily && mentorship) {
          setMission(daily);
          setAdvice(mentorship);
        } else {
          // Fallbacks de segurança se o timeout estourar
          setMission({
            title: 'Missão de Exploração',
            description: 'Explore as funcionalidades da Gincana e continue engajando com sua tribo!',
            points: 10,
            icon: '🧭',
            category: 'geral',
            targetPath: '/activities'
          });
          setAdvice({
            advice: 'Mantenha-se firme no seu propósito diário e não esqueça de registrar suas leituras!',
            tag: 'Conselho'
          });
        }
      } catch (err) {
        console.error("Erro no AIMissionPanel:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAIContent();
    return () => { mounted = false; };
    // Usando user.id para evitar loop infinito caso o objeto user mude de referência
  }, [user.id]);

  const handleAccept = () => {
    if (mission?.targetPath) {
      navigate(mission.targetPath);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-64">
        <div className="h-4 w-32 bg-zinc-800 rounded mb-4"></div>
        <div className="h-20 bg-zinc-800 rounded mb-4"></div>
        <div className="h-10 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 🎯 Missão do Dia (IA Generated) */}
      <div className="card-premium group p-0!">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase italic tracking-tighter text-lg leading-none">Missão de Elite</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Análise Tática IA</p>
              </div>
            </div>
            <span className="badge-premium text-primary! border-primary/30!">
              +{mission?.points} XP
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">{mission?.icon}</span>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">{mission?.title}</h4>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium italic">
              "{mission?.description}"
            </p>
          </div>

          <button 
            onClick={handleAccept}
            className="w-full py-4 bg-primary text-black font-black uppercase italic tracking-tighter rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-primary/10"
          >
            ACEITAR DESAFIO <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🧠 Mentoria Inteligente */}
      <div className="card-premium group p-0!">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="p-8 relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-white uppercase italic tracking-tighter text-lg leading-none">Conselho do Mentor</h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Sincronia de Dados</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-black/40 rounded-3xl p-6 border border-zinc-800/50 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="badge-premium text-blue-400! border-blue-500/20!">{advice?.tag}</span>
              </div>
              <p className="text-zinc-200 text-base italic leading-relaxed font-medium pt-4">
                "{advice?.advice}"
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Baseado em sua Performance</span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
