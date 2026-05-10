import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Eagerly loaded (needed for landing/login)
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import NotificationToast from './components/NotificationToast';
import AchievementCelebration from './components/AchievementCelebration';
import { AudioProvider } from './context/AudioContext';

// Lazy loaded components (heavy apps)
const Sidebar = lazy(() => import('./components/Sidebar'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Activities = lazy(() => import('./components/Activities'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminPointsEditor = lazy(() => import('./components/AdminPointsEditor'));
const MyGroup = lazy(() => import('./components/MyGroup'));
const AdminLinks = lazy(() => import('./components/AdminLinks'));
const Ranking = lazy(() => import('./components/Ranking'));
const Chat = lazy(() => import('./components/Chat'));
const LeaderPanel = lazy(() => import('./components/LeaderPanel'));
const Feed = lazy(() => import('./components/Feed'));
const Store = lazy(() => import('./components/Store'));
const BibleViewer = lazy(() => import('./components/BibleViewer'));
const VoxelArena = lazy(() => import('./components/VoxelArena'));
const ReadingPlans = lazy(() => import('./components/ReadingPlans'));
const Duel = lazy(() => import('./components/Duel'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const WaitingRoom = lazy(() => import('./components/WaitingRoom'));
const ValidationHub = lazy(() => import('./components/ValidationHub'));
const DownloadApp = lazy(() => import('./components/DownloadApp'));

import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAppTheme } from './hooks/useAppTheme';
import { useAuth } from './context/useAuth';
import { AutomationService } from './lib/AutomationService';
import { useEffect, useState } from 'react';
import { useToast } from './context/ToastContext';
import { Loader2 } from 'lucide-react';

const Calendar = lazy(() => import('./components/Calendar'));

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  // Auth ainda inicializando (apenas na primeira carga — depois de loginado, loading fica false)
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Usuário logado mas perfil ainda não chegou — aguarda sem redirecionar
  if (allowedRoles && !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function MainLayout() {
  const { user, profile, refreshProfile } = useAuth();
  const theme = useAppTheme();
  const { success, error: toastError } = useToast();
  const [promoting, setPromoting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user?.id) {
      AutomationService.handleDailyLogin(user.id);
    }
  }, [user?.id]);

  const promoteToAdmin = async () => {
    if (!user) return;
    setPromoting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);
      
      if (error) throw error;
      await refreshProfile();
      success("Acesso Concedido", "Você foi promovido a Administrador!");
    } catch {
      toastError("Erro", "Não foi possível promover a Administrador.");
    } finally {
      setPromoting(false);
    }
  };

  const isGincanaStarted = theme.gincanaStatus === 'active' || (theme.gincanaStartDate && new Date(theme.gincanaStartDate) <= new Date());
  const isPending = profile?.status === 'pending';

  // Bloqueio Global: Se não for Admin e (Gincana não começou OU Usuário está pendente)
  if (profile?.role !== 'admin') {
    if ((theme.gincanaStatus === 'waiting' && !isGincanaStarted) || isPending) {
      return (
        <WaitingRoom 
          startDate={theme.gincanaStartDate || new Date().toISOString()} 
          status={isPending ? 'pending' : 'waiting'} 
        />
      );
    }
  }

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black flex selection:bg-white selection:text-black">
      <Sidebar />
      
      <main 
        id="main-content"
        className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 overflow-y-auto h-screen custom-scrollbar relative scroll-smooth"
      >
        {/* Dev Tools / Admin Access */}
        {profile && profile.role !== 'admin' && (
           <div className="absolute top-2 right-2 z-50">
              <button 
                disabled={promoting}
                onClick={promoteToAdmin}
                className="flex items-center gap-2 text-zinc-900 hover:text-primary text-[8px] uppercase font-black transition-colors bg-black/50 p-2 rounded active:scale-95 disabled:opacity-50"
              >
                {promoting ? <Loader2 size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
                {promoting ? "PROMOVENDO..." : "DEV: VIRAR ADMIN PARA TESTAR"}
              </button>
           </div>
        )}

        <AnimatePresence>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <BrowserRouter>
        <NotificationToast />
        <AchievementCelebration />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <LandingPage />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Register />
          </Suspense>
        } />
        <Route path="/download" element={
          <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <DownloadApp />
          </Suspense>
        } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="activities" element={<Activities />} />
            <Route path="feed" element={<Feed />} />
            <Route path="store" element={<Store />} />
            <Route path="bible" element={<BibleViewer />} />
            <Route path="reading-plans" element={<ReadingPlans />} />
            <Route path="duel" element={<Duel />} />
            <Route path="profile/:id" element={<UserProfile />} />
            <Route path="group" element={<MyGroup />} />
            <Route path="chat" element={<Chat />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="arena-voxel" element={<VoxelArena />} />
            <Route path="metaverso" element={<VoxelArena />} />
            <Route path="leader" element={
              <ProtectedRoute allowedRoles={['leader', 'admin']}>
                <LeaderPanel />
              </ProtectedRoute>
            } />
            <Route path="validations" element={
              <ProtectedRoute allowedRoles={['leader', 'admin']}>
                <ValidationHub />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/:tab" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="links-convite" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLinks />
              </ProtectedRoute>
            } />
            <Route path="admin/points" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPointsEditor />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </BrowserRouter>
  </AudioProvider>
  );
}
