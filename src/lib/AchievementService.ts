import { supabase } from './supabase';
import { NotificationService } from './NotificationService';
import { FeedService } from './FeedService';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Verifica se a Gincana já está oficialmente ativa.
 * Bloqueia silenciosamente qualquer distribuição de troféu
 * enquanto o status for 'waiting' ou 'preparing'.
 */
async function isGincanaActive(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'app')
      .single();
    const status = (data?.value as any)?.gincanaStatus;
    // Se não encontrar config, assume ativo para não bloquear
    if (!status) return true;
    return status === 'active';
  } catch {
    return true; // Fail-open: se o banco falhar, não bloqueia
  }
}

export interface AchievementDef {
  name: string;
  description: string;
  points: number;
  icon: string;
  rarity: Rarity;
  color: string;
  howToConquer?: string;
}

export let ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDef> = {

  // ─── NOVOS TROFÉUS (SETOR FÁCIL) — common, 10–100 pts ────────────────────────
  first_task: {
    name: 'Primeiro Passo 🏁',
    description: 'Completou sua primeira tarefa oficial.',
    points: 50, icon: 'Flag', rarity: 'common', color: '#94a3b8'
  },
  first_login: {
    name: 'Bem-vindo à Arena ⚡',
    description: 'Fez seu primeiro login na plataforma.',
    points: 10, icon: 'Zap', rarity: 'common', color: '#94a3b8'
  },
  profile_photo: {
    name: 'Rosto na Arena 📸',
    description: 'Adicionou uma foto de perfil.',
    points: 15, icon: 'Camera', rarity: 'common', color: '#94a3b8'
  },
  profile_updated: {
    name: 'Identidade Forjada 👤',
    description: 'Atualizou seu perfil de guerreiro pela primeira vez.',
    points: 20, icon: 'User', rarity: 'common', color: '#94a3b8'
  },
  profile_complete: {
    name: 'Perfil Completo 🧩',
    description: 'Preencheu todos os campos do perfil.',
    points: 40, icon: 'CheckSquare', rarity: 'common', color: '#94a3b8'
  },
  welcome_bonus: {
    name: 'Recruta 🎖️',
    description: 'Cadastrou-se na plataforma da Gincana.',
    points: 50, icon: 'UserPlus', rarity: 'common', color: '#94a3b8'
  },
  first_comment: {
    name: 'Voz Ativa 💬',
    description: 'Comentou em uma postagem do Mural.',
    points: 20, icon: 'MessageCircle', rarity: 'common', color: '#94a3b8'
  },
  first_like: {
    name: 'Apoio da Tribo ❤️',
    description: 'Curtiu a postagem de outro membro.',
    points: 10, icon: 'Heart', rarity: 'common', color: '#94a3b8'
  },
  first_reaction: {
    name: 'Reagiu ao Mural 🔥',
    description: 'Usou uma reação em uma publicação.',
    points: 10, icon: 'Smile', rarity: 'common', color: '#94a3b8'
  },
  first_feed_post: {
    name: 'Grito de Guerra 📢',
    description: 'Publicou pela primeira vez no Mural da Tribo.',
    points: 25, icon: 'Megaphone', rarity: 'common', color: '#94a3b8'
  },
  first_devotional: {
    name: 'Primeiro Pão 🍞',
    description: 'Completou seu primeiro devocional.',
    points: 25, icon: 'BookHeart', rarity: 'common', color: '#94a3b8'
  },
  first_reading_plan: {
    name: 'Livro Aberto 📖',
    description: 'Ingressou em um plano de leitura.',
    points: 20, icon: 'BookOpen', rarity: 'common', color: '#94a3b8'
  },
  first_chapter: {
    name: 'Capítulo Um 📄',
    description: 'Leu o primeiro capítulo de um plano.',
    points: 15, icon: 'FileText', rarity: 'common', color: '#94a3b8'
  },
  first_duel: {
    name: 'Sangue na Arena ⚔️',
    description: 'Participou do seu primeiro duelo.',
    points: 30, icon: 'Swords', rarity: 'common', color: '#94a3b8'
  },
  first_group: {
    name: 'Tribo Definida 🛡️',
    description: 'Foi alocado em um grupo/tribo.',
    points: 15, icon: 'Users', rarity: 'common', color: '#94a3b8'
  },
  social_butterfly: {
    name: 'Voz da Tribo 🗣️',
    description: 'Fez sua primeira postagem ou interação no Mural.',
    points: 25, icon: 'MessageSquare', rarity: 'common', color: '#94a3b8'
  },
  first_xp_earned: {
    name: 'Primeiros Pontos 🌟',
    description: 'Acumulou os primeiros pontos XP.',
    points: 20, icon: 'Star', rarity: 'common', color: '#94a3b8'
  },
  two_tasks: {
    name: 'Segundo Passo 🏃',
    description: 'Completou 2 tarefas aprovadas.',
    points: 30, icon: 'CheckCircle', rarity: 'common', color: '#94a3b8'
  },
  daily_visit_1: {
    name: 'Check-in Diário ✅',
    description: 'Visitou o app por 1 dia.',
    points: 10, icon: 'CalendarCheck', rarity: 'common', color: '#94a3b8'
  },
  first_weekly_goal: {
    name: 'Meta da Semana 🗓️',
    description: 'Completou uma tarefa na semana.',
    points: 30, icon: 'Calendar', rarity: 'common', color: '#94a3b8'
  },
  store_fan: {
    name: 'Consumidor 🛍️',
    description: 'Realizou seu primeiro resgate na loja.',
    points: 50, icon: 'ShoppingBag', rarity: 'common', color: '#94a3b8'
  },
  streak_login_3: {
    name: 'Faísca ⚡',
    description: '3 dias consecutivos de acesso à Arena.',
    points: 30, icon: 'Zap', rarity: 'common', color: '#94a3b8'
  },

  // ─── SETOR MÉDIO — rare, 100–500 pts ─────────────────────────────────────────
  five_tasks: {
    name: 'Membro Ativo 🏃',
    description: 'Completou 5 tarefas com sucesso.',
    points: 150, icon: 'Zap', rarity: 'rare', color: '#3b82f6'
  },
  ten_tasks: {
    name: 'Artesão 🔨',
    description: 'Completou 10 tarefas aprovadas.',
    points: 200, icon: 'Hammer', rarity: 'rare', color: '#3b82f6'
  },
  twenty_tasks: {
    name: 'Operário da Tribo ⚙️',
    description: 'Completou 20 tarefas aprovadas.',
    points: 300, icon: 'Settings', rarity: 'rare', color: '#3b82f6'
  },
  reading_streak_7: {
    name: 'Fiel no Pouco 📖',
    description: '7 dias seguidos de leitura bíblica.',
    points: 300, icon: 'BookOpen', rarity: 'rare', color: '#3b82f6'
  },
  streak_login_7: {
    name: 'Chama da Semana 🔥',
    description: '7 dias consecutivos de presença digital.',
    points: 150, icon: 'Flame', rarity: 'rare', color: '#f97316'
  },
  streak_login_14: {
    name: 'Guardião Quinzenal 🛡️',
    description: '14 dias de presença contínua sem falhas.',
    points: 400, icon: 'Shield', rarity: 'rare', color: '#3b82f6'
  },
  streak_login_21: {
    name: 'Trincheira 🪖',
    description: '21 dias consecutivos de acesso.',
    points: 300, icon: 'Tent', rarity: 'rare', color: '#3b82f6'
  },
  duel_victor_5: {
    name: 'Gladiador 🛡️',
    description: 'Venceu 5 duelos na Arena.',
    points: 150, icon: 'Crosshair', rarity: 'rare', color: '#3b82f6'
  },
  duel_victor_10: {
    name: 'Combatente 🗡️',
    description: 'Venceu 10 duelos na Arena.',
    points: 300, icon: 'Sword', rarity: 'rare', color: '#3b82f6'
  },
  mission_hunter: {
    name: 'Caçador de Missões 🎯',
    description: 'Completou 10 missões da tribo.',
    points: 200, icon: 'Target', rarity: 'rare', color: '#3b82f6'
  },
  bible_reader: {
    name: 'Leitor Voraz 📖',
    description: 'Completou um plano de leitura bíblica inteiro.',
    points: 250, icon: 'Book', rarity: 'rare', color: '#3b82f6'
  },
  two_plans_complete: {
    name: 'Dupla Missão ✌️',
    description: 'Finalizou 2 planos de leitura.',
    points: 400, icon: 'BookMarked', rarity: 'rare', color: '#3b82f6'
  },
  read_10_chapters: {
    name: 'Leitor Dedicado 📚',
    description: 'Leu 10 capítulos em planos de leitura.',
    points: 200, icon: 'BookText', rarity: 'rare', color: '#3b82f6'
  },
  read_30_chapters: {
    name: 'Devorador de Palavras 📜',
    description: 'Leu 30 capítulos bíblicos.',
    points: 350, icon: 'Scroll', rarity: 'rare', color: '#3b82f6'
  },
  five_devotionals: {
    name: 'Manhãs com Deus ☀️',
    description: 'Completou 5 devocionais.',
    points: 150, icon: 'Sun', rarity: 'rare', color: '#f97316'
  },
  twenty_devotionals: {
    name: 'Discípulo da Rotina 🙏',
    description: 'Completou 20 devocionais.',
    points: 300, icon: 'HandsHelping', rarity: 'rare', color: '#3b82f6'
  },
   streak_devotional_7: {
    name: 'Fiel no Pouco 📖',
    description: '7 dias consecutivos de devocional diário concluído.',
    points: 300, icon: 'BookOpen', rarity: 'rare', color: '#3b82f6'
  },
  points_500: {
    name: 'Meio Guerreiro 💪',
    description: 'Acumulou 500 pontos XP.',
    points: 150, icon: 'TrendingUp', rarity: 'rare', color: '#3b82f6'
  },
  points_1000: {
    name: 'Mil Pontos! 💥',
    description: 'Acumulou 1.000 pontos XP.',
    points: 250, icon: 'Award', rarity: 'rare', color: '#3b82f6'
  },
  three_redemptions: {
    name: 'Colecionador 🛍️',
    description: 'Realizou 3 resgates na loja.',
    points: 200, icon: 'ShoppingCart', rarity: 'rare', color: '#3b82f6'
  },
  top10_weekly: {
    name: 'Elite Semanal 🥇',
    description: 'Entrou no Top 10 do ranking semanal.',
    points: 250, icon: 'BarChart', rarity: 'rare', color: '#3b82f6'
  },
  post_5_times: {
    name: 'Cronista da Tribo 📓',
    description: 'Publicou 5 vezes no Mural.',
    points: 200, icon: 'PenTool', rarity: 'rare', color: '#3b82f6'
  },
  receive_5_likes: {
    name: 'Aprovado pela Tribo 👍',
    description: 'Recebeu 5 curtidas em publicações.',
    points: 200, icon: 'ThumbsUp', rarity: 'rare', color: '#3b82f6'
  },
  earn_badge: {
    name: 'Honraria Concedida 🏅',
    description: 'Recebeu um Selo do líder da tribo.',
    points: 200, icon: 'Medal', rarity: 'rare', color: '#3b82f6'
  },
  five_weeks_active: {
    name: 'Veterano das Semanas 🛡️',
    description: 'Completou tarefas em 5 semanas consecutivas.',
    points: 400, icon: 'ShieldCheck', rarity: 'rare', color: '#3b82f6'
  },

  // ─── SETOR DIFÍCIL — epic + legendary, 500–15.000 pts ────────────────────────
  veteran: {
    name: 'Veterano da Tribo 🛡️',
    description: 'Alcançou a marca de 15 tarefas aprovadas.',
    points: 500, icon: 'Shield', rarity: 'epic', color: '#a855f7'
  },
  thirty_tasks: {
    name: 'Herói das Tarefas 🦸',
    description: 'Completou 30 tarefas aprovadas.',
    points: 750, icon: 'UserCheck', rarity: 'epic', color: '#a855f7'
  },
  fifty_tasks: {
    name: 'Máquina de Guerra 🤖',
    description: 'Completou 50 tarefas aprovadas.',
    points: 1500, icon: 'Bot', rarity: 'epic', color: '#a855f7'
  },
  hundred_tasks: {
    name: 'Centurião das Tarefas 💯',
    description: 'Completou 100 tarefas — disciplina absoluta.',
    points: 5000, icon: 'Trophy', rarity: 'legendary', color: '#f59e0b'
  },
  reading_streak_15: {
    name: 'Inabalável ⚔️',
    description: '15 dias seguidos mergulhado na Palavra.',
    points: 1000, icon: 'Flame', rarity: 'epic', color: '#a855f7'
  },
  reading_streak_30: {
    name: 'Inflamado pela Palavra 🔥',
    description: '30 dias seguidos de leitura bíblica.',
    points: 2000, icon: 'BookOpen', rarity: 'epic', color: '#a855f7'
  },
  reading_streak_60: {
    name: 'Profeta da Rotina 🕊️',
    description: '60 dias seguidos de leitura bíblica.',
    points: 5000, icon: 'Bird', rarity: 'legendary', color: '#f59e0b'
  },
  streak_login_30: {
    name: 'Guerreiro do Mês 🏆',
    description: '30 dias consecutivos de acesso — um mês sem falhar.',
    points: 1000, icon: 'Trophy', rarity: 'epic', color: '#a855f7'
  },
  streak_login_60: {
    name: 'Inabalável 💎',
    description: '60 dias de fidelidade absoluta à Arena.',
    points: 2500, icon: 'Gem', rarity: 'epic', color: '#6366f1'
  },
  streak_login_100: {
    name: 'Centurião 🌟',
    description: '100 dias consecutivos — um verdadeiro guerreiro.',
    points: 5000, icon: 'Star', rarity: 'legendary', color: '#f59e0b'
  },
  streak_login_180: {
    name: 'Meio Ano Inabalável 💎',
    description: '180 dias consecutivos de acesso.',
    points: 7500, icon: 'Diamond', rarity: 'legendary', color: '#f59e0b'
  },
  streak_login_365: {
    name: 'Guardião Eterno 🔱',
    description: '365 dias — um ano inteiro de presença inabalável.',
    points: 15000, icon: 'Crown', rarity: 'legendary', color: '#ec4899'
  },
  streak_devotional_14: {
    name: 'Discípulo Ardente ✝️',
    description: '14 dias de devocional diário sem interrupção.',
    points: 750, icon: 'BookMarked', rarity: 'epic', color: '#a855f7'
  },
  streak_devotional_30: {
    name: 'Servidor da Palavra 📜',
    description: '30 dias de devoção — um mês inteiro mergulhado na Palavra.',
    points: 2000, icon: 'Scroll', rarity: 'epic', color: '#a855f7'
  },
  streak_devotional_60: {
    name: 'Apóstolo da Disciplina 🔱',
    description: '60 dias de devocional ininterrupto. Disciplina lendária.',
    points: 5000, icon: 'Crown', rarity: 'legendary', color: '#f59e0b'
  },
  hundred_devotionals: {
    name: 'Monge Digital 🧘',
    description: '100 devocionais concluídos.',
    points: 2000, icon: 'Brain', rarity: 'epic', color: '#a855f7'
  },
  points_5000: {
    name: 'Arena de Ouro 🥇',
    description: 'Acumulou 5.000 pontos XP.',
    points: 1000, icon: 'Coins', rarity: 'epic', color: '#a855f7'
  },
  max_level: {
    name: 'Lenda da Arena 🏆',
    description: 'Atingiu 10.000 pontos — o nível máximo de honra.',
    points: 2000, icon: 'Crown', rarity: 'legendary', color: '#f59e0b'
  },
  points_25000: {
    name: 'Imperador da Arena 👑',
    description: 'Acumulou 25.000 pontos XP.',
    points: 5000, icon: 'Crown', rarity: 'legendary', color: '#f59e0b'
  },
  complete_5_plans: {
    name: 'Explorador Bíblico 🗺️',
    description: 'Finalizou 5 planos de leitura.',
    points: 1500, icon: 'Map', rarity: 'epic', color: '#a855f7'
  },
  complete_10_plans: {
    name: 'Bibliomante 📖',
    description: 'Finalizou 10 planos de leitura completos.',
    points: 5000, icon: 'Library', rarity: 'legendary', color: '#f59e0b'
  },
  duel_master_50: {
    name: 'Mestre das Armas 🗡️',
    description: 'Venceu 50 duelos na Arena.',
    points: 1000, icon: 'Swords', rarity: 'epic', color: '#a855f7'
  },
  duel_master_100: {
    name: 'Gladiador Supremo 🗡️',
    description: 'Venceu 100 duelos na Arena.',
    points: 5000, icon: 'Swords', rarity: 'legendary', color: '#f59e0b'
  },
  top3_ranking: {
    name: 'Pódio de Elite 🏆',
    description: 'Alcançou o Top 3 no ranking geral.',
    points: 1500, icon: 'Medal', rarity: 'epic', color: '#a855f7'
  },
  tribe_hero: {
    name: 'Herói da Tribo 🦸',
    description: 'Alcançou o Top 1 no ranking geral de guerreiros.',
    points: 2000, icon: 'Crown', rarity: 'legendary', color: '#f59e0b'
  },
  ten_redemptions: {
    name: 'Rei da Loja 👑',
    description: 'Realizou 10 resgates na loja.',
    points: 1000, icon: 'ShoppingBag', rarity: 'epic', color: '#a855f7'
  },
  earn_5_badges: {
    name: 'Colecionador de Honras 🎖️',
    description: 'Recebeu 5 Selos de líderes da tribo.',
    points: 1500, icon: 'Award', rarity: 'epic', color: '#a855f7'
  },
  feed_master: {
    name: 'Lenda do Mural 📰',
    description: 'Publicou 50 vezes no Mural.',
    points: 1000, icon: 'Newspaper', rarity: 'epic', color: '#a855f7'
  },
  perfect_week_4: {
    name: '4 Semanas Perfeitas ⭐',
    description: 'Completou todas as tarefas em 4 semanas seguidas.',
    points: 2000, icon: 'CalendarCheck', rarity: 'epic', color: '#a855f7'
  },
  absolute_faith: {
    name: 'Fé Absoluta 🕊️',
    description: '100 tarefas devocionais completadas ao longo do tempo.',
    points: 5000, icon: 'Heart', rarity: 'legendary', color: '#f59e0b'
  },
  
  // ─── MAIS 23 TROFÉUS PARA COMPLETAR 100 ──────────────────────────────────
  bible_explorer: {
    name: 'Explorador da Bíblia 🧭',
    description: 'Navegou por todos os livros do Novo Testamento.',
    points: 150, icon: 'Compass', rarity: 'rare', color: '#3b82f6'
  },
  fast_learner: {
    name: 'Aprendiz Ágil 🎓',
    description: 'Completou 3 tarefas no mesmo dia.',
    points: 100, icon: 'GraduationCap', rarity: 'common', color: '#94a3b8'
  },
  social_leader: {
    name: 'Líder Social 🗣️',
    description: 'Recebeu 20 comentários em suas postagens.',
    points: 300, icon: 'Users', rarity: 'rare', color: '#3b82f6'
  },
  night_owl: {
    name: 'Coruja da Noite 🦉',
    description: 'Fez um devocional entre 00h e 04h.',
    points: 50, icon: 'Moon', rarity: 'common', color: '#94a3b8'
  },
  early_bird: {
    name: 'Madrugador 🌅',
    description: 'Fez um devocional entre 05h e 07h.',
    points: 50, icon: 'Sun', rarity: 'common', color: '#94a3b8'
  },
  helper_hand: {
    name: 'Mão Amiga 🤝',
    description: 'Ajudou a validar uma tarefa (para líderes).',
    points: 100, icon: 'Handshake', rarity: 'rare', color: '#3b82f6'
  },
  quiz_master: {
    name: 'Mestre do Quiz 🧠',
    description: 'Acertou todas as questões de um Quiz Bíblico.',
    points: 200, icon: 'Lightbulb', rarity: 'rare', color: '#3b82f6'
  },
  continuous_faith: {
    name: 'Fé Contínua 🔄',
    description: 'Manteve uma ofensiva de 90 dias.',
    points: 3000, icon: 'RefreshCw', rarity: 'epic', color: '#a855f7'
  },
  peace_maker: {
    name: 'Pacificador 🕊️',
    description: 'Participou de um duelo sem perder pontos.',
    points: 100, icon: 'Smile', rarity: 'common', color: '#94a3b8'
  },
  tribe_spirit: {
    name: 'Espírito de Equipe 🛡️',
    description: 'Sua tribo alcançou o primeiro lugar semanal.',
    points: 500, icon: 'Shield', rarity: 'epic', color: '#a855f7'
  },
  loyal_soldier: {
    name: 'Soldado Leal 🎖️',
    description: 'Não perdeu nenhum dia de Gincana por 3 meses.',
    points: 4000, icon: 'UserCheck', rarity: 'legendary', color: '#f59e0b'
  },
  donator: {
    name: 'Doador 🎁',
    description: 'Enviou uma reação premium no Mural.',
    points: 150, icon: 'Gift', rarity: 'rare', color: '#3b82f6'
  },
  sharp_eye: {
    name: 'Olho de Águia 🦅',
    description: 'Encontrou um erro no sistema e reportou.',
    points: 500, icon: 'Eye', rarity: 'epic', color: '#a855f7'
  },
  marathon_reader: {
    name: 'Maratonista Bíblico 🏃📖',
    description: 'Leu 10 capítulos em um único dia.',
    points: 300, icon: 'Zap', rarity: 'rare', color: '#3b82f6'
  },
  deep_thinker: {
    name: 'Pensador Profundo 🤔',
    description: 'Escreveu um comentário com mais de 200 caracteres.',
    points: 50, icon: 'FileText', rarity: 'common', color: '#94a3b8'
  },
  mountain_climber: {
    name: 'Alpinista de XP 🏔️',
    description: 'Ganhou mais de 500 XP em um único dia.',
    points: 1000, icon: 'Mountain', rarity: 'epic', color: '#a855f7'
  },
  flame_keeper: {
    name: 'Guardião da Chama 🔥',
    description: 'Manteve o Streak de leitura por 120 dias.',
    points: 8000, icon: 'Flame', rarity: 'legendary', color: '#f59e0b'
  },
  ocean_explorer: {
    name: 'Mergulho Profundo 🌊',
    description: 'Completou todos os Salmos.',
    points: 2500, icon: 'Waves', rarity: 'epic', color: '#a855f7'
  },
  diamond_mind: {
    name: 'Mente de Diamante 💎',
    description: 'Completou 50 Quizzes sem errar nenhuma pergunta.',
    points: 6000, icon: 'Gem', rarity: 'legendary', color: '#f59e0b'
  },
  architect: {
    name: 'Arquiteto da Fé 🏗️',
    description: 'Ajudou a organizar um evento da Gincana.',
    points: 1000, icon: 'Building', rarity: 'epic', color: '#a855f7'
  },
  unstoppable: {
    name: 'Imparável 🚀',
    description: 'Ganhou 5 duelos seguidos.',
    points: 500, icon: 'Rocket', rarity: 'epic', color: '#a855f7'
  },
  guardian_angel: {
    name: 'Anjo da Guarda 😇',
    description: 'Sugeriu um plano de leitura que 10 pessoas entraram.',
    points: 2000, icon: 'UserPlus', rarity: 'legendary', color: '#f59e0b'
  },
  final_warrior: {
    name: 'Guerreiro Final 🏆',
    description: 'Esteve presente no encerramento da Gincana.',
    points: 10000, icon: 'Award', rarity: 'legendary', color: '#ec4899'
  },
};

/**
 * Carrega as definições de conquistas do banco de dados.
 * Caso falhe ou não encontre, mantém as definições hardcoded acima.
 */
export async function loadAchievementDefinitions() {
  try {
    const { data, error } = await supabase
      .from('system_achievements')
      .select('*')
      .eq('is_active', true); // Coluna snake_case no banco

    if (error) throw error;

    if (data && data.length > 0) {
      // Começamos com os 100+ troféus base e aplicamos os overrides do banco
      const merged = { ...ACHIEVEMENT_DEFINITIONS }; 
      
      data.forEach((row: any) => {
        merged[row.key] = {
          name: row.name,
          description: row.description,
          points: row.points,
          icon: row.icon,
          rarity: row.rarity as Rarity,
          color: row.color || '#94a3b8',
          howToConquer: row.howToConquer
        };
      });
      
      ACHIEVEMENT_DEFINITIONS = merged;
      return merged;
    }
  } catch (err) {
    console.error('Error loading achievement definitions:', err);
  }
  return ACHIEVEMENT_DEFINITIONS;
}

export class AchievementService {
  /**
   * Verifica se o usuário atingiu os critérios para novas conquistas
   */
  static async check(userId: string) {
    try {
      // 🔒 TRAVA DE TEMPORADA: não distribui troféus antes do início oficial
      if (!(await isGincanaActive())) {
        console.info('[AchievementService] Gincana ainda não iniciada ou suspensa — troféus automáticos bloqueados.');
        return;
      }

      console.log(`[AchievementService] Iniciando checagem automática de troféus para: ${userId}`);

      // 🚀 Paralelizar as 4 queries independentes em vez de rodar sequencialmente
      const [participationsRes, redemptionsRes, profileRes, completionsRes] = await Promise.all([
        supabase
          .from('participations')
          .select('*', { count: 'exact', head: true })
          .eq('"userId"', userId)
          .eq('status', 'approved'),
        supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('"userId"', userId),
        supabase
          .from('profiles')
          .select('totalPoints, "streakLogin", "streakDevotional", "groupId", avatar_url, name, email, birthDate, gender')
          .eq('id', userId)
          .single(),
        supabase
          .from('bible_completions')
          .select('created_at')
          .eq('user_id', userId)
          .eq('is_devotional', true)
          .order('created_at', { ascending: false })
      ]);

      const tasksCount = participationsRes.count;
      const redemptionsCount = redemptionsRes.count;
      const profile = profileRes.data;
      const completions = completionsRes.data;

      let streak = 0;
      if (completions && completions.length > 0) {
        // Bug fix: usa data LOCAL (sv locale), não UTC, para evitar reset prematuro após 21h no Brasil
        const dates = [...new Set(completions.map((l: any) =>
          new Date(l.created_at).toLocaleDateString('sv')
        ))];
        const today = new Date().toLocaleDateString('sv');
        const checkDate = new Date();
        if (!dates.includes(today)) checkDate.setDate(checkDate.getDate() - 1);

        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (dates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Buscar conquistas existentes (depende das queries acima, fica serial)
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('"achievementKey"')
        .eq('"userId"', userId);

      const existingKeys = existing?.map((e: any) => e.achievementKey) || [];

      const hw = (key: string) => !existingKeys.includes(key);
      const toAward: string[] = [];

      const tc = tasksCount ?? 0;
      const rc = redemptionsCount ?? 0;
      const pts = (profile as any)?.totalPoints ?? 0;
      const streakLogin = (profile as any)?.streakLogin ?? 0;
      const streakDevotional = (profile as any)?.streakDevotional ?? 0;
      const devCount = completions?.length ?? 0;

      // ─── Busca paralela de dados extras incluindo vitórias de duelos ─────────
      const [feedPostsRes, chaptersRes, plansRes, userBadgesRes, duelWinsRes] = await Promise.all([
        supabase.from('feed_posts').select('*', { count: 'exact', head: true }).eq('authorId', userId),
        supabase.from('bible_completions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_devotional', false),
        supabase.from('reading_plan_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('"userId"', userId),
        supabase.from('duel_rooms').select('*', { count: 'exact', head: true })
          .eq('winner_id', userId)
          .eq('status', 'finished'),
      ]);
      const postsCount = feedPostsRes.count ?? 0;
      const chaptersCount = chaptersRes.count ?? 0;
      const plansCount = plansRes.count ?? 0;
      const badgesCount = userBadgesRes.count ?? 0;
      const duelWins = duelWinsRes.count ?? 0;

      // ─── SETOR FÁCIL ──────────────────────────────────────────────────────────
      if (hw('first_login') && streakLogin >= 1) toAward.push('first_login');
      if (hw('daily_visit_1') && streakLogin >= 1) toAward.push('daily_visit_1');
      if (hw('welcome_bonus') && profile) toAward.push('welcome_bonus'); // Se o perfil existe, ele se cadastrou
      if (hw('first_group') && (profile as any)?.groupId) toAward.push('first_group');
      if (hw('profile_photo') && (profile as any)?.avatar_url) toAward.push('profile_photo');
      
      // Perfil Completo: nome, email, birthDate, groupId, gender
      const p = profile as any;
      if (hw('profile_complete') && p?.name && p?.email && p?.birthDate && p?.groupId && p?.gender) {
        toAward.push('profile_complete');
      }

      if (hw('first_task')  && tc >= 1)  toAward.push('first_task');
      if (hw('two_tasks')   && tc >= 2)  toAward.push('two_tasks');
      if (hw('store_fan')   && rc >= 1)  toAward.push('store_fan');
      if (hw('first_xp_earned') && pts >= 1) toAward.push('first_xp_earned');
      if (hw('first_devotional') && devCount >= 1) toAward.push('first_devotional');
      if (hw('first_chapter') && chaptersCount >= 1) toAward.push('first_chapter');
      if (hw('first_feed_post') && postsCount >= 1) toAward.push('first_feed_post');
      if (hw('streak_login_3') && streakLogin >= 3) toAward.push('streak_login_3');

      // Troféus de duelo (setor fácil)
      if (hw('first_duel') && duelWins >= 1) toAward.push('first_duel');

      // ─── SETOR MÉDIO ──────────────────────────────────────────────────────────
      if (hw('five_tasks')        && tc >= 5)   toAward.push('five_tasks');
      if (hw('ten_tasks')         && tc >= 10)  toAward.push('ten_tasks');
      if (hw('twenty_tasks')      && tc >= 20)  toAward.push('twenty_tasks');
      if (hw('points_500')        && pts >= 500)   toAward.push('points_500');
      if (hw('points_1000')       && pts >= 1000)  toAward.push('points_1000');
      if (hw('three_redemptions') && rc >= 3)   toAward.push('three_redemptions');
      if (hw('five_devotionals')  && devCount >= 5)  toAward.push('five_devotionals');
      if (hw('twenty_devotionals')&& devCount >= 20) toAward.push('twenty_devotionals');
      if (hw('read_10_chapters')  && chaptersCount >= 10) toAward.push('read_10_chapters');
      if (hw('read_30_chapters')  && chaptersCount >= 30) toAward.push('read_30_chapters');
      if (hw('bible_reader')      && plansCount >= 1) toAward.push('bible_reader');
      if (hw('two_plans_complete')&& plansCount >= 2) toAward.push('two_plans_complete');
      if (hw('earn_badge')        && badgesCount >= 1) toAward.push('earn_badge');
      if (hw('post_5_times')      && postsCount >= 5)  toAward.push('post_5_times');
      if (hw('earn_5_badges')     && badgesCount >= 5) toAward.push('earn_5_badges');

      // Vitórias de duelos (setor médio)
      if (hw('duel_victor_5')  && duelWins >= 5)  toAward.push('duel_victor_5');
      if (hw('duel_victor_10') && duelWins >= 10) toAward.push('duel_victor_10');

      // Streaks de leitura (médio)
      if (hw('reading_streak_7') && streak >= 7) toAward.push('reading_streak_7');

      // Streaks de login (médio)
      for (const m of [7, 14, 21]) {
        if (hw(`streak_login_${m}`) && streakLogin >= m) toAward.push(`streak_login_${m}`);
      }
      // Streaks devocionais (médio)
      if (hw('streak_devotional_7') && streakDevotional >= 7) toAward.push('streak_devotional_7');

      // ─── SETOR DIFÍCIL ────────────────────────────────────────────────────────
      if (hw('veteran')       && tc >= 15)  toAward.push('veteran');
      if (hw('thirty_tasks')  && tc >= 30)  toAward.push('thirty_tasks');
      if (hw('fifty_tasks')   && tc >= 50)  toAward.push('fifty_tasks');
      if (hw('hundred_tasks') && tc >= 100) toAward.push('hundred_tasks');
      if (hw('points_5000')   && pts >= 5000)  toAward.push('points_5000');
      if (hw('max_level')     && pts >= 10000) toAward.push('max_level');
      if (hw('points_25000')  && pts >= 25000) toAward.push('points_25000');
      if (hw('ten_redemptions')  && rc >= 10)  toAward.push('ten_redemptions');
      if (hw('hundred_devotionals') && devCount >= 100) toAward.push('hundred_devotionals');
      if (hw('complete_5_plans')   && plansCount >= 5)  toAward.push('complete_5_plans');
      if (hw('complete_10_plans')  && plansCount >= 10) toAward.push('complete_10_plans');
      if (hw('feed_master')        && postsCount >= 50) toAward.push('feed_master');

      // Vitórias de duelos (setor difícil)
      if (hw('duel_master_50')  && duelWins >= 50)  toAward.push('duel_master_50');
      if (hw('duel_master_100') && duelWins >= 100) toAward.push('duel_master_100');

      // Streaks de leitura (difícil)
      if (hw('reading_streak_15') && streak >= 15) toAward.push('reading_streak_15');
      if (hw('reading_streak_30') && streak >= 30) toAward.push('reading_streak_30');
      if (hw('reading_streak_60') && streak >= 60) toAward.push('reading_streak_60');

      // Streaks de login (difícil)
      for (const m of [30, 60, 100, 180, 365]) {
        if (hw(`streak_login_${m}`) && streakLogin >= m) toAward.push(`streak_login_${m}`);
      }
      // Streaks devocionais (difícil)
      for (const m of [14, 30, 60]) {
        if (hw(`streak_devotional_${m}`) && streakDevotional >= m) toAward.push(`streak_devotional_${m}`);
      }

      for (const key of toAward) {
        await this.award(userId, key);
      }

    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  }

  private static async award(userId: string, key: string) {
    const def = ACHIEVEMENT_DEFINITIONS[key as keyof typeof ACHIEVEMENT_DEFINITIONS];
    if (!def) return;

    // 🔒 Segunda barreira: garante que award() também seja bloqueado se chamado diretamente
    if (!(await isGincanaActive())) return;

    try {
      // Bug fix: aspas duplas no VALOR (coluna camelCase), não na chave JS
      // Forma correta: { userId: ... } — o SDK Supabase gerencia a citação SQL internamente
      const { error } = await supabase
        .from('user_achievements')
        .insert({ userId: userId, achievementKey: key });

      if (error) return;

      // Busca única do perfil (evita duplo fetch)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, groupId, avatar_url, avatarUrl')
        .eq('id', userId)
        .single();
      
      await supabase.rpc('increment_points', {
        user_id: userId,
        group_id: profile?.groupId,
        pts: def.points,
        reason: `Conquista: ${def.name}`
      });

      // Notificar o usuário
      const rarityLabel = def.rarity === 'legendary' ? '🏆 TROFEU LENDARIO' : 
                          def.rarity === 'epic' ? '🛡️ CONQUISTA EPICA' : 
                          def.rarity === 'rare' ? '🏅 MEDALHA RARA' : '🎖️ SELO';

      const userAvatar = profile?.avatar_url || (profile as any)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'guerreiro'}`;

      await NotificationService.send(
        userId,
        'achievement',
        `${rarityLabel}: ${def.name}`,
        `Você desbloqueou algo incrível: ${def.description} (+${def.points} pts)`,
        undefined,
        userAvatar
      );

      // 📢 Notificar no Chat Global se for Épico ou Lendário
      if (def.rarity === 'epic' || def.rarity === 'legendary') {
        await supabase.from('messages').insert({
          senderId: 'system',
          senderName: 'SISTEMA ARENA',
          text: `🔥 ABSURDO! ${profile?.name} acaba de alcançar o status de ${def.rarity.toUpperCase()} ao desbloquear: "${def.name}"! Reverência ao guerreiro! 👑`,
          groupId: 'global'
        });
      }

    } catch (err) {
      console.error('Error awarding achievement:', err);
    }
  }

  /**
   * Concede uma conquista somente se o usuário ainda não a possui.
   * Chamado diretamente pelo AutomationService no loop de milestones.
   */
  static async awardIfNotExists(userId: string, key: string): Promise<void> {
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('"userId"', userId)
      .eq('"achievementKey"', key)
      .maybeSingle();

    if (!existing) {
      await this.award(userId, key);
    }
  }
}
