import { supabase } from './supabase';
import { NotificationService } from './NotificationService';

export interface PendingMission {
  id: string;
  type: 'activity' | 'event';
  userId: string;
  userName: string;
  title: string;
  proofUrl: string;
  points: number;
  date: string;
  groupId: string;
}

export class ValidationService {
  static async getPendingAll(): Promise<PendingMission[]> {
    // 1. Buscar participações de atividades normais
    const { data: acts } = await supabase
      .from('participations')
      .select('*, activities(title, points), profiles(name)')
      .eq('status', 'pending');

    // 2. Buscar participações de eventos do calendário
    const { data: evts } = await supabase
      .from('event_participations')
      .select('*, calendar_events(title, points), profiles(name)')
      .eq('status', 'pending');

    const formattedActs: PendingMission[] = (acts || []).map(a => ({
      id: a.id,
      type: 'activity',
      userId: a.user_id,
      userName: a.profiles?.name || 'Membro',
      title: a.activities?.title || 'Atividade',
      proofUrl: a.proof_url || a.proofUrl,
      points: a.activities?.points || 0,
      date: a.created_at,
      groupId: a.group_id || a.groupId
    }));

    const formattedEvts: PendingMission[] = (evts || []).map(e => ({
      id: e.id,
      type: 'event',
      userId: e.user_id,
      userName: e.profiles?.name || 'Membro',
      title: e.calendar_events?.title || 'Missão',
      proofUrl: e.proof_url,
      points: e.calendar_events?.points || 0,
      date: e.occurrence_date,
      groupId: e.profiles?.groupId // Assumindo que pegamos o grupo do perfil
    }));

    return [...formattedActs, ...formattedEvts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  static async validate(mission: PendingMission, status: 'approved' | 'rejected', senderAvatarUrl?: string) {
    const table = mission.type === 'activity' ? 'participations' : 'event_participations';
    
    // Atualizar status na tabela correspondente
    const { error: updateError } = await supabase
      .from(table)
      .update({ status })
      .eq('id', mission.id);

    if (updateError) throw updateError;

    if (status === 'approved') {
      // Creditar Pontos via RPC
      await supabase.rpc('increment_points', {
        user_id: mission.userId,
        group_id: mission.groupId,
        pts: mission.points,
        reason: `Aprovação: ${mission.title}`
      });

      // Notificar Usuário
      await NotificationService.send(
        mission.userId,
        'task_approved',
        'Missão Cumprida! 🏆',
        `Sua prova para "${mission.title}" foi aprovada. +${mission.points} XP na conta!`,
        '/dashboard/calendar',
        senderAvatarUrl
      );
    } else {
      await NotificationService.send(
        mission.userId,
        'task_rejected',
        'Prova Recusada ❌',
        `Sua prova para "${mission.title}" não foi aceita. Fale com seu líder para saber o motivo.`,
        '/dashboard/calendar',
        senderAvatarUrl
      );
    }

    return true;
  }
}
