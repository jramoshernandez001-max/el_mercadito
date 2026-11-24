import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATS, PRECIO_PREMIUM, cat, cop, waLink, type Negocio } from "@/lib/datos";
import { anuncioActual } from "@/lib/consultas";
import { esAdmin } from "@/lib/supabase/server";
import { BotonConfirmar } from "./BotonConfirmar";
import { cambiarPlan, cambiarVisibilidad, eliminarNegocio, guardarAnuncio, resolverSolicitud } from "./acciones";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default async function Admin() {
  const { supabase, admin } = await esAdmin();
  if (!admin) notFound();

  const [{ data: negs }, { data: resumen }, { data: sols }, anuncio] = await Promise.all([
    supabase.from("negocios").select("*, productos(id)").order("creado", { ascending: false }),
    supabase.rpc("resumen_eventos"),
    supabase.from("solicitudes").select("negocio_id,estado,creado").eq("estado", "pendiente").order("creado"),
    anuncioActual(supabase),
  ]);
  const todos = (negs ?? []) as (Negocio & { productos: { id: string }[] })[];
  const visibles = todos.filter((n) => !n.oculto);
  const metr = new Map<string, { vistas: number; whatsapp: number }>(
    ((resumen ?? []) as { negocio_id: string; vistas: number; whatsapp: number }[]).map((r) => [r.negocio_id, { vistas: Number(r.vistas), whatsapp: Number(r.whatsapp) }]),
  );
  const totV = [...metr.values()].reduce((s, m) => s + m.vistas, 0);
  const totW = [...metr.values()].reduce((s, m) => s + m.whatsapp, 0);
  const premium = todos.filter((n) => n.plan === "premium").length;
  const porCat = CATS.map((c) => [c, visibles.filter((n) => n.categoria === c.id).length] as const);
  const maxC = Math.max(1, ...porCat.map((x) => x[1]));
  const top = visibles.map((n) => ({ n, ...(metr.get(n.id) ?? { vistas: 0, whatsapp: 0 }) })).sort((a, b) => b.vistas - a.vistas).slice(0, 5);
  const color = /^#[0-9a-fA-F]{6}$/.test(anuncio?.color ?? "") ? anuncio!.color : "#16A864";

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <div className="pt-[22px] pb-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Panel de administración</h1>
        <p className="mt-1 text-sm text-gris">Moderación, planes, anuncios y métricas de la plataforma.</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-[10px] sm:grid-cols-5">
        {[
          [visibles.length, "Perfiles visibles"],
          [todos.reduce((s, n) => s + n.productos.length, 0), "Productos y servicios"],
          [totV, "Visitas a perfiles"],
          [totW, "Clics a WhatsApp"],
          [premium, `Premium · ${cop(premium * PRECIO_PREMIUM)}/mes`],
        ].map(([v, l]) => (
          <div key={String(l)} className="rounded-[14px] bg-white p-[14px] shadow-tarjeta">
            <b className="block text-2xl tracking-tight">{v}</b>
            <span className="text-xs font-semibold text-gris">{l}</span>
          </div>
        ))}
      </div>

      {(sols ?? []).length > 0 && (
        <div className="panel mt-[14px]">
          <h3 className="mb-3 font-bold">Solicitudes Premium ({sols!.length})</h3>
          {sols!.map((s) => {
            const n = todos.find((x) => x.id === s.negocio_id);
            if (!n) return null;
            return (
              <div key={s.negocio_id} className="flex flex-wrap items-center gap-[10px] border-b border-linea py-2">
                <div className="min-w-[160px] flex-1">
                  <b>{n.nombre}</b>
                  <div className="text-[13px] text-gris">
                    <a className="underline" target="_blank" rel="noopener noreferrer" href={waLink(n.whatsapp, `Hola ${n.nombre}, te escribimos de El Mercadito por tu solicitud del plan Premium.`)}>
                      Escribir al {n.whatsapp}
                    </a>
                  </div>
                </div>
                <form action={resolverSolicitud} className="flex gap-2">
                  <input type="hidden" name="id" value={n.id} />
                  <button name="decision" value="aprobar" className="btn-verde btn-sm">Aprobar</button>
                  <button name="decision" value="rechazar" className="btn-borde btn-sm">Rechazar</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-[14px] grid items-start gap-[14px] md:grid-cols-2">
        <div className="panel">
          <h3 className="mb-3 font-bold">Perfiles por categoría</h3>
          {porCat.map(([c, n]) => (
            <div key={c.id} className="mb-2 grid grid-cols-[150px_1fr_30px] items-center gap-[10px] text-[13px]">
              <span>{c.e} {c.n}</span>
              <span className="h-[10px] rounded-[5px] bg-[#EEF1F5]"><i className="block h-full rounded-[5px] bg-verde" style={{ width: `${(n / maxC) * 100}%` }} /></span>
              <b>{n}</b>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3 className="mb-3 font-bold">Más visitados</h3>
          {top.length ? top.map(({ n, vistas, whatsapp }, i) => (
            <div key={n.id} className="flex gap-[10px] border-b border-linea py-[7px] text-sm">
              <b className="w-[18px]">{i + 1}</b>
              <Link href={`/n/${n.slug}`} className="flex-1">{n.nombre}</Link>
              <span className="text-gris">{vistas} visitas · {whatsapp} 💬</span>
            </div>
          )) : <p className="text-[13px] text-gris">Sin datos aún.</p>}
        </div>
      </div>

      <div className="panel mt-[14px]">
        <h3 className="mb-3 font-bold">Anuncio local en portada</h3>
        <form action={guardarAnuncio} className="grid gap-3">
          <label className="inline-flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" name="activo" defaultChecked={anuncio?.activo} className="h-[18px] w-[18px] accent-verde" /> Mostrar anuncio
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta">Título<input name="titulo" maxLength={60} defaultValue={anuncio?.titulo} className="campo" placeholder="¡2x1 en butifarras este sábado!" /></label>
            <label className="etiqueta">
              Perfil vinculado
              <select name="negocio_id" defaultValue={anuncio?.negocio_id ?? ""} className="campo">
                <option value="">Ninguno</option>
                {visibles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </label>
          </div>
          <label className="etiqueta">Texto<input name="texto" maxLength={120} defaultValue={anuncio?.texto} className="campo" placeholder="Solo en el Mercado Público" /></label>
          <label className="etiqueta">Color<input type="color" name="color" defaultValue={color} className="h-10 w-[60px]" /></label>
          <div><button className="btn-navy">Guardar anuncio</button></div>
        </form>
      </div>

      <div className="panel mt-[14px]">
        <h3 className="mb-3 font-bold">Todos los perfiles ({todos.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] tracking-wide text-gris uppercase">
                <th className="border-b border-linea px-1.5 py-2.5">Emprendimiento</th>
                <th className="border-b border-linea px-1.5 py-2.5">Métricas</th>
                <th className="border-b border-linea px-1.5 py-2.5">Plan</th>
                <th className="border-b border-linea px-1.5 py-2.5">Visible</th>
                <th className="border-b border-linea px-1.5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {todos.map((n) => {
                const m = metr.get(n.id) ?? { vistas: 0, whatsapp: 0 };
                return (
                  <tr key={n.id} className={n.oculto ? "opacity-60" : ""}>
                    <td className="border-b border-linea px-1.5 py-2.5">
                      <Link href={`/n/${n.slug}`} className="font-semibold">{n.nombre}</Link>
                      <div className="text-xs text-gris">{cat(n.categoria).n} · {n.zona} · {n.productos.length} ítems</div>
                    </td>
                    <td className="border-b border-linea px-1.5 py-2.5 text-xs text-gris">{m.vistas} visitas<br />{m.whatsapp} 💬</td>
                    <td className="border-b border-linea px-1.5 py-2.5">
                      <form action={cambiarPlan}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="plan" value={n.plan === "premium" ? "basico" : "premium"} />
                        <button className={n.plan === "premium" ? "pill-verde" : "pill"} title="Cambiar plan">{n.plan === "premium" ? "⭐ Premium" : "Básico"}</button>
                      </form>
                    </td>
                    <td className="border-b border-linea px-1.5 py-2.5">
                      <form action={cambiarVisibilidad}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="oculto" value={n.oculto ? "false" : "true"} />
                        <button className={n.oculto ? "pill bg-amber-100 text-amber-800" : "pill-verde"}>{n.oculto ? "Oculto" : "Visible"}</button>
                      </form>
                    </td>
                    <td className="border-b border-linea px-1.5 py-2.5 text-right">
                      <form action={eliminarNegocio}>
                        <input type="hidden" name="id" value={n.id} />
                        <BotonConfirmar mensaje={`¿Eliminar "${n.nombre}" definitivamente?`} className="btn-rojo btn-sm">Eliminar</BotonConfirmar>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gris">Toca el plan o la visibilidad para cambiarlos.</p>
      </div>
    </div>
  );
}
