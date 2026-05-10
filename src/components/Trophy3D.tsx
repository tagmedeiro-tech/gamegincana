import React from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';

interface Trophy3DProps {
  icon: string;
  rarity: 'legendary' | 'epic' | 'rare' | 'common';
  size?: number;
  isFloating?: boolean;
}

export default function Trophy3D({ icon, rarity, size = 64, isFloating = true }: Trophy3DProps) {
  const Icon = (LucideIcons as any)[icon] || LucideIcons.Award;

  // Paleta de Metais Preciosos (Início Claro -> Fim Escuro)
  const metals = {
    legendary: {
      start: '#FDE68A', // Ouro claro reflexivo
      end: '#B45309',   // Ouro envelhecido escuro
      glow: 'rgba(245, 158, 11, 0.6)',
      crystal: 'rgba(245, 158, 11, 0.15)'
    },
    epic: {
      start: '#E9D5FF', // Ametista clara
      end: '#7E22CE',   // Ametista profunda
      glow: 'rgba(168, 85, 247, 0.6)',
      crystal: 'rgba(168, 85, 247, 0.15)'
    },
    rare: {
      start: '#BAE6FD', // Safira clara
      end: '#0369A1',   // Safira profunda
      glow: 'rgba(59, 130, 246, 0.6)',
      crystal: 'rgba(59, 130, 246, 0.15)'
    },
    common: {
      start: '#F8FAFC', // Prata/Platina clara
      end: '#475569',   // Prata escurecida
      glow: 'rgba(148, 163, 184, 0.5)',
      crystal: 'rgba(148, 163, 184, 0.1)'
    }
  };

  const current = metals[rarity] || metals.common;
  const gradientId = `grad-${rarity}-${icon}`;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ perspective: '1000px' }}>
      
      {/* Definição Global do Gradiente Metálico para o SVG */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={current.start} />
            <stop offset="45%" stopColor={current.start} />
            <stop offset="55%" stopColor={current.end} />
            <stop offset="100%" stopColor={current.end} />
          </linearGradient>
        </defs>
      </svg>

      {/* Esfera de Cristal e Ícone */}
      <motion.div
        animate={isFloating ? {
          y: [-4, 4, -4],
          rotateX: [5, -5, 5],
          rotateY: [-10, 10, -10]
        } : {}}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative flex items-center justify-center group/orb"
      >
        {/* O Vidro da Esfera (Glassmorphism 3D) */}
        <div 
          className="relative rounded-full flex items-center justify-center overflow-hidden transition-all duration-500"
          style={{ 
            width: size * 1.5, 
            height: size * 1.5,
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, ${current.crystal} 40%, rgba(0,0,0,0.8) 100%)`,
            boxShadow: `
              inset 0 0 20px ${current.glow}, 
              inset 3px 3px 8px rgba(255,255,255,0.4), 
              inset -5px -5px 15px rgba(0,0,0,0.8),
              0 15px 35px rgba(0,0,0,0.6)
            `
          }}
        >
          {/* Reflexo Especular Curvo (O Brilho do Vidro no topo) */}
          <div className="absolute top-[4%] left-[10%] w-[50%] h-[30%] bg-linear-to-b from-white/60 to-transparent rounded-[100%] rotate-[-30deg] blur-[1px] pointer-events-none mix-blend-overlay" />
          
          {/* Reflexo inferior secundário */}
          <div className="absolute bottom-[2%] right-[5%] w-[40%] h-[15%] bg-white/20 rounded-[100%] rotate-[-20deg] blur-[3px] pointer-events-none" />

          {/* O Ícone Metálico (Holograma 3D) */}
          <div className="relative z-20 flex items-center justify-center transform group-hover/orb:scale-110 transition-transform duration-500">
            {/* Sombra Interna do ícone (profundidade) */}
            <Icon 
              size={size * 0.8} 
              className="absolute top-[3px] left-[3px] opacity-60 blur-[3px]"
              style={{ color: '#000' }}
            />
            {/* O Ícone com o Gradiente Injetado */}
            <Icon 
              size={size * 0.8} 
              strokeWidth={rarity === 'legendary' ? 2.5 : 2}
              style={{ 
                stroke: `url(#${gradientId})`, // Mágica: Aplica o metal no SVG
                filter: `drop-shadow(0 0 12px ${current.glow})` // Aura radiante
              }} 
            />
          </div>
        </div>

        {/* Anéis Orbitais (Tecnologia/Magia) */}
        <motion.div 
          animate={{ rotateZ: 360, rotateX: 60 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full border border-white/20 opacity-0 group-hover/orb:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ width: size * 2, height: size * 2, boxShadow: `0 0 15px ${current.glow}` }}
        />
      </motion.div>
    </div>
  );
}



