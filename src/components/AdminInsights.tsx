import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { Users, UserMinus, TrendingUp, AlertTriangle, Calendar, Sparkles } from 'lucide-react';

interface MemberInsight extends UserProfile {
  lastParticipation?: string;
  daysInactive: number;
  participationCount: number;
  groupName?: string;
}

export default function AdminInsights() {
  const [members, setMembers] = useState<MemberInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // 1. Buscar todos os perfis e seus grupos
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*, groups(name)');

        // 2. Buscar todas as participações aprovadas para calcular inatividade
        const { data: participations } = await supabase
          .from('participations')
          .select('userId, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (profiles) {
          const now = new Date();
          const insights: MemberInsight[] = profiles.map(p => {
            const userParts = participations?.filter(part => part.userId === p.id) || [];
            const lastPart = userParts[0]?.created_at;
            const lastDate = lastPart ? new Date(lastPart) : new Date(p.created_at || now);
            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...p,
              groupName: (p.groups as unknown as { name: string })?.name,
              lastParticipation: lastPart,
              daysInactive: lastPart ? diffDays : 999, // 999 se nunca participou
              participationCount: userParts.length
            };
          });

          setMembers(insights.sort((a, b) => b.daysInactive - a.daysInactive));
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const inactiveMembers = members.filter(m => m.daysInactive >= 14);
  const risingStars = members.filter(m => m.participationCount >= 5).sort((a,b) => b.participationCount - a.participationCount).slice(0, 5);

  if (loading && members.length === 0) return <div className="p-20 text-center animate-pulse text-primary font-black uppercase italic">Analisando Comportamento...</div>;

  return (
    <div className="space-y-8">
      {/* 🧠 IA ADMIN ADVISOR */}
      <section className="bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-8 relative overflow-hidden group">
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-primary/20 rounded-lg"><Sparkles className="w-5 h-5 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-white"><span>Recomendação Estratégica IA</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl">
                  <h4 className="text-primary font-black text-[10px] uppercase tracking-widest mb-2"><span>Ação Sugerida: Reativação</span></h4>
                  <p className="text-zinc-300 text-sm italic leading-relaxed">
                     <span>{inactiveMembers.length > 0 
                       ? `Você tem ${inactiveMembers.length} membros inativos há mais de 14 dias. Sugerimos disparar uma missão relâmpago de pontuação dobrada para incentivar o retorno de ${inactiveMembers[0].name.split(' ')[0]} e outros.`
                       : "Excelente! O engajamento está alto. Hora de lançar um desafio de 'Liderança' para manter o ritmo."}</span>
                  </p>
               </div>
               <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl">
                  <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2"><span>Ação Sugerida: Crescimento</span></h4>
                  <p className="text-zinc-300 text-sm italic leading-relaxed">
                     <span>{risingStars.length > 0
                       ? `${risingStars[0].name.split(' ')[0]} é um talento em ascensão com ${risingStars[0].participationCount} atividades. Considere convidá-lo para uma mentoria de novos membros ou dar um cargo de 'Capitão de Equipe'.`
                       : "Foque em identificar novos talentos através das participações mais recentes."}</span>
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* 📊 RESUMO ANALÍTICO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-bold bg-zinc-900 border-zinc-800 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl"><Users className="text-primary" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Membros</span>
           </div>
           <p className="text-4xl font-black text-white italic">{members.length}</p>
        </div>

        <div className="card-bold bg-zinc-900 border-red-500/30 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl"><UserMinus className="text-red-500" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inativos (+14 dias)</span>
           </div>
           <p className="text-4xl font-black text-white italic">{inactiveMembers.length}</p>
        </div>

        <div className="card-bold bg-zinc-900 border-green-500/30 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl"><TrendingUp className="text-green-500" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Engajamento Médio</span>
           </div>
           <p className="text-4xl font-black text-white italic">
             {(members.reduce((acc, m) => acc + m.participationCount, 0) / (members.length || 1)).toFixed(1)}
             <span className="text-sm font-black uppercase ml-2 text-zinc-600">atividades/membro</span>
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🚨 ALERTA DE SUMIDOS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-red-500">
             <AlertTriangle size={20} />
             <h3 className="text-xl font-black uppercase italic tracking-tighter">Alerta de Inatividade</h3>
          </div>
          <div className="bg-zinc-900 border-4 border-zinc-800 rounded-[2.5rem] overflow-hidden">
             {inactiveMembers.length === 0 ? (
               <p className="p-10 text-center text-zinc-500 font-bold italic">Todos os membros estão ativos! 🎉</p>
             ) : (
               <div className="divide-y-2 divide-zinc-800">
                 {inactiveMembers.slice(0, 8).map(m => (
                   <div key={m.id} className="p-4 flex items-center justify-between hover:bg-black/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-red-500/50 flex items-center justify-center font-black text-zinc-500 overflow-hidden shrink-0">
                            {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-white font-black uppercase italic text-xs leading-none mb-1"><span>{m.name}</span></p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600"><span>{m.groupName || 'Sem Tribo'}</span></p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-red-500 font-black italic text-sm"><span>{m.daysInactive >= 999 ? 'NUNCA' : `${m.daysInactive} DIAS`}</span></p>
                         <p className="text-[8px] font-black uppercase text-zinc-700 italic">SEM PARTICIPAR</p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </section>

        {/* ⭐ DESTAQUES EM ASCENSÃO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
             <TrendingUp size={20} />
             <h3 className="text-xl font-black uppercase italic tracking-tighter">Guerreiros em Ascensão</h3>
          </div>
          <div className="bg-zinc-900 border-4 border-zinc-800 rounded-[2.5rem] overflow-hidden">
             <div className="divide-y-2 divide-zinc-800">
               {risingStars.map((m, i) => (
                 <div key={m.id} className="p-4 flex items-center justify-between hover:bg-black/20 transition-all">
                    <div className="flex items-center gap-4">
                       <span className="text-xl font-black italic text-zinc-800">#{i+1}</span>
                       <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-primary/50 flex items-center justify-center font-black text-zinc-500 overflow-hidden shrink-0">
                          {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-white font-black uppercase italic text-xs leading-none mb-1"><span>{m.name}</span></p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-primary italic"><span>{m.participationCount} ATIVIDADES</span></p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-white font-black italic text-sm"><span>{m.totalPoints}</span></p>
                       <p className="text-[8px] font-black uppercase text-zinc-700 italic">PONTOS TOTAIS</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </section>
      </div>

      {/* 📅 HISTÓRICO RECENTE */}
      <section className="card-bold bg-zinc-900 border-zinc-800 p-8 rounded-[3rem]">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
               <Calendar className="text-primary" /> Atividade dos Membros
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                     <th className="pb-4">Membro</th>
                     <th className="pb-4">Tribo</th>
                     <th className="pb-4">Score</th>
                     <th className="pb-4">Participações</th>
                     <th className="pb-4 text-right">Última Vez</th>
                  </tr>
               </thead>
               <tbody className="divide-y-2 divide-zinc-800">
                  {members.slice(0, 15).map(m => (
                    <tr key={m.id} className="group hover:bg-black/20 transition-all">
                       <td className="py-4">
                          <p className="text-white font-black uppercase italic text-sm"><span>{m.name}</span></p>
                       </td>
                       <td className="py-4">
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-zinc-800 rounded-lg text-zinc-400"><span>{m.groupName || '-'}</span></span>
                       </td>
                       <td className="py-4">
                          <p className="text-primary font-black italic"><span>{m.totalPoints}</span></p>
                       </td>
                       <td className="py-4 font-bold text-zinc-500 italic"><span>{m.participationCount}</span></td>
                       <td className="py-4 text-right">
                          <p className={`text-[10px] font-black uppercase italic ${m.daysInactive >= 14 ? 'text-red-500' : 'text-zinc-600'}`}>
                             <span>{m.daysInactive === 0 ? 'HOJE' : m.daysInactive >= 999 ? 'NUNCA' : `HÁ ${m.daysInactive} DIAS`}</span>
                          </p>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
}
