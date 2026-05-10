import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle' | 'brutalist';
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton component for high-fidelity structural loading.
 * Uses Brutalist Dynamic design patterns from the project skill.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangle', width, height, ...props }) => {
  const baseClass = "animate-pulse bg-zinc-800/50";
  
  const getVariantClass = () => {
    switch (variant) {
      case 'circle': return 'rounded-full';
      case 'text': return 'rounded h-3 w-full';
      case 'brutalist': return 'rounded-none border-2 border-zinc-700/50';
      default: return 'rounded-3xl';
    }
  };

  return (
    <div 
      {...props}
      className={`${baseClass} ${getVariantClass()} ${className}`}
      style={{ 
        width: width ?? '100%', 
        height: height ?? (variant === 'text' ? undefined : '100%'),
      }}
    />
  );
};

export default Skeleton;
