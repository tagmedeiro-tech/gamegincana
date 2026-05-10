/**
 * PushService.ts
 *
 * Serviço centralizado de Push Notifications.
 * Funciona tanto no app nativo (Capacitor) quanto no web (sem-op).
 * Integrado ao Supabase para persistência de tokens e campanhas.
 */

import { supabase } from './supabase';
import { initPushNotifications, isNative } from './nativeCapabilities';

// ─── Token Registration ───────────────────────────────────────────────────────

/**
 * Inicializa o push para um usuário autenticado.
 * Deve ser chamado após o login bem-sucedido.
 */
export const PushService = {

  async register(userId: string) {
    if (!isNative) return; // no-op no browser
    await initPushNotifications(userId, supabase);
  },

  // ─── Admin: Enviar Push para todos (ou grupo específico) ──────────────────

  /**
   * Envia uma notificação push via Supabase Edge Function (servidor).
   * O Edge Function lida com a chamada à FCM/APNS.
   */
  async sendCampaign(payload: {
    title: string;
    body: string;
    target: 'all' | string;  // 'all' | 'tribe:leoes' | 'user:uuid'
    data?: Record<string, string>;
    createdBy: string;
  }) {
    // 1. Salvar campanha no banco
    const { data: campaign, error } = await supabase
      .from('push_campaigns')
      .insert({
        title: payload.title,
        body: payload.body,
        target: payload.target,
        data: payload.data || {},
        created_by: payload.createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Coletar tokens alvo
    let tokenQuery = supabase
      .from('profiles')
      .select('id, push_token')
      .not('push_token', 'is', null);

    if (payload.target !== 'all') {
      if (payload.target.startsWith('tribe:')) {
        const tribeId = payload.target.replace('tribe:', '');
        tokenQuery = tokenQuery.eq('"groupId"', tribeId) as any;
      } else if (payload.target.startsWith('user:')) {
        const userId = payload.target.replace('user:', '');
        tokenQuery = tokenQuery.eq('id', userId) as any;
      }
    }

    const { data: targets } = await tokenQuery;
    if (!targets?.length) return { campaign, sent: 0 };

    // 3. Registrar logs (o Edge Function pode usar isso para processar)
    const logs = targets.map(t => ({
      campaign_id: campaign.id,
      user_id: t.id,
      token: t.push_token,
      status: 'pending',
    }));

    await supabase.from('push_logs').insert(logs);

    // 4. Disparar Edge Function (se configurada) — ou usar Firebase Admin SDK
    // Por enquanto, o envio real ocorre via console Firebase/APNS
    // quando o Edge Function "send-push" for configurado no Supabase.
    console.log(`[PushService] Campanha ${campaign.id} criada. ${targets.length} tokens enfileirados.`);

    return { campaign, sent: targets.length };
  },

  // ─── Helper: Enviar para um usuário específico (missão completada, etc.) ──

  async notifyUser(userId: string, title: string, body: string, url?: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) return;

    await supabase.from('push_campaigns').insert({
      title,
      body,
      target: `user:${userId}`,
      data: url ? { url } : {},
    });
  },
};
