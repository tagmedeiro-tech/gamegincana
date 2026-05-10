-- 1. Forçar a remoção das versões antigas
DROP FUNCTION IF EXISTS public.increment_points(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.increment_points(uuid, text, integer, text);

-- 2. Recriar a função garantindo o group_id como text
CREATE OR REPLACE FUNCTION public.increment_points(
    user_id uuid,
    group_id text,
    pts integer,
    reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Incrementa no usuário
    IF user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET "totalPoints" = COALESCE("totalPoints", 0) + pts
        WHERE id = user_id;
    END IF;

    -- Incrementa no grupo
    IF group_id IS NOT NULL THEN
        UPDATE public.groups
        SET "totalPoints" = COALESCE("totalPoints", 0) + pts
        WHERE id = group_id;
    END IF;

    -- Registra no log
    INSERT INTO public.point_logs ("userId", "groupId", points, reason)
    VALUES (user_id, group_id, pts, reason);
END;
$$;

-- 3. RECARREGAR O CACHE DO SUPABASE (CRÍTICO)
-- Isso força o banco a esquecer que a função antiga usava uuid
NOTIFY pgrst, reload_schema;
