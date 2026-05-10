-- Tabela para registrar eventos brutos do jogo (Auditoria)
CREATE TABLE IF NOT EXISTS public.game_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "groupId" TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'BLOCK_PLACED', 'ENEMY_KILLED', 'BASE_DEFENDED'
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios logs, Admins veem tudo
CREATE POLICY "Users can view own game logs" ON public.game_logs
    FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Admins can view all game logs" ON public.game_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Função RPC para processar XP do Metaverso com proteção contra Farming
CREATE OR REPLACE FUNCTION public.process_voxel_xp(
    p_user_id UUID,
    p_event_type TEXT,
    p_points INTEGER,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_daily_count INTEGER;
    v_daily_limit INTEGER := 100; -- Limite de 100 XP por dia via jogo para evitar abusos
    v_group_id TEXT;
BEGIN
    -- 1. Obter o grupo do usuário
    SELECT "groupId" INTO v_group_id FROM public.profiles WHERE id = p_user_id;

    -- 2. Verificar quantos pontos o usuário já ganhou HOJE via jogo
    SELECT COALESCE(SUM(points_earned), 0) INTO v_daily_count 
    FROM public.game_logs 
    WHERE "userId" = p_user_id 
    AND created_at >= CURRENT_DATE;

    -- 3. Se ultrapassar o limite, ignorar (ou retornar erro)
    IF v_daily_count + p_points > v_daily_limit THEN
        RETURN json_build_object('success', false, 'message', 'Limite diário de XP do Metaverso atingido.');
    END IF;

    -- 4. Registrar o log do evento
    INSERT INTO public.game_logs ("userId", "groupId", event_type, points_earned, metadata)
    VALUES (p_user_id, v_group_id, p_event_type, p_points, p_metadata);

    -- 5. Atualizar o perfil do usuário (XP e Coins)
    UPDATE public.profiles 
    SET "totalPoints" = "totalPoints" + p_points,
        "coins" = "coins" + (p_points / 2) -- Ganha metade em moedas
    WHERE id = p_user_id;

    -- 6. Registrar no log de pontos geral para o Ranking das Tribos
    INSERT INTO public.point_logs ("userId", "groupId", points, "activityId", created_at)
    VALUES (p_user_id, v_group_id, p_points, 'metaverse-voxel', now());

    RETURN json_build_object('success', true, 'new_total', (SELECT "totalPoints" FROM public.profiles WHERE id = p_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
