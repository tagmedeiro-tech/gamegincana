import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Share2 } from 'lucide-react';
import { ReactionEmoji, FeedPost } from '../../types';
import { FeedService } from '../../lib/FeedService';
import { useAuth } from '../../context/useAuth';
import { useAudio } from '../../context/AudioContext';

import confetti from 'canvas-confetti';

const EMOJIS: ReactionEmoji[] = ['❤️', '🔥', '🙌', '😂', '😮'];

interface Props {
  post: FeedPost;
  onCommentToggle: () => void;
  showComments: boolean;
  onReactionUpdate: (post: FeedPost) => void;
}

export default function PostReactionBar({ post, onCommentToggle, showComments, onReactionUpdate }: Props) {
  const { profile } = useAuth();
  const { playClick, playFire, playShimmer, playSuccess } = useAudio();
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const summary = post.reactionSummary ?? {} as Record<ReactionEmoji, number>;
  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

  const fireConfetti = (emoji: ReactionEmoji) => {
    const scalar = 2;
    const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' });

    // Haptic Feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    switch (emoji) {
      case '🔥':
        playFire();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#ff4500', '#ff8c00', '#ffd700'],
          shapes: [triangle],
          scalar
        });
        break;
      case '🙌':
        playShimmer();
        confetti({
          particleCount: 80,
          spread: 120,
          origin: { y: 0.7 },
          colors: ['#FBBF24', '#FFFFFF'],
          gravity: 0.5,
          scalar
        });
        break;
      case '❤️':
        playSuccess();
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#ff0000', '#ff69b4'],
          scalar
        });
        break;
      default:
        playClick();
        confetti({
          particleCount: 30,
          spread: 70,
          origin: { y: 0.8 },
          scalar
        });
    }
  };

  const handleReact = async (emoji: ReactionEmoji) => {
    if (!profile || loading) return;
    
    // Se estiver adicionando uma nova reação (não removendo), dispara o efeito
    if (post.myReaction !== emoji) {
      fireConfetti(emoji);
    }

    setLoading(true);
    setShowPicker(false);
    try {
      await FeedService.toggleReaction(post.id, profile.id, emoji);
      const reactions = await FeedService.getReactions(post.id);
      const newSummary = reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
        return acc;
      }, {} as Record<ReactionEmoji, number>);
      const myReaction = reactions.find(r => r.userId === profile.id)?.emoji ?? null;
      onReactionUpdate({ ...post, reactions, reactionSummary: newSummary, myReaction });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-2.5 flex items-center gap-3 border-t-2 border-zinc-800/40 relative">
      {/* Lado Esquerdo: Botao Reagir */}
      <div className="relative shrink-0">
        <button
          onClick={() => {
            playClick();
            setShowPicker(p => !p);
          }}
          className={`flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all
            ${post.myReaction ? 'text-primary' : 'text-zinc-500 hover:text-white'}`}
        >
          <span className="text-base">{post.myReaction ?? '❤️'}</span>
          <span className="hidden xs:inline">{post.myReaction ? 'Reagido' : 'Reagir'}</span>
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className="absolute bottom-full mb-3 left-0 bg-zinc-800 border-2 border-zinc-700
                         rounded-2xl p-2.5 flex gap-1.5 shadow-2xl z-30"
            >
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`text-lg w-8 h-8 flex items-center justify-center rounded-xl
                             hover:bg-zinc-700 active:scale-90 transition-all
                             ${post.myReaction === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meio: Contador e Avatares (Flex-1 para ocupar espaco disponivel) */}
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        {totalReactions > 0 && (
          <>
            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/5 shrink-0">
              <span className="text-[10px] font-black text-white">{totalReactions}</span>
              <div className="flex items-center">
                {EMOJIS.filter(e => (summary[e] ?? 0) > 0).slice(0, 2).map(e => (
                  <span key={e} className="text-[10px]">{e}</span>
                ))}
              </div>
            </div>
            
            <div className="flex -space-x-1.5 overflow-hidden">
              {(post.reactions || []).slice(0, 2).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-4 h-4 rounded-full border border-zinc-900 overflow-hidden bg-zinc-800 shrink-0"
                  title={r.author?.name}
                >
                  <img 
                    src={r.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.author?.name || 'membro'}`} 
                    alt={r.author?.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lado Direito: Comentar */}
      <button
        onClick={() => {
          playClick();
          onCommentToggle();
        }}
        className={`flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest shrink-0
                   active:scale-95 transition-colors
                   ${showComments ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
      >
        <MessageCircle size={14} />
        <span>
          {(post.commentCount ?? 0) > 0 ? post.commentCount : ''}
          <span className="hidden xs:inline ml-1">Comentar</span>
        </span>
      </button>
    </div>
  );
}
