// Verifica e corrige RLS de todas as tabelas críticas do sistema
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:triboide001@db.fwdtsfczcdzqbmroxaxc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- ============================================================
-- FIX RLS COMPLETO: Todas as tabelas críticas
-- ============================================================

-- PARTICIPATIONS (camelCase: userId, groupId, activityId, pointsEarned)
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'participations' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.participations'; END LOOP;
END $$;
CREATE POLICY "read_participations" ON public.participations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_participations" ON public.participations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_participations" ON public.participations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_participations" ON public.participations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ACTIVITIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'activities' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.activities'; END LOOP;
END $$;
CREATE POLICY "read_activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_activities" ON public.activities FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- GROUPS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'groups' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.groups'; END LOOP;
END $$;
CREATE POLICY "read_groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_read_groups" ON public.groups FOR SELECT TO anon USING (true);
CREATE POLICY "manage_groups" ON public.groups FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.notifications'; END LOOP;
END $$;
CREATE POLICY "read_own_notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage_notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- USER_ACHIEVEMENTS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_achievements' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.user_achievements'; END LOOP;
END $$;
CREATE POLICY "read_achievements" ON public.user_achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (true);

-- FEED_LIKES
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'feed_likes' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.feed_likes'; END LOOP;
END $$;
CREATE POLICY "read_feed_likes" ON public.feed_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_feed_likes" ON public.feed_likes FOR ALL TO authenticated USING (true);

-- FEED_COMMENTS
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'feed_comments' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.feed_comments'; END LOOP;
END $$;
CREATE POLICY "read_feed_comments" ON public.feed_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_feed_comments" ON public.feed_comments FOR ALL TO authenticated USING (true);

-- STORE_ITEMS / REDEMPTIONS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'store_items' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.store_items'; END LOOP;
END $$;
CREATE POLICY "read_store_items" ON public.store_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_store_items" ON public.store_items FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'redemptions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.redemptions'; END LOOP;
END $$;
CREATE POLICY "read_own_redemptions" ON public.redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_redemptions" ON public.redemptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_manage_redemptions" ON public.redemptions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- MESSAGES (Chat)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.messages'; END LOOP;
END $$;
CREATE POLICY "read_messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_messages" ON public.messages FOR UPDATE TO authenticated USING (true);

-- CONFIG (Tema)
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'config' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.config'; END LOOP;
END $$;
CREATE POLICY "read_config" ON public.config FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_read_config" ON public.config FOR SELECT TO anon USING (true);
CREATE POLICY "admin_manage_config" ON public.config FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- DUEL_ROOMS / DUEL_ANSWERS / DUEL_QUESTIONS
ALTER TABLE public.duel_rooms ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'duel_rooms' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.duel_rooms'; END LOOP;
END $$;
CREATE POLICY "read_own_duel_rooms" ON public.duel_rooms FOR SELECT TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid() OR status = 'finished');
CREATE POLICY "insert_duel_rooms" ON public.duel_rooms FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "update_duel_rooms" ON public.duel_rooms FOR UPDATE TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

ALTER TABLE public.duel_answers ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'duel_answers' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.duel_answers'; END LOOP;
END $$;
CREATE POLICY "read_duel_answers" ON public.duel_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_duel_answers" ON public.duel_answers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.duel_questions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'duel_questions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.duel_questions'; END LOOP;
END $$;
CREATE POLICY "read_duel_questions" ON public.duel_questions FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "admin_manage_duel_questions" ON public.duel_questions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- BIBLE_COMPLETIONS / VERSE_NOTES
ALTER TABLE public.bible_completions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'bible_completions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.bible_completions'; END LOOP;
END $$;
CREATE POLICY "read_bible_completions" ON public.bible_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bible_completions" ON public.bible_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.verse_notes ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'verse_notes' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.verse_notes'; END LOOP;
END $$;
CREATE POLICY "read_verse_notes" ON public.verse_notes FOR SELECT TO authenticated USING ("userId" = auth.uid());
CREATE POLICY "manage_verse_notes" ON public.verse_notes FOR ALL TO authenticated USING ("userId" = auth.uid());

-- USER_READING_PLANS / READING_PLAN_COMPLETIONS
ALTER TABLE public.user_reading_plans ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_reading_plans' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.user_reading_plans'; END LOOP;
END $$;
CREATE POLICY "read_own_reading_plans" ON public.user_reading_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "manage_own_reading_plans" ON public.user_reading_plans FOR ALL TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.reading_plan_completions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reading_plan_completions' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.reading_plan_completions'; END LOOP;
END $$;
CREATE POLICY "read_own_plan_completions" ON public.reading_plan_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_plan_completions" ON public.reading_plan_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ACHIEVEMENTS (definições públicas)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'achievements' AND schemaname = 'public'
  LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.achievements'; END LOOP;
END $$;
CREATE POLICY "read_achievements_defs" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_achievements_defs" ON public.achievements FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- VERIFICAÇÃO FINAL
SELECT tablename, count(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
`;

async function run() {
  try {
    console.log('Conectando...');
    await client.connect();
    console.log('Aplicando RLS em todas as tabelas...\n');
    const result = await client.query(sql);
    const last = Array.isArray(result) ? result[result.length - 1] : result;
    if (last?.rows) {
      console.log('\n✅ RESUMO DE POLICIES POR TABELA:');
      console.table(last.rows);
    }
    console.log('\n✅ RLS completo aplicado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

run();
