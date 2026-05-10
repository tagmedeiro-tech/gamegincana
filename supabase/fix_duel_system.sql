-- ============================================================
-- FIX CRÍTICO: Sistema de Duelo
-- 1. Corrige finalize_duel para usar pontos dinâmicos do Admin
-- 2. Adiciona crédito de moedas (coins) no resultado
-- 3. Adiciona log de pontos para histórico e streaks
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Garante que a coluna coins existe em profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'coins') THEN
    ALTER TABLE public.profiles ADD COLUMN coins INTEGER DEFAULT 0;
  END IF;
END $$;

-- Recria a RPC finalize_duel aceitando pontos dinâmicos do Admin
CREATE OR REPLACE FUNCTION finalize_duel(
  p_room_id uuid,
  p_challenger_score integer,
  p_challenged_score integer,
  -- Pontos configuráveis pelo Admin (com defaults para retrocompatibilidade)
  p_win_pts integer DEFAULT 60,
  p_loss_pts integer DEFAULT 15,
  p_draw_pts integer DEFAULT 30,
  p_win_coins integer DEFAULT 20,
  p_loss_coins integer DEFAULT 5,
  p_draw_coins integer DEFAULT 10
) RETURNS jsonb AS $$
DECLARE
  v_room duel_rooms%ROWTYPE;
  v_winner_id uuid;
  v_challenger_pts integer;
  v_challenged_pts integer;
  v_challenger_coins integer;
  v_challenged_coins integer;
BEGIN
  -- Busca e trava a sala (previne double-execution)
  SELECT * INTO v_room FROM duel_rooms 
  WHERE id = p_room_id AND status = 'active'
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sala nao encontrada ou ja finalizada');
  END IF;

  -- Determinar vencedor e calcular pontos/moedas
  IF p_challenger_score > p_challenged_score THEN
    v_winner_id := v_room.challenger_id;
    v_challenger_pts := p_win_pts;   v_challenger_coins := p_win_coins;
    v_challenged_pts := p_loss_pts;  v_challenged_coins := p_loss_coins;
  ELSIF p_challenged_score > p_challenger_score THEN
    v_winner_id := v_room.challenged_id;
    v_challenged_pts := p_win_pts;   v_challenged_coins := p_win_coins;
    v_challenger_pts := p_loss_pts;  v_challenger_coins := p_loss_coins;
  ELSE
    v_winner_id := NULL;
    v_challenger_pts := p_draw_pts;  v_challenger_coins := p_draw_coins;
    v_challenged_pts := p_draw_pts;  v_challenged_coins := p_draw_coins;
  END IF;

  -- Atualizar pontos e moedas dos jogadores
  UPDATE profiles SET
    "totalPoints" = "totalPoints" + v_challenger_pts,
    coins = COALESCE(coins, 0) + v_challenger_coins
  WHERE id = v_room.challenger_id;

  UPDATE profiles SET
    "totalPoints" = "totalPoints" + v_challenged_pts,
    coins = COALESCE(coins, 0) + v_challenged_coins
  WHERE id = v_room.challenged_id;

  -- Atualizar pontos dos grupos
  IF v_room.challenger_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + v_challenger_pts
    WHERE id = v_room.challenger_group_id;
  END IF;
  IF v_room.challenged_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + v_challenged_pts
    WHERE id = v_room.challenged_group_id;
  END IF;

  -- Registrar no histórico (point_logs) para transparência
  INSERT INTO point_logs ("userId", "groupId", points, reason)
  VALUES 
    (v_room.challenger_id, v_room.challenger_group_id, v_challenger_pts, 
     CASE WHEN v_winner_id = v_room.challenger_id THEN 'Vitória no Duelo Sagrado'
          WHEN v_winner_id IS NULL THEN 'Empate no Duelo Sagrado'
          ELSE 'Derrota no Duelo Sagrado' END),
    (v_room.challenged_id, v_room.challenged_group_id, v_challenged_pts,
     CASE WHEN v_winner_id = v_room.challenged_id THEN 'Vitória no Duelo Sagrado'
          WHEN v_winner_id IS NULL THEN 'Empate no Duelo Sagrado'
          ELSE 'Derrota no Duelo Sagrado' END);

  -- Marcar sala como finalizada
  UPDATE duel_rooms SET
    status = 'finished',
    winner_id = v_winner_id,
    challenger_score = p_challenger_score,
    challenged_score = p_challenged_score,
    finished_at = now()
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'challenger_score', p_challenger_score,
    'challenged_score', p_challenged_score,
    'challenger_pts', v_challenger_pts,
    'challenged_pts', v_challenged_pts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION finalize_duel(uuid, integer, integer, integer, integer, integer, integer, integer, integer) TO authenticated;

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
