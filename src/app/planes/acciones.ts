"use server";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function solicitarPremium() {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("solicitar_premium");
  if (error) console.error("solicitarPremium", error.message);
  revalidatePath("/planes");
  revalidatePath("/mi-negocio");
}
