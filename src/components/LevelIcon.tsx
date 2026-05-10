import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Award, Crown, Star, Zap, Shield, Gem, Flame, Target, Flag, Sword, Hexagon, Skull, Ghost } from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  Trophy, Medal, Award, Crown, Star, Zap, Shield, Gem, Flame, Target, Flag, Sword, Skull, Ghost
};

interface Props {
  name?: string;
  size?: number;
  className?: string;
  color?: string;
}

export default function LevelIcon({ name, size = 16, className = "", color = "#FBBF24" }: Props) {
  const IconComp = name ? ICON_MAP[name] : Trophy;
  
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size * 1.5, height: size * 1.5 }}>
      {/* Background Glow Layer */}
      <div 
        className="absolute inset-0 blur-xl opacity-20 rounded-full"
        style={{ backgroundColor: color }}
      />

      {/* Decorative Base Shape */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <Hexagon size={size * 1.5} style={{ color }} strokeWidth={1} />
      </div>

      {/* Main Icon with Premium Effects */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10"
        style={{ 
          filter: `drop-shadow(0 0 ${size/4}px ${color}88)`,
          color: color
        }}
      >
        <IconComp 
          size={size} 
          strokeWidth={2.5}
          className="drop-shadow-2xl"
        />
        
        {/* Subtle Shine Reflection */}
        <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent mix-blend-overlay rounded-full pointer-events-none" />
      </motion.div>

      {/* Mini Accent Star for High Levels (Visual Polish) */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-1 -right-1 z-20"
      >
        <Star size={size/3} fill={color} style={{ color }} />
      </motion.div>
    </div>
  );
}

