import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Heart, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { FeedService } from '../lib/FeedService';
import { FeedPost } from '../types';
import { useAuth } from '../context/useAuth';
import PostComposer from './feed/PostComposer';
import LoadingSpinner from './LoadingSpinner';

export default function PhotoMural() {
  const { profile } = useAuth();
  const [photos, setPhotos] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fetchTopPhotos = useCallback(async () => {
    try {
      // Busca as últimas 50 fotos para ranquear as mais curtidas no front
      const allPhotos = await FeedService.getPosts(0, 'type:photo', 50, profile?.id);
      
      // Ordena por total de reações
      const ranked = [...allPhotos].sort((a, b) => {
        const aCount = Object.values(a.reactionSummary || {}).reduce((acc: number, v) => acc + (v as number), 0);
        const bCount = Object.values(b.reactionSummary || {}).reduce((acc: number, v) => acc + (v as number), 0);
        return bCount - aCount;
      }).slice(0, 15); // Pega o top 15

      setPhotos(ranked);
    } catch (err) {
      console.error('Erro ao buscar fotos do mural:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchTopPhotos();
  }, [fetchTopPhotos]);

  // Rotação Automática
  useEffect(() => {
    if (photos.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000); // 6 segundos por foto

    return () => clearInterval(interval);
  }, [photos.length, isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentPhoto = photos[currentIndex];

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-zinc-900 border-4 border-zinc-800 rounded-4xl flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full h-[400px] bg-zinc-900 border-4 border-zinc-800 rounded-4xl flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-4xl">
          📸
        </div>
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">O Mural está vazio!</h3>
          <p className="text-zinc-500 font-bold italic">Seja o primeiro a imortalizar um momento da tribo.</p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="bg-primary text-black px-8 py-3 rounded-2xl font-black uppercase italic active:scale-95 transition-all flex items-center gap-2"
        >
          <Camera size={20} /> Adicionar Foto
        </button>
        {showComposer && (
          <PostComposer 
            onPublished={() => { setShowComposer(false); fetchTopPhotos(); }} 
            onClose={() => setShowComposer(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[450px] md:h-[600px] bg-black border-4 border-zinc-800 rounded-4xl overflow-hidden group shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Imagem de Fundo (Blur/Glow) */}
          <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
            style={{ backgroundImage: `url(${currentPhoto.imageUrl})` }}
          />
          
          {/* Imagem Principal */}
          <img 
            src={currentPhoto.imageUrl} 
            alt={currentPhoto.caption}
            className="w-full h-full object-contain relative z-10"
          />

          {/* Overlay de Gradiente */}
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-20" />
          
          {/* Info do Autor & Legenda */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-30 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={currentPhoto.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentPhoto.author?.name}`} 
                  alt={currentPhoto.author?.name}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 border-primary object-cover shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-primary text-black p-1 rounded-lg">
                  <Sparkles size={12} className="fill-current" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-primary font-black uppercase italic tracking-tighter text-sm md:text-base">
                  {currentPhoto.author?.name}
                </p>
                <h4 className="text-white text-lg md:text-2xl font-black italic tracking-tighter line-clamp-2 uppercase">
                  {currentPhoto.caption || "Sem legenda"}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-zinc-900/80 backdrop-blur-md border-2 border-zinc-800 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" size={18} />
                <span className="text-white font-black italic">
                  {Object.values(currentPhoto.reactionSummary || {}).reduce((acc: number, v) => acc + (v as number), 0)}
                </span>
              </div>
              
              <button
                onClick={() => setShowComposer(true)}
                className="bg-primary text-black p-3 rounded-2xl font-black uppercase italic active:scale-95 transition-all shadow-lg shadow-primary/20"
                title="Adicionar sua foto"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles de Navegação */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handlePrev}
          className="p-3 bg-black/50 backdrop-blur-xl border-2 border-white/10 rounded-2xl text-white hover:bg-primary hover:text-black transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={handleNext}
          className="p-3 bg-black/50 backdrop-blur-xl border-2 border-white/10 rounded-2xl text-white hover:bg-primary hover:text-black transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Indicadores (Dots) */}
      <div className="absolute top-6 right-8 z-40 flex gap-1.5">
        {photos.map((_, i) => (
          <div 
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-primary' : 'w-1.5 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Badge de "Mural da Glória" */}
      <div className="absolute top-6 left-8 z-40">
        <div className="bg-primary text-black px-4 py-1.5 rounded-xl font-black uppercase italic text-[10px] tracking-widest flex items-center gap-2 shadow-xl">
          <Camera size={12} />
          Mural da Glória
        </div>
      </div>

      {/* Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <PostComposer 
            onPublished={() => { setShowComposer(false); fetchTopPhotos(); }} 
            onClose={() => setShowComposer(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
