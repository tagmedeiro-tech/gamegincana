-- Migration: Sistema de Ofensivas (Streaks) e Troféus Automáticos
-- Execute no SQL Editor do Supabase

-- 1. Colunas de streak na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "streakLogin"              INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakLoginLastDate"      DATE,
ADD COLUMN IF NOT EXISTS "streakDevotional"         INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakDevotionalLastDate" DATE,
ADD COLUMN IF NOT EXISTS "streakLoginMax"           INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streakDevotionalMax"      INTEGER DEFAULT 0;

-- 2. Tabela de escudos de proteção de ofensiva
CREATE TABLE IF NOT EXISTS streak_shields (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('login', 'devotional')),
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS para streak_shields
ALTER TABLE streak_shields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shields"
  ON streak_shields FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "System can insert shields"
  ON streak_shields FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own shields"
  ON streak_shields FOR UPDATE
  USING (auth.uid() = "userId");
