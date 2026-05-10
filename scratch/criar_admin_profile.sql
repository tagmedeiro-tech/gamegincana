-- Script para criar o perfil mestre do admin
-- UID do usuário autenticado: 26c01d32-6ed9-4553-a4da-91aa93c2bd94
-- Email: tagmedeiro@gmail.com

INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  status,
  "totalPoints",
  coins,
  achievements
) VALUES (
  '26c01d32-6ed9-4553-a4da-91aa93c2bd94',
  'Administrador Mestre',
  'tagmedeiro@gmail.com',
  'admin',
  'active',
  0,
  0,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Verificar se foi criado
SELECT id, name, email, role, status FROM profiles WHERE email = 'tagmedeiro@gmail.com';
