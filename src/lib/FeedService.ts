import { supabase } from './supabase';
import {
  FeedPost,
  PostComment,
  PostReaction,
  ReactionEmoji,
  PostType,
  DEFAULT_MURAL_POINTS,
  MuralPointsConfig,
} from '../types';
import { NotificationService } from './NotificationService';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([\\w-]{11})/);
  return match?.[1] ?? '';
}

function buildSpotifyEmbedUrl(uriOrUrl: string): string {
  // Aceita: spotify:track:ID  ou  https://open.spotify.com/track/ID
  const trackMatch = uriOrUrl.match(/track[/:]([A-Za-z0-9]+)/);
  const playlistMatch = uriOrUrl.match(/playlist[/:]([A-Za-z0-9]+)/);
  if (trackMatch) return `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator&theme=0`;
  if (playlistMatch) return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator&theme=0`;
  return '';
}

function mapPost(raw: any): FeedPost {
  if (!raw) return {} as FeedPost;
  const author = raw.profiles || raw.author;
  const group = raw.groups || raw.group || author?.group;
  
  const spotifyUri = raw.spotify_uri || raw.spotifyUri;
  const spotifyUrl = raw.spotify_url || raw.spotifyUrl;
  let embedUrl = raw.spotify_embed_url || raw.spotifyEmbedUrl;
  
  if (!embedUrl && (spotifyUri || spotifyUrl)) {
    embedUrl = buildSpotifyEmbedUrl(spotifyUri || spotifyUrl);
  }

  return {
    id: raw.id,
    authorId: raw.author_id || raw.authorId,
    groupId: raw.group_id || raw.groupId,
    postType: raw.post_type || raw.postType,
    caption: raw.caption,
    imageUrl: raw.image_url || raw.imageUrl,
    imagePath: raw.image_path || raw.imagePath,
    verseRef: raw.verse_ref || raw.verseRef,
    verseText: raw.verse_text || raw.verseText,
    verseBookId: raw.verse_book_id || raw.verseBookId,
    verseChapter: raw.verse_chapter || raw.verseChapter,
    verseNumber: raw.verse_number || raw.verseNumber,
    studyTitle: raw.study_title || raw.studyTitle,
    studyBody: raw.study_body || raw.studyBody,
    videoUrl: raw.video_url || raw.videoUrl,
    videoThumbnail: raw.video_thumbnail || raw.videoThumbnail,
    videoTitle: raw.video_title || raw.videoTitle,
    videoId: raw.video_id || raw.videoId,
    spotifyUri: spotifyUri,
    spotifyUrl: spotifyUrl,
    spotifyTitle: raw.spotify_title || raw.spotifyTitle,
    spotifyArtist: raw.spotify_artist || raw.spotifyArtist,
    spotifyCover: raw.spotify_cover || raw.spotifyCover,
    spotifyEmbedUrl: embedUrl,
    achievementKey: raw.achievement_key || raw.achievementKey,
    achievementLabel: raw.achievement_label || raw.achievementLabel,
    achievementIcon: raw.achievement_icon || raw.achievementIcon,
    duelId: raw.duel_id || raw.duelId,
    duelOpponentName: raw.duel_opponent_name || raw.duelOpponentName,
    duelOpponentGroupName: raw.duel_opponent_group_name || raw.duelOpponentGroupName,
    duelScore: raw.duel_score || raw.duelScore,
    participationId: raw.participation_id || raw.participationId,
    activityTitle: raw.activity_title || raw.activityTitle,
    isPinned: !!raw.is_pinned || !!raw.isPinned,
    visibility: raw.visibility || 'public',
    created_at: raw.created_at || raw.createdAt,
    author: author ? {
      name: author.name,
      avatar_url: author.avatar_url || author.avatarUrl,
      groupId: author.groupId || author.group_id,
      totalPoints: author.totalPoints,
      role: author.role
    } : undefined,
    groupName: group?.name,
    reactions: raw.reactions || [],
    reactionSummary: raw.reactionSummary || {},
    commentCount: raw.commentCount || (typeof raw.comment_count === 'number' ? raw.comment_count : (raw.comment_count?.[0]?.count ?? 0)),
    myReaction: raw.myReaction ?? null
  };
}

// ─── FEED SERVICE ─────────────────────────────────────────────────────────────

export class FeedService {

  // ── Posts ──────────────────────────────────────────────────────────────────

  static async getPosts(
    page = 0,
    filter: string = 'all',
    pageSize = 15,
    currentUserId?: string
  ): Promise<FeedPost[]> {
    const from = page * pageSize;
    const to   = from + pageSize - 1;

    // ⚡ CONSULTA TURBO: Trazemos Post, Autor, Grupo e Reações em um único pedido ao banco.
    // Isso elimina o atraso de múltiplas requisições (Client-Side Join).
    let query = supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles(
          id, 
          name, 
          avatar_url, 
          totalPoints, 
          groupId:"groupId", 
          role,
          group:groups(id, name)
        ),
        comment_count:post_comments(count),
        reactions:post_reactions(
          id, 
          postId:post_id, 
          userId:user_id, 
          emoji, 
          author:profiles(name, avatar_url)
        )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter.startsWith('type:')) {
      const type = filter.replace('type:', '');
      query = query.eq('post_type', type);
    } else if (filter !== 'all' && filter !== 'my_group') {
      query = query.eq('group_id', filter);
    }

    const { data: posts, error } = await query;
    if (error) { console.error('[FeedService.getPosts]', error); return []; }
    if (!posts || posts.length === 0) return [];

    return posts.map(raw => {
      const postReactions = (raw.reactions as any[]) || [];
      const summary = postReactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
        return acc;
      }, {} as Record<ReactionEmoji, number>);

      return mapPost({
        ...raw,
        author: raw.author,
        group: raw.author?.group,
        comment_count: raw.comment_count?.[0]?.count ?? 0,
        reactions: postReactions,
        reactionSummary: summary,
        myReaction: currentUserId ? (postReactions.find(r => r.userId === currentUserId)?.emoji ?? null) : null
      });
    });
  }

  static async createPost(payload: Partial<FeedPost>): Promise<FeedPost | null> {
    const insert: Record<string, unknown> = {
      author_id:              payload.authorId,
      group_id:               payload.groupId ?? null,
      post_type:              payload.postType,
      caption:                payload.caption ?? null,
      image_url:              payload.imageUrl ?? null,
      image_path:             payload.imagePath ?? null,
      verse_ref:              payload.verseRef ?? null,
      verse_text:             payload.verseText ?? null,
      verse_book_id:          payload.verseBookId ?? null,
      verse_chapter:          payload.verseChapter ?? null,
      verse_number:           payload.verseNumber ?? null,
      study_title:            payload.studyTitle ?? null,
      study_body:             payload.studyBody ?? null,
      video_url:              payload.videoUrl ?? null,
      video_thumbnail:        payload.videoThumbnail ?? null,
      video_title:            payload.videoTitle ?? null,
      video_id:               payload.videoId ?? null,
      spotify_uri:            payload.spotifyUri ?? null,
      spotify_url:            payload.spotifyUrl ?? null,
      spotify_title:          payload.spotifyTitle ?? null,
      spotify_artist:         payload.spotifyArtist ?? null,
      spotify_cover:          payload.spotifyCover ?? null,
      achievement_key:        payload.achievementKey ?? null,
      achievement_label:      payload.achievementLabel ?? null,
      achievement_icon:       payload.achievementIcon ?? null,
      duel_id:                payload.duelId ?? null,
      duel_opponent_name:     payload.duelOpponentName ?? null,
      duel_opponent_group_name: payload.duelOpponentGroupName ?? null,
      duel_score:             payload.duelScore ?? null,
      participation_id:       payload.participationId ?? null,
      activity_title:         payload.activityTitle ?? null,
      visibility:             payload.visibility ?? 'public',
    };

    const { data, error } = await supabase
      .from('feed_posts')
      .insert(insert)
      .select('*')
      .single();

    if (error) { console.error('[FeedService.createPost]', error); return null; }
    return mapPost(data);
  }

  static async deletePost(postId: string, imagePath?: string): Promise<void> {
    if (imagePath) {
      try {
        const { error: storageError } = await supabase.storage.from('feed-media').remove([imagePath]);
        if (storageError) {
          console.warn('[FeedService.deletePost] Storage cleanup failed (non-blocking):', storageError);
        }
      } catch (err) {
        console.warn('[FeedService.deletePost] Storage exception (non-blocking):', err);
      }
    }
    await supabase.from('feed_posts').delete().eq('id', postId).throwOnError();
  }

  static async pinPost(postId: string, pinned: boolean): Promise<void> {
    await supabase.from('feed_posts').update({ is_pinned: pinned }).eq('id', postId);
  }

  // ── Reacoes ───────────────────────────────────────────────────────────────

  static async getReactions(postId: string): Promise<PostReaction[]> {
    const { data } = await supabase
      .from('post_reactions')
      .select('*, profiles:user_id(name, avatar_url, avatarUrl)')
      .eq('post_id', postId);
    return (data ?? []).map(r => {
      const profileData = r.profiles as any;
      return {
        id:      r.id,
        postId:  r.post_id,
        userId:  r.user_id,
        emoji:   r.emoji as ReactionEmoji,
        author:  profileData ? {
          name: profileData.name,
          avatar_url: profileData.avatar_url || profileData.avatarUrl
        } : undefined
      };
    });
  }

  static async toggleReaction(
    postId: string,
    userId: string,
    emoji: ReactionEmoji
  ): Promise<'added' | 'removed'> {
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from('post_reactions').delete().eq('id', existing.id);
      return 'removed';
    } else {
      await supabase.from('post_reactions')
        .insert({ post_id: postId, user_id: userId, emoji });
      
      // Notificar o autor do post
      try {
        const { data: post } = await supabase.from('feed_posts').select('author_id, caption').eq('id', postId).single();
        if (post && post.author_id !== userId) {
          const { data: reactor } = await supabase.from('profiles').select('name, avatar_url, avatarUrl').eq('id', userId).single();
          const actorAvatar = reactor?.avatar_url || (reactor as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reactor?.name || 'membro'}`;
          
          await NotificationService.send(
            post.author_id,
            'announcement',
            '❤️ Nova Reação!',
            `${reactor?.name || 'Alguém'} reagiu ao seu post: "${post.caption?.substring(0, 30)}..."`,
            '/dashboard',
            actorAvatar
          );
        }
      } catch (err) {
        console.error('Error sending reaction notification:', err);
      }
      
      return 'added';
    }
  }

  // ── Comentarios ───────────────────────────────────────────────────────────

  static async getComments(postId: string): Promise<PostComment[]> {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles:author_id ( name, avatar_url, role )')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    return (data ?? []).map(c => ({
      id:        c.id,
      postId:    c.post_id,
      authorId:  c.author_id,
      content:   c.content,
      created_at: c.created_at,
      author:    c.profiles as PostComment['author'],
    }));
  }

  static async addComment(
    postId: string,
    authorId: string,
    content: string
  ): Promise<PostComment | null> {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, author_id: authorId, content })
      .select('*, profiles:author_id ( name, avatar_url, role )')
      .single();

    if (error) { console.error('[FeedService.addComment]', error); return null; }

    // Notificar o autor do post
    try {
      const { data: post } = await supabase.from('feed_posts').select('author_id, caption').eq('id', postId).single();
      if (post && post.author_id !== authorId) {
        const { data: commenter } = await supabase.from('profiles').select('name, avatar_url, avatarUrl').eq('id', authorId).single();
        const actorAvatar = commenter?.avatar_url || (commenter as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commenter?.name || 'membro'}`;
        
        await NotificationService.send(
          post.author_id,
          'announcement',
          '💬 Novo Comentário!',
          `${commenter?.name || 'Alguém'} comentou no seu post: "${content.substring(0, 30)}..."`,
          '/dashboard',
          actorAvatar
        );
      }
    } catch (err) {
      console.error('Error sending comment notification:', err);
    }

    return {
      id:        data.id,
      postId:    data.post_id,
      authorId:  data.author_id,
      content:   data.content,
      created_at: data.created_at,
      author:    data.profiles as PostComment['author'],
    };
  }

  static async deleteComment(commentId: string): Promise<void> {
    await supabase.from('post_comments').delete().eq('id', commentId);
  }

  // ── Upload de Foto ────────────────────────────────────────────────────────

  static async uploadPhoto(
    file: File,
    userId: string
  ): Promise<{ url: string; path: string } | null> {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED.includes(file.type)) {
      throw new Error('Formato invalido. Use JPG, PNG ou WebP.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Imagem muito grande. Maximo 5MB.');
    }

    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('feed-media')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (error) { console.error('[FeedService.uploadPhoto]', error); return null; }

    const { data: urlData } = supabase.storage.from('feed-media').getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  }

  // ── Spotify ───────────────────────────────────────────────────────────────

  static buildSpotifyEmbedUrl = buildSpotifyEmbedUrl;

  static extractSpotifyMeta(uriOrUrl: string): { type: 'track' | 'playlist' | null; id: string } {
    const trackMatch    = uriOrUrl.match(/track[/:]([A-Za-z0-9]+)/);
    const playlistMatch = uriOrUrl.match(/playlist[/:]([A-Za-z0-9]+)/);
    if (trackMatch)    return { type: 'track',    id: trackMatch[1] };
    if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
    return { type: null, id: '' };
  }

  // ── YouTube ───────────────────────────────────────────────────────────────

  static extractYouTubeId = extractYouTubeId;

  static buildYouTubeEmbedUrl(videoId: string, autoplay = true): string {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`;
  }

  // ── Auto-posts (chamados por outros modulos) ──────────────────────────────

  static async autoPostAchievement(
    userId: string,
    groupId: string | undefined,
    achievementKey: string,
    achievementLabel: string,
    achievementIcon: string,
    shareOptIn = true
  ): Promise<void> {
    if (!shareOptIn) return;
    await FeedService.createPost({
      authorId:         userId,
      groupId:          groupId,
      postType:         'achievement',
      achievementKey,
      achievementLabel,
      achievementIcon,
      caption:          `Conquistei: ${achievementLabel}! ${achievementIcon}`,
      visibility:       'public',
    });
  }

  static async autoPostDuelVictory(
    winnerId: string,
    winnerGroupId: string | undefined,
    duelId: string,
    opponentName: string,
    opponentGroupName: string,
    score: string,
    shareOptIn = true
  ): Promise<void> {
    if (!shareOptIn) return;
    await FeedService.createPost({
      authorId:              winnerId,
      groupId:               winnerGroupId,
      postType:              'duel_victory',
      duelId,
      duelOpponentName:      opponentName,
      duelOpponentGroupName: opponentGroupName,
      duelScore:             score,
      caption:               `Venci o Duelo Biblico! ${score} contra ${opponentName} da ${opponentGroupName}. ⚔️`,
      visibility:            'public',
    });
  }

  static async shareActivityProof(
    userId: string,
    groupId: string | undefined,
    participationId: string,
    activityTitle: string,
    proofUrl?: string
  ): Promise<void> {
    await FeedService.createPost({
      authorId:        userId,
      groupId:         groupId,
      postType:        'activity_proof',
      participationId,
      activityTitle,
      imageUrl:        proofUrl,
      caption:         `Completei a atividade: ${activityTitle}! ✅`,
      visibility:      'public',
    });
  }

  static async autoPostNewMember(
    newMemberId: string,
    groupId: string | undefined,
    memberName: string
  ): Promise<void> {
    // 🛡️ Prevenção de duplicatas: Verifica se já existe um post de "novo membro" para este ID
    const { data: existing } = await supabase
      .from('feed_posts')
      .select('id')
      .eq('author_id', newMemberId)
      .eq('post_type', 'new_member')
      .maybeSingle();

    if (existing) return;

    await FeedService.createPost({
      authorId:   newMemberId,
      groupId:    groupId,
      postType:   'new_member',
      caption:    `O guerreiro ${memberName} foi aprovado na Arena!`,
      visibility: 'public',
    });
  }

  static async autoPostGroupUpdate(
    adminId: string,
    groupId: string,
    updateType: 'name' | 'logo',
    newValue: string
  ): Promise<void> {
    await FeedService.createPost({
      authorId:   adminId,
      groupId:    groupId,
      postType:   'group_update',
      caption:    updateType === 'name' ? newValue : 'Nosso brasão foi forjado novamente!',
      imageUrl:   updateType === 'logo' ? newValue : undefined,
      visibility: 'public',
    });
  }

  // ── Pontuacao do Mural ────────────────────────────────────────────────────

  static async grantPostXP(
    userId: string,
    groupId: string | undefined,
    postType: PostType,
    config: MuralPointsConfig = DEFAULT_MURAL_POINTS
  ): Promise<void> {
    const points = postType === 'bible_study' ? config.studyPoints : config.postPoints;
    if (points <= 0) return;
    const reason = postType === 'bible_study' ? 'mural_study' : 'mural_post';
    
    // Bug fix: supabase.rpc() retorna uma Promise, não um número
    // Não pode ser usado como valor em .update({ totalPoints: supabase.rpc(...) })
    // Usa a RPC increment_points que já é o padrão atômico do sistema
    await supabase.rpc('increment_points', {
      user_id: userId,
      group_id: groupId ?? null,
      pts: points,
      reason,
    });
  }

  static async grantCommentXP(
    userId: string,
    groupId: string | undefined,
    config: MuralPointsConfig = DEFAULT_MURAL_POINTS
  ): Promise<void> {
    if (config.commentPoints <= 0) return;
    // Bug fix: usa data LOCAL (sv locale) para consistência com o fuso brasileiro
    const today = new Date().toLocaleDateString('sv');
    const { count } = await supabase
      .from('point_logs')
      .select('*', { count: 'exact', head: true })
      .eq('"userId"', userId)
      .eq('reason', 'mural_comment')
      .gte('created_at', `${today}T00:00:00`);

    if ((count ?? 0) >= config.commentMaxDaily) return;

    // Bug fix: mesma correção — usa increment_points atômico
    await supabase.rpc('increment_points', {
      user_id: userId,
      group_id: groupId ?? null,
      pts: config.commentPoints,
      reason: 'mural_comment',
    });
  }
}
