import { supabase } from './supabase';
import { NotificationType } from '../types';

export const NotificationService = {
  /**
   * Envia uma notificação para um usuário específico
   */
  async send(userId: string, type: NotificationType, title: string, content: string, link?: string, senderAvatarUrl?: string) {
    try {
      // Injeta o avatar como metadado oculto no conteúdo se fornecido
      const finalContent = senderAvatarUrl ? `${content} [avatar:${senderAvatarUrl}]` : content;

      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        content: finalContent,
        link,
        read: false
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  },

  /**
   * Notifica todos os Administradores do sistema
   */
  async notifyAdmins(type: NotificationType, title: string, content: string, link?: string, senderAvatarUrl?: string) {
    try {
      const { data: admins, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      
      if (fetchError) {
        console.error('[NotificationService] Erro ao buscar admins:', fetchError);
        return;
      }

      if (!admins || admins.length === 0) {
        console.warn('[NotificationService] Nenhum admin encontrado para notificar. Verifique se existem perfis com role="admin".');
        return;
      }

      const finalContent = senderAvatarUrl ? `${content} [avatar:${senderAvatarUrl}]` : content;

      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type,
        title,
        content: finalContent,
        link,
        read: false
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) {
        console.error('[NotificationService] Erro ao inserir notificações para admins:', insertError);
      }
    } catch (err) {
      console.error('[NotificationService] Falha crítica em notifyAdmins:', err);
    }
  },

  /**
   * Notifica o Líder de um grupo específico
   */
  async notifyGroupLeader(groupId: string, type: NotificationType, title: string, content: string, link?: string, senderAvatarUrl?: string) {
    try {
      // Busca o líder do grupo
      const { data: group } = await supabase
        .from('groups')
        .select('leaderId')
        .eq('id', groupId)
        .single();
      
      if (group?.leaderId) {
        await this.send(group.leaderId, type, title, content, link, senderAvatarUrl);
      }
    } catch (err) {
      console.error('Error notifying group leader:', err);
    }
  },

  /**
   * Notifica tanto o Admin quanto o Líder do grupo sobre uma ação de membro
   */
  async notifyStaff(groupId: string | undefined, type: NotificationType, title: string, content: string, link?: string, senderAvatarUrl?: string) {
    // Notifica admin
    await this.notifyAdmins(type, title, content, link, senderAvatarUrl);
    // Notifica líder se houver grupo
    if (groupId) {
      await this.notifyGroupLeader(groupId, type, title, content, link, senderAvatarUrl);
    }
  },

  /**
   * Notifica todos os usuários do sistema
   */
  async notifyAll(type: NotificationType, title: string, content: string, link?: string, senderAvatarUrl?: string) {
    try {
      const { data: users, error: fetchError } = await supabase.from('profiles').select('id');
      
      if (fetchError) {
        console.error('[NotificationService] Erro ao buscar todos os usuários:', fetchError);
        return;
      }

      if (!users || users.length === 0) return;

      const finalContent = senderAvatarUrl ? `${content} [avatar:${senderAvatarUrl}]` : content;
      
      const allNotifications = users.map(u => ({
        user_id: u.id,
        type,
        title,
        content: finalContent,
        link,
        read: false
      }));

      // Divide em batches de 500 para respeitar o limite de insert do Supabase
      // (padrão: ~1000 linhas por request; usando 500 como margem de segurança)
      const BATCH_SIZE = 500;
      const batches: typeof allNotifications[] = [];
      for (let i = 0; i < allNotifications.length; i += BATCH_SIZE) {
        batches.push(allNotifications.slice(i, i + BATCH_SIZE));
      }

      const results = await Promise.allSettled(
        batches.map(batch => supabase.from('notifications').insert(batch))
      );

      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
      if (failed.length > 0) {
        console.error(`[NotificationService] ${failed.length}/${batches.length} batches falharam ao notificar todos.`);
      }
    } catch (err) {
      console.error('[NotificationService] Falha crítica em notifyAll:', err);
    }
  }
};
