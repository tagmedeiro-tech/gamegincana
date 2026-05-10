-- ⚔️ SISTEMA DE DUELO BÍBLICO ENTRE GRUPOS
-- Criado em: 2026-04-27

-- 1. Banco de perguntas do duelo
CREATE TABLE IF NOT EXISTS duel_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,              -- array de 4 strings
  correct_index integer NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  category text DEFAULT 'geral',      -- 'geral' | 'evangelhos' | 'epistolas' | 'antigo_testamento' | 'doutrina'
  difficulty text DEFAULT 'medio',    -- 'facil' | 'medio' | 'dificil'
  book_ref text,                       -- ex: 'JHN:3' (João capítulo 3)
  verse_ref text,                      -- ex: 'João 3:16'
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE duel_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active duel questions" ON duel_questions
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage duel questions" ON duel_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Salas de duelo
CREATE TABLE IF NOT EXISTS duel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES auth.users(id) NOT NULL,
  challenged_id uuid REFERENCES auth.users(id) NOT NULL,
  challenger_group_id text,
  challenged_group_id text,
  challenger_name text,
  challenged_name text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished','declined','expired')),
  question_ids uuid[],                -- array de IDs das 10 perguntas sorteadas
  challenger_score integer DEFAULT 0,
  challenged_score integer DEFAULT 0,
  winner_id uuid,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE duel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duel participants can read their room" ON duel_rooms
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
CREATE POLICY "Challenger can create duel" ON duel_rooms
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update their duel" ON duel_rooms
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- 3. Respostas em tempo real
CREATE TABLE IF NOT EXISTS duel_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES duel_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  question_index integer NOT NULL,    -- 0-9
  answer_index integer NOT NULL,      -- 0-3 (índice da resposta)
  is_correct boolean NOT NULL,
  response_ms integer,                -- tempo de resposta em ms
  answered_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_id, user_id, question_index)
);

ALTER TABLE duel_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duel participants read answers" ON duel_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM duel_rooms
      WHERE id = room_id AND (challenger_id = auth.uid() OR challenged_id = auth.uid())
    )
  );
CREATE POLICY "Users submit own answers" ON duel_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. RPC: Finalizar duelo e dar pontos
CREATE OR REPLACE FUNCTION finalize_duel(
  p_room_id uuid,
  p_challenger_score integer,
  p_challenged_score integer
) RETURNS jsonb AS $$
DECLARE
  v_room duel_rooms%ROWTYPE;
  v_winner_id uuid;
  v_win_pts integer := 60;
  v_loss_pts integer := 15;
  v_draw_pts integer := 30;
BEGIN
  SELECT * INTO v_room FROM duel_rooms WHERE id = p_room_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sala nao encontrada ou ja finalizada');
  END IF;

  -- Determinar vencedor
  IF p_challenger_score > p_challenged_score THEN
    v_winner_id := v_room.challenger_id;
    -- Challenger ganha
    UPDATE profiles SET "totalPoints" = "totalPoints" + v_win_pts WHERE id = v_room.challenger_id;
    UPDATE profiles SET "totalPoints" = "totalPoints" + v_loss_pts WHERE id = v_room.challenged_id;
    IF v_room.challenger_group_id IS NOT NULL THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_win_pts WHERE id = v_room.challenger_group_id;
    END IF;
    IF v_room.challenged_group_id IS NOT NULL THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_loss_pts WHERE id = v_room.challenged_group_id;
    END IF;
  ELSIF p_challenged_score > p_challenger_score THEN
    v_winner_id := v_room.challenged_id;
    -- Challenged ganha
    UPDATE profiles SET "totalPoints" = "totalPoints" + v_win_pts WHERE id = v_room.challenged_id;
    UPDATE profiles SET "totalPoints" = "totalPoints" + v_loss_pts WHERE id = v_room.challenger_id;
    IF v_room.challenged_group_id IS NOT NULL THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_win_pts WHERE id = v_room.challenged_group_id;
    END IF;
    IF v_room.challenger_group_id IS NOT NULL THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_loss_pts WHERE id = v_room.challenger_group_id;
    END IF;
  ELSE
    -- Empate
    v_winner_id := NULL;
    UPDATE profiles SET "totalPoints" = "totalPoints" + v_draw_pts WHERE id IN (v_room.challenger_id, v_room.challenged_id);
    IF v_room.challenger_group_id IS NOT NULL THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_draw_pts WHERE id = v_room.challenger_group_id;
    END IF;
    IF v_room.challenged_group_id IS NOT NULL AND v_room.challenged_group_id != v_room.challenger_group_id THEN
      UPDATE groups SET "totalPoints" = "totalPoints" + v_draw_pts WHERE id = v_room.challenged_group_id;
    END IF;
  END IF;

  -- Atualizar sala
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
    'challenged_score', p_challenged_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
