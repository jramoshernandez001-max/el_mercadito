import Link from "next/link";
import { cat, type Negocio } from "@/lib/datos";

export function portada(color: string) {
  return { background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)` };
}

export function LogoNegocio({ n, className = "" }: { n: Pick<Negocio, "logo_url" | "categoria" | "nombre">; className?: string }) {
  const c = cat(n.categoria);
  return (
    <div className={`grid place-items-center overflow-hidden ${className}`} style={n.logo_url ? undefined : { background: c.c + "1f" }}>
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
    <span title="Verificado" className="inline-grid h-4 w-4 flex-none place-items-center rounded-full bg-verde text-[10px] text-white">✓</span>
  );
}

export function TarjetaNegocio({ n }: { n: Negocio }) {
  const c = cat(n.categoria);
  return (
    <Link href={`/n/${n.slug}`} className="group flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-tarjeta transition hover:-translate-y-0.5">
      <LogoNegocio n={n} className="aspect-square w-full rounded-xl text-5xl transition group-hover:scale-[1.02]" />
      <div className="min-w-0 px-0.5 pb-0.5">
        <h3 className="flex items-center gap-1.5 truncate text-[15px] font-bold leading-tight">
          <span className="truncate">{n.nombre}</span>
          {n.plan === "premium" && <Verificado />}
        </h3>
        <p className="mt-1 truncate text-[13px] text-gris">{c.corto} · {n.zona}</p>
      </div>
    </Link>
  );
}

export function Rejilla({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function Vacio({ e, titulo, texto, children }: { e: string; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-14 text-center text-gris">
      <div className="mb-3 text-5xl">{e}</div>
      <h3 className="font-bold text-tinta">{titulo}</h3>
      {texto && <p className="mt-1 text-sm">{texto}</p>}
      {children}
    </div>
  );
}
