import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Crown, Medal, Users, Zap, Trophy, LayoutGrid, ChevronRight, BookOpen, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Member {
  id: string;
  name: string;
  avatar_url?: string;
  totalPoints: number;
  role?: string;
}

interface GroupWithMembers {
  id: string;
  name: string;
  logoUrl?: string;
  totalPoints: number;
  primaryColor?: string;
  secondary_color?: string;
  leaderId?: string;
  members: Member[];
}

interface TribeLeaderboardProps {
  groups: GroupWithMembers[];
  profile: any;
  navigate: any;
  expandedGroupId: string | null;
  setExpandedGroupId: (id: string | null) => void;
  awardingMemberId: string | null;
  setAwardingMemberId: (id: string | null) => void;
  quickXPValue: string;
  setQuickXPValue: (val: string) => void;
  handleQuickAward: (memberId: string, groupId: string, pts: number) => Promise<void>;
  processingAward: boolean;
  theme: any;
}

const TribeLeaderboard = React.memo(({
  groups,
  profile,
  navigate,
  expandedGroupId,
  setExpandedGroupId,
  awardingMemberId,
  setAwardingMemberId,
  quickXPValue,
  setQuickXPValue,
  handleQuickAward,
  processingAward,
  theme
}: TribeLeaderboardProps) => {
  const topThree = groups.slice(0, 3);
  const remainingGroups = groups.slice(3);
  const maxPoints = Math.max(...groups.map(g => g.totalPoints), 1);

  // Sub-componente para renderizar a lista de membros (Escalação)
  const MemberList = ({ group }: { group: GroupWithMembers }) => {
    const sumOfMembers = group.members.reduce((acc, m) => acc + (m.totalPoints || 0), 0);
    const collectivePoints = group.totalPoints - sumOfMembers;

    return (
      <div className="space-y-2">
        {group.members.map((member, mIndex) => {
        const isLeader = member.role === 'leader' || member.id === group.leaderId;
        const isGold = mIndex === 0;
        const isSilver = mIndex === 1;
        const isBronze = mIndex === 2;
        
        let borderClass = 'border-zinc-800 hover:border-primary/40';
        let bgClass = 'bg-black/40';
        let rankClass = 'text-zinc-700';
        
        if (isGold) {
          borderClass = 'border-primary/50 shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:border-primary hover:shadow-[0_0_25px_rgba(251,191,36,0.25)]';
          bgClass = 'bg-primary/5';
          rankClass = 'text-primary drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]';
        } else if (isSilver) {
          borderClass = 'border-zinc-300/50 hover:border-zinc-300';
          bgClass = 'bg-zinc-300/5';
          rankClass = 'text-zinc-300';
        } else if (isBronze) {
          borderClass = 'border-amber-600/50 hover:border-amber-600';
          bgClass = 'bg-amber-600/5';
          rankClass = 'text-amber-600';
        }
        
        if (isLeader) {
           borderClass = 'border-primary hover:border-white shadow-[0_0_20px_rgba(251,191,36,0.2)]';
           bgClass = 'bg-black/60';
        }

        return (
          <div key={member.id} className="relative">
            <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors duration-300 hover:-translate-y-1 group/member ${bgClass} ${borderClass}`}>
              <Link 
                to={`/dashboard/profile/${member.id}`} 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className={`relative w-10 h-10 rounded-full overflow-visible shrink-0 z-10 ${isLeader ? 'border-2 border-primary ring-2 ring-primary/30' : 'border-2 border-zinc-700 group-hover/member:border-primary bg-zinc-800'}`}>
                  {isLeader && (
                    <div className="absolute -top-3 -right-2 z-20">
                      <Crown size={18} className="text-primary drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" fill="currentColor" />
                    </div>
                  )}
                  <img 
                    src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                    alt={member.name} 
                    className="w-full h-full object-cover rounded-full relative z-10" 
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={`font-black uppercase italic text-[11px] truncate ${isLeader ? 'text-primary drop-shadow-sm' : 'text-white'}`}>
                    {member.name}
                  </p>
                  {isLeader ? (
                    <p className="text-[8px] font-black tracking-widest text-primary/80 uppercase">Líder da Tribo</p>
                  ) : null}
                </div>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl flex items-center justify-center min-w-[60px] md:min-w-[70px]">
                  <span className="font-black italic text-[10px] md:text-xs">{member.totalPoints} PTS</span>
                </div>
                
                {(profile?.role === 'admin' || (profile?.role === 'leader' && profile?.groupId === group.id)) && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAwardingMemberId(awardingMemberId === member.id ? null : member.id);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${awardingMemberId === member.id ? 'bg-primary text-black' : 'bg-black border-2 border-zinc-800 text-primary hover:border-primary hover:scale-110 shadow-lg shadow-black'}`}
                  >
                    <Zap size={14} fill={awardingMemberId === member.id ? "currentColor" : "none"} />
                  </button>
                )}
                <span className={`font-black italic text-sm w-6 text-right ${rankClass}`}>#{mIndex + 1}</span>
              </div>
            </div>

            {/* Quick Award Popup */}
            <AnimatePresence>
              {awardingMemberId === member.id && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-full mt-3 z-50 card-premium p-5! border-primary/50! shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4 min-w-[240px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                  <div className="flex items-center gap-2 relative z-10">
                    <Zap size={12} className="text-primary" fill="currentColor" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest">XP Rápido</p>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    {[10, 25, 50].map(val => (
                      <button
                        key={val}
                        disabled={processingAward}
                        onClick={() => handleQuickAward(member.id, group.id, val)}
                        className="flex-1 bg-black/60 border border-zinc-800 hover:border-primary hover:bg-primary hover:text-black py-2 rounded-xl text-[10px] font-black italic transition-colors duration-200"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <input 
                      type="number"
                      placeholder="0"
                      value={quickXPValue}
                      onChange={(e) => setQuickXPValue(e.target.value)}
                      className="flex-1 bg-black/80 border-2 border-zinc-800 rounded-xl px-4 py-2 text-white font-black italic text-xs outline-none focus:border-primary transition-all"
                    />
                    <button 
                      disabled={processingAward || !quickXPValue}
                      onClick={() => {
                        handleQuickAward(member.id, group.id, parseInt(quickXPValue));
                        setQuickXPValue("");
                      }}
                      className="bg-primary text-black px-4 py-2 rounded-xl font-black uppercase italic text-[10px] hover:bg-white transition-colors duration-200 disabled:opacity-50"
                    >
                      OK
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Indicador de Bônus / Penalidade Coletiva da Tribo */}
      {collectivePoints !== 0 && (
        <div className={`relative flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${collectivePoints > 0 ? 'border-primary/50 bg-black/60 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-red-500/50 bg-black/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${collectivePoints > 0 ? 'border-primary/50 bg-primary/10 text-primary' : 'border-red-500/50 bg-red-500/10 text-red-500'}`}>
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <p className={`font-black uppercase italic text-[11px] truncate ${collectivePoints > 0 ? 'text-primary' : 'text-red-500'}`}>
                {collectivePoints > 0 ? 'Vantagem da Tribo' : 'Penalidade da Tribo'}
              </p>
              <p className={`text-[8px] font-black tracking-widest uppercase ${collectivePoints > 0 ? 'text-primary/60' : 'text-red-500/60'}`}>
                Pontos Coletivos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-center min-w-[60px] md:min-w-[70px] ${collectivePoints > 0 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              <span className="font-black italic text-[10px] md:text-xs">
                {collectivePoints > 0 ? '+' : ''}{collectivePoints} PTS
              </span>
            </div>
            {profile?.role === 'admin' ? (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  const val = window.prompt(`Ajustar Pontos Coletivos (Atuais: ${collectivePoints}):\nDigite o novo valor EXATO de pontos coletivos que a tribo deve ter:`, collectivePoints.toString());
                  if (val !== null && !isNaN(parseInt(val))) {
                    const newVal = parseInt(val);
                    const diff = newVal - collectivePoints;
                    if (diff !== 0) {
                      try {
                        await supabase.from('groups').update({ totalPoints: group.totalPoints + diff }).eq('id', group.id);
                        await supabase.from('point_logs').insert({ '"groupId"': group.id, points: diff, reason: 'Ajuste Manual de Vantagem' });
                        window.location.reload();
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao atualizar pontos.");
                      }
                    }
                  }
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 bg-black border-2 border-zinc-800 ${collectivePoints > 0 ? 'text-primary hover:border-primary' : 'text-red-500 hover:border-red-500'} hover:scale-110 shadow-lg shadow-black`}
              >
                <Edit2 size={14} />
              </button>
            ) : (
              <span className={`font-black italic text-sm w-6 text-right ${collectivePoints > 0 ? 'text-primary/50' : 'text-red-500/50'}`}>--</span>
            )}
          </div>
        </div>
      )}
    </div>
  )};

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* 🏆 ELITE DA GINCANA (TOP 3) */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <Trophy className="text-primary" size={32} />
           <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white"><span>Elite da Gincana</span></h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {topThree.map((group, index) => {
            const isFirst = index === 0;
            const isExpanded = expandedGroupId === group.id;
            
            return (
              <div key={group.id} className="flex flex-col gap-4 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                  className={`relative cursor-pointer group rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 border-4 transition-colors duration-500 overflow-hidden min-h-[220px] shadow-2xl ${
                    isFirst 
                      ? 'bg-primary border-white shadow-[0_20px_50px_rgba(251,191,36,0.3)]' 
                      : 'bg-zinc-900 border-zinc-800 hover:border-primary hover:-translate-y-2 transition-colors duration-300'
                  }`}
                >
                  {isFirst && <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />}
                  
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-black italic text-lg border-2 z-20 ${
                    isFirst ? 'bg-black text-primary border-black' : 'bg-primary text-black border-primary'
                  }`}>
                    <span>{index + 1}º</span>
                  </div>

                  <div className="relative z-10 flex flex-col justify-between min-h-[160px] h-full">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${isFirst ? 'bg-black/10' : 'bg-primary/10'}`}>
                          {isFirst ? <Crown size={20} className="text-black" /> : <Medal size={18} className="text-primary" />}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isFirst ? 'text-black/60' : 'text-zinc-500'}`}>
                          <span>{index === 0 ? 'Tribo Soberana' : index === 1 ? 'Vice-Líder' : 'Elite Bronze'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-xl shrink-0 overflow-hidden transition-transform group-hover:rotate-3 ${isFirst ? 'border-white/40' : 'border-zinc-800 group-hover:border-primary'}`}>
                          {group.logoUrl ? (
                            <img src={group.logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Shield size={28} className={isFirst ? 'text-black' : 'text-primary'} />
                          )}
                        </div>
                        <h4 className={`text-2xl font-black uppercase italic leading-none tracking-tighter ${isFirst ? 'text-black' : 'text-white'}`}>
                          <span>{group.name}</span>
                        </h4>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 ${isFirst ? 'text-black' : 'text-zinc-500'}`}>Poder Bélico</p>
                      <p className={`text-3xl font-black italic leading-none ${isFirst ? 'text-black' : 'text-primary'}`}>
                         <span>{group.totalPoints} </span><span className="text-[10px] uppercase ml-1">pts</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border-4 border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden z-30"
                  >
                    <MemberList group={group} />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 🏁 A PISTA DE PERSEGUIÇÃO */}
      {remainingGroups.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
               <LayoutGrid className="text-zinc-600" /><span>A Perseguição</span>
            </h3>
            <p className="text-[10px] font-black uppercase text-zinc-600 italic"><span>Tribos lutando pelo pódio</span></p>
          </div>

          <div className="bg-zinc-900/30 border-4 border-zinc-900 p-8 rounded-[40px] space-y-12 shadow-2xl">
            {remainingGroups.map((group, index) => {
              const progress = (group.totalPoints / maxPoints) * 100;
              const isExpanded = expandedGroupId === group.id;
              const globalIndex = index + 3;

              return (
                <div key={group.id} className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <span className="text-sm font-black italic text-zinc-600"><span>#</span><span>{globalIndex + 1}</span></span>
                          <h4 className="text-lg font-black uppercase italic text-white"><span>{group.name}</span></h4>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-primary font-black italic text-xl">
                            <span>{group.totalPoints} </span><span className="text-[10px] uppercase tracking-widest">PTS</span>
                          </span>
                          <button 
                            onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                            className={`p-2 rounded-xl transition-colors duration-300 ${isExpanded ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                          >
                            <Users size={18} />
                          </button>
                       </div>
                    </div>

                    <div className="h-8 bg-black/50 rounded-xl border-2 border-zinc-800 relative shadow-inner overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         className="h-full rounded-lg relative overflow-hidden"
                         style={{ 
                           backgroundColor: group.primaryColor || '#FBBF24',
                           backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                         }}
                       />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/40 border-2 border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
                      >
                        <MemberList group={group} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
});

TribeLeaderboard.displayName = 'TribeLeaderboard';

export default TribeLeaderboard;
