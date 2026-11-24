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

  // Mantiene la URL compartible sin recargar
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
      <div className="mt-[14px] flex flex-col gap-[10px]">
        <label className="flex items-center rounded-xl border-[1.5px] border-linea bg-white px-3 focus-within:border-verde">
          🔎
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Buscar por nombre, producto o servicio"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-1.5 py-[11px] text-base outline-none"
          />
        </label>
        <div className="scroll-oculto flex gap-2 overflow-x-auto pb-1">
          <button className={!f.cat ? "chip-on" : "chip"} onClick={() => set("cat", "")}>Todas</button>
          {CATS.map((c) => (
            <button key={c.id} className={f.cat === c.id ? "chip-on" : "chip"} onClick={() => set("cat", c.id)}>
              {c.e} {c.n}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-[10px]">
          <select aria-label="Zona" value={f.zona} onChange={(e) => set("zona", e.target.value)} className="campo min-w-[140px] flex-1">
            <option value="">Todas las zonas</option>
            {ZONAS.map((z) => <option key={z}>{z}</option>)}
          </select>
          <select aria-label="Tipo" value={f.tipo} onChange={(e) => set("tipo", e.target.value)} className="campo min-w-[140px] flex-1">
            <option value="">Productos y servicios</option>
            <option value="producto">Solo productos</option>
            <option value="servicio">Solo servicios</option>
          </select>
        </div>
      </div>
      <div className="mt-4 mb-[10px] text-[13px] text-gris">
        {lista.length} resultado{lista.length === 1 ? "" : "s"} · orden rotativo equitativo
        {hayFiltros && (
          <>
            {" · "}
            <button className="font-bold text-verde" onClick={() => setF({ q: "", cat: "", zona: "", tipo: "" })}>Limpiar filtros</button>
          </>
        )}
      </div>
      {lista.length ? (
        <Rejilla>{lista.map((n) => <TarjetaNegocio key={n.id} n={n} />)}</Rejilla>
      ) : (
        <Vacio e="🔍" titulo="Nada por aquí todavía" texto="Prueba otra palabra o quita algún filtro." />
      )}
    </>
  );
}
