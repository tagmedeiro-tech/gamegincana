import React from 'react';
import Skeleton from '../Skeleton';

/**
 * High-fidelity Skeleton for the Dashboard.
 * Mirrors the grid structure and spacing of the real dashboard to prevent layout shift.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SKELETON */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 pb-8 border-b border-zinc-800/50 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-8 flex-1 order-2 xl:order-1">
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <Skeleton variant="circle" width={112} height={112} className="sm:w-32 sm:h-32 border-4 border-zinc-900 shadow-2xl" />
          </div>
          
          {/* Info Block */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Skeleton variant="text" width="40%" height={16} />
              <div className="flex gap-2">
                 <Skeleton variant="circle" width={16} height={16} />
                 <Skeleton variant="text" width="60%" height={12} />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
               <div className="flex justify-between">
                 <Skeleton variant="text" width="30%" height={8} />
                 <Skeleton variant="text" width="10%" height={8} />
               </div>
               <Skeleton variant="rectangle" height={8} className="rounded-full" />
            </div>
          </div>

          {/* Integrated Score & Sparkline */}
          <div className="hidden sm:flex pl-8 border-l-2 border-zinc-800/50 flex-col items-end shrink-0 gap-2">
             <Skeleton variant="text" width={40} height={8} />
             <div className="flex items-baseline gap-1">
                <Skeleton variant="text" width={60} height={32} />
                <Skeleton variant="text" width={20} height={12} />
             </div>
             <Skeleton variant="rectangle" width={80} height={24} className="mt-2 rounded-lg" />
          </div>
        </div>

        {/* Logo Block (Right) */}
        <div className="flex items-center gap-4 sm:gap-6 text-right w-full xl:w-auto justify-end order-1 xl:order-2">
          <div className="space-y-2 text-right">
             <Skeleton variant="text" width={180} height={48} className="ml-auto" />
             <Skeleton variant="text" width={120} height={12} className="ml-auto" />
          </div>
          <Skeleton variant="circle" width={64} height={64} className="sm:w-20 sm:h-20" />
        </div>
      </header>

      {/* STREAK WIDGET SKELETON */}
      <Skeleton variant="rectangle" height={100} className="rounded-3xl" />

      {/* MAIN BENTO GRID SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: MISSIONS (8 cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
           {/* Banner Duel */}
           <Skeleton variant="rectangle" height={160} className="rounded-[2.5rem]" />
           
           {/* Missions Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} variant="rectangle" height={140} className="rounded-4xl" />
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN: RANKING & ACTIVITY (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
           {/* Ranking Card */}
           <Skeleton variant="rectangle" height={400} className="rounded-[2.5rem]" />
           
           {/* Recent Activity */}
           <Skeleton variant="rectangle" height={300} className="rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
