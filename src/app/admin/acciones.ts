"use server";
import { revalidatePath } from "next/cache";
import { esAdmin } from "@/lib/supabase/server";

async function admin() {
  const r = await esAdmin();
  if (!r.admin) throw new Error("No autorizado");
  return r.supabase;
}
const refrescar = () => {
  revalidatePath("/", "layout");
};
const id = (f: FormData) => String(f.get("id") ?? "");

export async function resolverSolicitud(f: FormData) {
  const supabase = await admin();
  const aprobar = f.get("decision") === "aprobar";
  if (aprobar) await supabase.from("negocios").update({ plan: "premium" }).eq("id", id(f));
  await supabase.from("solicitudes").update({ estado: aprobar ? "aprobada" : "rechazada", actualizado: new Date().toISOString() }).eq("negocio_id", id(f));
  refrescar();
}

export async function cambiarPlan(f: FormData) {
  const supabase = await admin();
  await supabase.from("negocios").update({ plan: f.get("plan") === "premium" ? "premium" : "basico" }).eq("id", id(f));
  refrescar();
}

export async function cambiarVisibilidad(f: FormData) {
  const supabase = await admin();
  await supabase.from("negocios").update({ oculto: f.get("oculto") === "true" }).eq("id", id(f));
  refrescar();
}

export async function eliminarNegocio(f: FormData) {
  const supabase = await admin();
  await supabase.from("negocios").delete().eq("id", id(f));
  refrescar();
}

export async function guardarAnuncio(f: FormData) {
  const supabase = await admin();
  const color = String(f.get("color") ?? "");
  const negocio = String(f.get("negocio_id") ?? "");
  await supabase
    .from("anuncio")
    .update({
      activo: f.get("activo") === "on",
      titulo: String(f.get("titulo") ?? "").trim().slice(0, 60),
      texto: String(f.get("texto") ?? "").trim().slice(0, 120),
      negocio_id: negocio || null,
      color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#16A864",
      actualizado: new Date().toISOString(),
    })
    .eq("id", 1);
  refrescar();
}
