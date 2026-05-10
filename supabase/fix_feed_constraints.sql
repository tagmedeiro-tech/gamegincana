-- 🚀 CORREÇÃO DE CONSTRAINTS DO MURAL (FEED)
-- Este script expande os tipos de postagens permitidos no Mural da Tribo.

-- 1. Remover a constraint antiga se ela existir
ALTER TABLE feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;

-- 2. Adicionar a nova constraint com suporte a todos os tipos de posts do sistema
ALTER TABLE feed_posts ADD CONSTRAINT feed_posts_post_type_check 
CHECK (post_type IN (
  'photo',
  'text',
  'bible_study',
  'youtube',
  'spotify_track',
  'spotify_playlist',
  'achievement',
  'duel_victory',
  'activity_proof',
  'new_member',
  'group_update',
  'streak_milestone'
));

-- 3. Notificar o PostgREST para recarregar o esquema
NOTIFY pgrst, 'reload schema';
