import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { diaCO, type Negocio, type Producto } from "@/lib/datos";
import { usuarioActual } from "@/lib/supabase/server";
import { FormNegocio } from "./FormNegocio";

export const metadata: Metadata = { title: "Mi negocio" };

export default async function MiNegocio() {
  const { supabase, user } = await usuarioActual();
  if (!user) redirect("/ingresar?next=/mi-negocio");

  const { data: n } = await supabase.from("negocios").select("*, productos(*)").eq("owner_id", user.id).maybeSingle();
  const negocio = n as (Negocio & { productos: Producto[] }) | null;

  let vistas: string[] = [];
  let whats = 0;
  let solicitud: string | null = null;
  if (negocio) {
    const desde = diaCO(-29);
    const { data: ev } = await supabase.from("eventos").select("tipo,dia").eq("negocio_id", negocio.id).gte("dia", desde);
    vistas = (ev ?? []).filter((e) => e.tipo === "vista").map((e) => e.dia as string);
    whats = (ev ?? []).filter((e) => e.tipo === "whatsapp").length;
    const { data: s } = await supabase.from("solicitudes").select("estado").eq("negocio_id", negocio.id).maybeSingle();
    solicitud = s?.estado ?? null;
  }
  const prem = negocio?.plan === "premium";
  const dias = Array.from({ length: 7 }, (_, i) => {
    const k = diaCO(i - 6);
    const d = new Date(k + "T12:00:00");
    return { k, l: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()], n: vistas.filter((v) => v === k).length };
  });
  const max = Math.max(1, ...dias.map((d) => d.n));

  return (
    <div className="mx-auto max-w-[680px] px-4">
      <div className="flex items-center justify-between pt-6">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Mi negocio</h1>
        {negocio && (
          <Link href="/planes" className={prem ? "pill-verde" : "pill"}>
            {prem ? "⭐ Premium" : solicitud === "pendiente" ? "Premium en revisión" : "Básico · Mejorar"}
          </Link>
        )}
      </div>

      {negocio && (
        <div className="mt-4 rounded-2xl bg-white shadow-tarjeta">
          <div className="grid grid-cols-2 divide-x divide-linea py-4 text-center">
            <div>
              <b className="block text-2xl">{vistas.length}</b>
              <span className="text-xs text-gris">visitas · 30 días</span>
            </div>
            <div>
              <b className="block text-2xl">{whats}</b>
              <span className="text-xs text-gris">te escribieron</span>
            </div>
          </div>
          {prem && (
            <div className="flex h-24 items-end gap-2 border-t border-linea px-5 pt-4 pb-3">
              {dias.map((d) => (
                <div key={d.k} className="flex h-full flex-1 flex-col items-center justify-end gap-1 text-[10px] text-gris">
                  <i className="block w-full max-w-[28px] min-h-[2px] rounded-t bg-verde" style={{ height: `${Math.round((d.n / max) * 100)}%` }} title={`${d.n} visitas`} />
                  {d.l}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FormNegocio uid={user.id} negocio={negocio} />
    </div>
  );
}
