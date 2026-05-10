-- Migração: Remover bloqueio eterno e adicionar cooldown de 1 ano para leitura/quiz

-- 1. Adicionar tipo de conclusão
ALTER TABLE bible_completions ADD COLUMN IF NOT EXISTS completion_type text DEFAULT 'reading';

-- Atualizar registros existentes (todos são leituras até agora, quiz estava junto)
UPDATE bible_completions SET completion_type = 'reading' WHERE completion_type IS NULL;

-- 2. Remover a constraint UNIQUE que bloqueia repetição eterna
ALTER TABLE bible_completions DROP CONSTRAINT IF EXISTS bible_completions_user_id_book_id_chapter_key;

-- 3. Atualizar a RPC complete_bible_chapter
CREATE OR REPLACE FUNCTION complete_bible_chapter(
  p_user_id uuid,
  p_group_id text,
  p_book_id text,
  p_chapter integer,
  p_points integer,
  p_is_devotional boolean DEFAULT false,
  p_completion_type text DEFAULT 'reading'
) RETURNS jsonb AS $$
DECLARE
  v_last_completion timestamp with time zone;
  v_reason text;
  v_cooldown_days constant integer := 365;
BEGIN
  -- Verificar a última vez que o usuário completou isso (com esse mesmo completion_type)
  SELECT created_at INTO v_last_completion
  FROM bible_completions
  WHERE user_id = p_user_id 
    AND book_id = p_book_id 
    AND chapter = p_chapter
    AND completion_type = p_completion_type
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Se encontrou registro e for menos de 365 dias, recusa.
  IF v_last_completion IS NOT NULL AND (now() - v_last_completion) < interval '365 days' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Capítulo já pontuado neste ano.',
      'cooldown', true,
      'last_completion', v_last_completion
    );
  END IF;

  -- Se passou do cooldown ou é a primeira vez, registra conclusão
  INSERT INTO bible_completions (user_id, book_id, chapter, points_earned, is_devotional, completion_type)
  VALUES (p_user_id, p_book_id, p_chapter, p_points, p_is_devotional, p_completion_type);

  -- Gerar razão do log
  v_reason := CASE 
    WHEN p_is_devotional THEN 'Devocional Diário: ' || p_book_id || ' ' || p_chapter
    WHEN p_completion_type = 'quiz' THEN 'Quiz Bíblico: ' || p_book_id || ' ' || p_chapter
    ELSE 'Leitura Bíblica: ' || p_book_id || ' ' || p_chapter
  END;

  -- Dar pontos
  UPDATE profiles SET "totalPoints" = "totalPoints" + p_points WHERE id = p_user_id;
  
  IF p_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + p_points WHERE id = p_group_id;
  END IF;

  INSERT INTO point_logs ("userId", "groupId", points, reason)
  VALUES (p_user_id, p_group_id, p_points, v_reason);

  RETURN jsonb_build_object('success', true, 'points_added', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
