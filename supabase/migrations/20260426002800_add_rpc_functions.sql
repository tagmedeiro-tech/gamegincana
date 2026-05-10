-- Função para incrementar pontos e logar a transação
create or replace function increment_points(
  user_id uuid,
  group_id text,
  pts integer,
  reason text
) returns void as $$
begin
  -- Atualizar perfil do usuário
  update profiles 
  set "totalPoints" = "totalPoints" + pts
  where id = user_id;

  -- Atualizar pontos do grupo
  update groups 
  set "totalPoints" = "totalPoints" + pts
  where id = group_id;

  -- Inserir log de pontos
  insert into point_logs ("userId", "groupId", points, reason)
  values (user_id, group_id, pts, reason);
end;
$$ language plpgsql security definer;
