"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; n: string; ic: string };

export function Navegacion({ admin, conSesion }: { admin: boolean; conSesion: boolean }) {
  const ruta = usePathname();
  const items: Item[] = [
    { href: "/", n: "Inicio", ic: "🏠" },
    { href: "/explorar", n: "Buscar", ic: "🔎" },
    { href: "/mi-negocio", n: "Mi negocio", ic: "🏪" },
    ...(admin ? [{ href: "/admin", n: "Admin", ic: "📊" }] : []),
  ];
  const activo = (h: string) => (h === "/" ? ruta === "/" : ruta.startsWith(h));

  const sesion = conSesion ? (
    <form action="/auth/salir" method="post">
      <button className="px-3 py-2 text-sm font-semibold text-white/70 hover:text-white">Salir</button>
    </form>
  ) : (
    <Link href="/ingresar" className="btn-verde btn-sm">Ingresar</Link>
  );

  return (
    <>
      <nav className="ml-auto hidden items-center gap-1 md:flex">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${activo(i.href) ? "bg-white/12 text-white" : "text-white/70 hover:text-white"}`}
          >
            {i.n}
          </Link>
        ))}
        <span className="ml-2">{sesion}</span>
      </nav>
      <div className="ml-auto md:hidden">{sesion}</div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-linea bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${activo(i.href) ? "text-verde" : "text-gris"}`}
          >
            <span className={`text-[22px] leading-none ${activo(i.href) ? "" : "opacity-60 grayscale"}`}>{i.ic}</span>
            {i.n}
          </Link>
        ))}
      </nav>
    </>
  );
}
