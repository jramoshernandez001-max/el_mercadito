import Link from "next/link";
import { cat, type Negocio } from "@/lib/datos";

export function portada(color: string) {
  return { background: `linear-gradient(135deg, ${color} 0%, ${color}cc 55%, #0B1E3A 160%)` };
}

export function LogoNegocio({ n, className = "" }: { n: Pick<Negocio, "logo_url" | "categoria" | "nombre">; className?: string }) {
  const c = cat(n.categoria);
  return (
    <div className={`grid place-items-center overflow-hidden bg-white shadow-tarjeta ${className}`}>
      {n.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={n.logo_url} alt={`Logo de ${n.nombre}`} className="h-full w-full object-cover" />
      ) : (
        <span>{c.e}</span>
      )}
    </div>
  );
}

export function Verificado() {
  return (
    <span title="Verificado" className="inline-grid h-4 w-4 flex-none place-items-center rounded-full bg-verde text-[10px] text-white">
      ✓
    </span>
  );
}

export function TarjetaNegocio({ n }: { n: Negocio }) {
  const c = cat(n.categoria);
  const np = n.productos?.length ?? 0;
  return (
    <Link
      href={`/n/${n.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-transparent bg-white text-left shadow-tarjeta transition hover:-translate-y-0.5 hover:border-verde"
    >
      <div className="relative flex h-[92px] items-end px-3" style={portada(c.c)}>
        <LogoNegocio n={n} className="h-[58px] w-[58px] translate-y-6 rounded-[14px] border-[3px] border-white text-[26px]" />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pt-[30px] pb-3">
        <h3 className="flex items-center gap-[5px] text-[15px] leading-tight font-bold tracking-tight">
          {n.nombre}
          {n.plan === "premium" && <Verificado />}
        </h3>
        <p className="line-clamp-2 text-[12.5px] leading-snug text-gris">{n.eslogan || n.descripcion}</p>
        <div className="mt-auto flex flex-wrap gap-[5px] pt-1.5">
          <span className="pill">📍 {n.zona}</span>
          <span className="pill-verde">
            {c.e} {c.n.split(" ")[0]}
          </span>
          {np > 0 && <span className="pill">{np} {n.tipo === "servicio" ? "servicios" : "ítems"}</span>}
        </div>
      </div>
    </Link>
  );
}

export function Rejilla({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-[14px]">{children}</div>;
}

export function Vacio({ e, titulo, texto, children }: { e: string; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-10 text-center text-gris">
      <div className="mb-2 text-[40px]">{e}</div>
      <h3 className="mb-1 font-bold text-tinta">{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}
