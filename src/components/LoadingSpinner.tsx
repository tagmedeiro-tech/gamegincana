import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Carregando...", 
  size = 'md', 
  color = '#FBBF24', // primary amber
  fullScreen = false 
}: LoadingSpinnerProps) {
  
  const sizeMap = {
    sm: { container: 'w-5 h-5', icon: 14, border: 'border-2' },
    md: { container: 'w-20 h-20', icon: 24, border: 'border-4' },
    lg: { container: 'w-32 h-32', icon: 40, border: 'border-[6px]' },
    xl: { container: 'w-48 h-48', icon: 64, border: 'border-[8px]' }
  };

  const isSmall = size === 'sm';
  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center ${isSmall ? 'gap-0' : 'gap-8'}`}>
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Outer Pulsing Ring */}
        {!isSmall && (
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: color }}
          />
        )}

        {/* Rotating Progress Ring */}
        <div 
          className={`absolute inset-0 rounded-full ${currentSize.border} border-zinc-800 shadow-inner`}
        />
        
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full ${currentSize.border} border-t-transparent`}
          style={{ borderColor: `${color} transparent transparent transparent` }}
        />

        {/* Center Icon with Pulse */}
        <motion.div
          animate={isSmall ? {} : { 
            scale: [0.9, 1.1, 0.9],
            filter: [`drop-shadow(0 0 0px ${color}00)`, `drop-shadow(0 0 15px ${color}66)`, `drop-shadow(0 0 0px ${color}00)`]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 text-white"
        >
          <Shield size={currentSize.icon} className="text-zinc-400 opacity-50" />
          <Zap 
            size={currentSize.icon * 0.6} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
            style={{ color: color }}
            fill="currentColor"
          />
        </motion.div>
      </div>

      {!isSmall && message && (
        <div className="flex flex-col items-center">
          <motion.p 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-zinc-500 font-black uppercase italic tracking-[0.3em] text-[10px] md:text-xs"
          >
            {message}
          </motion.p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  if (isSmall) {
    return (
      <div className="inline-flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-20 flex items-center justify-center">
      {content}
    </div>
  );
}
