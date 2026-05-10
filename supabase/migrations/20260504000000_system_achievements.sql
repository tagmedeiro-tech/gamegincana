-- Migração para mover as Honrarias/Conquistas do Sistema para o Banco de Dados

CREATE TABLE IF NOT EXISTS system_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  points integer DEFAULT 0,
  icon text NOT NULL,
  rarity text DEFAULT 'common',
  color text,
  "triggerType" text,
  "triggerValue" integer,
  "isActive" boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE system_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read system_achievements" ON system_achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins manage system_achievements" ON system_achievements
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inserir valores iniciais baseados nas configurações hardcoded atuais
INSERT INTO system_achievements (key, name, description, points, icon, rarity, color, "triggerType") VALUES
('first_task', 'Primeiro Passo 🏁', 'Completou sua primeira tarefa oficial.', 50, 'Flag', 'common', '#94a3b8', 'task_count'),
('five_tasks', 'Membro Ativo 🏃', 'Completou 5 tarefas com sucesso.', 150, 'Zap', 'rare', '#3b82f6', 'task_count'),
('veteran', 'Veterano da Tribo 🛡️', 'Alcançou a marca de 15 tarefas aprovadas.', 500, 'Shield', 'epic', '#a855f7', 'task_count'),
('reading_streak_7', 'Fiel no Pouco 📖', '7 dias seguidos de leitura bíblica.', 300, 'BookOpen', 'rare', '#3b82f6', 'reading_streak'),
('reading_streak_15', 'Inabalável ⚔️', '15 dias seguidos mergulhado na Palavra.', 1000, 'Flame', 'epic', '#a855f7', 'reading_streak'),
('max_level', 'Lenda da Arena 🏆', 'Atingiu o nível máximo de honra.', 2000, 'Crown', 'legendary', '#f59e0b', 'level'),
('store_fan', 'Consumidor 🛍️', 'Realizou seu primeiro resgate na loja.', 50, 'ShoppingBag', 'common', '#94a3b8', 'store'),
('streak_login_3', 'Faísca ⚡', '3 dias consecutivos de acesso à Arena.', 30, 'Zap', 'common', '#94a3b8', 'login_streak'),
('streak_login_7', 'Chama da Semana 🔥', '7 dias consecutivos de presença digital.', 150, 'Flame', 'rare', '#f97316', 'login_streak'),
('streak_login_14', 'Guardião Quinzenal 🛡️', '14 dias de presença contínua sem falhas.', 400, 'Shield', 'rare', '#3b82f6', 'login_streak'),
('streak_login_30', 'Guerreiro do Mês 🏆', '30 dias consecutivos de acesso — um mês sem falhar.', 1000, 'Trophy', 'epic', '#a855f7', 'login_streak'),
('streak_login_60', 'Inabalável 💎', '60 dias de fidelidade absoluta à Arena.', 2500, 'Gem', 'epic', '#6366f1', 'login_streak'),
('streak_login_100', 'Centurião 🌟', '100 dias consecutivos — um verdadeiro guerreiro.', 5000, 'Star', 'legendary', '#f59e0b', 'login_streak'),
('streak_login_365', 'Guardião Eterno 🔱', '365 dias — um ano inteiro de presença inabalável.', 15000, 'Crown', 'legendary', '#ec4899', 'login_streak'),
('streak_devotional_7', 'Fiel no Pouco 📖', '7 dias consecutivos de devocional diário concluído.', 300, 'BookOpen', 'rare', '#3b82f6', 'devotional_streak'),
('streak_devotional_14', 'Discípulo Ardente ✝️', '14 dias de devocional diário sem interrupção.', 750, 'BookMarked', 'epic', '#a855f7', 'devotional_streak'),
('streak_devotional_30', 'Servidor da Palavra 📜', '30 dias de devoção — um mês inteiro mergulhado na Palavra.', 2000, 'Scroll', 'epic', '#a855f7', 'devotional_streak'),
('streak_devotional_60', 'Apóstolo da Disciplina 🔱', '60 dias de devocional ininterrupto. Disciplina lendária.', 5000, 'Crown', 'legendary', '#f59e0b', 'devotional_streak')
ON CONFLICT (key) DO NOTHING;
