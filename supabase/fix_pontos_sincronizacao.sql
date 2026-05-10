-- 1. Corrige a função de incremento para garantir que SEMPRE atualize a tribo
CREATE OR REPLACE FUNCTION public.increment_points(
    user_id uuid,
    group_id uuid,
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

-- 2. Recalcula os pontos de TODAS as tribos varrendo o histórico
UPDATE public.groups g
SET "totalPoints" = COALESCE((
    SELECT SUM(points)
    FROM public.point_logs pl
    WHERE pl."groupId" = g.id
), 0);

-- 3. Recalcula os pontos de TODOS os usuários varrendo o histórico
UPDATE public.profiles p
SET "totalPoints" = COALESCE((
    SELECT SUM(points)
    FROM public.point_logs pl
    WHERE pl."userId" = p.id
), 0);
