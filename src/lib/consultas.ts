import type { SupabaseClient } from "@supabase/supabase-js";
import type { Negocio } from "./datos";

/** Negocios visibles al público, con su catálogo. */
export async function negociosVisibles(supabase: SupabaseClient): Promise<Negocio[]> {
  const { data, error } = await supabase
    .from("negocios")
    .select("*, productos(id,negocio_id,nombre,precio,descripcion,foto_url,orden)")
    .eq("oculto", false);
  if (error) {
    console.error("negociosVisibles", error.message);
    return [];
  }
  return (data ?? []) as Negocio[];
}

export type Anuncio = { activo: boolean; titulo: string; texto: string; negocio_id: string | null; color: string };

export async function anuncioActual(supabase: SupabaseClient): Promise<Anuncio | null> {
  const { data } = await supabase.from("anuncio").select("activo,titulo,texto,negocio_id,color").eq("id", 1).maybeSingle();
  return (data as Anuncio) ?? null;
}
