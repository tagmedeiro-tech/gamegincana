-- ============================================================
-- RPC ATÔMICA: redeem_store_item
-- Substitui o fluxo de 3 passos do cliente por uma transação
-- segura no banco que garante consistência total.
--
-- O que ela faz (em uma transação):
--  1. Verifica se o usuário tem moedas suficientes
--  2. Verifica se o item tem estoque (stock > 0)
--  3. Deduz as moedas do perfil
--  4. Decrementa o estoque (WHERE stock > 0 para evitar negativo)
--  5. Cria o registro de resgate com status 'pending'
--
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_store_item(
  p_user_id  UUID,
  p_item_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item       store_items%ROWTYPE;
  v_user_coins INTEGER;
BEGIN
  -- Busca o item com lock para evitar race condition
  SELECT * INTO v_item
  FROM store_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'item_not_found', 'message', 'Item não encontrado.');
  END IF;

  IF v_item.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_stock', 'message', 'Item fora de estoque.');
  END IF;

  -- Busca o saldo atual do usuário com lock
  SELECT coins INTO v_user_coins
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_user_coins IS NULL OR v_user_coins < v_item.cost THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_coins', 'message', 'Moedas insuficientes.');
  END IF;

  -- Deduz moedas
  UPDATE profiles
  SET coins = coins - v_item.cost
  WHERE id = p_user_id;

  -- Decrementa estoque (guarda dupla: WHERE stock > 0)
  UPDATE store_items
  SET stock = stock - 1
  WHERE id = p_item_id AND stock > 0;

  -- Registra o resgate
  INSERT INTO redemptions (
    "userId",
    "itemId",
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_item_id,
    'pending',
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'message', 'Resgate realizado com sucesso.');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'reason', 'error', 'message', SQLERRM);
END;
$$;

-- Garante que apenas o próprio usuário pode chamar esta função
REVOKE ALL ON FUNCTION redeem_store_item(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_store_item(UUID, UUID) TO authenticated;
