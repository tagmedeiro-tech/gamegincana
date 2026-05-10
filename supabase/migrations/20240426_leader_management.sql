-- Expansão para Gestão de Tribos e Liderança

-- 1. Adicionar campos de personalização na tabela de grupos
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS "logoUrl" text,
ADD COLUMN IF NOT EXISTS "primaryColor" text DEFAULT '#FBBF24',
ADD COLUMN IF NOT EXISTS "secondaryColor" text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS "description" text;

-- 2. Tabela de Selos/Conquistas (Badges)
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" text REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL, -- Nome do ícone Lucide
  description text,
  points integer DEFAULT 0,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Selos do Usuário (Relacionamento Muitos-para-Muitos)
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  "badgeId" uuid REFERENCES badges(id) ON DELETE CASCADE,
  "awardedBy" uuid REFERENCES auth.users(id),
  "awardedAt" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Células
CREATE TABLE IF NOT EXISTS cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" text REFERENCES groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  "leaderId" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "meetingDay" text,
  location text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. Habilitar RLS para as novas tabelas
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Public read badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Leaders can manage badges" ON badges FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR (role = 'leader' AND "groupId" = badges."groupId"))));

CREATE POLICY "Public read user_badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Leaders can award badges" ON user_badges FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'leader')));

CREATE POLICY "Public read cells" ON cells FOR SELECT USING (true);
CREATE POLICY "Leaders can manage cells" ON cells FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR (role = 'leader' AND "groupId" = cells."groupId"))));
