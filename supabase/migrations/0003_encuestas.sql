-- =====================================================================
--  Encuesta de validación (compradores y emprendedores)
-- =====================================================================
create table if not exists public.encuestas (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('comprador', 'emprendedor')),
  respuestas jsonb not null check (jsonb_typeof(respuestas) = 'object' and pg_column_size(respuestas) < 4000),
  creado     timestamptz not null default now()
);

alter table public.encuestas enable row level security;

-- Cualquiera puede responder; solo el administrador puede leer.
drop policy if exists encuestas_responder on public.encuestas;
create policy encuestas_responder on public.encuestas for insert to anon, authenticated
  with check (true);
drop policy if exists encuestas_leer on public.encuestas;
create policy encuestas_leer on public.encuestas for select to authenticated
  using (public.es_admin());

grant insert on public.encuestas to anon, authenticated;
