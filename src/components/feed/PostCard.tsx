import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, Trash2, User, BookOpen, ExternalLink, Trophy, Sword, CheckCircle2, Play, X, Shield, Sparkles, Flame, Zap, Crown } from 'lucide-react';
import { FeedPost, getUserLevel } from '../../types';
import { FeedService } from '../../lib/FeedService';
import { useAuth } from '../../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import PostReactionBar from './PostReactionBar';
import PostCommentSection from './PostCommentSection';
import { useAppTheme } from '../../hooks/useAppTheme';
import LevelIcon from '../LevelIcon';
import { useToast } from '../../context/ToastContext';
import ImageWithSkeleton from './ImageWithSkeleton';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

// ── Sub-cards por tipo ────────────────────────────────────────────────────────

function PhotoCard({ post }: { post: FeedPost }) {
  const [lightbox, setLightbox] = useState(false);
  if (!post.imageUrl) return null;
  return (
    <>
      <div
        className="cursor-zoom-in mt-1"
        onClick={() => setLightbox(true)}
      >
        <ImageWithSkeleton 
          src={post.imageUrl} 
          alt="Post" 
          aspectRatio="aspect-auto" 
          className="max-h-[420px]"
        />
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X size={28} />
            </button>
            <img src={post.imageUrl} alt="Post" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TextCard({ post }: { post: FeedPost }) {
  const navigate = useNavigate();
  if (!post.verseRef && !post.caption) return null;
  return (
    <div className="mt-2 space-y-3">
      {post.verseRef && (
        <div className="bg-black/40 border-l-4 border-primary rounded-r-2xl p-4">
          <p className="text-primary font-black text-[10px] uppercase tracking-widest mb-2">
            📖 {post.verseRef}
          </p>
          <p className="text-white italic text-sm leading-relaxed">
            &ldquo;{post.verseText}&rdquo;
          </p>
          {post.verseBookId && (
            <button
              onClick={() => navigate(`/bible?book=${post.verseBookId}&chapter=${post.verseChapter}`)}
              className="mt-3 flex items-center gap-1 text-zinc-500 hover:text-primary text-[10px] font-black uppercase transition-colors"
            >
              <BookOpen size={10} /> Ler capitulo
            </button>
          )}
        </div>
      )}
      {post.caption && (
        <p className="text-zinc-200 text-sm leading-relaxed">{post.caption}</p>
      )}
    </div>
  );
}

function BibleStudyCard({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  if (!post.studyTitle) return null;
  return (
    <div className="mt-2 bg-black/30 border-2 border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <BookOpen size={16} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-0.5">Estudo Biblico</p>
          <p className="text-white font-black italic text-sm">{post.studyTitle}</p>
        </div>
        <span className="text-zinc-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-zinc-800 pt-4">
              {post.studyBody}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function YoutubeCard({ post }: { post: FeedPost }) {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  if (!post.videoId && !post.videoUrl) return null;

  const videoId = post.videoId ?? FeedService.extractYouTubeId(post.videoUrl ?? '');
  const embedUrl = FeedService.buildYouTubeEmbedUrl(videoId, true);
  const initialThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleThumbError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src.includes('maxresdefault')) {
      img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else {
      img.style.display = 'none';
    }
  };

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border-2 border-zinc-800 aspect-video relative bg-black">
      {!playing ? (
        <div className="relative w-full h-full cursor-pointer" onClick={() => setPlaying(true)}>
          <img
            src={thumbSrc ?? initialThumb}
            onLoad={() => setThumbSrc(thumbSrc ?? initialThumb)}
            onError={handleThumbError}
            className="w-full h-full object-cover"
            alt="Video"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <Play size={26} className="text-white ml-1" fill="white" />
            </div>
          </div>
          {post.videoTitle && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90">
              <p className="text-white font-black text-sm truncate">{post.videoTitle}</p>
            </div>
          )}
        </div>
      ) : (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={post.videoTitle ?? 'Video'}
        />
      )}
    </div>
  );
}

function SpotifyCard({ post }: { post: FeedPost }) {
  const embedUrl = post.spotifyEmbedUrl ?? (post.spotifyUri ? FeedService.buildSpotifyEmbedUrl(post.spotifyUri) : '');
  if (!embedUrl) return null;
  const isPlaylist = post.postType === 'spotify_playlist';
  return (
    <div className="mt-2 rounded-2xl overflow-hidden border-2 border-zinc-800">
      <iframe
        src={embedUrl}
        width="100%"
        height={isPlaylist ? 380 : 152}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={post.spotifyTitle ?? 'Spotify'}
        className="rounded-2xl"
      />
    </div>
  );
}

function AchievementCard({ post }: { post: FeedPost }) {
  if (!post.achievementLabel) return null;
  return (
    <div className="mt-2 bg-linear-to-r from-primary/20 to-zinc-900 border-2 border-primary/40 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary text-2xl">
        {post.achievementIcon ?? '🏆'}
      </div>
      <div>
        <p className="text-primary font-black text-[9px] uppercase tracking-widest">Nova Conquista!</p>
        <p className="text-white font-black italic text-base">{post.achievementLabel}</p>
      </div>
      <Trophy size={32} className="text-primary/30 ml-auto" />
    </div>
  );
}

function DuelVictoryCard({ post }: { post: FeedPost }) {
  if (!post.duelOpponentName) return null;
  return (
    <div className="mt-2 bg-linear-to-r from-red-900/30 to-zinc-900 border-2 border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 text-2xl">
        ⚔️
      </div>
      <div className="flex-1">
        <p className="text-red-400 font-black text-[9px] uppercase tracking-widest">Vitoria no Duelo!</p>
        <p className="text-white font-black italic text-sm">
          Venci {post.duelOpponentName}
          {post.duelOpponentGroupName && <span className="text-zinc-400"> ({post.duelOpponentGroupName})</span>}
        </p>
        {post.duelScore && (
          <p className="text-red-400 font-black text-lg">{post.duelScore} ⚔️</p>
        )}
      </div>
      <Sword size={28} className="text-red-500/40 shrink-0" />
    </div>
  );
}

function ActivityProofCard({ post }: { post: FeedPost }) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl border border-zinc-800">
        <CheckCircle2 size={14} className="text-primary" />
        <p className="text-zinc-400 text-xs font-bold">{post.activityTitle ?? 'Atividade Concluida'}</p>
      </div>
      {post.imageUrl && (
        <ImageWithSkeleton src={post.imageUrl} alt="Prova" className="max-h-[360px]" />
      )}
    </div>
  );
}

function NewMemberCard({ post }: { post: FeedPost }) {
  const memberName = post.author?.name ?? post.caption?.replace('O guerreiro ', '').replace(' foi aprovado na Arena!', '') ?? 'Novo Guerreiro';
  const avatarUrl = post.author?.avatar_url ?? (post.author as any)?.avatarUrl;
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 12, stiffness: 120 }}
      className="mt-2 relative overflow-hidden rounded-3xl border-2 border-primary/50 bg-black p-6 flex flex-col items-center text-center gap-4"
      style={{ boxShadow: '0 0 40px rgba(251,191,36,0.08) inset, 0 0 60px rgba(251,191,36,0.04)' }}
    >
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-primary/10 via-transparent to-transparent pointer-events-none" />
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-3xl border-2 border-primary/30 pointer-events-none"
      />
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 pointer-events-none" />
        <div className="w-20 h-20 rounded-full border-4 border-primary overflow-hidden bg-zinc-900 flex items-center justify-center relative z-10"
          style={{ boxShadow: '0 0 30px rgba(251,191,36,0.3)' }}
        >
          <img 
            src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberName)}`} 
            alt={memberName} 
            className="w-full h-full object-cover" 
          />
        </div>
      </motion.div>
      <div>
        <p className="text-primary text-[9px] font-black uppercase tracking-[0.3em] mb-1">⚔️ Novo Guerreiro na Arena</p>
        <h3 className="text-white text-xl font-black italic uppercase tracking-tight leading-none">{memberName}</h3>
        <p className="text-zinc-500 text-xs font-bold mt-1">foi convocado para a batalha!</p>
      </div>
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full">
        <Shield size={12} className="text-primary" />
        <span className="text-primary text-[10px] font-black uppercase tracking-widest">Membro Aprovado</span>
      </div>
    </motion.div>
  );
}

function GroupUpdateCard({ post }: { post: FeedPost }) {
  const hasLogo = !!post.imageUrl;
  const newName = post.caption ?? '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-2 relative overflow-hidden rounded-3xl border-2 border-zinc-700 bg-zinc-950"
    >
      {hasLogo ? (
        <div className="relative flex flex-col items-center justify-center p-8 gap-4">
          <div className="absolute inset-0 bg-radial-[at_50%_50%] from-zinc-700/30 via-transparent to-transparent pointer-events-none" />
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(255,255,255,0.05)', '0 0 50px rgba(255,255,255,0.12)', '0 0 20px rgba(255,255,255,0.05)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-zinc-700 bg-zinc-900 relative z-10"
          >
            <img src={post.imageUrl} alt="Novo Brasão" className="w-full h-full object-contain p-2" />
          </motion.div>
          <div className="text-center relative z-10">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1">🛡️ Identidade Forjada</p>
            <p className="text-white font-black italic text-sm">A tribo tem um novo brasão!</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-4 py-1.5 rounded-full relative z-10">
            <Sparkles size={12} className="text-zinc-400" />
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Logo Atualizada</span>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden p-6 flex flex-col gap-3">
          <div className="absolute -right-4 -top-4 text-white/3 font-black text-[100px] leading-none pointer-events-none select-none">IDT</div>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">🛡️ Identidade Forjada</p>
          <h3
            className="text-white font-black italic uppercase tracking-tight leading-none"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
          >
            {newName}
          </h3>
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-4 py-1.5 rounded-full w-fit">
            <Sparkles size={12} className="text-zinc-400" />
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Nome Atualizado</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StreakMilestoneCard({ post }: { post: FeedPost }) {
  if (!post.achievementKey || !post.achievementLabel) return null;
  const isDevotional = post.achievementKey.includes('devotional');
  const daysMatch = post.achievementKey.match(/\d+/);
  const days = daysMatch ? parseInt(daysMatch[0]) : 0;
  
  const getCategory = (d: number) => {
    if (d >= 365) return { label: '🔱 GUARDIÃO ETERNO', color: 'text-pink-500', bg: 'from-pink-900/40', border: 'border-pink-500/50' };
    if (d >= 100) return { label: '🌟 LENDÁRIO / CENTURIÃO', color: 'text-amber-500', bg: 'from-amber-900/40', border: 'border-amber-500/50' };
    if (d >= 60)  return { label: '💎 PLATINA / INABALÁVEL', color: 'text-blue-400', bg: 'from-blue-900/40', border: 'border-blue-400/50' };
    if (d >= 30)  return { label: '🥇 OURO / GUERREIRO DO MÊS', color: 'text-yellow-400', bg: 'from-yellow-900/40', border: 'border-yellow-400/50' };
    if (d >= 14)  return { label: '🥈 PRATA / QUINZENAL', color: 'text-zinc-300', bg: 'from-zinc-700/40', border: 'border-zinc-500/50' };
    if (d >= 7)   return { label: '🥉 BRONZE / SEMANAL', color: 'text-orange-400', bg: 'from-orange-900/40', border: 'border-orange-500/50' };
    return { label: '⚡ INÍCIO DA JORNADA', color: 'text-primary', bg: 'from-primary/20', border: 'border-primary/40' };
  };

  const cat = getCategory(days);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`mt-2 relative overflow-hidden rounded-3xl border-2 bg-zinc-950 p-6 flex flex-col items-center text-center gap-5 ${cat.border}`}
    >
      <div className={`absolute inset-0 bg-linear-to-b ${cat.bg} to-transparent opacity-30 pointer-events-none`} />
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-6 opacity-10"
      >
        {isDevotional ? <Flame size={80} /> : <Zap size={80} />}
      </motion.div>
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-black shadow-2xl relative z-10 ${cat.border}`}
        >
          <span className={`text-4xl font-black italic leading-none ${cat.color}`}>{days}</span>
          <span className="text-[10px] font-black text-zinc-500 uppercase italic">Dias</span>
        </motion.div>
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse ${cat.color.replace('text-', 'bg-')}`} />
      </div>
      <div className="relative z-10">
        <p className={`${cat.color} text-[10px] font-black uppercase tracking-[0.3em] mb-1`}>{cat.label}</p>
        <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter leading-tight">
          OFENSIVA {isDevotional ? 'DEVOCIONAL' : 'DE PRESENÇA'}
        </h3>
        <p className="text-zinc-500 text-xs font-bold mt-2 max-w-[200px]">
          {post.achievementLabel}
        </p>
      </div>
      <div className={`flex items-center gap-3 px-6 py-2 rounded-full border-2 bg-black/50 ${cat.border}`}>
        {isDevotional ? <Flame size={16} className="text-orange-500" /> : <Zap size={16} className="text-primary" />}
        <span className="text-white text-[11px] font-black uppercase italic tracking-widest">Guerreiro em Chamas</span>
      </div>
    </motion.div>
  );
}

// ── PostCard principal ────────────────────────────────────────────────────────

interface Props {
  key?: React.Key;
  post: FeedPost;
  index: number;
  onDelete?: (id: string) => void;
  onUpdate: (post: FeedPost) => void;
}

export default function PostCard({ post, index, onDelete, onUpdate }: Props) {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const theme = useAppTheme();
  const isAdmin = profile?.role === 'admin';
  const isAuthor = profile?.id === post.authorId;
  const isTribeLeader = profile?.role === 'leader' && profile?.groupId === post.groupId;
  const canDelete = isAdmin || isAuthor || isTribeLeader;
  const lvl = getUserLevel(post.author?.totalPoints || 0, theme.levels);

  const handleDelete = async () => {
    console.log(`[DEBUG] Delete disparado. User=${profile?.id}, Role=${profile?.role}`);
    
    // Admins deletam no primeiro clique para evitar erros de re-render por lentidão do AuthProvider
    if (!isAdmin && !confirmDelete) { 
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      return; 
    }
    
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      await FeedService.deletePost(post.id, post.imagePath);
      
      setIsDeleted(true);
      success("Arena Atualizada", "O post foi removido com sucesso.");
      
      setTimeout(() => {
        onDelete?.(post.id);
      }, 300);
    } catch (err: any) {
      console.error("[PostCard.handleDelete] Erro:", err);
      const msg = err.message || "Acesso negado ou erro de rede.";
      toastError("Erro na Exclusão", msg);
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = async () => {
    await FeedService.pinPost(post.id, !post.isPinned);
    onUpdate({ ...post, isPinned: !post.isPinned });
  };

  const renderContent = () => {
    switch (post.postType) {
      case 'photo':        return <PhotoCard post={post} />;
      case 'text':         return <TextCard post={post} />;
      case 'bible_study':  return <BibleStudyCard post={post} />;
      case 'youtube':      return <YoutubeCard post={post} />;
      case 'spotify_track':
      case 'spotify_playlist': return <SpotifyCard post={post} />;
      case 'achievement':    return <AchievementCard post={post} />;
      case 'duel_victory':   return <DuelVictoryCard post={post} />;
      case 'activity_proof': return <ActivityProofCard post={post} />;
      case 'new_member':     return <NewMemberCard post={post} />;
      case 'group_update':   return <GroupUpdateCard post={post} />;
      case 'streak_milestone': return <StreakMilestoneCard post={post} />;
      default: return null;
    }
  };

  if (isDeleted) {
    return (
      <motion.div 
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.8 }}
        className="bg-red-500/10 border-4 border-red-500/20 rounded-[2.5rem] p-12 text-center"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-red-400 font-black uppercase italic text-sm tracking-widest">Post Removido da Arena</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index % 5 * 0.08, 0.4) }}
      className={`bg-zinc-900 border-4 rounded-4xl overflow-hidden shadow-2xl transition-all
        ${post.isPinned ? 'border-primary/60 shadow-primary/10' : 'border-zinc-800 hover:border-zinc-700'}`}
    >
      {post.isPinned && (
        <div className="px-5 pt-3 flex items-center gap-1.5">
          <Pin size={10} className="text-primary" />
          <span className="text-primary text-[9px] font-black uppercase tracking-widest">Fixado</span>
        </div>
      )}

      <div className="px-5 pt-4 pb-3 flex items-center gap-3 relative z-30">
        <Link to={`/dashboard/profile/${post.authorId}`} className="shrink-0 transition-transform hover:scale-105">
          <div className="relative group">
            {post.author?.role === 'leader' && (
              <motion.div 
                animate={{ 
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]"
              >
                <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full animate-pulse"></div>
                <img 
                  src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif" 
                  alt="Coroa 3D" 
                  className="w-7 h-7 relative z-10 scale-125 object-contain"
                />
              </motion.div>
            )}
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden bg-zinc-800 flex items-center justify-center relative group transition-all duration-500 ${post.author?.role === 'leader' ? 'border-primary shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-zinc-700'}`}>
              <img 
                src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'membro'}`} 
                className="w-full h-full object-cover" 
                alt={post.author?.name} 
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink size={12} className="text-white" />
              </div>
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/dashboard/profile/${post.authorId}`} className="hover:underline decoration-primary">
              <span className="text-white font-black uppercase italic text-sm truncate leading-none">
                {post.author?.name ?? 'Membro'}
              </span>
            </Link>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-black/40 border border-white/10 rounded-full text-[8px] font-black uppercase italic tracking-tighter shrink-0" style={{ color: lvl.color }}>
              <LevelIcon name={lvl.icon} size={10} color={lvl.color} />
              NV. {lvl.level}
            </span>
            {post.author?.role === 'leader' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary text-black rounded-full text-[8px] font-black uppercase italic tracking-tighter shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                <Crown size={10} fill="currentColor" />
                Líder da Tribo
              </span>
            )}
            {post.groupName && (
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                {post.groupName}
              </span>
            )}
          </div>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
            {formatTime(post.created_at)}
          </p>
        </div>

        {(canDelete || isAdmin) && (
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <button
                onClick={handlePin}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all
                  ${post.isPinned ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-600 hover:text-primary'}`}
                title={post.isPinned ? 'Desafixar' : 'Fixar'}
              >
                <Pin size={12} />
              </button>
            )}
            {canDelete && (
              <button
                style={{ zIndex: 50, position: 'relative' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-lg
                  ${confirmDelete ? 'bg-red-600 text-white border-2 border-white' : 'bg-zinc-800 text-zinc-600 hover:text-red-400'}
                  ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={confirmDelete ? 'CONFIRMAR AGORA' : 'Excluir'}
              >
                {isDeleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
              </button>
            )}
          </div>
        )}
      </div>

      {post.caption && post.postType !== 'text' && post.postType !== 'activity_proof' && post.postType !== 'new_member' && post.postType !== 'group_update' && (
        <div className="px-5 pb-2">
          <p className="text-zinc-200 text-sm leading-relaxed">{post.caption}</p>
        </div>
      )}

      <div className="px-5 pb-4">
        {renderContent()}
      </div>

      <PostReactionBar
        post={post}
        onCommentToggle={() => setShowComments(s => !s)}
        showComments={showComments}
        onReactionUpdate={onUpdate}
      />

      <AnimatePresence>
        {showComments && (
          <PostCommentSection
            key={`comments-${post.id}`}
            postId={post.id}
            onCountChange={count => onUpdate({ ...post, commentCount: count })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
