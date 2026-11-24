"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATS, LIMITE, TIPOS, ZONAS, slugify, type Negocio, type Producto } from "@/lib/datos";
import { comprimir } from "@/lib/imagenes";
import { crearClienteNavegador } from "@/lib/supabase/client";

type ProdDraft = { key: string; id?: string; nombre: string; precio: string; descripcion: string; foto_url: string };

const vacio = { nombre: "", eslogan: "", descripcion: "", categoria: "", zona: "", tipo: "producto", whatsapp: "", instagram: "", horario: "", logo_url: "" };

export function FormNegocio({ uid, negocio }: { uid: string; negocio: (Negocio & { productos: Producto[] }) | null }) {
  const router = useRouter();
  const supabase = crearClienteNavegador();
  const [creando, setCreando] = useState(!!negocio);
  const [d, setD] = useState(() => (negocio ? { ...vacio, ...Object.fromEntries(Object.keys(vacio).map((k) => [k, String((negocio as Record<string, unknown>)[k] ?? "")])) } : { ...vacio }));
  const [prods, setProds] = useState<ProdDraft[]>(() =>
    [...(negocio?.productos ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((p) => ({ key: p.id, id: p.id, nombre: p.nombre, precio: p.precio == null ? "" : String(p.precio), descripcion: p.descripcion, foto_url: p.foto_url })),
  );
  const [nid, setNid] = useState<string | undefined>(negocio?.id);
  const [baseIds, setBaseIds] = useState<string[]>(() => (negocio?.productos ?? []).map((p) => p.id));
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ t: string; err?: boolean } | null>(null);
  const limite = negocio?.plan === "premium" ? LIMITE.premium : LIMITE.basico;

  const set = (k: keyof typeof vacio, v: string) => setD((x) => ({ ...x, [k]: v }));
  const setP = (key: string, k: keyof ProdDraft, v: string) => setProds((ps) => ps.map((p) => (p.key === key ? { ...p, [k]: v } : p)));

  async function subir(file: File | undefined, destino: "logo" | string) {
    if (!file) return;
    setSubiendo(destino);
    try {
      const blob = await comprimir(file, destino === "logo" ? 400 : 700, 0.75);
      const ruta = `${uid}/${destino === "logo" ? "logo" : "p"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const { error } = await supabase.storage.from("imagenes").upload(ruta, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      const url = supabase.storage.from("imagenes").getPublicUrl(ruta).data.publicUrl;
      if (destino === "logo") set("logo_url", url);
      else setP(destino, "foto_url", url);
    } catch {
      setAviso({ t: "No se pudo subir la imagen. Prueba con una foto JPG o PNG.", err: true });
    } finally {
      setSubiendo(null);
    }
  }

  async function guardar() {
    setAviso(null);
    const tel = d.whatsapp.replace(/\D/g, "");
    if (d.nombre.trim().length < 2) return setAviso({ t: "Escribe el nombre de tu emprendimiento.", err: true });
    if (!d.categoria) return setAviso({ t: "Elige una categoría.", err: true });
    if (!d.zona) return setAviso({ t: "Elige tu zona de Lorica.", err: true });
    if (tel.length < 10 || tel.length > 13) return setAviso({ t: "Escribe un WhatsApp válido de 10 dígitos.", err: true });

    setGuardando(true);
    const datos = {
      nombre: d.nombre.trim().slice(0, 60),
      eslogan: d.eslogan.trim().slice(0, 70),
      descripcion: d.descripcion.trim().slice(0, 500),
      categoria: d.categoria,
      zona: d.zona,
      tipo: d.tipo,
      whatsapp: tel,
      instagram: d.instagram.replace(/[^A-Za-z0-9._]/g, "").slice(0, 30),
      horario: d.horario.trim().slice(0, 60),
      logo_url: d.logo_url,
    };
    try {
      let negocioId = nid;
      if (negocioId) {
        const { error } = await supabase.from("negocios").update(datos).eq("id", negocioId);
        if (error) throw error;
      } else {
        for (let intento = 0; intento < 3 && !negocioId; intento++) {
          const slug = `${slugify(datos.nombre) || "negocio"}-${Math.random().toString(36).slice(2, 6)}`;
          const { data, error } = await supabase.from("negocios").insert({ ...datos, owner_id: uid, slug }).select("id").single();
          if (error && error.code !== "23505") throw error;
          negocioId = data?.id;
        }
        if (!negocioId) throw new Error("slug");
      }

      // Sincroniza el catálogo: borra los quitados, actualiza los existentes, crea los nuevos
      const validos = prods.filter((p) => p.nombre.trim());
      const quedan = new Set(validos.filter((p) => p.id).map((p) => p.id));
      const borrar = baseIds.filter((id) => !quedan.has(id));
      if (borrar.length) {
        const { error } = await supabase.from("productos").delete().in("id", borrar);
        if (error) throw error;
      }
      for (const [i, p] of validos.entries()) {
        const fila = {
          negocio_id: negocioId,
          nombre: p.nombre.trim().slice(0, 60),
          precio: p.precio.replace(/\D/g, "") === "" ? null : Number(p.precio.replace(/\D/g, "")),
          descripcion: p.descripcion.trim().slice(0, 120),
          foto_url: p.foto_url,
          orden: i,
        };
        const { error } = p.id ? await supabase.from("productos").update(fila).eq("id", p.id) : await supabase.from("productos").insert(fila);
        if (error) throw error;
      }
      const { data: frescos } = await supabase.from("productos").select("*").eq("negocio_id", negocioId).order("orden");
      setProds((frescos ?? []).map((p) => ({ key: p.id, id: p.id, nombre: p.nombre, precio: p.precio == null ? "" : String(p.precio), descripcion: p.descripcion, foto_url: p.foto_url })));
      setBaseIds((frescos ?? []).map((p) => p.id));
      setAviso({ t: nid ? "Cambios guardados ✓" : "¡Tu emprendimiento ya está publicado! 🎉" });
      setNid(negocioId);
      router.refresh();
    } catch (e) {
      const m = (e as { message?: string })?.message ?? "";
      setAviso({ t: m.includes("LIMITE_PRODUCTOS") ? `Tu plan permite hasta ${limite} productos o servicios.` : "No se pudo guardar. Revisa los datos e intenta de nuevo.", err: true });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!nid || !confirm("¿Eliminar tu perfil de El Mercadito? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("negocios").delete().eq("id", nid);
    if (error) return setAviso({ t: "No se pudo eliminar. Intenta de nuevo.", err: true });
    router.refresh();
    setCreando(false);
    setD({ ...vacio });
    setProds([]);
    setNid(undefined);
    setBaseIds([]);
  }

  if (!creando)
    return (
      <div className="mt-6 rounded-2xl bg-white px-6 py-12 text-center shadow-tarjeta">
        <div className="text-5xl">🏪</div>
        <h2 className="mt-4 text-xl font-bold">Publica tu negocio gratis</h2>
        <p className="mt-1 text-sm text-gris">Te toma menos de 5 minutos.</p>
        <button className="btn-verde mt-6" onClick={() => setCreando(true)}>Crear mi perfil</button>
      </div>
    );

  const campo = (k: keyof typeof vacio, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="etiqueta">
      {label}
      <input className="campo" value={d[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );

  return (
    <>
      <section className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-tarjeta">
        <div className="flex items-center gap-4">
          <label className="relative grid h-20 w-20 flex-none cursor-pointer place-items-center overflow-hidden rounded-2xl bg-fondo text-center text-[11px] font-semibold text-gris ring-1 ring-linea">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {d.logo_url ? <img src={d.logo_url} alt="Logo" className="h-full w-full object-cover" /> : subiendo === "logo" ? "…" : <span className="text-2xl">📷<br /><span className="text-[11px]">Logo</span></span>}
            <input type="file" accept="image/*" aria-label="Subir logo" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => subir(e.target.files?.[0], "logo")} />
          </label>
          <div className="flex-1">{campo("nombre", "Nombre", { maxLength: 60, placeholder: "Butifarras Doña Mery" })}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="etiqueta">
            Categoría
            <select className="campo" value={d.categoria} onChange={(e) => set("categoria", e.target.value)}>
              <option value="">Elige</option>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.e} {c.corto}</option>)}
            </select>
          </label>
          <label className="etiqueta">
            Zona
            <select className="campo" value={d.zona} onChange={(e) => set("zona", e.target.value)}>
              <option value="">Elige</option>
              {ZONAS.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
        </div>
        {campo("whatsapp", "WhatsApp", { inputMode: "tel", maxLength: 15, placeholder: "300 123 4567" })}
        <label className="etiqueta">
          Descripción
          <textarea className="campo" rows={2} maxLength={500} value={d.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="¿Qué ofreces?" />
        </label>
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-bold text-verde [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">+ Más detalles</span><span className="hidden group-open:inline">− Menos detalles</span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="etiqueta">
              Ofreces
              <select className="campo" value={d.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {campo("horario", "Horario", { maxLength: 60, placeholder: "Lun–Sáb 8 a.m. – 6 p.m." })}
            {campo("instagram", "Instagram", { maxLength: 30, placeholder: "usuario (sin @)" })}
            {campo("eslogan", "Frase corta", { maxLength: 70, placeholder: "Sabor costeño" })}
          </div>
        </details>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5 shadow-tarjeta">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">Productos</h2>
          <span className="text-xs text-gris">{prods.length} de {limite}</span>
        </div>
        <div className="grid gap-2">
          {prods.map((p) => (
            <div key={p.key} className="flex items-center gap-3">
              <label className="relative grid h-14 w-14 flex-none cursor-pointer place-items-center overflow-hidden rounded-xl bg-fondo text-lg ring-1 ring-linea">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.foto_url ? <img src={p.foto_url} alt="" className="h-full w-full object-cover" /> : subiendo === p.key ? "…" : "📷"}
                <input type="file" accept="image/*" aria-label="Foto del producto" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => subir(e.target.files?.[0], p.key)} />
              </label>
              <input className="campo min-w-0 flex-[2]" maxLength={60} value={p.nombre} onChange={(e) => setP(p.key, "nombre", e.target.value)} placeholder="Nombre" />
              <input className="campo min-w-0 flex-1" inputMode="numeric" value={p.precio} onChange={(e) => setP(p.key, "precio", e.target.value)} placeholder="Precio" />
              <button aria-label="Quitar" className="grid h-9 w-9 flex-none place-items-center rounded-full text-gris hover:bg-red-50 hover:text-red-600" onClick={() => setProds((ps) => ps.filter((x) => x.key !== p.key))}>✕</button>
            </div>
          ))}
        </div>
        {prods.length < limite ? (
          <button
            className="mt-3 w-full rounded-xl border-2 border-dashed border-linea py-3 text-sm font-bold text-gris hover:border-verde hover:text-verde"
            onClick={() => setProds((ps) => [...ps, { key: crypto.randomUUID(), nombre: "", precio: "", descripcion: "", foto_url: "" }])}
          >
            + Agregar producto
          </button>
        ) : (
          negocio?.plan !== "premium" && <Link href="/planes" className="mt-3 block text-center text-sm font-bold text-verde">¿Necesitas más? Mira Premium</Link>
        )}
      </section>

      <div className="sticky bottom-[72px] z-10 mt-4 flex items-center gap-2 rounded-2xl bg-white/95 p-3 shadow-tarjeta backdrop-blur md:bottom-3">
        <button className="btn-verde flex-1" onClick={guardar} disabled={guardando || !!subiendo}>
          {guardando ? "Guardando…" : nid ? "Guardar" : "Publicar"}
        </button>
        {nid ? (
          negocio && <Link href={`/n/${negocio.slug}`} className="btn-borde">Ver perfil</Link>
        ) : (
          <button className="btn-borde" onClick={() => setCreando(false)}>Cancelar</button>
        )}
      </div>
      {aviso && <p className={`mt-3 text-center text-sm font-semibold ${aviso.err ? "text-red-600" : "text-verde"}`}>{aviso.t}</p>}
      {nid && (
        <button className="mx-auto mt-8 block text-xs text-gris underline hover:text-red-600" onClick={eliminar}>Eliminar mi perfil</button>
      )}
    </>
  );
}
