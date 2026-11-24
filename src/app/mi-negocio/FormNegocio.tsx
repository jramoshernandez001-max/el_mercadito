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
      <>
        <div className="panel mt-3 px-5! py-[30px]! text-center">
          <div className="text-[46px]">🏪</div>
          <h3 className="mt-2 mb-1.5 text-xl font-bold">Publica tu emprendimiento gratis</h3>
          <p className="mx-auto mb-[18px] max-w-[420px] text-gris">Perfil permanente, catálogo de hasta {LIMITE.basico} productos o servicios y contacto directo por WhatsApp. Sin pagar pauta.</p>
          <button className="btn-verde" onClick={() => setCreando(true)}>Crear mi perfil</button>
        </div>
        <div className="mt-[14px] grid grid-cols-3 gap-[10px]">
          {["Llena tus datos", "Sube productos con foto", "Recibe mensajes por WhatsApp"].map((t, i) => (
            <div key={t} className="rounded-[14px] bg-white p-[14px] shadow-tarjeta"><b className="block text-2xl">{i + 1}</b><span className="text-xs font-semibold text-gris">{t}</span></div>
          ))}
        </div>
      </>
    );

  const campo = (k: keyof typeof vacio, label: React.ReactNode, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="etiqueta">
      {label}
      <input className="campo" value={d[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );

  return (
    <>
      <div className="panel mt-[14px]">
        <h3 className="mb-3 font-bold">Datos del emprendimiento</h3>
        <div className="grid gap-3">
          <div className="flex items-center gap-[14px]">
            <label className="relative grid h-[92px] w-[92px] cursor-pointer place-items-center overflow-hidden rounded-[20px] border-2 border-dashed border-[#C9D1DC] bg-[#EEF1F5] text-center text-xs text-gris">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.logo_url ? <img src={d.logo_url} alt="Logo" className="h-full w-full object-cover" /> : subiendo === "logo" ? "Subiendo…" : <>Subir<br />logo</>}
              <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => subir(e.target.files?.[0], "logo")} />
            </label>
            <div className="flex-1 text-[13px] text-gris">
              Tu logo o una foto que te represente. Se ajusta automáticamente.
              {d.logo_url && <><br /><button className="font-bold text-verde" onClick={() => set("logo_url", "")}>Quitar logo</button></>}
            </div>
          </div>
          {campo("nombre", "Nombre del emprendimiento *", { maxLength: 60, placeholder: "Ej: Butifarras Doña Mery" })}
          {campo("eslogan", <span>Frase corta <span className="font-medium text-gris">(opcional)</span></span>, { maxLength: 70, placeholder: "Ej: Sabor costeño desde el mercado" })}
          <label className="etiqueta">
            Descripción
            <textarea className="campo" rows={3} maxLength={500} value={d.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Qué vendes u ofreces, cómo entregas, etc." />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta">
              Categoría *
              <select className="campo" value={d.categoria} onChange={(e) => set("categoria", e.target.value)}>
                <option value="">Elige…</option>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.e} {c.n}</option>)}
              </select>
            </label>
            <label className="etiqueta">
              Zona de Lorica *
              <select className="campo" value={d.zona} onChange={(e) => set("zona", e.target.value)}>
                <option value="">Elige…</option>
                {ZONAS.map((z) => <option key={z}>{z}</option>)}
              </select>
            </label>
            <label className="etiqueta">
              Ofreces *
              <select className="campo" value={d.tipo} onChange={(e) => set("tipo", e.target.value)}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {campo("whatsapp", "WhatsApp *", { inputMode: "tel", maxLength: 15, placeholder: "300 123 4567" })}
            {campo("instagram", <span>Instagram <span className="font-medium text-gris">(sin @)</span></span>, { maxLength: 30, placeholder: "minegocio" })}
            {campo("horario", "Horario", { maxLength: 60, placeholder: "Lun–Sáb 8 a.m. – 6 p.m." })}
          </div>
        </div>
      </div>

      <div className="panel mt-[14px]">
        <div className="mb-[10px] flex items-baseline justify-between">
          <h3 className="font-bold">Catálogo</h3>
          <span className="text-xs text-gris">{prods.length}/{limite} {negocio?.plan === "premium" ? "(Premium)" : "(Básico)"}</span>
        </div>
        <div className="grid gap-3">
          {prods.length === 0 && <p className="text-[13px] text-gris">Aún no tienes productos ni servicios.</p>}
          {prods.map((p) => (
            <div key={p.key} className="grid grid-cols-[84px_1fr] items-start gap-3 rounded-[14px] border-[1.5px] border-linea p-3">
              <label className="relative grid h-[84px] w-[84px] cursor-pointer place-items-center overflow-hidden rounded-xl bg-[#EEF1F5] text-center text-xs text-gris">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.foto_url ? <img src={p.foto_url} alt="" className="h-full w-full object-cover" /> : subiendo === p.key ? "Subiendo…" : <>📷<br />Foto</>}
                <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => subir(e.target.files?.[0], p.key)} />
              </label>
              <div className="grid gap-2">
                <input className="campo" maxLength={60} value={p.nombre} onChange={(e) => setP(p.key, "nombre", e.target.value)} placeholder="Nombre del producto o servicio" />
                <div className="grid grid-cols-2 gap-2">
                  <input className="campo" inputMode="numeric" value={p.precio} onChange={(e) => setP(p.key, "precio", e.target.value)} placeholder="Precio (COP)" />
                  <button className="btn-rojo btn-sm" onClick={() => setProds((ps) => ps.filter((x) => x.key !== p.key))}>Quitar</button>
                </div>
                <input className="campo" maxLength={120} value={p.descripcion} onChange={(e) => setP(p.key, "descripcion", e.target.value)} placeholder="Detalle corto (opcional)" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          {prods.length < limite ? (
            <button className="btn-borde" onClick={() => setProds((ps) => [...ps, { key: crypto.randomUUID(), nombre: "", precio: "", descripcion: "", foto_url: "" }])}>+ Agregar producto o servicio</button>
          ) : (
            <p className="text-[13px] text-gris">
              Llegaste al límite de tu plan.{" "}
              {negocio?.plan !== "premium" && <Link href="/planes" className="font-bold text-verde">Premium permite hasta {LIMITE.premium}.</Link>}
            </p>
          )}
        </div>
      </div>

      <div className="panel sticky bottom-[64px] z-10 mt-[14px] flex flex-wrap items-center gap-[10px] md:bottom-3">
        <button className="btn-verde" onClick={guardar} disabled={guardando || !!subiendo}>
          {guardando ? "Guardando…" : nid ? "Guardar cambios" : "Publicar mi perfil"}
        </button>
        {nid ? (
          <>
            {negocio && <Link href={`/n/${negocio.slug}`} className="btn-borde">Ver mi perfil</Link>}
            <button className="btn-rojo ml-auto" onClick={eliminar}>Eliminar</button>
          </>
        ) : (
          <button className="btn-borde" onClick={() => setCreando(false)}>Cancelar</button>
        )}
        {aviso && <p className={`w-full text-sm font-semibold ${aviso.err ? "text-red-600" : "text-verde"}`}>{aviso.t}</p>}
      </div>
    </>
  );
}
