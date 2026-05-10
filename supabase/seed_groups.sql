-- Seed das Tribos/Grupos iniciais
-- Execute este comando no SQL Editor do Supabase

INSERT INTO groups (id, name, "memberCount", "totalPoints")
VALUES 
  ('leões', 'Leões de Judá', 0, 0),
  ('águias', 'Águias de Fogo', 0, 0),
  ('gad', 'Tribo de Gad', 0, 0)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name;

-- Opcional: Atualizar perfis existentes que podem estar com groupId errado
UPDATE profiles SET "groupId" = 'leões' WHERE "groupId" = 'leoes-juda';
