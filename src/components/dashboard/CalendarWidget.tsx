import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CalendarService } from '../../lib/CalendarService';
import { CalendarEvent } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarWidget() {
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const events = await CalendarService.getEvents(new Date());
        const now = new Date();
        const future = events
          .filter(e => {
            const evDate = new Date(`${e.event_date}T${e.start_time}`);
            return evDate >= now;
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.event_date}T${a.start_time}`).getTime();
            const dateB = new Date(`${b.event_date}T${b.start_time}`).getTime();
            return dateA - dateB;
          });

        if (future.length > 0) {
          setNextEvent(future[0]);
        }
      } catch (err) {
        console.error('Error fetching next event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNextEvent();
  }, []);

  if (loading || !nextEvent) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'live': return 'text-red-500';
      case 'metaverso': return 'text-purple-500';
      case 'meeting': return 'text-blue-500';
      default: return 'text-amber-500';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <CalendarIcon size={120} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-zinc-900 border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center shadow-lg">
            <span className="text-[10px] font-black uppercase text-zinc-500 leading-none mb-1">
              {format(new Date(nextEvent.event_date), 'MMM', { locale: ptBR })}
            </span>
            <span className="text-2xl font-black text-white leading-none">
              {format(new Date(nextEvent.event_date), 'dd')}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${getTypeColor(nextEvent.type)}`}>
                PRÓXIMO EVENTO • {nextEvent.type}
              </span>
              {nextEvent.points_reward > 0 && (
                <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[9px] font-black text-amber-500">+{nextEvent.points_reward} XP</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {nextEvent.title}
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase">
                <Clock size={14} className="text-zinc-600" />
                <span>{nextEvent.start_time}</span>
              </div>
              <p className="text-zinc-500 text-xs font-bold uppercase truncate max-w-[200px]">
                {nextEvent.description}
              </p>
            </div>
          </div>
        </div>

        <Link 
          to="/dashboard/calendar"
          className="flex items-center gap-3 px-6 py-4 bg-zinc-800 hover:bg-white text-white hover:text-black rounded-2xl font-black uppercase italic tracking-tighter transition-all group/btn"
        >
          <span>VER CALENDÁRIO COMPLETO</span>
          <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
