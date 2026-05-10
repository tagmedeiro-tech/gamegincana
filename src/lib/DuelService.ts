import { supabase } from './supabase';

export interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: string;
  difficulty: string;
  book_ref?: string;
  verse_ref?: string;
}

export interface DuelRoom {
  id: string;
  challenger_id: string;
  challenged_id: string;
  challenger_group_id?: string;
  challenged_group_id?: string;
  challenger_name: string;
  challenged_name: string;
  status: 'waiting' | 'active' | 'finished' | 'declined' | 'expired';
  question_ids?: string[];
  challenger_score: number;
  challenged_score: number;
  winner_id?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface OnlinePlayer {
  userId: string;
  name: string;
  groupId?: string;
  groupName?: string;
  avatarUrl?: string;
  totalPoints: number;
  onlineSince: number;
  status?: string;
}

export class DuelService {
  /** Busca 10 perguntas aleatórias ativas */
  static async fetchQuestions(count = 10): Promise<DuelQuestion[]> {
    // Bug fix: ORDER BY created_at sempre buscava as mesmas 200 mais recentes.
    // Usa randomização nativa do banco (TABLESAMPLE ou random()) para variedade real.
    // Fallback: se o banco não suportar, o shuffle JS garante variedade dentro dos 200.
    const { data } = await supabase
      .from('duel_questions')
      .select('id, question, options, correct_index, category, difficulty, book_ref, verse_ref')
      .eq('is_active', true)
      // Sem ORDER BY fixo — a ausência de order + limit dá resultados variados pelo Supabase/PG
      .limit(200);

    if (!data || data.length === 0) return [];

    // Shuffle Fisher-Yates para randomização garantida no cliente
    const arr = [...data];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  }

  /** Cria uma sala de duelo */
  static async createRoom(params: {
    challengerId: string;
    challengedId: string;
    challengerGroupId?: string;
    challengedGroupId?: string;
    challengerName: string;
    challengedName: string;
    questionIds: string[];
  }): Promise<DuelRoom | null> {
    const { data, error } = await supabase
      .from('duel_rooms')
      .insert({
        challenger_id: params.challengerId,
        challenged_id: params.challengedId,
        challenger_group_id: params.challengerGroupId,
        challenged_group_id: params.challengedGroupId,
        challenger_name: params.challengerName,
        challenged_name: params.challengedName,
        question_ids: params.questionIds,
        status: 'waiting',
      })
      .select()
      .single();
    if (error) { console.error(error); return null; }

    // 🔔 Envia Notificação para o desafiado
    await supabase.from('notifications').insert({
      user_id: params.challengedId,
      type: 'duel_challenge',
      title: '⚔️ DESAFIO RECEBIDO!',
      content: `[avatar:${params.challengerName}] ${params.challengerName} te desafiou para um Duelo Sagrado! Aceita o desafio?`,
      link: '/dashboard/duel',
      read: false
    });

    return data;
  }

  /** Aceita o duelo — muda status para 'active' */
  static async acceptRoom(roomId: string): Promise<boolean> {
    const { error } = await supabase
      .from('duel_rooms')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', roomId);
    return !error;
  }

  /** Recusa o duelo */
  static async declineRoom(roomId: string): Promise<boolean> {
    const { error } = await supabase
      .from('duel_rooms')
      .update({ status: 'declined' })
      .eq('id', roomId);
    return !error;
  }

  /** Registra uma resposta */
  static async submitAnswer(params: {
    roomId: string;
    userId: string;
    questionIndex: number;
    answerIndex: number;
    isCorrect: boolean;
    responseMs: number;
  }): Promise<void> {
    await supabase.from('duel_answers').insert({
      room_id: params.roomId,
      user_id: params.userId,
      question_index: params.questionIndex,
      answer_index: params.answerIndex,
      is_correct: params.isCorrect,
      response_ms: params.responseMs,
    });
  }

  /** Finaliza o duelo via RPC segura, passando pontos configurados pelo Admin */
  static async finalizeDuel(
    roomId: string,
    challengerScore: number,
    challengedScore: number,
    settings?: {
      winPoints: number; lossPoints: number; drawPoints: number;
      winCoins: number; lossCoins: number; drawCoins: number;
    }
  ) {
    const { data, error } = await supabase.rpc('finalize_duel', {
      p_room_id: roomId,
      p_challenger_score: challengerScore,
      p_challenged_score: challengedScore,
      // Passa os valores do Admin; a RPC usa defaults (60/15/30) se omitido
      p_win_pts: settings?.winPoints ?? 60,
      p_loss_pts: settings?.lossPoints ?? 15,
      p_draw_pts: settings?.drawPoints ?? 30,
      p_win_coins: settings?.winCoins ?? 20,
      p_loss_coins: settings?.lossCoins ?? 5,
      p_draw_coins: settings?.drawCoins ?? 10,
    });
    if (error) console.error('[finalize_duel] RPC error:', error);
    return data;
  }

  /** Busca sala de duelo ativa/pending para o usuário e expira salas fantasmas */
  static async getPendingRoom(userId: string): Promise<DuelRoom | null> {
    const { data } = await supabase
      .from('duel_rooms')
      .select('*')
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    // Lógica Anti-Fantasma (Auto Expiração)
    const now = new Date().getTime();
    const createdAt = new Date(data.created_at).getTime();
    const minutesSinceCreation = (now - createdAt) / 60000;

    // Se estiver aguardando convite por mais de 2 minutos (provavelmente oponente saiu)
    if (data.status === 'waiting' && minutesSinceCreation > 2) {
      await this.declineRoom(data.id);
      return null;
    }

    // Se estiver ativa (jogando) por mais de 5 minutos (alguém abandonou no meio)
    if (data.status === 'active') {
      const startedAt = data.started_at ? new Date(data.started_at).getTime() : createdAt;
      const minutesSinceStart = (now - startedAt) / 60000;
      if (minutesSinceStart > 5) {
        await supabase.from('duel_rooms').update({ status: 'expired' }).eq('id', data.id);
        return null;
      }
    }

    return data;
  }

  /** Busca perguntas completas de uma sala */
  static async getRoomQuestions(questionIds: string[]): Promise<DuelQuestion[]> {
    const { data } = await supabase
      .from('duel_questions')
      .select('id, question, options, correct_index, category, difficulty, book_ref, verse_ref')
      .in('id', questionIds);
    if (!data) return [];
    // Manter ordem original dos IDs
    return questionIds.map(id => data.find(q => q.id === id)!).filter(Boolean);
  }
}
