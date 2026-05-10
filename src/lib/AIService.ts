import { supabase } from './supabase';
import { UserProfile } from '../types';

export interface DailyMission {
  title: string;
  description: string;
  points: number;
  icon: string;
  category: string;
  targetPath?: string;
}

export class AIService {
  /**
   * Sugere uma missão do dia baseada no histórico recente do usuário
   */
  static async getDailyMission(user: UserProfile): Promise<DailyMission> {
    const defaultMissions: DailyMission[] = [
      { title: 'Intercessor da Tribo', description: 'Ore por um membro da sua tribo que esta afastado hoje.', points: 15, icon: '🙏', category: 'relacionamento', targetPath: '/chat' },
      { title: 'Evangelista Digital', description: 'Compartilhe o link de convite da Gincana com 3 amigos.', points: 25, icon: '📱', category: 'online', targetPath: '/activities' }
    ];

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // FIX: 'definitionId' nao existe em point_logs — usar 'reason' como proxy
      const { data: recentLogs } = await supabase
        .from('point_logs')
        .select('reason')
        .eq('"userId"', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      const reasons = recentLogs ? recentLogs.map(l => (l.reason || '').toLowerCase()) : [];
      const hasDevocional = reasons.some(r => r.includes('devoc') || r.includes('leitura') || r.includes('biblia'));
      const hasCulto = reasons.some(r => r.includes('culto') || r.includes('presenc'));

      if (!hasDevocional) {
        return { title: 'Mestre da Palavra', description: 'A IA notou que voce ainda nao leu a Palavra ultimamente! Faca o seu devocional hoje e recupere o tempo.', points: 30, icon: '📖', category: 'devocional', targetPath: '/bible' };
      }
      
      if (!hasCulto) {
         return { title: 'Fogo e Gloria', description: 'Voce sabia que trazer visitantes rende pontos extras? Prepare seu convite para o proximo evento!', points: 50, icon: '🔥', category: 'evangelismo', targetPath: '/activities' };
      }

      return { title: 'Testemunho Vivo', description: 'Sua constancia esta otima! Entre no chat da sua Tribo e conte qual foi a melhor parte do seu devocional de hoje.', points: 15, icon: '🌟', category: 'relacionamento', targetPath: '/chat' };

    } catch {
      const now = new Date();
      const day = now.getDay();
      return defaultMissions[day % defaultMissions.length];
    }
  }

  /**
   * Analisa o comportamento do usuário e gera uma dica de mentoria personalizada
   */
  static async getMentorshipAdvice(user: UserProfile): Promise<{ advice: string; tag: string }> {
    try {
      // 1. Verifica se tem muitas tarefas pendentes
      // FIX: coluna e 'userId' (camelCase), nao 'user_id'
      const { count: pendingCount } = await supabase
        .from('participations')
        .select('*', { count: 'exact', head: true })
        .eq('"userId"', user.id)
        .eq('status', 'pending');

      if (pendingCount && pendingCount > 3) {
        return {
          advice: `Voce tem ${pendingCount} tarefas aguardando aprovacao. Continue assim, sua tribo vai disparar no ranking quando forem aprovadas!`,
          tag: 'Incentivo'
        };
      }

      // 2. Verifica se o usuario e novo
      if (user.totalPoints < 50) {
        return {
          advice: "Bem-vindo a jornada! Sua primeira grande meta e chegar ao Nivel 2 (Guerreiro). Tente o 'Devocional Diario' para comecar.",
          tag: 'Dica de Carreira'
        };
      }

      // 3. Analisa participacoes recentes
      // FIX: 'pointsEarned' (camelCase), nao 'points_earned'
      const { data: recent } = await supabase
        .from('participations')
        .select('"pointsEarned", created_at')
        .eq('"userId"', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recent || recent.length === 0) {
        return {
          advice: "Parece que voce esta um pouco parado. Que tal ler um capitulo da Biblia agora e ganhar seus primeiros 10 pontos de hoje?",
          tag: 'Ativacao'
        };
      }

      // 4. Analisa troféus básicos faltantes (Ganhos fáceis de XP)
      const { data: myAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('"userId"', user.id);
      
      const myIds = (myAchievements || []).map(a => a.achievement_id);

      if (!myIds.includes('profile_photo')) {
        return {
          advice: "Sua arena parece vazia sem seu rosto! Adicione uma foto de perfil e ganhe o troféu 'Rosto na Arena' (+15 XP).",
          tag: 'Conquista Fácil'
        };
      }

      if (!myIds.includes('first_comment')) {
        return {
          advice: "Sua voz é importante! Comente em qualquer postagem no Mural para ganhar o troféu 'Voz Ativa' (+20 XP).",
          tag: 'Engajamento'
        };
      }

      if (!myIds.includes('first_reading_plan')) {
        return {
          advice: "Quer subir de nível rápido? Entre em um Plano de Leitura na aba 'Bíblia'. É a forma mais constante de ganhar XP!",
          tag: 'Estratégia'
        };
      }

      const genericAdvices = [
        { advice: "O segredo do topo do ranking é a constância. Pequenas tarefas diárias somam grandes vitórias para sua tribo!", tag: 'Estratégia' },
        { advice: user.coins > 50 ? "Você acumulou uma boa quantia de moedas! Já conferiu as novidades da Loja hoje?" : "Sabia que completar desafios manuais rende mais moedas para gastar na Loja?", tag: 'Recompensa' },
        { advice: "Sua liderança é percebida pelo seu exemplo. Continue engajado no Mural para inspirar outros guerreiros.", tag: 'Liderança' },
        { advice: "A Arena está em constante evolução. Mantenha seu devocional em dia para não perder o bônus de ofensiva (Streak)!", tag: 'Foco' },
        { advice: "Duelo Sagrado: Sabia que vencer um oponente online te dá um bônus massivo de XP e Moedas? Desafie alguém agora!", tag: 'Arena' }
      ];

      return genericAdvices[Math.floor(Math.random() * genericAdvices.length)];
    } catch {
      return { advice: "Continue firme na sua caminhada com Cristo e com sua tribo!", tag: 'Espiritual' };
    }
  }

  /**
   * Verifica se houve inatividade e dispara alertas (Logic for Cron/Backend simulation)
   */
  static async checkInactivity(_userId: string): Promise<boolean> {
    // FIX: 'last_login' nao existe em profiles — funcao desativada como simulacao
    return false;
  }
}
