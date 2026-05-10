import { supabase } from './supabase';
import { NotificationService } from './NotificationService';
import { AchievementService } from './AchievementService';
import { FeedService } from './FeedService';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type StreakType = 'login' | 'devotional';

interface StreakProfile {
  groupId: string | null;
  streakLogin: number;
  streakLoginLastDate: string | null;
  streakLoginMax: number;
  streakDevotional: number;
  streakDevotionalLastDate: string | null;
  streakDevotionalMax: number;
}

// ─── MILESTONES ──────────────────────────────────────────────────────────────

const LOGIN_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
const DEVOTIONAL_MILESTONES = [7, 14, 30, 60];

const MILESTONE_MESSAGES: Record<number, string> = {
  3:   '3 dias em chamas! ⚡ Sua ofensiva está se formando!',
  7:   '🔥 7 dias! Uma semana de presença inabalável!',
  14:  '💪 14 dias! Duas semanas de guerra espiritual contínua!',
  30:  '🏆 30 dias! UM MÊS COMPLETO! Guerreiro do mês!',
  60:  '💎 60 dias! Você é inabalável!',
  100: '🌟 100 DIAS! Status de Centurião conquistado!',
  365: '🔱 UM ANO INTEIRO! Guardião Eterno da Arena!',
};

// ─── AUTOMATION SERVICE ───────────────────────────────────────────────────────

export class AutomationService {
  /**
   * Verifica se hoje é aniversário do usuário e executa as ações de celebração.
   */
  static async checkBirthday(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, birthDate, groupId, avatar_url, avatarUrl')
        .eq('id', userId)
        .single();
        
      if (!profile?.birthDate) return false;
      
      const parts = profile.birthDate.split('-');
      if (parts.length < 3) return false;
      
      const bMonth = parseInt(parts[1]);
      const bDay = parseInt(parts[2]);
      
      if (bMonth === month && bDay === day) {
        const logReason = `Birthday Celebration ${year}`;
        
        const { data: existingLog } = await supabase
          .from('point_logs')
          .select('id')
          .eq('"userId"', userId)
          .eq('reason', logReason)
          .maybeSingle();
          
        if (existingLog) return true;
        
        await FeedService.createPost({
          authorId: userId,
          groupId: profile.groupId || undefined,
          postType: 'announcement',
          caption: `🎂 HOJE O DIA É TODO MEU! Celebrando mais um ano de vida e muitas vitórias na Arena da Tribo! 🔥`,
          visibility: 'public'
        });
        
        await NotificationService.notifyAll(
          'announcement',
          `🎂 Parabéns, ${profile.name}!`,
          `Hoje é aniversário de um grande guerreiro da nossa Arena! Deixe seu parabéns no Mural!`,
          '/dashboard',
          profile.avatar_url || profile.avatarUrl
        );
        
        await supabase.rpc('increment_points', {
          user_id: userId,
          group_id: profile.groupId || '',
          pts: 100,
          reason: logReason
        });
        
        return true;
      }
    } catch (err) {
      console.error('Error in checkBirthday:', err);
    }
    return false;
  }

  /**
   * Ponto de entrada para o login diário.
   * Concede o bônus de pontos e atualiza a ofensiva de presença.
   */
  static async handleDailyLogin(userId: string) {
    try {
      // 🛡️ GUARD DE SESSÃO: Garante execução única por dia na sessão do navegador.
      const today = todayLocal();
      const sessionKey = `daily_login_done_${userId}_${today}`;
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, 'true');

      // 1. Buscar configurações do App (única query — reaproveitada para trava e bônus)
      const { data: configData } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'app')
        .single();

      const config = configData?.value as any;

      // 🔒 TRAVA DE TEMPORADA: não processa login/pontos antes do início oficial
      const gincanaStatus = config?.gincanaStatus;
      if (gincanaStatus && gincanaStatus !== 'active') {
        console.info(`[AutomationService] Gincana não ativa (Status: ${gincanaStatus || 'indefinido'}) — login diário suspenso.`);
        return;
      }

      const bonusConfig = config?.dailyLoginBonus;
      if (bonusConfig && bonusConfig.enabled === false) return;

      const pointsToAward = bonusConfig?.points ?? 5;
      
      console.log(`[AutomationService] Iniciando processamento de login para usuário: ${userId}`);

      // 2. Buscar perfil completo (com streak)
      const { data: profile } = await supabase
        .from('profiles')
        .select(`groupId, "streakLogin", "streakLoginLastDate", "streakLoginMax",
                 "streakDevotional", "streakDevotionalLastDate", "streakDevotionalMax"`)
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return;

      // 🚀 TRAVA DE SEGURANÇA: Se a data do último login for hoje, interromper imediatamente
      if (profile.streakLoginLastDate === today) {
        return;
      }

      // 3. Verificar se o bônus de pontos já foi dado hoje (Check secundário via point_logs)
      const { data: todayBonus } = await supabase
        .from('point_logs')
        .select('id')
        .eq('"userId"', userId)
        .ilike('reason', '%Login Di%')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (!todayBonus || todayBonus.length === 0) {
        // Conceder pontos do login
        const { error: rpcError } = await supabase.rpc('increment_points', {
          user_id: userId,
          group_id: profile.groupId || '',
          pts: pointsToAward,
          reason: 'Bonus de Presenca Digital (Login Diario)',
        });

        if (rpcError) {
          console.warn('RPC increment_points falhou:', rpcError.message);
        }

        await NotificationService.send(
          userId,
          'login',
          'Presença Confirmada! ⚡',
          `Você acaba de ganhar +${pointsToAward} pontos por acessar a Arena hoje. Mantenha a constância!`
        );
      }

      // 4. Atualizar streak de login (independente dos pontos)
      await AutomationService.handleStreakUpdate(userId, 'login', profile as StreakProfile);

      // 5. Verificar troféus globais
      await AchievementService.check(userId);

    } catch (err) {
      console.error('AutomationService.handleDailyLogin error:', err);
    }
  }

  /**
   * Chamado após a conclusão do devocional diário.
   * Atualiza a ofensiva devocional e verifica troféus.
   */
  static async handleDevotionalStreak(userId: string) {
    try {
      // 🔒 TRAVA DE TEMPORADA
      const { data: configData } = await supabase
        .from('config').select('value').eq('key', 'app').single();
      const gincanaStatus = (configData?.value as any)?.gincanaStatus;
      if (gincanaStatus && gincanaStatus !== 'active') return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`groupId, "streakLogin", "streakLoginLastDate", "streakLoginMax",
                 "streakDevotional", "streakDevotionalLastDate", "streakDevotionalMax"`)
      .eq('id', userId)
        .maybeSingle();

      if (!profile) return;

      await AutomationService.handleStreakUpdate(userId, 'devotional', profile as StreakProfile);

      // Verificar troféus globais
      await AchievementService.check(userId);
    } catch (err) {
      console.error('AutomationService.handleDevotionalStreak error:', err);
    }
  }

  /**
   * Núcleo do sistema de ofensivas.
   * Calcula o novo streak, protege com shield se disponível, atualiza o banco
   * e dispara a concessão de troféus nos marcos.
   */
  static async handleStreakUpdate(
    userId: string,
    type: StreakType,
    profile: StreakProfile
  ): Promise<number> {
    const today = todayLocal();
    const yesterday = yesterdayLocal();

    const streakField      = type === 'login' ? 'streakLogin'              : 'streakDevotional';
    const lastDateField    = type === 'login' ? 'streakLoginLastDate'      : 'streakDevotionalLastDate';
    const maxField         = type === 'login' ? 'streakLoginMax'           : 'streakDevotionalMax';

    const currentStreak  = (profile[streakField] as number)  ?? 0;
    const lastDate       = profile[lastDateField] as string | null;
    const currentMax     = (profile[maxField] as number)     ?? 0;

    // Já processado hoje
    if (lastDate === today) return currentStreak;

    let newStreak: number;

    if (lastDate === yesterday) {
      // Consecutivo normal
      newStreak = currentStreak + 1;
    } else if (lastDate && daysBetween(lastDate, today) === 2) {
      // Perdeu exatamente 1 dia — verificar escudo
      const { data: shield } = await supabase
        .from('streak_shields')
        .select('id')
        .eq('"userId"', userId)
        .eq('type', type)
        .is('used_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (shield) {
        // Consumir o escudo e manter streak
        await supabase
          .from('streak_shields')
          .update({ used_at: new Date().toISOString() })
          .eq('id', shield.id);

        newStreak = currentStreak + 1;

        await NotificationService.send(
          userId,
          'achievement',
          '🛡️ Escudo Ativado!',
          `Seu escudo de ofensiva foi usado para proteger sua sequência de ${currentStreak} dias!`
        );
      } else {
        newStreak = 1; // Reset sem escudo
      }
    } else {
      newStreak = 1; // Reset (gap > 1 dia)
    }

    const newMax = Math.max(newStreak, currentMax);

    // Atualizar banco
    await supabase
      .from('profiles')
      .update({
        [streakField]:   newStreak,
        [lastDateField]: today,
        [maxField]:      newMax,
      } as any)
      .eq('id', userId);

    // Verificar marcos e conceder troféus
    await AutomationService.checkStreakMilestones(userId, type, newStreak, currentStreak);

    return newStreak;
  }

  /**
   * Verifica se o novo streak atingiu algum marco e concede troféu + post no mural.
   */
  private static async checkStreakMilestones(
    userId: string,
    type: StreakType,
    newStreak: number,
    previousStreak: number
  ) {
    const milestones = type === 'login' ? LOGIN_MILESTONES : DEVOTIONAL_MILESTONES;

    for (const milestone of milestones) {
      // Dispara para TODOS os marcos cruzados (ex: streak saltou de 2 para 30)
      // Bug fix: o 'break' anterior impedia que múltiplos marcos fossem concedidos num único salto
      if (newStreak >= milestone && previousStreak < milestone) {
        const key = `streak_${type}_${milestone}`;

        // Conceder troféu (idempotente)
        await AchievementService.awardIfNotExists(userId, key).catch(console.error);

        // Notificar com mensagem temática
        const msg = MILESTONE_MESSAGES[milestone];
        if (msg) {
          await NotificationService.send(
            userId,
            'achievement',
            `🔥 OFENSIVA DE ${milestone} DIAS!`,
            `${msg} Continue assim, guerreiro!`
          ).catch(console.error);
        }
      }
    }
  }

  /**
   * Sugere missões automáticas baseadas no histórico (Backend simulation)
   */
  static async scheduleAutomatedChallenges() {
    // Placeholder para futura automação de desafios por backend
  }
}
