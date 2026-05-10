import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Landmark, Users, Shield, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Group {
  id: string;
  name: string;
}

export default function AdminLinks() {
  const [copied, setCopied] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [baseUrl] = useState(window.location.origin);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase.from('groups').select('id, name');
      if (data) setGroups(data);
    };
    fetchGroups();
  }, []);

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getLink = (role: string) => {
    let url = `${baseUrl}/register?role=${role}`;
    if (selectedGroup) url += `&groupId=${encodeURIComponent(selectedGroup)}`;
    return url;
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-zinc-900 p-8 rounded-[2.5rem] border-4 border-zinc-800">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)]">
          <Landmark size={40} className="text-black" />
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white leading-none uppercase">Central de Convites</h2>
          <p className="text-zinc-500 font-bold mt-2 italic">Gere links estratégicos para novos membros e líderes.</p>
        </div>
      </header>

      {/* Tribe Selector Filter */}
      <div className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-4xl flex flex-col md:flex-row items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
           <Users size={24} />
        </div>
        <div className="flex-1 w-full">
           <p className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Vincular a uma Tribo específica? (Opcional)</p>
           <select 
             value={selectedGroup}
             onChange={(e) => setSelectedGroup(e.target.value)}
             className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-white font-bold outline-none transition-all"
           >
             <option value="">Nenhuma (O usuário escolhe no cadastro)</option>
             {groups.map(g => (
               <option key={g.id} value={g.id}>{g.name}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {/* Member Link */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="card-bold bg-zinc-900 border-primary p-8 relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-primary text-black shadow-lg">
                <Users size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic text-white leading-none">Membros</h3>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Cadastro de participantes</p>
              </div>
            </div>
            
            <div className="bg-black border-2 border-dashed border-zinc-800 rounded-2xl p-5 mb-8 flex-1 flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase text-zinc-600 mb-2 tracking-widest">URL Gerada:</p>
              <p className="font-mono text-xs text-zinc-400 break-all leading-relaxed">
                {getLink('participant')}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => copyToClipboard(getLink('participant'), 'member')}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase tracking-tighter transition-all shadow-xl ${
                  copied === 'member' ? 'bg-green-600 text-white' : 'bg-primary text-black hover:scale-105'
                }`}
              >
                {copied === 'member' ? (
                  <>COPIADO <Check size={20} /></>
                ) : (
                  <>COPIAR <Copy size={20} /></>
                )}
              </button>
              <a 
                href={getLink('participant')} 
                target="_blank" 
                rel="noreferrer"
                className="p-5 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white hover:bg-zinc-700 transition-all"
              >
                <ExternalLink size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Leader Link */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="card-bold bg-zinc-900 border-blue-500 p-8 relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-lg">
                <Shield size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic text-white leading-none">Líderes</h3>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Acesso Administrativo</p>
              </div>
            </div>
            
            <div className="bg-black border-2 border-dashed border-zinc-800 rounded-2xl p-5 mb-8 flex-1 flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase text-zinc-600 mb-2 tracking-widest">URL Gerada:</p>
              <p className="font-mono text-xs text-zinc-400 break-all leading-relaxed">
                {getLink('leader')}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => copyToClipboard(getLink('leader'), 'leader')}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase tracking-tighter transition-all shadow-xl ${
                  copied === 'leader' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:scale-105'
                }`}
              >
                {copied === 'leader' ? (
                  <>COPIADO <Check size={20} /></>
                ) : (
                  <>COPIAR <Copy size={20} /></>
                )}
              </button>
              <a 
                href={getLink('leader')} 
                target="_blank" 
                rel="noreferrer"
                className="p-5 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white hover:bg-zinc-700 transition-all"
              >
                <ExternalLink size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="card-bold bg-primary/10 text-primary p-8 border-primary/20 mt-12 flex flex-col md:flex-row items-center gap-8">
        <Share2 className="shrink-0" size={48} />
        <div className="space-y-2">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Dica Estratégica</h3>
          <p className="font-bold leading-relaxed italic text-zinc-400">
            Se você selecionar uma tribo acima, o link gerado já trará essa tribo **pré-selecionada** e bloqueada para o novo membro, evitando erros de cadastro!
          </p>
        </div>
      </div>
    </div>
  );
}
