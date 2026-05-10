import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Crown } from 'lucide-react';
import { PostComment } from '../../types';
import { FeedService } from '../../lib/FeedService';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { DEFAULT_MURAL_POINTS } from '../../types';

interface Props {
  key?: React.Key;
  postId: string;
  onCountChange: (count: number) => void;
}

export default function PostCommentSection({ postId, onCountChange }: Props) {
  const { profile } = useAuth();
  const { muralPoints } = useAppTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cfg = muralPoints ?? DEFAULT_MURAL_POINTS;

  useEffect(() => {
    FeedService.getComments(postId).then(data => {
      setComments(data);
      setLoading(false);
    });
  }, [postId]);

  const handleSubmit = async () => {
    if (!profile || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const comment = await FeedService.addComment(postId, profile.id, text.trim());
      if (comment) {
        setComments(prev => [...prev, comment]);
        onCountChange(comments.length + 1);
        setText('');
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        // XP por comentario
        await FeedService.grantCommentXP(profile.id, profile.groupId, cfg);
        toastSuccess('Comentado!', `+${cfg.commentPoints} XP`);
      }
    } catch {
      toastError('Erro', 'Nao foi possivel comentar.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    return `${d}d`;
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden bg-black/20"
    >
      <div className="p-5 space-y-4">
        {/* Lista de comentarios */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-hide">
            {comments.length === 0 && (
              <p className="text-center text-zinc-700 font-bold italic text-[10px] uppercase py-2">
                Seja o primeiro a comentar!
              </p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 items-start">
                <div className="relative shrink-0">
                  {c.author?.role === 'leader' && (
                    <motion.div 
                      animate={{ 
                        y: [0, -2, 0],
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                    >
                      <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full animate-pulse"></div>
                      <img 
                        src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif" 
                        alt="Coroa 3D" 
                        className="w-4 h-4 relative z-10 scale-125 object-contain"
                      />
                    </motion.div>
                  )}
                  <div className={`w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0 border-2 transition-all ${c.author?.role === 'leader' ? 'border-primary shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'border-zinc-700'}`}>
                    <img 
                      src={c.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author?.name || 'membro'}`} 
                      className="w-full h-full object-cover" 
                      alt={c.author?.name} 
                    />
                  </div>
                </div>
                <div className="bg-zinc-800/60 px-4 py-2.5 rounded-2xl rounded-tl-none flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`font-black text-[10px] uppercase italic truncate flex items-center gap-1 ${c.author?.role === 'leader' ? 'text-primary' : 'text-white'}`}>
                      {c.author?.role === 'leader' && <Crown size={10} fill="currentColor" className="shrink-0" />}
                      {c.author?.name ?? 'Membro'}
                    </p>
                    <span className="text-zinc-600 text-[9px] shrink-0">{formatTime(c.created_at)}</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input de novo comentario */}
        <div className="flex gap-3 pt-1">
          <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
            <img 
              src={profile?.avatar_url || profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'voce'}`} 
              className="w-full h-full object-cover" 
              alt="Voce" 
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Escreva algo..."
              maxLength={1000}
              className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-primary
                         rounded-2xl px-4 py-2.5 text-xs text-white outline-none transition-all pr-10
                         placeholder:text-zinc-600"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500
                         hover:text-primary active:scale-95 transition-all disabled:opacity-20"
            >
              {submitting
                ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
