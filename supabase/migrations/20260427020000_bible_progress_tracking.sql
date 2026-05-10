-- 📖 SISTEMA DE BLOQUEIO DE DEVOCIONAL DUPLICADO
-- Evita que usuários ganhem pontos múltiplas vezes pelo mesmo capítulo.

-- 1. Tabela de Leituras Concluídas
CREATE TABLE IF NOT EXISTS bible_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  chapter integer NOT NULL,
  points_earned integer DEFAULT 0,
  is_devotional boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- REGRA DE OURO: Único por usuário/livro/capítulo
  UNIQUE(user_id, book_id, chapter)
);

-- Habilitar RLS
ALTER TABLE bible_completions ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own completions" ON bible_completions;
CREATE POLICY "Users can view own completions" ON bible_completions
  FOR SELECT USING (auth.uid() = user_id);

-- 2. RPC Segura para Conclusão de Leitura
-- Esta função verifica se o usuário já leu antes de dar pontos.
CREATE OR REPLACE FUNCTION complete_bible_chapter(
  p_user_id uuid,
  p_group_id text,
  p_book_id text,
  p_chapter integer,
  p_points integer,
  p_is_devotional boolean DEFAULT false
) RETURNS jsonb AS $$
DECLARE
  v_already_read boolean;
  v_reason text;
BEGIN
  -- Verificar duplicidade
  SELECT EXISTS (
    SELECT 1 FROM bible_completions 
    WHERE user_id = p_user_id AND book_id = p_book_id AND chapter = p_chapter
  ) INTO v_already_read;

  IF v_already_read THEN
    RETURN jsonb_build_object('success', false, 'message', 'Capítulo já concluído anteriormente.');
  END IF;

  -- Registrar conclusão
  INSERT INTO bible_completions (user_id, book_id, chapter, points_earned, is_devotional)
  VALUES (p_user_id, p_book_id, p_chapter, p_points, p_is_devotional);

  -- Gerar razão do log
  v_reason := CASE 
    WHEN p_is_devotional THEN 'Devocional Diário: ' || p_book_id || ' ' || p_chapter
    ELSE 'Leitura Bíblica: ' || p_book_id || ' ' || p_chapter
  END;

  -- Dar pontos (reutilizando a lógica de increment_points existente ou expandindo)
  UPDATE profiles SET "totalPoints" = "totalPoints" + p_points WHERE id = p_user_id;
  
  IF p_group_id IS NOT NULL THEN
    UPDATE groups SET "totalPoints" = "totalPoints" + p_points WHERE id = p_group_id;
  END IF;

  INSERT INTO point_logs ("userId", "groupId", points, reason)
  VALUES (p_user_id, p_group_id, p_points, v_reason);

  RETURN jsonb_build_object('success', true, 'points_added', p_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
