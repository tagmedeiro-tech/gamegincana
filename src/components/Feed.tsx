import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Plus, ChevronDown, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { FeedPost, FeedFilter } from '../types';
import { FeedService } from '../lib/FeedService';
import PostCard from './feed/PostCard';
import PostComposer from './feed/PostComposer';
import Skeleton from './Skeleton';
import { OfflineService } from '../lib/OfflineService';

const PAGE_SIZE = 10;

// ─── Filtros ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { id: 'type:photo',        label: '📷 Fotos' },
  { id: 'type:youtube',      label: '▶️ Videos' },
  { id: 'type:bible_study',  label: '📖 Estudos' },
  { id: 'type:achievement',  label: '🏆 Conquistas' },
];

interface Group { id: string; name: string; }

// ─── Feed principal ───────────────────────────────────────────────────────────

export default function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [groups, setGroups] = useState<Group[]>([]);
  const [showComposer, setShowComposer] = useState(false);

  // Busca grupos dinamicamente
  useEffect(() => {
    supabase.from('groups').select('id, name').then(({ data }) => {
      if (data) setGroups(data);
    });
  }, []);

  const load = useCallback(async (pageNum: number, activeFilter: FeedFilter) => {
    const filterArg = activeFilter === 'my_group' && profile?.groupId
      ? profile.groupId
      : activeFilter;
    const data = await FeedService.getPosts(pageNum, filterArg, PAGE_SIZE, profile?.id);
    setHasMore(data.length === PAGE_SIZE);
    return data;
  }, [profile?.groupId]);

  useEffect(() => {
    let mounted = true;
    
    // ⚡ CACHE APK: Restaura do cache local imediatamente
    const cached = OfflineService.get<FeedPost[]>('feed_posts');
    if (cached) {
      setPosts(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setPage(0);
    
    load(0, filter)
      .then(data => {
        if (!mounted) return;
        setPosts(data);
        // Salva apenas a primeira página no cache de carregamento rápido
        if (filter === 'all') {
          OfflineService.save('feed_posts', data);
        }
      })
      .catch(err => {
        console.error("Erro no Mural:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
      
    return () => { mounted = false; };
  }, [filter, load]);

  // Realtime: novo post aparece no topo
  useEffect(() => {
    const channel = supabase
      .channel(`feed_posts_rt_${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, async () => {
        const fresh = await FeedService.getPosts(0, 'all', 1, profile?.id);
        if (fresh.length > 0) {
          setPosts(prev => {
            if (prev.some(p => p.id === fresh[0].id)) return prev;
            return [fresh[0], ...prev];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    const data = await load(next, filter);
    setPosts(prev => [...prev, ...data]);
    setPage(next);
    setLoadingMore(false);
  };

  const handleUpdate = (updated: FeedPost) =>
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));

  const handleDelete = (id: string) =>
    setPosts(prev => prev.filter(p => p.id !== id));

  const handlePublished = (post: FeedPost) =>
    setPosts(prev => [post, ...prev]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-4">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
            <span>Mural </span>
            <span className="text-primary block text-6xl md:text-8xl -mt-2">da Tribo</span>
          </h2>
          <p className="text-zinc-500 font-bold italic flex items-center gap-2 text-sm mt-2">
            <Flame size={16} className="text-primary animate-pulse" />
            <span>O que esta rolando na arena</span>
          </p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 bg-primary text-black px-5 py-3 rounded-2xl
                     font-black uppercase italic text-sm active:scale-95 transition-all
                     hover:bg-white shadow-lg shadow-primary/20"
        >
          <Plus size={16} /> Postar
        </button>
      </header>

      {/* Barra de filtros com Fading Edges (Global Utility) */}
      <div className="scroll-faded-container group/filters">
        <div className="flex gap-2 overflow-x-auto modern-scrollbar pb-4 -mb-2 px-1 scroll-smooth">
          <FilterBtn id="all" label="Todos" active={filter} onSelect={setFilter} />
          <FilterBtn id="my_group" label="Minha Tribo" active={filter} onSelect={setFilter} />
          {groups.length === 0 ? (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          ) : groups.map(g => (
            <FilterBtn key={g.id} id={g.id} label={g.name} active={filter} onSelect={setFilter} />
          ))}
          <div className="w-px bg-zinc-800 shrink-0 mx-1" />
          {TYPE_FILTERS.map(f => (
            <FilterBtn key={f.id} id={f.id} label={f.label} active={filter} onSelect={setFilter} />
          ))}
          {/* Espaçador final para garantir que o último item não cole na borda */}
          <div className="w-10 shrink-0" />
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {loading && posts.length === 0 ? (
          // SKELETON POSTS
          [0, 1, 2].map(i => (
            <div key={`skeleton-${i}`} className="bg-zinc-900 border-4 border-zinc-800 rounded-4xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="h-48 w-full bg-zinc-800 rounded-2xl" />
              <div className="h-4 w-3/4 bg-zinc-800 rounded-full" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-zinc-700">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-black uppercase italic">Nenhum post ainda</p>
            <p className="text-sm mt-1">Seja o primeiro a postar!</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-3 bg-zinc-900 border-4 border-zinc-800
                         hover:border-primary text-zinc-500 hover:text-primary
                         px-10 py-4 rounded-3xl font-black uppercase italic
                         active:scale-95 transition-all disabled:opacity-50"
            >
              <ChevronDown size={18} className={loadingMore ? 'animate-spin' : ''} />
              {loadingMore ? 'Carregando...' : 'Ver mais'}
            </button>
          </div>
        )}
      </div>

      {/* Composer modal */}
      <AnimatePresence>
        {showComposer && (
          <PostComposer
            onPublished={handlePublished}
            onClose={() => setShowComposer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FilterBtn ────────────────────────────────────────────────────────────────

function FilterBtn({ id, label, active, onSelect }: {
  id: string; label: string;
  active: FeedFilter; onSelect: (f: FeedFilter) => void;
  key?: React.Key;
}) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest
                 whitespace-nowrap transition-all active:scale-95 border-2 shrink-0
                 ${isActive
                   ? 'bg-primary text-black border-primary'
                   : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}
    >
      {label}
    </button>
  );
}
