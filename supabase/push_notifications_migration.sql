-- ============================================================
-- Supabase: Push Notifications Support
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Adicionar coluna push_token na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Tabela de campanhas de push (para o admin disparar notificações em massa)
CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'all', -- 'all' | 'tribe:{id}' | 'user:{id}'
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Log de envios individuais
CREATE TABLE IF NOT EXISTS push_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES push_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage push_campaigns" ON push_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can view push_logs" ON push_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
