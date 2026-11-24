-- =====================================================================
--  Asistente de pedidos con IA (plan Premium)
--  Lleva la cuenta de mensajes por día para limitar el gasto en IA.
-- =====================================================================

create table if not exists public.asistente_uso (
  negocio_id uuid not null references public.negocios on delete cascade,
  visitante  text not null check (char_length(visitante) between 8 and 64),
  dia        date not null default public.hoy_co(),
  mensajes   integer not null default 0,
  primary key (negocio_id, visitante, dia)
);

alter table public.asistente_uso enable row level security;
-- Sin políticas: nadie la lee ni la escribe directo; solo la función de abajo.

-- Devuelve true si el mensaje está permitido y lo cuenta.
-- Límites: 40 mensajes por visitante al día y 400 por tienda al día. Solo tiendas Premium visibles.
create or replace function public.consumir_asistente(p_negocio uuid, p_visitante text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean;
  v_visitante int;
  v_tienda int;
begin
  select (plan = 'premium' and not oculto) into v_ok from public.negocios where id = p_negocio;
  if not coalesce(v_ok, false) then return false; end if;

  select coalesce(sum(mensajes), 0) into v_tienda from public.asistente_uso
   where negocio_id = p_negocio and dia = public.hoy_co();
  select coalesce(mensajes, 0) into v_visitante from public.asistente_uso
   where negocio_id = p_negocio and visitante = left(p_visitante, 64) and dia = public.hoy_co();

  if coalesce(v_visitante, 0) >= 40 or v_tienda >= 400 then return false; end if;

  insert into public.asistente_uso (negocio_id, visitante, dia, mensajes)
  values (p_negocio, left(p_visitante, 64), public.hoy_co(), 1)
  on conflict (negocio_id, visitante, dia) do update set mensajes = public.asistente_uso.mensajes + 1;
  return true;
end $$;

revoke all on function public.consumir_asistente(uuid, text) from public;
grant execute on function public.consumir_asistente(uuid, text) to anon, authenticated;
