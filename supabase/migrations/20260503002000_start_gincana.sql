-- 🚀 Início de Temporada e Reset de Gincana

-- 1. Função Nuclear: Reset de Pontuação
CREATE OR REPLACE FUNCTION start_new_gincana(confirm_text TEXT)
RETURNS void AS $$
BEGIN
  -- Segurança: Verificar se o admin digitou a palavra correta
  IF confirm_text <> 'INICIAR GINCANA' THEN
    RAISE EXCEPTION 'Palavra-chave de confirmação incorreta.';
  END IF;

  -- 1. Zerar pontos dos usuários
  UPDATE profiles SET "totalPoints" = 0;
  
  -- 2. Zerar pontos dos grupos
  UPDATE groups SET "totalPoints" = 0;
  
  -- 3. Limpar logs de pontos antigos para que o ranking atual comece limpo
  DELETE FROM point_logs;

  -- 4. Limpar participações em atividades (opcional, mas recomendado para novo ciclo)
  DELETE FROM activity_participations;
  
  -- 5. Limpar conclusões da Bíblia (para permitir pontuar novamente no novo ciclo)
  -- DELETE FROM bible_completions; -- Decidir se quer resetar leitura bíblica também
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir permissões
GRANT EXECUTE ON FUNCTION start_new_gincana(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION start_new_gincana(TEXT) TO service_role;
