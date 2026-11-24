import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cat, cop, waLink, type Negocio } from "@/lib/datos";
import { usuarioActual } from "@/lib/supabase/server";
import { LogoNegocio, Verificado } from "@/components/TarjetaNegocio";
import { BotonWhatsApp, RegistrarVista } from "@/components/Metrica";
import { Asistente } from "@/components/Asistente";

async function cargar(slug: string) {
  const { supabase, user } = await usuarioActual();
  const { data } = await supabase
    .from("negocios")
    .select("*, productos(id,negocio_id,nombre,precio,descripcion,foto_url,orden)")
    .eq("slug", slug)
    .maybeSingle();
  return { n: data as Negocio | null, user };
}

export async function generateMetadata(props: PageProps<"/n/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { n } = await cargar(slug);
  if (!n) return { title: "No encontrado" };
  return {
    title: n.nombre,
    description: n.eslogan || n.descripcion.slice(0, 150) || `${cat(n.categoria).n} en ${n.zona}, Lorica`,
    openGraph: { title: `${n.nombre} · El Mercadito`, images: n.logo_url ? [n.logo_url] : undefined },
  };
}

export default async function PerfilNegocio(props: PageProps<"/n/[slug]">) {
  const { slug } = await props.params;
  const { n, user } = await cargar(slug);
  if (!n) notFound();
  const c = cat(n.categoria);
  const productos = [...(n.productos ?? [])].sort((a, b) => a.orden - b.orden);
  const ig = n.instagram.replace(/[^A-Za-z0-9._]/g, "");
  const esMio = user?.id === n.owner_id;

  return (
    <div className="mx-auto max-w-[680px] px-4">
      <RegistrarVista negocio={n.id} />
      <Link href="/explorar" aria-label="Volver" className="mt-4 inline-grid h-10 w-10 place-items-center rounded-full bg-white text-lg shadow-tarjeta">←</Link>

      {(n.oculto || esMio) && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-verde-suave px-4 py-3 text-sm text-[#0e5e39]">
          {n.oculto ? "Perfil oculto por moderación." : "Este es tu perfil."}
          {esMio && <Link href="/mi-negocio" className="ml-auto font-bold">Editar</Link>}
        </div>
      )}

      <header className="mt-5 flex items-center gap-4">
        <LogoNegocio n={n} className="h-20 w-20 flex-none rounded-2xl text-4xl shadow-tarjeta" />
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl leading-tight font-bold tracking-tight">
            {n.nombre}
            {n.plan === "premium" && <Verificado />}
          </h1>
          <p className="mt-1 text-sm text-gris">{c.e} {c.corto} · 📍 {n.zona}</p>
        </div>
      </header>

      {(n.eslogan || n.descripcion) && (
        <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-line text-[#2B3A50]">{n.descripcion || n.eslogan}</p>
      )}

      {(n.horario || ig) && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gris">
          {n.horario && <span>🕒 {n.horario}</span>}
          {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="hover:text-tinta">📸 @{ig}</a>}
        </div>
      )}

      {productos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{n.tipo === "servicio" ? "Servicios" : "Catálogo"}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {productos.map((p) => (
              <BotonWhatsApp
                key={p.id}
                negocio={n.id}
                href={waLink(n.whatsapp, `Hola ${n.nombre}, vi "${p.nombre}" en El Mercadito 🛒 ¿Está disponible?`)}
                className="group overflow-hidden rounded-2xl bg-white shadow-tarjeta"
              >
                <div className="grid aspect-square place-items-center overflow-hidden text-4xl" style={{ background: c.c + "1a" }}>
                  {p.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.foto_url} alt={p.nombre} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    c.e
                  )}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">{p.nombre}</h3>
                  {p.precio != null && <p className="mt-0.5 text-sm font-bold text-verde">{cop(p.precio)}</p>}
                </div>
              </BotonWhatsApp>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-gris">Toca un producto para preguntar por él</p>
        </section>
      )}

      <div className="sticky bottom-[68px] z-20 mt-6 flex gap-2 pb-3 md:bottom-0">
        {n.plan === "premium" ? (
          <>
            <div className="flex-1">
              <Asistente
                negocio={{ id: n.id, nombre: n.nombre, whatsapp: n.whatsapp, emoji: c.e, logo: n.logo_url }}
                sugerencias={["¿Qué me recomiendas?", ...productos.slice(0, 2).map((p) => `Quiero ${p.nombre}`)]}
              />
            </div>
            <BotonWhatsApp
              negocio={n.id}
              href={waLink(n.whatsapp, `Hola ${n.nombre}, te encontré en El Mercadito 🛒 y quiero más información.`)}
              className="btn-wa w-14 flex-none px-0! text-xl! shadow-[0_8px_24px_rgba(37,211,102,.35)]"
            >
              <span aria-label="WhatsApp">💬</span>
            </BotonWhatsApp>
          </>
        ) : (
          <BotonWhatsApp
            negocio={n.id}
            href={waLink(n.whatsapp, `Hola ${n.nombre}, te encontré en El Mercadito 🛒 y quiero más información.`)}
            className="btn-wa w-full py-4! text-base! shadow-[0_8px_24px_rgba(37,211,102,.35)]"
          >
            Escribir por WhatsApp
          </BotonWhatsApp>
        )}
      </div>
    </div>
  );
}
