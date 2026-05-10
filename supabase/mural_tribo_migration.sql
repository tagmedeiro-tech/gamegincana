-- ============================================================
-- MURAL DA TRIBO: SQL Migration
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. TABELA: feed_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id        TEXT,  -- TEXT para compatibilidade com groups.id (TEXT no schema original)

  -- Tipo
  post_type       TEXT NOT NULL CHECK (post_type IN (
    'photo','text','bible_study','youtube',
    'spotify_track','spotify_playlist',
    'achievement','duel_victory','activity_proof'
  )),

  -- Conteudo geral
  caption         TEXT,

  -- Foto (upload Storage)
  image_url       TEXT,
  image_path      TEXT,

  -- Versiculo (integrado ao BibleViewer)
  verse_ref       TEXT,
  verse_text      TEXT,
  verse_book_id   TEXT,
  verse_chapter   INT,
  verse_number    INT,

  -- Estudo biblico
  study_title     TEXT,
  study_body      TEXT,

  -- Video YouTube
  video_url       TEXT,
  video_thumbnail TEXT,
  video_title     TEXT,
  video_id        TEXT,

  -- Spotify
  spotify_uri     TEXT,
  spotify_url     TEXT,
  spotify_title   TEXT,
  spotify_artist  TEXT,
  spotify_cover   TEXT,

  -- Conquista
  achievement_key   TEXT,
  achievement_label TEXT,
  achievement_icon  TEXT,

  -- Duelo (sem FK formal: bible_duels pode nao existir ainda)
  duel_id                UUID,
  duel_opponent_name     TEXT,
  duel_opponent_group_name TEXT,
  duel_score             TEXT,

  -- Prova de Atividade (sem FK formal: participations usa id UUID mas evita erro se nao existir)
  participation_id UUID,
  activity_title   TEXT,

  -- Metadados
  is_pinned        BOOLEAN DEFAULT false,
  visibility       TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'group_only')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_public_posts" ON feed_posts
  FOR SELECT USING (visibility = 'public' OR author_id = auth.uid());

CREATE POLICY "author_creates_post" ON feed_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "author_deletes_post" ON feed_posts
  FOR DELETE USING (author_id = auth.uid());

-- Admin pode fixar/deletar qualquer post
CREATE POLICY "admin_all_posts" ON feed_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;

-- ============================================================
-- 2. TABELA: post_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "author_comments" ON post_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "author_deletes_comment" ON post_comments
  FOR DELETE USING (author_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;

-- ============================================================
-- 3. TABELA: post_reactions
-- ============================================================
CREATE TABLE IF NOT EXISTS post_reactions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji     TEXT NOT NULL DEFAULT '❤️'
            CHECK (emoji IN ('❤️','🔥','🙌','😂','😮')),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_reactions"  ON post_reactions FOR SELECT USING (true);
CREATE POLICY "user_reacts"     ON post_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_unreacts"   ON post_reactions
  FOR DELETE USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;

-- ============================================================
-- 4. TABELA: tribe_playlists
-- ============================================================
CREATE TABLE IF NOT EXISTS tribe_playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  spotify_uri TEXT,
  cover_url   TEXT,
  curator_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tribe_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_playlists" ON tribe_playlists FOR SELECT USING (true);
CREATE POLICY "admin_manages_playlists" ON tribe_playlists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. BUCKET: feed-media (Storage)
-- Executar separadamente no SQL Editor
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feed-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-media');

CREATE POLICY "owner_delete_media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'feed-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 6. Anti-spam: limite de 10 posts por usuario por dia
-- ============================================================
CREATE OR REPLACE FUNCTION check_post_daily_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM feed_posts
    WHERE author_id = NEW.author_id
      AND created_at >= CURRENT_DATE
  ) >= 10 THEN
    RAISE EXCEPTION 'Limite de 10 posts por dia atingido.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_post_daily_limit
  BEFORE INSERT ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION check_post_daily_limit();
