-- 🚀 CORREÇÃO DE SEGURANÇA E TABELAS V3
-- Este script garante que todas as tabelas necessárias existam e tenham políticas de RLS adequadas.

-- 1. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Tabela de Conquistas do Usuário
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "achievementKey" text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE("userId", "achievementKey")
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read user_achievements" ON user_achievements;
CREATE POLICY "Public read user_achievements" ON user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can award achievements" ON user_achievements;
CREATE POLICY "System can award achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Tabela de Notas de Versículos
CREATE TABLE IF NOT EXISTS verse_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "bookId" text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE verse_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notes" ON verse_notes;
CREATE POLICY "Users can view own notes" ON verse_notes
  FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own notes" ON verse_notes;
CREATE POLICY "Users can insert own notes" ON verse_notes
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- 4. Tabela de Curtidas no Feed
CREATE TABLE IF NOT EXISTS feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "participationId" uuid REFERENCES participations(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE("participationId", "userId")
);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read feed_likes" ON feed_likes;
CREATE POLICY "Public read feed_likes" ON feed_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own likes" ON feed_likes;
CREATE POLICY "Users can manage own likes" ON feed_likes
  FOR ALL USING (auth.uid() = "userId");

-- 5. Tabela de Comentários no Feed
CREATE TABLE IF NOT EXISTS feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "participationId" uuid REFERENCES participations(id) ON DELETE CASCADE,
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read feed_comments" ON feed_comments;
CREATE POLICY "Public read feed_comments" ON feed_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON feed_comments;
CREATE POLICY "Users can insert own comments" ON feed_comments
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- 6. Tabela de Loja e Resgates
CREATE TABLE IF NOT EXISTS store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  stock integer DEFAULT 0,
  "imageUrl" text,
  category text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "itemId" uuid REFERENCES store_items(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  "pointsSpent" integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read store_items" ON store_items;
CREATE POLICY "Public read store_items" ON store_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read redemptions" ON redemptions;
CREATE POLICY "Public read redemptions" ON redemptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert redemptions" ON redemptions;
CREATE POLICY "Users can insert redemptions" ON redemptions FOR INSERT WITH CHECK (auth.uid() = "userId");
