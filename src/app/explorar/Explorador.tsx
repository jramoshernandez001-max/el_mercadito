"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATS, ZONAS, cat, normalizar, rotar, type Negocio } from "@/lib/datos";
import { Rejilla, TarjetaNegocio, Vacio } from "@/components/TarjetaNegocio";

type Filtros = { q: string; cat: string; zona: string; tipo: string };

export function Explorador({ negocios, inicial }: { negocios: Negocio[]; inicial: Filtros }) {
  const [f, setF] = useState<Filtros>(inicial);
  const router = useRouter();
  const ruta = usePathname();

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
      const qs = p.toString();
      router.replace(qs ? `${ruta}?${qs}` : ruta, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [f, ruta, router]);

  const lista = useMemo(() => {
    const palabras = normalizar(f.q.trim()).split(/\s+/).filter(Boolean);
    return rotar(
      negocios.filter((n) => {
        if (f.cat && n.categoria !== f.cat) return false;
        if (f.zona && n.zona !== f.zona) return false;
        if (f.tipo && !(n.tipo === f.tipo || n.tipo === "ambos")) return false;
        if (palabras.length) {
          const texto = normalizar(
            [n.nombre, n.eslogan, n.descripcion, cat(n.categoria).n, n.zona, ...(n.productos ?? []).map((p) => `${p.nombre} ${p.descripcion}`)].join(" "),
          );
          return palabras.every((w) => texto.includes(w));
        }
        return true;
      }),
    );
  }, [negocios, f]);

  const hayFiltros = f.q || f.cat || f.zona || f.tipo;
  const set = (k: keyof Filtros, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <>
      <div className="mt-4 flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-tarjeta focus-within:ring-2 focus-within:ring-verde">
          <span aria-hidden>🔎</span>
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="¿Qué buscas?"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
          />
          {f.q && <button aria-label="Borrar" onClick={() => set("q", "")} className="text-gris">✕</button>}
        </label>
        <select
          aria-label="Zona"
          value={f.zona}
          onChange={(e) => set("zona", e.target.value)}
          className={`w-[118px] rounded-full px-3 text-sm font-semibold shadow-tarjeta outline-none sm:w-[170px] ${f.zona ? "bg-navy text-white" : "bg-white"}`}
        >
          <option value="">📍 Zona</option>
          {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>

      <div className="scroll-oculto -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATS.map((c) => (
          <button key={c.id} className={f.cat === c.id ? "chip-on" : "chip"} onClick={() => set("cat", f.cat === c.id ? "" : c.id)}>
            {c.e} {c.corto}
          </button>
        ))}
      </div>

      <div className="mt-4 mb-3 flex items-center justify-between text-[13px] text-gris">
        <span>{lista.length} {lista.length === 1 ? "resultado" : "resultados"}</span>
        {hayFiltros && <button className="font-bold text-verde" onClick={() => setF({ q: "", cat: "", zona: "", tipo: "" })}>Limpiar</button>}
      </div>

      {lista.length ? (
        <Rejilla>{lista.map((n) => <TarjetaNegocio key={n.id} n={n} />)}</Rejilla>
      ) : (
        <Vacio e="🔍" titulo="Sin resultados" texto="Prueba con otra palabra." />
      )}
    </>
  );
}
