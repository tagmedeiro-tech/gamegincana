-- CORREÇÃO DE PERMISSÕES E SCHEMA (VERSÃO CORRIGIDA)

-- 1. Garantir colunas extras na tabela 'activities'
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "validationType" text DEFAULT 'manual';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "missionType" text DEFAULT 'normal';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "startsAt" timestamptz;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "expiresAt" timestamptz;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "definitionId" uuid;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS requires_acceptance boolean DEFAULT false;

-- 2. Políticas para a tabela 'activities'
DROP POLICY IF EXISTS "Admins can manage activities" ON activities;
CREATE POLICY "Admins can manage activities" ON activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Políticas para a tabela 'groups'
DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Criar/Ajustar 'activity_definitions' sem restrições agressivas
CREATE TABLE IF NOT EXISTS activity_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  default_points integer DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Remover restrição de categoria se ela existir para evitar o erro 23514
ALTER TABLE activity_definitions DROP CONSTRAINT IF EXISTS activity_definitions_category_check;

ALTER TABLE activity_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read definitions" ON activity_definitions;
CREATE POLICY "Public read definitions" ON activity_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage definitions" ON activity_definitions;
CREATE POLICY "Admins manage definitions" ON activity_definitions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Inserir definições padrão com categorias em minúsculo (Padrão do Sistema)
INSERT INTO activity_definitions (key, title, description, category, default_points, icon)
VALUES 
  ('ovelha_restaurada', 'Ovelha Restaurada', 'Trouxe alguém que estava afastado da Igreja', 'devocional', 40, 'UserPlus'),
  ('membro_novo', 'Membro Novo', 'Trouxe um visitante pela primeira vez', 'evangelismo', 50, 'Users'),
  ('leitura_biblica', 'Leitura Bíblica', 'Leitura de um capítulo da Bíblia', 'devocional', 10, 'BookOpen')
ON CONFLICT (key) DO UPDATE SET 
  category = EXCLUDED.category,
  default_points = EXCLUDED.default_points;
