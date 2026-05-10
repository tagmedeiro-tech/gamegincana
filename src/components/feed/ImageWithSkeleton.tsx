import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export default function ImageWithSkeleton({ src, alt, className = "", aspectRatio = "aspect-video" }: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} bg-zinc-800 rounded-2xl border-2 border-zinc-800`}>
      {/* Skeleton / Shimmer */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <div className="w-full h-full bg-linear-to-r from-transparent via-white/5 to-transparent bg-size-[200%_100%] animate-shimmer" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Imagem Real */}
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          filter: isLoaded ? 'blur(0px)' : 'blur(10px)'
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${className} w-full h-full object-cover`}
      />
    </div>
  );
}
