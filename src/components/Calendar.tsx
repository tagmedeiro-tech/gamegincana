import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Star,
  Users,
  Video,
  Plus,
  Info,
  X,
  Zap,
  MessageCircle,
  Gift,
  Cake,
  QrCode
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/useAuth';
import { CalendarEvent } from '../types';
import { CalendarService } from '../lib/CalendarService';
import { useToast } from '../context/ToastContext';
import { NotificationService } from '../lib/NotificationService';
import QRScanner from './QRScanner';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [birthdays, setBirthdays] = useState<{ name: string; day: number; id: string; phone?: string; avatarUrl?: string }[]>([]);
  const [participations, setParticipations] = useState<{ event_id: string; occurrence_date: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { profile } = useAuth();
  const { success, error, info } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [viewingBirthday, setViewingBirthday] = useState<{ name: string; day: number; id: string; phone?: string; avatarUrl?: string } | null>(null);
  const [uploadingForEventId, setUploadingForEventId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [availableActivities, setAvailableActivities] = useState<any[]>([]);
  const [scanningEvent, setScanningEvent] = useState<CalendarEvent | null>(null);
  const isAdmin = profile?.role === 'admin';



  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '20:00',
    type: 'gincana' as const,
    points_reward: 0,
    is_recurring: false,
    recurrence_pattern: {
      freq: 'weekly' as const,
      days: [] as number[],
    },
    requires_proof: false,
    linked_activity_id: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eventsData, birthdaysData, participationsData, actsData] = await Promise.all([
        CalendarService.getEvents(currentDate),
        CalendarService.getBirthdays(currentDate),
        profile ? CalendarService.getUserParticipations(profile.id, currentDate) : Promise.resolve([]),
        CalendarService.getAvailableActivities()
      ]);
      setEvents(eventsData);
      setBirthdays(birthdaysData);
      setParticipations(participationsData);
      setAvailableActivities(actsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  React.useEffect(() => {
    setPreviewImage(null);
  }, [selectedDate]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setCreating(true);
    try {
      await CalendarService.createEvent({
        ...newEvent,
        created_by: profile.id,
        linked_activity_id: newEvent.linked_activity_id || undefined,
        group_id: newEvent.group_id || undefined
      });
      success("Sucesso", "Evento criado com sucesso!");
      
      // Notificar todos os usuários
      await NotificationService.notifyAll(
        'announcement',
        `Novo Evento: ${newEvent.title}`,
        `Um novo evento foi agendado para o dia ${format(new Date(newEvent.event_date), 'dd/MM')} às ${newEvent.start_time}. Confira no calendário!`,
        '/dashboard/calendar'
      );

      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '20:00',
        type: 'gincana',
        points_reward: 0,
        is_recurring: false,
        recurrence_pattern: { freq: 'weekly', days: [] },
        requires_proof: false,
        linked_activity_id: ''
      });
      fetchEvents();
    } catch (err) {
      error("Erro", "Não foi possível criar o evento.");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      // Gerar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      info("Processando", "Enviando sua prova...");
      // Simulação de delay de upload
      setTimeout(() => {
        success("Sucesso", "Prova enviada para validação!");
        setUploadingForEventId(null);
        fetchEvents(); // Recarrega para mostrar o status novo
      }, 2000);
    } catch (err) {
      error("Erro", "Falha ao enviar a foto.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Deseja realmente excluir este evento?")) return;
    try {
      await CalendarService.deleteEvent(id);
      success("Excluído", "Evento removido.");
      fetchEvents();
    } catch (err) {
      error("Erro", "Falha ao excluir.");
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay(); // 0-6

    return events.filter(e => {
      // Se for um evento recorrente, tratamos de forma diferente
      if (e.is_recurring && e.recurrence_pattern) {
        const eventStart = new Date(e.event_date);
        eventStart.setHours(0,0,0,0);
        const currentDay = new Date(day);
        currentDay.setHours(0,0,0,0);

        // Não mostra se for antes da data de início da série
        if (currentDay < eventStart) return false;

        // Não mostra se for depois do fim da série (se houver)
        if (e.recurrence_pattern.endDate && currentDay > new Date(e.recurrence_pattern.endDate)) return false;

        // Verifica se o dia da semana coincide com o padrão selecionado
        if (e.recurrence_pattern.freq === 'weekly' && e.recurrence_pattern.days?.includes(dayOfWeek)) {
          return true;
        }
        
        return false; // Se for recorrente mas não bater com o dia, não mostra
      }

      // Se NÃO for recorrente, mostra apenas na data exata
      return e.event_date === dayStr;
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDate);
  const selectedDayBirthdays = birthdays.filter(b => b.day === selectedDate.getDate());

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'live': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'metaverso': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'meeting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'culto': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-12 pb-12">
        {/* ── HEADER PREMIUM & NAVIGATION ── */}
        <div className="relative">
          {/* Elementos Decorativos de Fundo */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 text-primary/80"
              >
                <div className="p-2.5 bg-primary/10 rounded-2xl backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5">
                  <CalendarIcon size={20} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Agenda de Guerra da Tribo</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.85]">
                  Missões <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-b from-primary via-primary to-amber-600 drop-shadow-[0_10px_40px_rgba(251,191,36,0.3)]">
                    Tribais
                  </span>
                </h1>
                <p className="text-zinc-500 font-bold mt-6 max-w-xl text-sm md:text-lg leading-relaxed uppercase tracking-wider">
                  Sincronize suas conquistas, participe dos eventos épicos <br className="hidden md:block" />
                  e celebre as vitórias com toda a sua tribo.
                </p>
              </motion.div>
            </div>

            {/* SELETOR DE DATA GLASSMORPHISM */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative bg-zinc-900/40 backdrop-blur-3xl border-2 border-zinc-800/80 p-3 rounded-[3rem] flex items-center gap-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                <motion.button 
                  whileHover={{ scale: 1.15, x: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevMonth}
                  className="w-16 h-16 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-700/50 rounded-full flex items-center justify-center text-zinc-400 transition-all hover:text-primary hover:border-primary/30 shadow-xl"
                >
                  <ChevronLeft size={28} />
                </motion.button>

                <div className="px-10 py-3 text-center min-w-[180px] md:min-w-[220px]">
                  <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-1.5 opacity-80">
                    {format(currentDate, 'yyyy')}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                    {format(currentDate, 'MMMM', { locale: ptBR })}
                  </h2>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.15, x: 3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextMonth}
                  className="w-16 h-16 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-700/50 rounded-full flex items-center justify-center text-zinc-400 transition-all hover:text-primary hover:border-primary/30 shadow-xl"
                >
                  <ChevronRight size={28} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 md:gap-8">
          {/* ── CALENDAR GRID ── */}
          <div className="flex-1 bg-zinc-900/30 backdrop-blur-sm border-2 border-zinc-800/50 rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="grid grid-cols-7 mb-4 md:mb-6">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-[10px] md:text-xs font-black uppercase text-zinc-600 tracking-widest py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-3">
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayEvents = getEventsForDay(day);
                const dayBirthdays = birthdays.filter(b => b.day === day.getDate() && isSameMonth(day, currentDate));
                
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day)}
                    className={`relative aspect-square md:aspect-auto md:h-32 p-1.5 md:p-4 rounded-xl md:rounded-4xl border-2 transition-all flex flex-col items-center md:items-start justify-center md:justify-start ${
                      isSelected 
                        ? 'bg-primary border-primary shadow-[0_10px_30px_rgba(251,191,36,0.25)] z-10' 
                        : isToday
                          ? 'bg-zinc-800/80 border-primary/40 text-white'
                          : isCurrentMonth
                            ? 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 text-zinc-300'
                            : 'bg-transparent border-transparent text-zinc-800 opacity-20 pointer-events-none'
                    }`}
                  >
                    <span className={`text-sm md:text-2xl font-black italic tracking-tighter ${isSelected ? 'text-black' : ''}`}>
                      {format(day, 'd')}
                    </span>

                    {/* Desktop Indicators */}
                    <div className="hidden md:flex flex-wrap gap-1 mt-auto">
                      {dayEvents.map((e, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-primary'}`} />
                      ))}
                      {dayBirthdays.map((b, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      ))}
                    </div>

                    {/* Mobile Dot Indicators */}
                    <div className="md:hidden absolute bottom-1.5 flex gap-0.5">
                      {(dayEvents.length > 0 || dayBirthdays.length > 0) && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-primary shadow-[0_0_5px_rgba(251,191,36,1)]'}`} />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── SIDEBAR / DAY DETAILS ── */}
          <div className="xl:w-96 space-y-6">
            <div className="xl:hidden flex items-center justify-center py-4">
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border-2 border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <CalendarIcon size={18} className="text-primary" />
                  <h3 className="text-xl md:text-2xl font-black uppercase italic text-white">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-primary hover:scale-110 active:scale-95 text-black rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-[0_5px_15px_rgba(251,191,36,0.3)]"
                  >
                    <Plus size={20} strokeWidth={3} />
                  </button>
                )}
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                {selectedDayBirthdays.map(b => (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={b.id}
                    onClick={() => setViewingBirthday(b)}
                    className="w-full p-4 bg-pink-500/5 border border-pink-500/20 rounded-2xl flex items-center gap-4 text-left group transition-all hover:bg-pink-500/10"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-pink-500/30 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-110 transition-transform bg-zinc-950">
                      <img 
                        src={b.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.name}`} 
                        alt={b.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">ANIVERSARIANTE</p>
                      <h4 className="text-white font-black uppercase text-sm">{b.name}</h4>
                    </div>
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageCircle size={16} />
                    </div>
                  </motion.button>
                ))}

                {selectedDayEvents.length > 0 || selectedDayBirthdays.length > 0 ? (
                  selectedDayEvents.map(event => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={event.id}
                      className="p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-2xl hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getTypeStyles(event.type)}`}>
                          {event.type}
                        </span>
                        <div className="flex items-center gap-1 text-primary">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[10px] font-black">{event.points_reward} PTS</span>
                        </div>
                      </div>
                      
                      <h4 className="text-white font-black uppercase text-sm mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                        {event.is_recurring && <span className="text-zinc-500">🔄</span>}
                        <span>{event.title}</span>
                      </h4>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold">
                          <Clock size={14} className="text-zinc-600" />
                          <span>{event.start_time} {event.end_time ? ` - ${event.end_time}` : ''}</span>
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                          <span>{event.description}</span>
                        </p>
                      </div>

                      {(() => {
                        const hasSubmitted = participations.some(p => 
                          p.event_id === event.id && 
                          p.occurrence_date === format(selectedDate, 'yyyy-MM-dd')
                        );

                        if (hasSubmitted) {
                          const participation = participations.find(p => p.event_id === event.id && p.occurrence_date === format(selectedDate, 'yyyy-MM-dd'));
                          const isApproved = participation?.status === 'approved';

                          return (
                            <div className={`w-full mb-3 py-3 rounded-xl border flex items-center justify-center gap-2 ${
                              isApproved 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              <div className={`w-2 h-2 rounded-full animate-pulse ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {isApproved ? 'MISSÃO APROVADA ✅' : 'AGUARDANDO VALIDAÇÃO ⏳'}
                              </span>
                            </div>
                          );
                        }

                        const linkedActivity = event.linked_activity_id ? availableActivities.find(a => a.id === event.linked_activity_id) : null;
                        const isQrCode = linkedActivity?.type === 'qr_code';

                        return event.requires_proof && (
                          <div className="space-y-3">
                            {isQrCode ? (
                              <button 
                                onClick={() => setScanningEvent(event)}
                                className="w-full py-3 bg-primary hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] flex items-center justify-center gap-2"
                              >
                                <QrCode size={14} />
                                <span>ESCANEAR QR CODE</span>
                              </button>
                            ) : (
                              <>
                                {previewImage && uploadingForEventId === event.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950"
                                  >
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  </motion.div>
                                )}
                                
                                <button 
                                  onClick={() => {
                                    setUploadingForEventId(event.id);
                                    fileInputRef.current?.click();
                                  }}
                                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                                >
                                  <Plus size={14} />
                                  <span>{previewImage && uploadingForEventId === event.id ? 'TROCAR FOTO' : 'ENVIAR PROVA (FOTO)'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setViewingEvent(event)}
                          className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 group-hover:border-primary/50"
                        >
                          <span>VER DETALHES</span>
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 rounded-xl transition-all border border-red-500/20"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info size={24} className="text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">
                      <span>Nenhum evento para este dia</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">LEGENDA</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gincana', type: 'gincana' },
                  { label: 'Live', type: 'live' },
                  { label: 'Metaverso', type: 'metaverso' },
                  { label: 'Reunião', type: 'meeting' },
                  { label: 'Culto', type: 'culto' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full border ${getTypeStyles(item.type)} bg-current opacity-40`}></div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <CalendarIcon size={24} className="text-primary" />
                    </div>
                    <span>Adicionar Evento</span>
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Defina os detalhes e regras do evento</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="bg-amber-500/10 border-2 border-amber-500/20 p-5 rounded-3xl flex items-start gap-4">
                  <Info size={24} className="text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest">Eventos Simples</h4>
                    <p className="text-xs text-amber-500/80 font-bold mt-1 leading-relaxed">
                      Este formulário cria apenas eventos informativos (sem pontuação). Para agendar Missões ou Cultos que valem XP e exigem Check-in/Prova, utilize o <strong className="text-amber-400">Painel de Desafios</strong>.
                    </p>
                  </div>
                </div>

                {/* Seção 1: O Quê? */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Informações Básicas</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative group">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Título do Evento</label>
                      <input 
                        type="text" 
                        required
                        value={newEvent.title}
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                        placeholder="Ex: Culto de Celebração ou Batalha Live"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-hidden transition-all group-hover:border-zinc-700 placeholder:text-zinc-700 font-bold"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Tipo de Evento</label>
                      <select 
                        value={newEvent.type}
                        onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-hidden transition-all appearance-none font-bold"
                      >
                        <option value="gincana">🏆 Gincana</option>
                        <option value="live">📺 Live</option>
                        <option value="metaverso">🎮 Metaverso</option>
                        <option value="meeting">🤝 Reunião</option>
                        <option value="culto">⛪ Culto</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Quando? */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Agendamento</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Data de Início</label>
                      <input 
                        type="date" 
                        required
                        value={newEvent.event_date}
                        onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:border-primary outline-hidden transition-all font-bold [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Horário</label>
                      <div className="relative">
                        <input 
                          type="time" 
                          required
                          value={newEvent.start_time}
                          onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:border-primary outline-hidden transition-all font-bold [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-2">
                    <button 
                      type="button"
                      onClick={() => setNewEvent({...newEvent, is_recurring: !newEvent.is_recurring})}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                        newEvent.is_recurring 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-zinc-950 border-zinc-800 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-primary transition-colors">Repetir</span>
                        <span className="text-xs font-bold text-white uppercase">Semanal</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-all ${newEvent.is_recurring ? 'bg-primary' : 'bg-zinc-800'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newEvent.is_recurring ? 'left-5' : 'left-1'}`}></div>
                      </div>
                    </button>
                  </div>

                  {/* Seletor de Dias */}
                  {newEvent.is_recurring && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-5 bg-zinc-950 border border-zinc-800 rounded-4xl"
                    >
                      <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-4 text-center">Selecionar dias de ocorrência</label>
                      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 px-1">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day, i) => {
                          const isSelected = (newEvent.recurrence_pattern.days || []).includes(i);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const days = newEvent.recurrence_pattern.days || [];
                                const newDays = days.includes(i) ? days.filter(d => d !== i) : [...days, i];
                                setNewEvent({...newEvent, recurrence_pattern: {...newEvent.recurrence_pattern, days: newDays}});
                              }}
                              className={`flex flex-col items-center gap-1.5 group transition-all`}
                            >
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                                isSelected 
                                  ? 'bg-primary border-primary text-black scale-110 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-white'
                              }`}>
                                {day[0]}
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${isSelected ? 'text-primary' : 'text-zinc-700'}`}>
                                {day}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Detalhes do Evento (Opcional)</label>
                  <textarea 
                    value={newEvent.description}
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Instruções adicionais para os membros..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-hidden transition-all resize-none font-medium text-sm placeholder:text-zinc-800"
                  />
                </div>

                {/* Botão Final */}
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="w-full py-5 bg-primary hover:bg-amber-500 text-black font-black rounded-3xl transition-all active:scale-95 shadow-[0_15px_30px_rgba(251,191,36,0.2)] disabled:opacity-50 flex items-center justify-center gap-3 group"
                  >
                    <Plus className="group-hover:rotate-90 transition-transform" />
                    <span className="uppercase tracking-tighter text-lg italic">Publicar Evento no Calendário</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes do Evento */}
      <AnimatePresence>
        {viewingEvent && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="p-8 relative">
                <button 
                  onClick={() => setViewingEvent(null)}
                  className="absolute top-6 right-6 p-2 bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>

                <div className="mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getTypeStyles(viewingEvent.type)}`}>
                    {viewingEvent.type}
                  </span>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mt-4">{viewingEvent.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horário</p>
                    <p className="text-white font-bold">{viewingEvent.start_time}</p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Recompensa</p>
                    <p className="text-primary font-black">{viewingEvent.points_reward} PONTOS</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sobre este Evento</p>
                  <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-300 leading-relaxed italic">
                    {viewingEvent.description || "Nenhuma descrição detalhada fornecida para este evento."}
                  </div>
                </div>

                <button 
                  onClick={() => setViewingEvent(null)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl uppercase italic tracking-tighter transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE ANIVERSÁRIO ── */}
      <AnimatePresence>
        {viewingBirthday && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingBirthday(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border-2 border-pink-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.2)]"
            >
              <div className="h-32 bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl"
                >
                  🥳
                </motion.div>
              </div>

              <div className="p-8 pt-0 -mt-12 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-zinc-950 border-4 border-zinc-900 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                   <img 
                      src={viewingBirthday.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingBirthday.name}`} 
                      alt={viewingBirthday.name} 
                      className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-pink-500/5 animate-pulse pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] italic">O dia é dele(a)!</p>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                    {viewingBirthday.name}
                  </h2>
                  <p className="text-zinc-500 font-bold max-w-xs text-sm leading-relaxed">
                    Hoje a tribo celebra a vida deste guerreiro(a). Que tal mandar uma mensagem especial?
                  </p>
                </div>

                <div className="w-full space-y-3 pt-4">
                  <a
                    href={`https://wa.me/${viewingBirthday.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns, ${viewingBirthday.name}! Que Deus te abençoe muito no seu aniversário e te dê muitos anos de vida e conquistas na tribo! 🎂🔥🏆`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all hover:scale-105 active:scale-95"
                  >
                    <MessageCircle size={20} strokeWidth={3} />
                    <span>Mandar Parabéns</span>
                  </a>

                  <button
                    onClick={() => setViewingBirthday(null)}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setViewingBirthday(null)}
                  className="w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Input de Arquivo Escondido */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={(e) => uploadingForEventId && handleUploadProof(e, uploadingForEventId)}
        className="hidden"
        accept="image/*"
      />

      {/* Modal do QR Scanner */}
      <AnimatePresence>
        {scanningEvent && (
          <QRScanner
            activityTitle={scanningEvent.title}
            onClose={() => setScanningEvent(null)}
            onScan={async (decodedText) => {
              if (!profile) return;
              const linkedAct = availableActivities.find(a => a.id === scanningEvent.linked_activity_id);
              if (linkedAct && decodedText === linkedAct.secret_payload) {
                setScanningEvent(null);
                
                try {
                  await supabase.from('event_participations').insert({
                    user_id: profile.id,
                    event_id: scanningEvent.id,
                    occurrence_date: format(selectedDate, 'yyyy-MM-dd'),
                    status: 'approved',
                    proof_url: 'QR_CODE_SCAN'
                  });

                  if (scanningEvent.points_reward > 0 && profile.groupId) {
                    await supabase.rpc('increment_points', {
                      user_id: profile.id,
                      group_id: profile.groupId,
                      pts: scanningEvent.points_reward,
                      reason: `Check-in: ${scanningEvent.title}`
                    });
                  }

                  success("Check-in Realizado!", "Presença confirmada via QR Code ✅");
                  confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FBBF24', '#000000', '#FFFFFF']
                  });
                  fetchEvents();
                } catch (err) {
                  error("Erro", "Falha ao registrar participação.");
                }
              } else {
                error("QR Code Inválido", "Este código não pertence a este evento.");
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
