-- 🙏 DEVOCIONAL PERPÉTUO POR USUÁRIO
-- Cada usuário tem seu próprio índice na sequência de 1189 capítulos.
-- A sequência é: Fundamentos → NT Completo → AT Completo → (repete)

CREATE TABLE IF NOT EXISTS user_devotional_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_index integer DEFAULT 0,          -- posição na sequência (0–1188)
  last_devotional_date date,                -- para bloquear 2x no mesmo dia
  total_completed integer DEFAULT 0,        -- total de dias de devocional feitos
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_devotional_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own devotional progress" ON user_devotional_progress;
CREATE POLICY "Users manage own devotional progress" ON user_devotional_progress
  FOR ALL USING (auth.uid() = user_id);

-- RPC: Concluir o devocional do dia
-- Avança o índice, dá pontos e bloqueia repetição no mesmo dia.
CREATE OR REPLACE FUNCTION complete_user_devotional(
  p_user_id uuid,
  p_group_id text,
  p_points integer
) RETURNS jsonb AS $$
DECLARE
  v_progress record;
  v_today date := CURRENT_DATE;
  v_next_index integer;
BEGIN
  -- Buscar ou criar progresso
  SELECT * INTO v_progress FROM user_devotional_progress WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_devotional_progress (user_id, current_index, last_devotional_date, total_completed)
    VALUES (p_user_id, 0, NULL, 0)
    RETURNING * INTO v_progress;
  END IF;

  -- Verificar se já fez o devocional hoje
  IF v_progress.last_devotional_date = v_today THEN
    RETURN jsonb_build_object('success', false, 'message', 'Devocional ja realizado hoje. Volte amanha!');
  END IF;

  -- Avançar índice (cicla de 0 a 1188)
  v_next_index := (v_progress.current_index + 1) % 1189;

  UPDATE user_devotional_progress
  SET current_index = v_next_index,
      last_devotional_date = v_today,
      total_completed = total_completed + 1
  WHERE user_id = p_user_id;

  -- Conceder pontos
  UPDATE profiles SET "totalPoints" = "totalPoints" + p_points WHERE id = p_user_id;

  IF p_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + p_points WHERE id = p_group_id;
  END IF;

  INSERT INTO point_logs ("userId", "groupId", points, reason)
  VALUES (p_user_id, p_group_id, p_points, 'Devocional Diario - Dia ' || (v_progress.total_completed + 1));

  RETURN jsonb_build_object(
    'success', true,
    'points_added', p_points,
    'next_index', v_next_index,
    'total_completed', v_progress.total_completed + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
