import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import Link from "next/link";
import "./globals.css";
import { LogoTienda } from "@/components/Logo";
import { Navegacion } from "@/components/Navegacion";
import { esAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "El Mercadito — Lorica", template: "%s · El Mercadito" },
  description: "Todo lo que Lorica produce y ofrece, a un clic de distancia. El primer directorio y mercado digital hiperlocal de Lorica, Córdoba.",
  openGraph: { siteName: "El Mercadito", locale: "es_CO", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0B1E3A" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, admin } = await esAdmin();
  return (
    <html lang="es">
      <body className="font-sans">
        <header className="sticky top-0 z-30 bg-navy text-white">
          <div className="mx-auto flex h-[60px] max-w-[1080px] items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-[10px] text-[19px] font-extrabold tracking-tight">
              <LogoTienda size={30} />
              <span>El Mercadito</span>
            </Link>
            <Navegacion admin={admin} conSesion={!!user} />
          </div>
        </header>
        <main className="min-h-[70vh] pb-24 md:pb-10">{children}</main>
        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-1 px-4 pt-10 pb-28 text-[13px] text-gris md:pb-8">
          <Link href="/como-funciona" className="hover:text-tinta">Cómo funciona</Link>
          <Link href="/planes" className="hover:text-tinta">Planes</Link>
          <span>© El Mercadito · Lorica</span>
        </footer>
      </body>
    </html>
  );
}
