-- Tabela de mapeamento username -> e-mail (Supabase Auth exige e-mail para login,
-- esta tabela permite ao usuário digitar apenas um "login" curto, ex: admin)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz default now()
);

-- Papel do usuário autenticado. 'admin' libera todas as funções do site.
-- 'gestor' tem acesso de visitante + Dashboard + exportação Excel/PDF.
-- Novos papéis podem ser adicionados aqui conforme necessário.
alter table usuarios add column if not exists role text not null default 'admin';

alter table usuarios enable row level security;

-- Necessário para o formulário de login resolver username -> email antes do signIn.
-- Não expõe senha (isso fica no Supabase Auth), apenas o e-mail vinculado ao username.
drop policy if exists "usuarios_select_publico" on usuarios;
create policy "usuarios_select_publico"
  on usuarios for select
  to anon, authenticated
  using (true);

-- Insira aqui o(s) usuário(s) administrador(es).
insert into usuarios (username, email) values
  ('admin', 'everson.junior@fatecie.edu.br')
on conflict (username) do nothing;

-- Insira aqui o(s) usuário(s) gestor(es). Requer que o usuário já exista
-- no Supabase Auth com o mesmo e-mail. Troque username/e-mail conforme o caso.
insert into usuarios (username, email, role) values
  ('victor.biazon', 'victor.biazon@fatecie.edu.br', 'gestor')
on conflict (username) do update set role = excluded.role;

insert into usuarios (username, email, role) values
  ('jaqueline.valin', 'jaqueline.valin@fatecie.edu.br', 'gestor')
on conflict (username) do update set role = excluded.role;
