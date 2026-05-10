// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// --- Configurações FCM ---
// NOTA: Você precisará configurar a variável FIREBASE_SERVICE_ACCOUNT no painel do Supabase
// contendo o JSON da sua Service Account do Firebase.

interface PushPayload {
  title: string
  body: string
  tokens: string[]
  data?: Record<string, string>
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record, type } = payload // Payload enviado pelo Webhook do Supabase

    // Só processamos novos registros (INSERT)
    if (type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignoring non-insert event' }), { status: 200 })
    }

    const campaign = record
    console.log(`[Push] Iniciando campanha: ${campaign.id} - ${campaign.title}`)

    // 1. Inicializar cliente Supabase com a chave de serviço (Service Role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Coletar tokens baseado no alvo (target)
    let tokenQuery = supabase
      .from('profiles')
      .select('id, push_token')
      .not('push_token', 'is', null)

    if (campaign.target !== 'all') {
      if (campaign.target.startsWith('tribe:')) {
        const tribeId = campaign.target.replace('tribe:', '')
        tokenQuery = tokenQuery.eq('groupId', tribeId)
      } else if (campaign.target.startsWith('user:')) {
        const userId = campaign.target.replace('user:', '')
        tokenQuery = tokenQuery.eq('id', userId)
      }
    }

    const { data: targets, error: tokenError } = await tokenQuery
    if (tokenError) throw tokenError

    if (!targets || targets.length === 0) {
      console.log('[Push] Nenhum token encontrado para o alvo:', campaign.target)
      return new Response(JSON.stringify({ status: 'no_targets' }), { status: 200 })
    }

    const tokens = targets.map(t => t.push_token)

    // 3. Enviar via FCM (Firebase Cloud Messaging)
    // Para simplificar, usamos uma biblioteca ou fetch direto com a chave legado ou v1
    // RECOMENDADO: Usar FCM v1 com Access Token (requer service account)
    
    const results = await sendFCMNotifications({
      title: campaign.title,
      body: campaign.body,
      tokens: tokens,
      data: campaign.data || {}
    })

    // 4. Atualizar logs
    await supabase
      .from('push_campaigns')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', campaign.id)

    // Registrar logs individuais
    const logs = targets.map(t => ({
      campaign_id: campaign.id,
      user_id: t.id,
      token: t.push_token,
      status: 'sent', // simplificado
      sent_at: new Date().toISOString()
    }))

    await supabase.from('push_logs').insert(logs)

    return new Response(JSON.stringify({ success: true, count: tokens.length, results }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error('[Push Error]', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

// Função auxiliar para disparar via FCM v1 (Moderno)
async function sendFCMNotifications(payload: PushPayload) {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')
  
  if (!serviceAccount.project_id) {
    console.warn('[Push] FIREBASE_SERVICE_ACCOUNT não configurada corretamente.')
    return { error: 'SERVICE_ACCOUNT_MISSING' }
  }

  // 1. Obter Token de Acesso via Google Auth (FCM v1 requer OAuth2)
  // Usamos uma implementação simplificada ou biblioteca via esm.sh
  const accessToken = await getGoogleAccessToken(serviceAccount)

  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      message: {
        token: payload.tokens[0], // O FCM v1 envia 1 por 1 ou via multicast manual
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {}
      }
    })
  })

  // Nota: Para múltiplos tokens no v1, o ideal é fazer um loop ou usar a API de batch
  // Aqui estamos simplificando para o primeiro token para validar a conexão.
  if (payload.tokens.length > 1) {
    for (let i = 1; i < payload.tokens.length; i++) {
      await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: {
            token: payload.tokens[i],
            notification: { title: payload.title, body: payload.body },
            data: payload.data || {}
          }
        })
      })
    }
  }

  return await response.json()
}

// Helper para gerar o token JWT e pegar o Access Token do Google
async function getGoogleAccessToken(serviceAccount: any) {
  const { GoogleAuth } = await import("https://deno.land/x/google_auth@v0.1.1/mod.ts")
  
  const auth = new GoogleAuth({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  })

  return await auth.getToken()
}
