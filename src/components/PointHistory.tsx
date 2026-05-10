import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, TrendingUp, User as UserIcon, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PointLog } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExtendedPointLog extends PointLog {
  profiles?: { name: string };
  groups?: { name: string };
}

export default function PointHistory({ groupId, userId }: { groupId?: string, userId?: string }) {
  const [logs, setLogs] = useState<ExtendedPointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let query = supabase
          .from('point_logs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (groupId) query = query.eq('"groupId"', groupId);
        if (userId) query = query.eq('"userId"', userId);

        const { data, error } = await query.limit(20);
        
        if (!error && data) {
          // Opcional: Se precisarmos de nomes aqui no futuro, faremos client-side join.
          // Por enquanto, garantimos que a busca dos logs não falhe.
          setLogs(data as ExtendedPointLog[]);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel(`point-history-sync-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'point_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, userId]);

  if (loading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl"></div>)}
  </div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <History size={20} className="text-primary" />
        <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">Histórico de Pontos</h3>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-zinc-900/50 rounded-2xl border-2 border-zinc-800 flex items-center justify-between hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-primary border border-zinc-800">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-none mb-1">{log.reason}</p>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-zinc-500">
                   <span className="flex items-center gap-1"><UserIcon size={10} /> {log.profiles?.name || 'Sistema'}</span>
                   <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-primary italic leading-none">+{log.points}</p>
              <p className="text-[8px] font-bold uppercase text-zinc-600">{log.groups?.name}</p>
            </div>
          </motion.div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-600 font-bold italic uppercase text-xs">Nenhum registro encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
