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
  const conv = vistas.length ? Math.round((whats / vistas.length) * 100) : 0;
  const dias = Array.from({ length: 7 }, (_, i) => {
    const k = diaCO(i - 6);
    const d = new Date(k + "T12:00:00");
    return { k, l: ["D", "L", "M", "M", "J", "V", "S"][d.getDay()], n: vistas.filter((v) => v === k).length };
  });
  const max = Math.max(1, ...dias.map((d) => d.n));

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <div className="pt-[22px] pb-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Mi negocio</h1>
        <p className="mt-1 text-sm text-gris">{negocio ? "Administra tu perfil y mira cómo te va." : "Crea tu perfil gratis. Puedes editarlo cuando quieras."}</p>
      </div>

      {negocio && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-[10px]">
            {[
              [vistas.length, "Visitas (30 días)"],
              [whats, "Clics a WhatsApp"],
              [conv + "%", "Visitas que escriben"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-[14px] bg-white p-[14px] shadow-tarjeta">
                <b className="block text-2xl tracking-tight">{v}</b>
                <span className="text-xs font-semibold text-gris">{l}</span>
              </div>
            ))}
          </div>
          <div className="panel relative mt-[14px]">
            <h3 className="mb-2 font-bold">Visitas últimos 7 días</h3>
            <div className="flex h-[120px] items-end gap-1.5">
              {dias.map((d, i) => (
                <div key={d.k} className="flex h-full flex-1 flex-col items-center justify-end gap-1 text-[10.5px] text-gris">
                  <em className="text-[11px] font-bold text-tinta not-italic">{prem ? d.n : ""}</em>
                  <i className="block w-full max-w-[34px] min-h-[2px] rounded-t-md bg-verde" style={{ height: `${prem ? Math.round((d.n / max) * 90) : [30, 55, 40, 70, 50, 80, 60][i]}%` }} />
                  {d.l}
                </div>
              ))}
            </div>
            {!prem && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/85 p-3 text-center text-[13px] font-semibold">
                <div>📈 Estadísticas por día en Premium<br /><Link href="/planes" className="font-bold text-verde">Conocer Premium</Link></div>
              </div>
            )}
          </div>
          <div className="panel mt-[14px] flex flex-wrap items-center gap-3">
            {prem ? (
              <span className="pill-verde">⭐ Plan Premium activo</span>
            ) : (
              <>
                <div className="min-w-[200px] flex-1">
                  <b>Plan Básico (gratis)</b>
                  <div className="text-[13px] text-gris">
                    {solicitud === "pendiente" ? "Tu solicitud Premium está en revisión." : solicitud === "rechazada" ? "Tu solicitud Premium no fue aprobada esta vez." : "Pásate a Premium: más productos, insignia y estadísticas."}
                  </div>
                </div>
                {solicitud !== "pendiente" && <Link href="/planes" className="btn-navy btn-sm">Ver Premium</Link>}
              </>
            )}
          </div>
        </>
      )}

      <FormNegocio uid={user.id} negocio={negocio} />
    </div>
  );
}
