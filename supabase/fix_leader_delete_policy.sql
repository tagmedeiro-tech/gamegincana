-- Habilita que Líderes de Tribo deletem posts de seus próprios membros
-- Execute este script no SQL Editor do Supabase

DROP POLICY IF EXISTS "leaders_delete_tribe_posts" ON feed_posts;
CREATE POLICY "leaders_delete_tribe_posts" ON feed_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'leader'
      AND profiles."groupId" = feed_posts.group_id
    )
  );

-- Garante que o Admin continue com acesso total (caso a política anterior tenha sido sobrescrita)
DROP POLICY IF EXISTS "admin_all_posts" ON feed_posts;
CREATE POLICY "admin_all_posts" ON feed_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
