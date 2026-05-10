-- 📖 SISTEMA DE PLANO DE LEITURA BÍBLICA
-- Tabelas e RPC para planos de leitura com porções diárias

-- 1. Assinaturas de Planos do Usuário
CREATE TABLE IF NOT EXISTS user_reading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'active', -- active | completed | abandoned
  completed_at timestamp with time zone,
  bonus_awarded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, plan_id) -- apenas 1 ativo por plano
);

-- 2. Porções Diárias Concluídas
CREATE TABLE IF NOT EXISTS reading_plan_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_plan_id uuid REFERENCES user_reading_plans(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  points_earned integer DEFAULT 0,
  completed_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_plan_id, day_number)
);

-- RLS
ALTER TABLE user_reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reading plans" ON user_reading_plans;
CREATE POLICY "Users manage own reading plans" ON user_reading_plans
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own plan completions" ON reading_plan_completions;
CREATE POLICY "Users manage own plan completions" ON reading_plan_completions
  FOR ALL USING (auth.uid() = user_id);

-- 3. RPC: Concluir uma porção diária do plano
CREATE OR REPLACE FUNCTION complete_reading_plan_day(
  p_user_plan_id uuid,
  p_user_id uuid,
  p_group_id text,
  p_day_number integer,
  p_total_days integer,
  p_points_per_day integer,
  p_bonus_points integer
) RETURNS jsonb AS $$
DECLARE
  v_already_done boolean;
  v_completed_count integer;
  v_plan_complete boolean := false;
  v_bonus_given boolean := false;
BEGIN
  -- Verificar duplicidade
  SELECT EXISTS(
    SELECT 1 FROM reading_plan_completions
    WHERE user_plan_id = p_user_plan_id AND day_number = p_day_number
  ) INTO v_already_done;

  IF v_already_done THEN
    RETURN jsonb_build_object('success', false, 'message', 'Porcao ja concluida.');
  END IF;

  -- Registrar conclusao da porcao
  INSERT INTO reading_plan_completions (user_plan_id, user_id, day_number, points_earned)
  VALUES (p_user_plan_id, p_user_id, p_day_number, p_points_per_day);

  -- Conceder pontos diarios
  UPDATE profiles SET "totalPoints" = "totalPoints" + p_points_per_day WHERE id = p_user_id;
  IF p_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + p_points_per_day WHERE id = p_group_id;
  END IF;
  INSERT INTO point_logs ("userId", "groupId", points, reason)
  VALUES (p_user_id, p_group_id, p_points_per_day, 'Plano de Leitura - Dia ' || p_day_number);

  -- Verificar se o plano foi concluido
  SELECT COUNT(*) FROM reading_plan_completions WHERE user_plan_id = p_user_plan_id
  INTO v_completed_count;

  IF v_completed_count >= p_total_days THEN
    v_plan_complete := true;
    -- Conceder bonus se ainda nao foi dado
    IF NOT (SELECT bonus_awarded FROM user_reading_plans WHERE id = p_user_plan_id) THEN
      UPDATE user_reading_plans
      SET status = 'completed', completed_at = now(), bonus_awarded = true
      WHERE id = p_user_plan_id;

      UPDATE profiles SET "totalPoints" = "totalPoints" + p_bonus_points WHERE id = p_user_id;
      IF p_group_id IS NOT NULL THEN
        UPDATE groups SET "totalPoints" = "totalPoints" + p_bonus_points WHERE id = p_group_id;
      END IF;
      INSERT INTO point_logs ("userId", "groupId", points, reason)
      VALUES (p_user_id, p_group_id, p_bonus_points, 'BONUS: Plano de Leitura Concluido!');

      v_bonus_given := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_added', p_points_per_day,
    'plan_complete', v_plan_complete,
    'bonus_given', v_bonus_given,
    'bonus_points', CASE WHEN v_bonus_given THEN p_bonus_points ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
