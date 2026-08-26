-- =========================================================
-- MIMO & MONTE — Schema do Supabase
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
-- Pode rodar de novo com segurança (usa "if not exists" / "or replace").
-- =========================================================

-- ---------------------------------------------------------
-- 1) PERFIS (login, papel do usuário: cliente ou gerente)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  avatar_url text,
  role text not null default 'cliente' check (role in ('cliente','gerente')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Função auxiliar (evita recursão infinita nas políticas de RLS)
create or replace function public.is_gerente()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'gerente'
  );
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_gerente());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Cria automaticamente um perfil quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2) KITS (catálogo — editável pelo Gerente)
-- ---------------------------------------------------------
create table if not exists public.kits (
  id text primary key,
  title text not null,
  category text not null,
  category_label text not null,
  icon text default '🎉',
  color_from text default '#FFE3DB',
  color_to text default '#FFB9A6',
  price numeric not null default 180,
  status text not null default 'disponivel' check (status in ('disponivel','indisponivel')),
  photo_url text,
  ref_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kits enable row level security;

drop policy if exists "kits_select_all" on public.kits;
create policy "kits_select_all" on public.kits for select using (true);

drop policy if exists "kits_insert_gerente" on public.kits;
create policy "kits_insert_gerente" on public.kits for insert with check (public.is_gerente());

drop policy if exists "kits_update_gerente" on public.kits;
create policy "kits_update_gerente" on public.kits for update using (public.is_gerente());

drop policy if exists "kits_delete_gerente" on public.kits;
create policy "kits_delete_gerente" on public.kits for delete using (public.is_gerente());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kits_set_updated_at on public.kits;
create trigger kits_set_updated_at before update on public.kits
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------
-- 3) DÚVIDAS (mensagens do botão flutuante estilo "Globalinho")
-- ---------------------------------------------------------
create table if not exists public.duvidas (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  nome text,
  email text,
  mensagem text not null,
  status text not null default 'pendente' check (status in ('pendente','respondida')),
  created_at timestamptz not null default now()
);

alter table public.duvidas enable row level security;

drop policy if exists "duvidas_insert_all" on public.duvidas;
create policy "duvidas_insert_all" on public.duvidas for insert with check (true);

drop policy if exists "duvidas_select_own_or_gerente" on public.duvidas;
create policy "duvidas_select_own_or_gerente" on public.duvidas
  for select using (auth.uid() = user_id or public.is_gerente());

drop policy if exists "duvidas_update_gerente" on public.duvidas;
create policy "duvidas_update_gerente" on public.duvidas for update using (public.is_gerente());

-- ---------------------------------------------------------
-- 4) STORAGE (fotos dos kits e avatares dos usuários)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('kits', 'kits', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "kits_photos_select" on storage.objects;
create policy "kits_photos_select" on storage.objects
  for select using (bucket_id = 'kits');

drop policy if exists "kits_photos_insert_gerente" on storage.objects;
create policy "kits_photos_insert_gerente" on storage.objects
  for insert with check (bucket_id = 'kits' and public.is_gerente());

drop policy if exists "kits_photos_update_gerente" on storage.objects;
create policy "kits_photos_update_gerente" on storage.objects
  for update using (bucket_id = 'kits' and public.is_gerente());

drop policy if exists "kits_photos_delete_gerente" on storage.objects;
create policy "kits_photos_delete_gerente" on storage.objects
  for delete using (bucket_id = 'kits' and public.is_gerente());

drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------
-- 5) SEED — catálogo atual (17 kits que já existem no site)
--    Só insere se a tabela ainda estiver vazia, pra não duplicar.
-- ---------------------------------------------------------
insert into public.kits (id, title, category, category_label, icon, color_from, color_to, price, status, photo_url, ref_url)
select * from (values
  ('hulk-vingador', 'Kit Festa Painel + Trio de Cilindros Incrível Hulk Vingador', 'herois', 'Heróis', '💥', '#CFF3DC', '#9FE3B8', 180, 'disponivel', 'images/kits/hulk-vingador.jpg', 'https://www.mercadolivre.com.br/kit-festa-painel-trio-de-cilindros-incrivel-hulk-vingador/p/MLB2092913129?pdp_filters=item_id:MLB4975509657'),
  ('morcego', 'Kit Painel 1,5 m + Trio Capa Cilindro Morcego Pegue e Monte', 'herois', 'Heróis', '🦇', '#DCE3F5', '#AEBBE8', 180, 'disponivel', 'images/kits/morcego.jpg', 'https://www.mercadolivre.com.br/kit-painel-15-m--trio-capa-cilindro-morcego-pegue-e-monte/up/MLBU3985495364?pdp_filters=item_id:MLB6800385994'),
  ('bailarina', 'Kit Painel 1,5 m + Trio Capa Cilindro Pegue Monte Bailarina', 'bailarina', 'Bailarina', '🩰', '#FBE1EE', '#F3B8D6', 180, 'disponivel', 'images/kits/bailarina.jpg', 'https://www.mercadolivre.com.br/kit-painel-15-m--trio-capa-cilindro-pegue-monte-bailarina/up/MLBU3985486718?pdp_filters=item_id:MLB6800348238'),
  ('temas-comemorativos', 'Capas Cilindro + Painel 1,50 Temas Comemorativos Tecido', 'variados', 'Temas variados', '🎉', '#FFE3DB', '#FFB9A6', 180, 'disponivel', 'images/kits/temas-comemorativos.jpg', 'https://produto.mercadolivre.com.br/MLB-3442787887-capas-cilindro-painel-150-temas-comemorativos-tecido-_JM'),
  ('cavalos', 'Capa Painel Redondo Cavalos + Trio Cilindros Pegue Monte', 'animais', 'Animais', '🐴', '#F2E6D6', '#DDC29A', 180, 'disponivel', 'images/kits/cavalos.jpg', 'https://produto.mercadolivre.com.br/MLB-1849577414-capa-painel-redondo-cavalos-trio-cilindros-pegue-monte-_JM'),
  ('roblox', 'Painel Redondo + Trio De Cilindro Capas Sublimados Rblox', 'anime-games', 'Anime e games', '🎮', '#D9F2E4', '#A9E0C0', 180, 'disponivel', 'images/kits/roblox.jpg', 'https://www.mercadolivre.com.br/painel-redondo-trio-de-cilindro-capas-sublimados-rblox/p/MLB2065651757'),
  ('temas-herois-trio', 'Trio Capas Cilindros Painel Redondo Pegue Monte Temas Heróis', 'herois', 'Heróis', '🦸', '#DCEBFC', '#A9CEF5', 180, 'disponivel', 'images/kits/temas-herois-trio.jpg', 'https://produto.mercadolivre.com.br/MLB-5315102856-trio-capas-cilindros-painel-redondo-pegue-monte-temas-herois-_JM'),
  ('super-herois-289', 'Kit Painel + Trio Capas de Cilindros Tema Super Heróis 289', 'herois', 'Heróis', '🦸‍♂️', '#DCEBFC', '#A9CEF5', 180, 'disponivel', 'images/kits/super-herois-289.jpg', 'https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-super-herois-289/p/MLB2101672626'),
  ('anime-decor', 'Capas Para Cilindros + Painel - Anime - Kit Decoração Festa', 'anime-games', 'Anime e games', '⭐', '#EBE1FA', '#CDB3EF', 180, 'disponivel', 'images/kits/anime-decor.jpg', 'https://www.mercadolivre.com.br/capas-para-cilindros-painel-anime-kit-decoracao-festa/p/MLB2085200145'),
  ('boteco-2', 'Kit Painel + Trio Capas De Cilindros Tema Boteco 2', 'boteco', 'Boteco', '🍻', '#FDEFCB', '#F6D480', 180, 'disponivel', 'images/kits/boteco-2.jpg', 'https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-boteco-2/p/MLB2092719961'),
  ('super-herois-290', 'Kit Painel +trio Capas De Cilindros Tema Super Heróis 290', 'herois', 'Heróis', '🛡️', '#FFE1DD', '#FBB2A8', 180, 'disponivel', 'images/kits/super-herois-290.jpg', 'https://www.mercadolivre.com.br/kit-painel-trio-capas-de-cilindros-tema-super-herois-290/p/MLB2101654960'),
  ('safari', 'Painel Redondo 1,50m + Capas Cilindros 3D Pegue Monte Safari', 'safari', 'Safari', '🦁', '#E9F3D9', '#C4E1A0', 180, 'disponivel', 'images/kits/safari.jpg', 'https://www.mercadolivre.com.br/painel-redondo-150m--capas-cilindros-3d-pegue-monte-safari/up/MLBU4598055859'),
  ('cha-revelacao', 'Painel Redondo + Capas Cilindros Chá Revelação Pegue Monte', 'cha-revelacao', 'Chá revelação', '👶', '#DDEBFC', '#F6C9DC', 180, 'disponivel', 'images/kits/cha-revelacao.jpg', 'https://www.mercadolivre.com.br/painel-redondo--capas-cilindros-cha-revelacao-pegue-monte/up/MLBU4626602350'),
  ('veste-facil', 'Capa Painel Redondo + Trio Cilindro Veste Fácil Pegue Monte', 'variados', 'Temas variados', '🎀', '#EBE1FA', '#CDB3EF', 180, 'disponivel', 'images/kits/veste-facil.jpg', 'https://produto.mercadolivre.com.br/MLB-3032101354-capa-painel-redondo-trio-cilindro-veste-facil-pegue-monte-_JM'),
  ('mais-vendidos', 'Trio Capas Cilindros + Painel Tema Mais Vendidos', 'variados', 'Temas variados', '✨', '#FFE3DB', '#FFB9A6', 180, 'disponivel', 'images/kits/mais-vendidos.jpg', 'https://produto.mercadolivre.com.br/MLB-3738730619-trio-capas-cilindros-painel-tema-mais-vendidos-_JM'),
  ('happy-birthday-1', 'Trio Capa Cilindro + Painel Tema Happy Birthday Veste Fácil – Preto e Dourado', 'aniversario', 'Aniversário', '🎂', '#FDEFCB', '#F6D480', 180, 'disponivel', 'images/kits/happy-birthday-1.jpg', 'https://produto.mercadolivre.com.br/MLB-2684832523-trio-capa-cilindro-painel-tema-happy-birthday-veste-facil-_JM'),
  ('happy-birthday-2', 'Trio Capa Cilindro + Painel Tema Happy Birthday Veste Fácil – Rosê', 'aniversario', 'Aniversário', '🎈', '#DCEBFC', '#A9CEF5', 180, 'disponivel', 'images/kits/happy-birthday-2.jpg', 'https://produto.mercadolivre.com.br/MLB-2684826911-trio-capa-cilindro-painel-tema-happy-birthday-veste-facil-_JM')
) as seed(id, title, category, category_label, icon, color_from, color_to, price, status, photo_url, ref_url)
where not exists (select 1 from public.kits);

-- ---------------------------------------------------------
-- 6) Promover seu usuário para Gerente (admin)
--    Rode isto DEPOIS de se cadastrar pelo site com o seu e-mail:
-- ---------------------------------------------------------
-- update public.profiles set role = 'gerente' where email = 'seu-email@aqui.com';
