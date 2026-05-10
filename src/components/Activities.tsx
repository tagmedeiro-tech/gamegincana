import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, Send, X, 
  Camera, Clock, Check, 
  ChevronRight, Timer, ImageIcon, History, Zap, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Activity, Participation } from '../types';
import { useAuth } from '../context/useAuth';
import { NotificationService } from '../lib/NotificationService';
import PointsTable from './PointsTable';
import { useToast } from '../context/ToastContext';
import { Loader2 } from 'lucide-react';
import PostComposer from './feed/PostComposer';
import LoadingSpinner from './LoadingSpinner';
import { OfflineService } from '../lib/OfflineService';
import { FeedPost } from '../types';
import QRScanner from './QRScanner';
import confetti from 'canvas-confetti';

// Interface estrita para as participações com os dados da atividade incluídos
interface ParticipationWithActivity extends Participation {
  activities: Activity;
}

interface ActivityCardProps {
  key?: string;
  activity: Activity;
  index: number;
  onComplete: (a: Activity) => Promise<void>;
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [participations, setParticipations] = useState<ParticipationWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'available' | 'history' | 'points'>('available');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: toastError } = useToast();
  const { user, profile, revalidateCount } = useAuth();
  const [showMuralComposer, setShowMuralComposer] = useState(false);
  const [muralInitialData, setMuralInitialData] = useState<Partial<FeedPost>>({});
  const [scanningActivity, setScanningActivity] = useState<Activity | null>(null);

  const loadActivities = useCallback(async (isInitial = false) => {
    // ⚡ CACHE APK: Restaura do cache local imediatamente no mobile
    if (isInitial) {
      const cachedAct = OfflineService.get<Activity[]>('arena_activities');
      const cachedPart = OfflineService.get<ParticipationWithActivity[]>('arena_participations');
      if (cachedAct) setActivities(cachedAct);
      if (cachedPart) setParticipations(cachedPart);
    }

    try {
      if (!isInitial) setLoading(true);
      
      // 1. Busca Atividades
      const { data: actData, error: actError } = await supabase
        .from('activities')
        .select('*')
        .eq('status', 'active')
        .order('points', { ascending: false });

      if (actError) throw actError;

      // 2. Busca Participações se houver usuário
      let partData: ParticipationWithActivity[] = [];
      if (user) {
        const { data, error: partError } = await supabase
          .from('participations')
          .select('*, activities(*)')
          .eq('"userId"', user.id)
          .order('created_at', { ascending: false });
        
        if (partError) throw partError;
        partData = (data as unknown as ParticipationWithActivity[]) || [];
      }

      // 3. Atualiza Estado e Cache
      setActivities(actData || []);
      setParticipations(partData);
      
      OfflineService.save('arena_activities', actData);
      OfflineService.save('arena_participations', partData);

    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActivities(true);

    const handleOnline = () => loadActivities(false);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadActivities]);

  const handleLogoUpload = async (file: File) => {
    // Validação de tipo e tamanho (sem isso, qualquer arquivo podia ser enviado)
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_MB = 5 * 1024 * 1024;
    if (!ALLOWED.includes(file.type)) {
      throw new Error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
    }
    if (file.size > MAX_MB) {
      throw new Error('Imagem muito grande. Máximo 5MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
    const filePath = `participations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('proofs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleComplete = async (activity: Activity) => {
    // Se exige aceite e o usuário ainda não aceitou, cria o vínculo de aceite
    const hasAccepted = participations.some(p => p.activityId === activity.id && p.status === 'accepted');
    
    if (activity.requires_acceptance && !hasAccepted) {
      await handleAccept(activity);
      return;
    }

    if (activity.type === 'qr_code') {
      setScanningActivity(activity);
      return;
    }

    if (activity.validationType === 'manual') {
      setSelectedActivity(activity);
    } else {
      await submitParticipation(activity, 'Validado automaticamente');
    }
  };

  const handleAccept = async (activity: Activity) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('participations')
        .insert({
          userId: user.id,
          groupId: profile.groupId,
          activityId: activity.id,
          status: 'accepted',
          pointsEarned: 0
        });

      if (error) throw error;
      
      success("Desafio Aceito", "Agora você pode enviar a prova.");
      await loadActivities(false);
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível aceitar o desafio.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitParticipation = async (activity: Activity, text: string) => {
    if (!user || !profile) return;

    // 🛡️ Prevenção de "Atividades Órfãs" (sem groupId)
    if (!profile.groupId) {
      toastError("Tribo Não Definida", "Você precisa estar vinculado a uma tribo para enviar desafios. Vá em Perfil e selecione sua tribo.");
      return;
    }

    setSubmitting(true);
    try {
      let finalProofUrl = text;

      if (proofFile) {
        finalProofUrl = await handleLogoUpload(proofFile);
      }

      // Verifica se já existe um registro de 'accepted' para atualizar
      const existingAccepted = participations.find(p => p.activityId === activity.id && p.status === 'accepted');

      let error;
      if (existingAccepted) {
        const { error: updateError } = await supabase
          .from('participations')
          .update({
            status: activity.validationType === 'auto' ? 'approved' : 'pending',
            pointsEarned: activity.validationType === 'auto' ? activity.points : 0,
            proofUrl: finalProofUrl,
            created_at: new Date().toISOString() // Atualiza a data para o momento do cumprimento
          })
          .eq('id', existingAccepted.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('participations')
          .insert({
            userId: user.id,
            groupId: profile.groupId,
            activityId: activity.id,
            status: activity.validationType === 'auto' ? 'approved' : 'pending',
            pointsEarned: activity.validationType === 'auto' ? activity.points : 0,
            proofUrl: finalProofUrl
          });
        error = insertError;
      }

      if (error) throw error;
      
      // 🔔 NOTIFICAR ADMIN E LÍDER
      const actorAvatar = profile.avatar_url || (profile as any).avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`;
      await NotificationService.notifyStaff(
        profile.groupId, 
        'task_submit', 
        'Novo Desafio Cumprido!', 
        `${profile.name} concluiu: ${activity.title}`,
        undefined,
        actorAvatar
      );

      if (activity.validationType === 'auto') {
         await supabase.rpc('increment_points', { 
           user_id: user.id, 
           group_id: profile.groupId, 
           pts: activity.points,
           reason: `Atividade: ${activity.title}`
         });
      }
      if (activity.validationType === 'auto') {
        success("Pontos Computados", "O desafio foi concluído com sucesso!");
        if (activity.type === 'qr_code') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FBBF24', '#000000', '#FFFFFF']
          });
        }
      } else {
        success("Desafio Enviado", "Sua prova foi enviada para validação.");
      }
      setSelectedActivity(null);
      setProofText('');
      setProofFile(null);
      await loadActivities(false);
    } catch (err) {
      console.error(err);
      toastError("Erro", "Não foi possível enviar a participação.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="pr-2">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase italic leading-none" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            Gincana <span className="text-primary block text-5xl sm:text-6xl mt-1" style={{ textShadow: '0 0 20px rgba(251,191,36,0.3)' }}>Atividades</span>
          </h2>
          <p className="text-zinc-500 font-bold mt-3 italic flex items-start sm:items-center gap-2 text-xs sm:text-sm">
            <Timer size={16} className="text-primary shrink-0 mt-0.5 sm:mt-0" /> 
            <span>Cumpra as tarefas e leve sua tribo ao topo.</span>
          </p>
        </div>

        <div className="scroll-faded-container w-full md:w-auto">
          <div className="flex bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 p-1.5 rounded-2xl overflow-x-auto modern-scrollbar w-full md:w-auto snap-x">
            <button 
              onClick={() => setView('available')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase italic tracking-tight transition-all whitespace-nowrap snap-start flex-1 md:flex-none text-[10px] sm:text-xs ${
                view === 'available' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <History size={16} className="rotate-180" /> Disponíveis
            </button>
            <button 
              onClick={() => setView('history')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase italic tracking-tight transition-all whitespace-nowrap snap-start flex-1 md:flex-none text-[10px] sm:text-xs ${
                view === 'history' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <History size={16} /> Meu Histórico
            </button>
            <button 
              onClick={() => setView('points')}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase italic tracking-tight transition-all whitespace-nowrap snap-start flex-1 md:flex-none text-[10px] sm:text-xs ${
                view === 'points' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Zap size={16} /> Tabela de Pontos
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'available' ? (
          <motion.div 
            key="available"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading && activities.length === 0 ? (
              // SKELETON CARDS
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-zinc-900/50 border-4 border-zinc-800/50 rounded-[32px] p-6 h-80 animate-pulse">
                  <div className="w-full h-32 bg-zinc-800 rounded-2xl mb-4" />
                  <div className="h-6 bg-zinc-800 rounded-full w-3/4 mb-4" />
                  <div className="h-4 bg-zinc-800 rounded-full w-1/2 mb-8" />
                  <div className="h-10 bg-zinc-800 rounded-xl w-full" />
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="col-span-full bg-zinc-900/50 border-2 border-dashed border-zinc-800 p-10 sm:p-20 rounded-4xl sm:rounded-[3rem] text-center flex flex-col items-center justify-center">
                <CheckCircle2 size={48} className="text-zinc-800 mb-4" />
                <p className="text-zinc-600 font-black italic uppercase text-lg sm:text-2xl">Nenhuma atividade ativa no momento.</p>
              </div>
            ) : activities.map((activity, i) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity} 
                index={i} 
                onComplete={handleComplete} 
                hasAccepted={participations.some(p => p.activityId === activity.id && p.status === 'accepted')}
                isCompleted={participations.some(p => p.activityId === activity.id && (p.status === 'approved' || p.status === 'pending'))}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {participations.length === 0 ? (
              <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 p-10 sm:p-20 rounded-4xl sm:rounded-[3rem] text-center flex flex-col items-center justify-center">
                <History size={48} className="text-zinc-800 mb-4" />
                <p className="text-zinc-600 font-black italic uppercase text-lg sm:text-2xl">Você ainda não participou de nenhum desafio.</p>
              </div>
            ) : participations.map((part) => (
              <div key={part.id} className="bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl flex items-center justify-between group hover:border-primary transition-all">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                    part.status === 'approved' ? 'bg-green-500/10 border-green-500 text-green-500' :
                    part.status === 'rejected' ? 'bg-red-500/10 border-red-500 text-red-500' :
                    'bg-orange-500/10 border-orange-500 text-orange-500'
                  }`}>
                    {part.status === 'approved' ? <CheckCircle2 size={24} /> : 
                     part.status === 'rejected' ? <X size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase italic text-white">{part.activities?.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {new Date(part.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        part.status === 'approved' ? 'text-green-500' :
                        part.status === 'rejected' ? 'text-red-500' :
                        'text-orange-500'
                      }`}>
                        {part.status === 'approved' ? `+${part.pointsEarned} Pontos` : 
                         part.status === 'rejected' ? 'Reprovado' : 'Aguardando Validação'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {part.proofUrl && (
                    <button
                      onClick={() => {
                        const isImage = part.proofUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || part.proofUrl?.includes('storage/v1/object/public');
                        setMuralInitialData({
                          postType: 'activity_proof',
                          activityTitle: part.activities?.title,
                          participationId: part.id,
                          imageUrl: isImage ? part.proofUrl : undefined,
                          caption: !isImage ? part.proofUrl : undefined,
                        });
                        setShowMuralComposer(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all active:scale-95 shadow-md group-hover:scale-110"
                      title="Compartilhar no Mural"
                    >
                      <Share2 size={16} />
                    </button>
                  )}
                  <ChevronRight size={20} className="text-zinc-800 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </motion.div>
        )}
        {view === 'points' && (
          <motion.div
            key="points"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PointsTable />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div key="submission-modal" className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-xl bg-zinc-900 border-4 border-zinc-800 p-8 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10" />
              
              <button 
                onClick={() => setSelectedActivity(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-primary text-black rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(251,191,36,0.2)]">
                  <Camera size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic text-white leading-none">Enviar Prova</h3>
                  <p className="text-primary font-black uppercase italic text-xs tracking-widest mt-1">
                    {selectedActivity.title}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comprovação (Foto)</label>
                  <div 
                    className={`relative h-40 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
                      proofFile ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-700 bg-black'
                    }`}
                  >
                    {proofFile ? (
                      <div className="text-center p-4">
                        <Check className="text-primary mx-auto mb-2" size={32} />
                        <p className="text-white font-bold text-sm truncate max-w-xs">{proofFile.name}</p>
                        <button onClick={() => setProofFile(null)} className="text-red-500 font-black uppercase text-[10px] mt-2">Remover</button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="text-zinc-700 mb-2" size={40} />
                        <p className="text-zinc-500 font-black uppercase text-[10px]">Clique para selecionar foto</p>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Observação (Opcional)</label>
                  <textarea 
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Conte um pouco como foi..."
                    className="w-full bg-black border-4 border-zinc-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all resize-none h-24"
                  />
                </div>

                <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4">
                   <p className="text-orange-500 text-[10px] font-bold uppercase leading-tight italic">
                    Ao enviar, o seu líder de tribo ou o administrador receberá uma notificação para validar sua pontuação.
                   </p>
                </div>

                <button 
                  onClick={() => submitParticipation(selectedActivity, proofText)}
                  disabled={submitting || (!proofFile && !proofText.trim())}
                  className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
                  {submitting ? 'ENVIANDO...' : 'CONCLUIR DESAFIO'} 
                  {!submitting && <Send size={20} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMuralComposer && (
          <PostComposer
            initialData={muralInitialData}
            onPublished={() => {}}
            onClose={() => setShowMuralComposer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scanningActivity && (
          <QRScanner
            activityTitle={scanningActivity.title}
            onClose={() => setScanningActivity(null)}
            onScan={(decodedText) => {
              if (decodedText === scanningActivity.secret_payload) {
                setScanningActivity(null);
                submitParticipation(scanningActivity, "Presença Confirmada via QR Code ✅");
              } else {
                toastError("QR Code Inválido", "Este QR Code não pertence a esta atividade.");
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  index: number;
  onComplete: (a: Activity) => Promise<void>;
  hasAccepted: boolean;
  isCompleted: boolean;
}

function ActivityCard({ activity, index, onComplete, hasAccepted, isCompleted }: ActivityCardProps) {
  const [timeLeft, setTimeLeft] = React.useState<string | null>(null);
  const [isUrgent, setIsUrgent] = React.useState(false);

  React.useEffect(() => {
    if (!activity.expiresAt) return;
    const update = () => {
      const diff = new Date(activity.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('EXPIRADO'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setIsUrgent(diff < 3600000 * 2); // < 2h = urgente
      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [activity.expiresAt]);

  const missionBadge = () => {
    switch (activity.missionType) {
      case 'flash':   return { label: '⚡ RELÂMPAGO', cls: 'bg-red-500/20 text-red-400 border-red-500/50' };
      case 'weekly':  return { label: '📅 SEMANAL',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/50' };
      case 'special': return { label: '⭐ ESPECIAL',  cls: 'bg-purple-500/20 text-purple-400 border-purple-500/50' };
      default:        return null;
    }
  };
  const badge = missionBadge();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
      className={`bg-zinc-900 border-4 rounded-[32px] p-6 flex flex-col justify-between group transition-all shadow-xl ${
        isUrgent
          ? 'border-red-500/70 shadow-red-500/10 hover:border-red-400'
          : 'border-zinc-800 hover:border-primary hover:shadow-primary/5'
      }`}
    >
      <div>
        {activity.imageUrl && (
          <div className="w-full h-32 md:h-40 bg-black rounded-2xl mb-4 overflow-hidden border-2 border-zinc-800 relative group-hover:border-primary/50 transition-colors">
            <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-black border-2 border-zinc-800 text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
              {activity.category || 'Geral'}
            </span>
            {badge && (
              <span className={`border text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-primary">
            <span className="text-3xl font-black italic">+{activity.points}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">pts</span>
          </div>
        </div>

        {/* Countdown */}
        {timeLeft && (
          <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
            isUrgent
              ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}>
            <Clock size={12} />
            <span>{isUrgent ? '🔥 Atenção! Expira em ' : 'Tempo restante: '}</span>
            <span className="font-black">{timeLeft}</span>
          </div>
        )}
        
        <h3 className="text-2xl font-black text-white uppercase italic leading-none mb-3 group-hover:text-primary transition-colors">
          {activity.title}
        </h3>
        <p className="text-zinc-500 font-bold text-sm italic leading-snug mb-6">
          {activity.description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 pt-4 border-t-2 border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${activity.type === 'presencial' ? 'bg-primary' : 'bg-blue-500'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">{activity.type}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600">
             <div className="w-4 h-4 flex items-center justify-center">
              {activity.validationType === 'auto' ? <ZapIcon size={10} className="text-green-500" /> : <Clock size={10} className="text-orange-500" />}
             </div>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {activity.validationType === 'auto' ? 'Auto' : 'Moderação'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => onComplete(activity)}
          disabled={isCompleted}
          className={`w-full py-3 rounded-xl font-black uppercase italic text-xs tracking-tighter active:scale-95 transition-all flex items-center justify-center gap-2 ${
            isCompleted 
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : activity.requires_acceptance && !hasAccepted
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                : isUrgent
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20'
                  : 'bg-zinc-800 hover:bg-primary text-zinc-500 hover:text-black shadow-lg hover:shadow-primary/20'
          }`}
        >
          {isCompleted ? (
            <><Check size={14} /> JÁ CONCLUÍDO</>
          ) : activity.requires_acceptance && !hasAccepted ? (
            <><ZapIcon size={14} /> ACEITAR DESAFIO</>
          ) : (
            <>{activity.validationType === 'auto' ? 'CONCLUIR AGORA' : 'ENVIAR PROVA'} <ChevronRight size={14} /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function ZapIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

