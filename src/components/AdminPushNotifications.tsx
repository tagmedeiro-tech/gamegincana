import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Send, Users, User, Trash2, CheckCircle2, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { PushService } from '../lib/PushService';

interface Campaign {
  id: string;
  title: string;
  body: string;
  target: string;
  sent_at: string | null;
  created_at: string;
}

export default function AdminPushNotifications() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | string>('all');
  const [targetType, setTargetType] = useState<'all' | 'tribe' | 'user'>('all');
  const [selectedTribe, setSelectedTribe] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
  }, []);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('push_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setCampaigns(data);
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from('groups').select('id, name');
    if (data) setGroups(data);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || !user) return;

    setLoading(true);
    try {
      let finalTarget = 'all';
      if (targetType === 'tribe') finalTarget = `tribe:${selectedTribe}`;
      if (targetType === 'user') finalTarget = `user:${selectedUserId}`;

      const result = await PushService.sendCampaign({
        title,
        body,
        target: finalTarget,
        createdBy: user.id
      });

      success("Notificação Agendada", `Enviando para ${result.sent} dispositivos.`);
      setTitle('');
      setBody('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toastError("Erro ao enviar", "Não foi possível disparar a notificação.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('push_campaigns').delete().eq('id', id);
    if (!error) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      success("Excluído", "Histórico de campanha removido.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* ─── FORMULÁRIO DE ENVIO ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="card-bold bg-zinc-900/50 border-primary p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Bell className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Nova Notificação</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Disparo de Push Nativo via FCM</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Título da Notificação</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo Desafio Liberado! ⚔️"
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold placeholder:text-zinc-700 focus:border-primary transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Mensagem (Corpo)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Descreva o que os jovens devem fazer..."
                rows={3}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold placeholder:text-zinc-700 focus:border-primary transition-all outline-none resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${targetType === 'all' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
              >
                <Users size={20} />
                <span className="text-[10px] font-black uppercase">Todos</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('tribe')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${targetType === 'tribe' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
              >
                <Smartphone size={20} />
                <span className="text-[10px] font-black uppercase">Tribo</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('user')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${targetType === 'user' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
              >
                <User size={20} />
                <span className="text-[10px] font-black uppercase">Individual</span>
              </button>
            </div>

            {targetType === 'tribe' && (
              <select
                value={selectedTribe}
                onChange={(e) => setSelectedTribe(e.target.value)}
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold focus:border-primary outline-none"
                required
              >
                <option value="">Selecionar Tribo...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}

            {targetType === 'user' && (
              <input
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="ID do Usuário (UUID)"
                className="w-full bg-black border-2 border-zinc-800 rounded-2xl p-4 text-white font-bold focus:border-primary outline-none"
                required
              />
            )}

            <button
              type="submit"
              disabled={loading || !title || !body}
              className="w-full bg-primary text-black font-black uppercase italic tracking-tighter py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              Disparar Notificação Agora
            </button>
          </form>
        </div>
      </div>

      {/* ─── HISTÓRICO ─────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
          Histórico Recente
        </h3>

        <div className="space-y-3">
          {campaigns.length === 0 && (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800 p-10 rounded-4xl text-center">
              <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma campanha enviada ainda</p>
            </div>
          )}

          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-4xl flex items-center justify-between group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase italic leading-tight">{c.title}</h4>
                  <p className="text-xs text-zinc-500 font-bold mt-1 line-clamp-1">{c.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700">
                      {c.target === 'all' ? 'Global' : c.target}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteCampaign(c.id)}
                className="p-3 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-400 shrink-0 mt-1" />
          <p className="text-[10px] font-bold text-blue-400/80 leading-relaxed uppercase tracking-widest">
            Nota: As notificações push só funcionam para usuários que baixaram o APK oficial e concederam permissão no primeiro login.
          </p>
        </div>
      </div>

    </div>
  );
}
