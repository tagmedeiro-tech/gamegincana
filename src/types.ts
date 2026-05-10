/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'leader' | 'participant';

// ─── NÍVEIS RPG ──────────────────────────────────────────────────────────────
export interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon?: string;
}

export const LEVEL_THRESHOLDS: UserLevel[] = [
  { level: 1, title: 'Recruta',       minPoints: 0,    maxPoints: 49,   color: '#71717a' },
  { level: 2, title: 'Guerreiro',     minPoints: 50,   maxPoints: 149,  color: '#3b82f6' },
  { level: 3, title: 'Comprometido',  minPoints: 150,  maxPoints: 349,  color: '#8b5cf6' },
  { level: 4, title: 'Influenciador', minPoints: 350,  maxPoints: 699,  color: '#f59e0b' },
  { level: 5, title: 'Líder da Tribo',minPoints: 700,  maxPoints: Infinity, color: '#FBBF24' },
];

export function getUserLevel(totalPoints: number, levels?: UserLevel[]): UserLevel {
  const source = levels && levels.length > 0 ? levels : LEVEL_THRESHOLDS;
  return source.slice().reverse().find(l => totalPoints >= l.minPoints) || source[0];
}

export function getLevelProgress(totalPoints: number, levels?: UserLevel[]): number {
  const level = getUserLevel(totalPoints, levels);
  if (level.maxPoints === Infinity) return 100;
  const range = level.maxPoints - level.minPoints;
  const progress = totalPoints - level.minPoints;
  return Math.min(100, Math.round((progress / range) * 100));
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  userId: string;
  achievementKey: string;
  created_at: string;
}

export type ActivityCategory =
  | 'presenca'
  | 'evangelismo'
  | 'devocional'
  | 'online'
  | 'lideranca'
  | 'especial'
  | 'relacionamento';

export interface ActivityDefinition {
  id: string;
  key: string;
  title: string;
  description: string;
  category: ActivityCategory;
  default_points: number;
  current_points: number;
  icon: string;
  max_per_week: number | null;
  is_active: boolean;
  requires_proof: boolean;
  coin_reward?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  groupId?: string;
  avatarUrl?: string;
  avatar_url?: string;
  birthDate?: string;
  isBaptized?: boolean;
  isServing?: boolean;
  wantsToServe?: boolean;
  serviceArea?: string;
  praiseInstrument?: string;
  whatsapp?: string;
  favorite_verse?: string;
  bio?: string;
  totalPoints: number;
  coins: number;
  achievements: Achievement[];
}

export interface Group {
  id: string;
  name: string;
  leaderId?: string;
  color: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  description?: string;
  totalPoints: number;
  memberCount: number;
}

export interface Badge {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  description: string;
  points: number;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedBy: string;
  awardedAt: string;
}

export interface Cell {
  id: string;
  groupId: string;
  name: string;
  leaderId: string;
  meetingDay: string;
  location: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  points: number;
  category?: string;
  type: 'presencial' | 'online' | 'qr_code';
  status: 'active' | 'archived';
  validationType: 'auto' | 'manual';
  // ⏳ Missões com prazo (Fase 2)
  startsAt?: string;   // ISO date string
  expiresAt?: string;  // ISO date string — null = sem prazo
  missionType?: 'normal' | 'flash' | 'weekly' | 'special'; // tipo de missão
  imageUrl?: string;   // Arte do desafio
  definitionId?: string; // Vínculo com a tabela de pontuações
  requires_acceptance?: boolean; // Se o membro precisa aceitar antes de cumprir
  secret_payload?: string; // Código secreto para missões de QR Code
}

export interface Participation {
  id: string;
  userId: string;
  groupId: string;
  activityId: string;
  status: 'accepted' | 'pending' | 'approved' | 'rejected';
  pointsEarned: number;
  created_at: string;
  proofUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  text: string;
  created_at: string;
  groupId: string | null;
  likes?: string[];
  profiles?: { role: UserRole; avatar_url?: string }; // Adicionado para suporte a destaques premium
}

export interface PointLog {
  id: string;
  groupId: string;
  userId: string;
  points: number;
  reason: string;
  created_at: string;
}

// ─── LOJA DE RECOMPENSAS ───────────────────────────────────────────────────

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Redemption {
  id: string;
  userId: string;
  itemId: string;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at: string;
  // Joins
  profiles?: { name: string; avatar_url?: string };
  store_items?: StoreItem;
}

export type NotificationType = 'login' | 'task_submit' | 'task_approved' | 'task_rejected' | 'redemption' | 'announcement' | 'achievement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// ─── ECOSSISTEMA BÍBLICO (Fase 5) ───────────────────────────────────────────

export interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

export interface BibleVerse {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleReadingPlan {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  type: 'annual' | 'chronological' | 'custom';
}

export interface UserBibleProgress {
  id: string;
  userId: string;
  planId: string;
  currentDay: number;
  completedChapters: string[]; // Formato: "GEN:1", "GEN:2"
  lastReadAt: string;
}

export interface VerseNote {
  id: string;
  userId: string;
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  color?: string; // Para marcação/highlight
  created_at: string;
}

export interface BibleQuiz {
  id: string;
  chapterKey: string; // Formato: "GEN:1"
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    verseRef?: { ref: string; text: string }; // Versículo de contexto da pergunta
  }[];
}
// ─── QUIZ EXTERNO (OpenTDB Integration) ──────────────────────────────────────

export interface ExternalQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'local' | 'opentdb';
  chapterRef?: string; // ex: "JHN:3" — preenchido só para perguntas locais
}

// ─── DUELO BÍBLICO INTER-GRUPOS ───────────────────────────────────────────────

export type DuelStatus = 'pending' | 'active' | 'finished' | 'declined' | 'timeout';
export type DuelMode = 'direct' | 'matchmaking'; // Direto ou fila de matchmaking

export interface BibleDuel {
  id: string;
  mode: DuelMode;

  // Jogadores (de grupos DIFERENTES)
  challengerId: string;
  challengerGroupId: string;    // Grupo de quem desafiou
  challengedId: string;
  challengedGroupId: string;    // Grupo de quem foi desafiado

  status: DuelStatus;
  questions: ExternalQuizQuestion[];
  currentQuestionIndex: number;

  // Placar individual
  challengerScore: number;
  challengedScore: number;

  // Resultado
  winnerId?: string;
  winnerGroupId?: string;       // Grupo que ganhou pontos
  loserId?: string;
  loserGroupId?: string;        // Grupo que perdeu pontos

  // Transferência de pontos
  individualPointsTransferred: number;  // XP do perdedor → vencedor
  groupPointsTransferred: number;       // Pontos do grupo perdedor → grupo vencedor

  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface DuelAnswer {
  id: string;
  duelId: string;
  userId: string;
  questionIndex: number;
  answerIndex: number;
  isCorrect: boolean;
  answeredAt: string; // Timestamp ISO — desempate por velocidade
}

export interface DuelMatchmakingEntry {
  userId: string;
  groupId: string;
  joinedAt: string;
  status: 'waiting' | 'matched';
}

// ─── MURAL DA TRIBO (Rede Social) ────────────────────────────────────────────

export type PostType =
  | 'photo'
  | 'text'
  | 'bible_study'
  | 'youtube'
  | 'spotify_track'
  | 'spotify_playlist'
  | 'achievement'
  | 'duel_victory'
  | 'activity_proof'
  | 'new_member'
  | 'group_update'
  | 'announcement'
  | 'streak_milestone';

export type ReactionEmoji = '❤️' | '🔥' | '🙌' | '😂' | '😮';

export type FeedFilter = 'all' | 'my_group' | string; // string = group_id ou 'type:photo' etc

export interface FeedPost {
  id: string;
  authorId: string;
  groupId?: string;
  postType: PostType;

  // Conteudo geral
  caption?: string;

  // Foto (upload via Supabase Storage)
  imageUrl?: string;   // URL publica
  imagePath?: string;  // Caminho interno (para delete limpo)

  // Versiculo integrado ao BibleViewer
  verseRef?: string;      // ex: "Joao 3:16" (label de exibicao)
  verseText?: string;     // texto completo do versiculo
  verseBookId?: string;   // ex: "JHN" (deep-link para BibleViewer)
  verseChapter?: number;
  verseNumber?: number;

  // Estudo Biblico
  studyTitle?: string;
  studyBody?: string; // markdown

  // Video (YouTube / Instagram)
  videoUrl?: string;
  videoThumbnail?: string;
  videoTitle?: string;
  videoId?: string; // ID extraido da URL do YouTube

  // Spotify
  spotifyUri?: string;
  spotifyUrl?: string;
  spotifyTitle?: string;
  spotifyArtist?: string;
  spotifyCover?: string;
  spotifyEmbedUrl?: string; // gerado automaticamente

  // Conquista automatica
  achievementKey?: string;
  achievementLabel?: string;
  achievementIcon?: string;

  // Duelo
  duelId?: string;
  duelOpponentName?: string;
  duelOpponentGroupName?: string;
  duelScore?: string; // ex: "5-2"

  // Prova de Atividade
  participationId?: string;
  activityTitle?: string;

  // Metadados
  isPinned: boolean;
  visibility: 'public' | 'group_only';
  created_at: string;

  // Joins (carregados junto com o post)
  author?: { name: string; avatar_url?: string; groupId?: string; totalPoints?: number; role?: UserRole };
  groupName?: string;
  reactions?: PostReaction[];
  reactionSummary?: Record<ReactionEmoji, number>;
  commentCount?: number;
  myReaction?: ReactionEmoji | null;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  created_at: string;
  author?: { name: string; avatar_url?: string; role?: UserRole };
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  emoji: ReactionEmoji;
  author?: { name: string; avatar_url?: string; avatarUrl?: string };
}

export interface TribePlaylist {
  id: string;
  name: string;
  description?: string;
  spotifyUri?: string;
  coverUrl?: string;
  curatorId?: string;
  isOfficial: boolean;
  created_at: string;
  curator?: { name: string };
}

// Configuracao de pontos do Mural (salva dentro do AppTheme na tabela config)
export interface MuralPointsConfig {
  postPoints: number;             // default: 2
  studyPoints: number;            // default: 5
  commentPoints: number;          // default: 1
  commentMaxDaily: number;        // default: 3
  reactionBonusPoints: number;    // default: 3 (bonus ao atingir threshold de reacoes)
  reactionBonusThreshold: number; // default: 5 (quantas reacoes disparam o bonus)
}

export const DEFAULT_MURAL_POINTS: MuralPointsConfig = {
  postPoints: 2,
  studyPoints: 5,
  commentPoints: 1,
  commentMaxDaily: 3,
  reactionBonusPoints: 3,
  reactionBonusThreshold: 5,
};

// ─── SISTEMA DE CALENDÁRIO ──────────────────────────────────────────────────

export type CalendarEventType = 'gincana' | 'live' | 'metaverso' | 'meeting' | 'culto' | 'outros';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD para eventos únicos ou início da série
  start_time: string; // HH:mm
  end_time?: string;  // HH:mm
  type: CalendarEventType;
  group_id?: string;
  points_reward: number;
  created_by: string;
  created_at: string;
  
  // Recorrência (Fase 2)
  is_recurring?: boolean;
  recurrence_pattern?: {
    freq: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // [0, 1, 2...] onde 0 é Domingo
    endDate?: string;
  };
  
  // Integração com Missões
  requires_proof?: boolean;
  linked_activity_id?: string;
}
