"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; n: string; corto?: string; ic: string };

export function Navegacion({ admin, conSesion }: { admin: boolean; conSesion: boolean }) {
  const ruta = usePathname();
  const items: Item[] = [
    { href: "/", n: "Inicio", ic: "🏠" },
    { href: "/explorar", n: "Explorar", ic: "🔎" },
    { href: "/mi-negocio", n: "Mi negocio", ic: "🏪" },
    { href: "/como-funciona", n: "Cómo funciona", corto: "Guía", ic: "💡" },
    { href: "/planes", n: "Planes", ic: "⭐" },
    ...(admin ? [{ href: "/admin", n: "Admin", ic: "📊" }] : []),
  ];
  const activo = (h: string) => (h === "/" ? ruta === "/" : ruta.startsWith(h));

  return (
    <>
      <nav className="ml-auto hidden items-center gap-1 md:flex">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-full px-[14px] py-2 text-sm font-semibold ${activo(i.href) ? "bg-white/12 text-white" : "text-[#cfd8e6] hover:text-white"}`}
          >
            {i.n}
          </Link>
        ))}
        {conSesion ? (
          <form action="/auth/salir" method="post">
            <button className="ml-2 rounded-full px-3 py-2 text-sm font-semibold text-[#cfd8e6] hover:text-white">Salir</button>
          </form>
        ) : (
          <Link href="/ingresar" className="btn-verde btn-sm ml-2">
            Ingresar
          </Link>
        )}
      </nav>
      <div className="ml-auto md:hidden">
        {conSesion ? (
          <form action="/auth/salir" method="post">
            <button className="rounded-full px-3 py-2 text-sm font-semibold text-[#cfd8e6]">Salir</button>
          </form>
        ) : (
          <Link href="/ingresar" className="btn-verde btn-sm">
            Ingresar
          </Link>
        )}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-linea bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-1 flex-col items-center gap-0.5 px-0.5 pt-2 pb-[9px] text-[11px] font-semibold ${activo(i.href) ? "text-verde" : "text-gris"}`}
          >
            <span className="text-xl leading-none">{i.ic}</span>
            {i.corto ?? i.n}
          </Link>
        ))}
      </nav>
    </>
  );
}
