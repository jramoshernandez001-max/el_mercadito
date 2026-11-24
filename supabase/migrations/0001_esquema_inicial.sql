-- =====================================================================
--  El Mercadito — esquema inicial
--  Ejecutar completo en Supabase: SQL Editor → New query → Run
-- =====================================================================

-- ---------- Perfiles (rol de administrador) ----------
create table if not exists public.perfiles (
  id        uuid primary key references auth.users on delete cascade,
  es_admin  boolean not null default false,
  creado    timestamptz not null default now()
);

create or replace function public.manejar_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false)
$$;

-- Fecha "de hoy" en hora de Colombia
create or replace function public.hoy_co()
returns date language sql stable as $$
  select (now() at time zone 'America/Bogota')::date
$$;

-- ---------- Negocios ----------
create table if not exists public.negocios (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references auth.users on delete cascade,
  slug         text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  nombre       text not null check (char_length(nombre) between 2 and 60),
  eslogan      text not null default '' check (char_length(eslogan) <= 70),
  descripcion  text not null default '' check (char_length(descripcion) <= 500),
  categoria    text not null check (categoria in
                 ('comida','moda','artesanias','belleza','tecnologia','hogar','servicios','clases','eventos')),
  zona         text not null check (zona in
                 ('Centro','Mercado Público','Zona Norte','Zona Sur','Ribera del Sinú','Corregimientos')),
  tipo         text not null default 'producto' check (tipo in ('producto','servicio','ambos')),
  whatsapp     text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  instagram    text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$'),
  horario      text not null default '' check (char_length(horario) <= 60),
  logo_url     text not null default '',
  plan         text not null default 'basico' check (plan in ('basico','premium')),
  oculto       boolean not null default false,
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now()
);

-- Solo el administrador puede cambiar plan, visibilidad o dueño
create or replace function public.proteger_negocio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.es_admin() then
      new.plan := 'basico';
      new.oculto := false;
    end if;
  else
    if not public.es_admin() then
      new.plan := old.plan;
      new.oculto := old.oculto;
      new.owner_id := old.owner_id;
      new.slug := old.slug;
    end if;
    new.creado := old.creado;
  end if;
  new.actualizado := now();
  return new;
end $$;

drop trigger if exists proteger_negocio on public.negocios;
create trigger proteger_negocio
  before insert or update on public.negocios
  for each row execute function public.proteger_negocio();

-- ---------- Productos y servicios ----------
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocios on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 60),
  precio      integer check (precio is null or precio between 0 and 100000000),
  descripcion text not null default '' check (char_length(descripcion) <= 120),
  foto_url    text not null default '',
  orden       integer not null default 0,
  creado      timestamptz not null default now()
);
create index if not exists productos_negocio_idx on public.productos (negocio_id, orden);

-- Límite de catálogo según el plan (Básico 6, Premium 15)
create or replace function public.limitar_productos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_total int;
  v_limite int;
begin
  select plan into v_plan from public.negocios where id = new.negocio_id;
  v_limite := case when v_plan = 'premium' then 15 else 6 end;
  select count(*) into v_total from public.productos where negocio_id = new.negocio_id;
  if v_total >= v_limite then
    raise exception 'LIMITE_PRODUCTOS: tu plan permite % productos o servicios', v_limite;
  end if;
  return new;
end $$;

drop trigger if exists limitar_productos on public.productos;
create trigger limitar_productos
  before insert on public.productos
  for each row execute function public.limitar_productos();

-- ---------- Métricas (visitas y clics a WhatsApp, únicos por día) ----------
create table if not exists public.eventos (
  negocio_id uuid not null references public.negocios on delete cascade,
  tipo       text not null check (tipo in ('vista','whatsapp')),
  visitante  text not null check (char_length(visitante) between 8 and 64),
  dia        date not null default public.hoy_co(),
  primary key (negocio_id, tipo, visitante, dia)
);
create index if not exists eventos_dia_idx on public.eventos (negocio_id, dia);

create or replace function public.registrar_evento(p_negocio uuid, p_tipo text, p_visitante text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_tipo not in ('vista','whatsapp') then return; end if;
  -- El dueño no se cuenta a sí mismo
  if exists (select 1 from public.negocios where id = p_negocio and owner_id = auth.uid()) then return; end if;
  insert into public.eventos (negocio_id, tipo, visitante, dia)
  values (p_negocio, p_tipo, left(p_visitante, 64), public.hoy_co())
  on conflict do nothing;
end $$;

create or replace function public.resumen_eventos()
returns table (negocio_id uuid, vistas bigint, whatsapp bigint)
language sql stable security definer set search_path = public as $$
  select e.negocio_id,
         count(*) filter (where e.tipo = 'vista'),
         count(*) filter (where e.tipo = 'whatsapp')
  from public.eventos e
  where public.es_admin()
  group by e.negocio_id
$$;

-- ---------- Solicitudes Premium ----------
create table if not exists public.solicitudes (
  negocio_id  uuid primary key references public.negocios on delete cascade,
  estado      text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create or replace function public.solicitar_premium()
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.negocios where owner_id = auth.uid();
  if v_id is null then raise exception 'SIN_NEGOCIO'; end if;
  insert into public.solicitudes (negocio_id, estado) values (v_id, 'pendiente')
  on conflict (negocio_id) do update set estado = 'pendiente', actualizado = now()
  where public.solicitudes.estado <> 'aprobada';
end $$;

-- ---------- Anuncio local de portada (una sola fila) ----------
create table if not exists public.anuncio (
  id          int primary key default 1 check (id = 1),
  activo      boolean not null default false,
  titulo      text not null default '' check (char_length(titulo) <= 60),
  texto       text not null default '' check (char_length(texto) <= 120),
  negocio_id  uuid references public.negocios on delete set null,
  color       text not null default '#16A864' check (color ~ '^#[0-9a-fA-F]{6}$'),
  actualizado timestamptz not null default now()
);
insert into public.anuncio (id) values (1) on conflict do nothing;

-- =====================================================================
--  Seguridad a nivel de fila (RLS)
-- =====================================================================
alter table public.perfiles    enable row level security;
alter table public.negocios    enable row level security;
alter table public.productos   enable row level security;
alter table public.eventos     enable row level security;
alter table public.solicitudes enable row level security;
alter table public.anuncio     enable row level security;

-- perfiles: cada quien ve el suyo; el admin ve todos. Nadie los edita desde la app.
drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles for select
  using (id = auth.uid() or public.es_admin());

-- negocios
drop policy if exists negocios_leer on public.negocios;
create policy negocios_leer on public.negocios for select
  using (not oculto or owner_id = auth.uid() or public.es_admin());
drop policy if exists negocios_crear on public.negocios;
create policy negocios_crear on public.negocios for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists negocios_editar on public.negocios;
create policy negocios_editar on public.negocios for update to authenticated
  using (owner_id = auth.uid() or public.es_admin());
drop policy if exists negocios_borrar on public.negocios;
create policy negocios_borrar on public.negocios for delete to authenticated
  using (owner_id = auth.uid() or public.es_admin());

-- productos
drop policy if exists productos_leer on public.productos;
create policy productos_leer on public.productos for select
  using (exists (select 1 from public.negocios n where n.id = negocio_id
                 and (not n.oculto or n.owner_id = auth.uid() or public.es_admin())));
drop policy if exists productos_escribir on public.productos;
create policy productos_escribir on public.productos for all to authenticated
  using (exists (select 1 from public.negocios n where n.id = negocio_id
                 and (n.owner_id = auth.uid() or public.es_admin())))
  with check (exists (select 1 from public.negocios n where n.id = negocio_id
                 and (n.owner_id = auth.uid() or public.es_admin())));

-- eventos: se escriben solo por registrar_evento(); los lee el dueño o el admin
drop policy if exists eventos_leer on public.eventos;
create policy eventos_leer on public.eventos for select to authenticated
  using (public.es_admin() or exists (select 1 from public.negocios n
         where n.id = negocio_id and n.owner_id = auth.uid()));

-- solicitudes: el dueño ve la suya; el admin ve y cambia todas
drop policy if exists solicitudes_leer on public.solicitudes;
create policy solicitudes_leer on public.solicitudes for select to authenticated
  using (public.es_admin() or exists (select 1 from public.negocios n
         where n.id = negocio_id and n.owner_id = auth.uid()));
drop policy if exists solicitudes_admin on public.solicitudes;
create policy solicitudes_admin on public.solicitudes for update to authenticated
  using (public.es_admin());

-- anuncio: todos leen, solo el admin edita
drop policy if exists anuncio_leer on public.anuncio;
create policy anuncio_leer on public.anuncio for select using (true);
drop policy if exists anuncio_editar on public.anuncio;
create policy anuncio_editar on public.anuncio for update to authenticated
  using (public.es_admin());

-- Permisos de ejecución de funciones
revoke all on function public.registrar_evento(uuid, text, text) from public;
grant execute on function public.registrar_evento(uuid, text, text) to anon, authenticated;
revoke all on function public.solicitar_premium() from public;
grant execute on function public.solicitar_premium() to authenticated;
revoke all on function public.resumen_eventos() from public;
grant execute on function public.resumen_eventos() to authenticated;

-- =====================================================================
--  Almacenamiento de imágenes (logos y fotos de productos)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Cada usuario solo escribe dentro de su carpeta: imagenes/<su id>/...
drop policy if exists imagenes_subir on storage.objects;
create policy imagenes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists imagenes_actualizar on storage.objects;
create policy imagenes_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'imagenes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists imagenes_borrar on storage.objects;
create policy imagenes_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'imagenes' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

-- =====================================================================
--  Endurecimiento (recomendaciones del revisor de seguridad de Supabase)
-- =====================================================================
create or replace function public.hoy_co()
returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Bogota')::date
$$;
revoke execute on function public.manejar_nuevo_usuario() from public, anon, authenticated;
revoke execute on function public.proteger_negocio() from public, anon, authenticated;
revoke execute on function public.limitar_productos() from public, anon, authenticated;
revoke execute on function public.solicitar_premium() from anon;
revoke execute on function public.resumen_eventos() from anon;
