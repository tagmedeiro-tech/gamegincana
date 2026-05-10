import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Trophy, Star, Shield, ArrowUpRight, Crown } from 'lucide-react';
import Chat from './Chat';
import PointHistory from './PointHistory';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { useAppTheme } from '../hooks/useAppTheme';

interface Member {
  id: string;
  name: string;
  avatar_url?: string;
  totalPoints: number;
}

export default function MyGroup() {
  const { profile } = useAuth();
  const theme = useAppTheme();
  const [members, setMembers] = useState<Member[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.groupId) return;

    const fetchGroupData = async () => {
      setLoading(true);
      try {
        // 1. Informações da Tribo
        const { data: gData } = await supabase
          .from('groups')
          .select('*')
          .eq('id', profile.groupId)
          .single();
        
        if (gData) setGroupInfo(gData);

        // 2. Membros da Tribo
        const { data: mData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, totalPoints')
          .eq('"groupId"', profile.groupId)
          .order('totalPoints', { ascending: false });
        
        if (mData) setMembers(mData);

        // 3. Posição no Ranking Global
        const { data: allGroups } = await supabase
          .from('groups')
          .select('id, totalPoints')
          .order('totalPoints', { ascending: false });
        
        if (allGroups) {
          const index = allGroups.findIndex(g => g.id === profile.groupId);
          setRank(index + 1);
        }
      } catch (err) {
        console.error('Error fetching group data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [profile?.groupId]);

  if (!profile?.groupId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-zinc-900/50 rounded-[3rem] border-4 border-dashed border-zinc-800">
        <Users size={64} className="text-zinc-700 mb-4" />
        <h2 className="text-3xl font-black text-white uppercase italic">Sem Tribo Atribuída</h2>
        <p className="text-zinc-500 font-bold mt-2">Fale com um administrador para ser alocado em um grupo.</p>
      </div>
    );
  }

  const tribeColor = groupInfo?.primaryColor || theme.primaryColor || '#FBBF24';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 rounded-[3rem] overflow-hidden group shadow-2xl border-4 border-zinc-900">
        {groupInfo?.banner_url ? (
          <img src={groupInfo.banner_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-zinc-800 to-black flex items-center justify-center">
            <Shield size={80} className="text-zinc-900" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-8 left-8 flex items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-black rounded-4xl border-4 flex items-center justify-center shadow-2xl relative overflow-hidden"
               style={{ borderColor: tribeColor }}>
             {groupInfo?.logoUrl ? (
               <img src={groupInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <Users size={40} style={{ color: tribeColor }} />
             )}
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/30">
                Tribo Oficial
              </span>
              <span className="flex items-center gap-1 text-white/60 text-[10px] font-black uppercase tracking-widest">
                <Star size={10} className="fill-primary text-primary" /> {members.length} Guerreiros
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">
              {groupInfo?.name || `Tribo #${profile.groupId}`}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Ranking */}
        <div className="lg:col-span-4 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -5 }} className="card-premium bg-zinc-900 border-zinc-800 p-6 flex flex-col justify-between h-32">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Rank Global</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black italic text-white">{rank}º</span>
                <span className="text-xs font-bold text-zinc-600 uppercase">Lugar</span>
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="card-premium bg-zinc-900 border-zinc-800 p-6 flex flex-col justify-between h-32">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Poder Bélico</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black italic text-primary">{groupInfo?.totalPoints || 0}</span>
                <span className="text-xs font-bold text-zinc-600 uppercase">XP</span>
              </div>
            </motion.div>
          </div>

          {/* Members List */}
          <div className="card-premium bg-zinc-900 border-zinc-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                <Users size={20} className="text-primary" /> Guerreiros
              </h3>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                Top 5
              </span>
            </div>
            <div className="space-y-4">
              {members.slice(0, 5).map((member, index) => (
                <div key={member.id} className="flex items-center gap-4 group/item">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-800 overflow-hidden group-hover/item:border-primary transition-colors">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5 border-2 border-zinc-900 shadow-lg">
                        <Crown size={10} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-white truncate">{member.name}</p>
                    <p className="text-[10px] font-bold text-primary">{member.totalPoints} XP</p>
                  </div>
                  <ArrowUpRight size={14} className="text-zinc-700 opacity-0 group-hover/item:opacity-100 group-hover/item:text-primary transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Motivation Quote */}
          <div className="card-premium bg-primary p-8 text-black relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <MessageSquare size={120} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} fill="black" />
              <p className="text-[11px] font-black uppercase tracking-widest">Grito de Guerra</p>
            </div>
            <p className="font-black italic text-xl leading-tight relative z-10">
              "O ferro com o ferro se afia; assim, o homem afia o rosto do seu amigo." Prosperem juntos!
            </p>
          </div>
        </div>

        {/* Right Column: Chat & Activity */}
        <div className="lg:col-span-8 space-y-8">
           {/* Chat Panel */}
           <div className="card-premium bg-zinc-900 border-zinc-800 p-1 flex flex-col h-[600px] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase italic text-lg text-white">Quartel General</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chat exclusivo da Tribo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      {members.slice(0, 3).map((m, i) => (
                        <div key={m.id} className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800">
                          {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : null}
                        </div>
                      ))}
                   </div>
                   <span className="text-[10px] font-black text-zinc-500 ml-2">+{members.length > 3 ? members.length - 3 : 0} ON</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-black/40">
                <Chat groupId={profile.groupId || 'leoes-juda'} />
              </div>
           </div>

           {/* Activity History */}
           <div className="card-premium bg-zinc-900 border-zinc-800 p-8 shadow-xl">
             <div className="flex items-center gap-2 mb-8 border-b border-zinc-800 pb-4">
                <Trophy size={20} className="text-primary" />
                <h3 className="text-xl font-black uppercase italic text-white">Registros de Honra</h3>
             </div>
             <PointHistory groupId={profile.groupId} />
           </div>
        </div>
      </div>
    </div>
  );
}
