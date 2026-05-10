import React, { useState, useEffect, useCallback } from 'react';
import { FeedPost } from '../../types';
import { FeedService } from '../../lib/FeedService';
import { Trash2, Pin, Eye, AlertTriangle, MessageSquare, Search, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/useAuth';

interface Props {
  groupId?: string | null;
  isAdmin: boolean;
}

export default function PostModerationPanel({ groupId, isAdmin }: Props) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { success, error: toastError } = useToast();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Usar a mesma lógica do Feed, mas sem paginação pesada ou buscando um limite maior
      const data = await FeedService.getPosts(0, groupId || 'all', 100, profile?.id);
      setPosts(data);
    } catch (err) {
      console.error(err);
      toastError('Erro', 'Não foi possível carregar os posts para moderação.');
    } finally {
      setLoading(false);
    }
  }, [groupId, toastError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDelete = async (post: FeedPost) => {
    if (!window.confirm(`Tem certeza que deseja excluir a publicação de ${post.author?.name}?`)) return;
    
    try {
      await FeedService.deletePost(post.id, post.imagePath);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      success('Excluído', 'Post removido com sucesso.');
    } catch (err) {
      toastError('Erro', 'Falha ao excluir post.');
    }
  };

  const handlePin = async (post: FeedPost) => {
    try {
      await FeedService.pinPost(post.id, !post.isPinned);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPinned: !p.isPinned } : p));
      success(post.isPinned ? 'Desafixado' : 'Fixado', 'Status atualizado.');
    } catch (err) {
      toastError('Erro', 'Falha ao atualizar fixação.');
    }
  };

  const getPostPreview = (post: FeedPost) => {
    switch (post.postType) {
      case 'text': return post.caption || post.verseText || 'Texto sem conteúdo';
      case 'photo': return '[FOTO] ' + (post.caption || '');
      case 'bible_study': return '[ESTUDO] ' + post.studyTitle;
      case 'youtube': return '[YOUTUBE] ' + (post.videoTitle || '');
      case 'spotify_track': return '[SPOTIFY] ' + (post.spotifyTitle || '');
      case 'spotify_playlist': return '[PLAYLIST] ' + (post.spotifyTitle || '');
      case 'achievement': return `[CONQUISTA] ${post.achievementLabel}`;
      case 'duel_victory': return `[DUELO] Vitória sobre ${post.duelOpponentName}`;
      case 'activity_proof': return `[PROVA] ${post.activityTitle}`;
      default: return 'Desconhecido';
    }
  };

  const filteredPosts = posts.filter(p => {
    const term = search.toLowerCase();
    const preview = getPostPreview(p).toLowerCase();
    const author = (p.author?.name || '').toLowerCase();
    return preview.includes(term) || author.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border-4 border-zinc-800 p-6 rounded-3xl">
        <div>
          <h3 className="text-2xl font-black uppercase italic text-white mb-1">Moderação do Mural</h3>
          <p className="text-zinc-500 font-bold text-sm italic">Gerencie as publicações da tribo, remova conteúdos indesejados ou fixe avisos importantes.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por autor ou conteúdo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black border-2 border-zinc-800 focus:border-primary rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white outline-none transition-all"
            />
          </div>
          <button 
            onClick={loadPosts}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors border border-zinc-700"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b-2 border-zinc-800">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-16">Tipo</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Autor</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Conteúdo</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Data</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-black uppercase italic">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Carregando publicações...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-600 font-black uppercase italic text-lg">
                    Nenhuma publicação encontrada.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${post.isPinned ? 'bg-primary/5' : ''}`}>
                    <td className="p-4 text-center">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 mx-auto">
                        {post.postType === 'photo' && <Eye size={14} />}
                        {post.postType === 'text' && <MessageSquare size={14} />}
                        {post.postType === 'achievement' && <span className="text-sm">🏆</span>}
                        {post.postType === 'duel_victory' && <span className="text-sm">⚔️</span>}
                        {post.postType === 'activity_proof' && <span className="text-sm">✅</span>}
                        {post.postType === 'bible_study' && <span className="text-sm">📖</span>}
                        {(post.postType === 'youtube' || post.postType === 'spotify_track' || post.postType === 'spotify_playlist') && <span className="text-sm">🎵</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-white text-sm uppercase italic truncate max-w-[120px]">{post.author?.name || 'Membro'}</div>
                      <div className="text-[9px] font-bold text-zinc-500 uppercase">{post.groupName || 'Sem Tribo'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-zinc-300 text-xs font-bold line-clamp-2 max-w-md">
                        {getPostPreview(post)}
                      </div>
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 mt-1 bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                          <Pin size={8} /> Fixado
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-zinc-400">
                        {format(new Date(post.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handlePin(post)}
                          className={`p-2 rounded-xl transition-all ${post.isPinned ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
                          title={post.isPinned ? 'Desafixar' : 'Fixar no topo'}
                        >
                          <Pin size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(post)}
                          className="p-2 rounded-xl bg-zinc-800 text-red-500 hover:bg-red-500/20 transition-all"
                          title="Excluir post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
