import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TIPOS, cat, cop, waLink, type Negocio } from "@/lib/datos";
import { usuarioActual } from "@/lib/supabase/server";
import { LogoNegocio, portada } from "@/components/TarjetaNegocio";
import { BotonCopiar, BotonWhatsApp, RegistrarVista } from "@/components/Metrica";

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
  const msg = `Hola ${n.nombre}, te encontré en El Mercadito 🛒 y quiero más información.`;

  return (
    <div className="mx-auto max-w-[720px]">
      <RegistrarVista negocio={n.id} />
      <div className="relative h-[130px] md:mt-6 md:rounded-t-[22px]" style={portada(c.c)}>
        <Link href="/explorar" className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold">← Volver</Link>
      </div>
      <div className="relative -mt-10 px-[18px]">
        <LogoNegocio n={n} className="h-[86px] w-[86px] rounded-[20px] border-4 border-white text-[38px]" />
      </div>
      <div className="px-[18px] pt-[14px] pb-6">
        {n.oculto && <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Este perfil está oculto por moderación. Solo tú y el equipo pueden verlo.</div>}
        {esMio && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-verde-suave p-3 text-sm text-[#0e5e39]">
            Así ven tu perfil los compradores. <Link href="/mi-negocio" className="ml-auto font-bold">Editar</Link>
          </div>
        )}
        <h1 className="flex flex-wrap items-center gap-1.5 text-[22px] leading-tight font-bold tracking-tight">
          {n.nombre}
          {n.plan === "premium" && <span className="pill-verde">✓ Verificado</span>}
        </h1>
        {n.eslogan && <p className="mt-1 text-gris">{n.eslogan}</p>}
        <div className="mt-[10px] flex flex-wrap gap-[5px]">
          <span className="pill">📍 {n.zona}</span>
          <span className="pill-verde">{c.e} {c.n}</span>
          <span className="pill">{TIPOS[n.tipo]}</span>
        </div>
        {n.descripcion && <p className="mt-3 text-[14.5px] leading-relaxed whitespace-pre-line text-[#2B3A50]">{n.descripcion}</p>}
        <div className="mt-[14px] grid gap-2 text-sm">
          {n.horario && <div className="flex items-center gap-[10px] rounded-xl bg-white px-3 py-[10px]">🕒 <span>{n.horario}</span></div>}
          <div className="flex items-center gap-[10px] rounded-xl bg-white px-3 py-[10px]">📱 <span>WhatsApp {n.whatsapp}</span><BotonCopiar texto={n.whatsapp} /></div>
          {ig && (
            <div className="flex items-center gap-[10px] rounded-xl bg-white px-3 py-[10px]">
              📸 <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="underline">@{ig}</a>
            </div>
          )}
        </div>

        {productos.length > 0 && (
          <>
            <div className="mt-5 mb-[10px] flex items-baseline justify-between">
              <h2 className="text-[19px] font-bold tracking-tight">{n.tipo === "servicio" ? "Servicios" : "Catálogo"}</h2>
              <span className="text-xs text-gris">{productos.length} publicados</span>
            </div>
            <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
              {productos.map((p) => (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-[14px] bg-white shadow-tarjeta">
                  <div className="grid aspect-square place-items-center overflow-hidden text-[34px]" style={{ background: c.c + "1f" }}>
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto_url} alt={p.nombre} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      c.e
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-[3px] px-[10px] pt-[9px] pb-[10px]">
                    <h3 className="text-[13.5px] leading-tight font-bold">{p.nombre}</h3>
                    {p.precio != null && <div className="text-sm font-extrabold text-verde">{cop(p.precio)}</div>}
                    {p.descripcion && <div className="text-xs leading-snug text-gris">{p.descripcion}</div>}
                    <BotonWhatsApp
                      negocio={n.id}
                      href={waLink(n.whatsapp, `Hola ${n.nombre}, vi "${p.nombre}" en El Mercadito 🛒 ¿Está disponible?`)}
                      className="btn-wa btn-sm mt-auto w-full"
                    >
                      Pedir
                    </BotonWhatsApp>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="sticky bottom-[62px] z-20 bg-gradient-to-t from-fondo from-60% to-transparent px-[18px] pt-6 pb-3 md:bottom-0">
        <BotonWhatsApp negocio={n.id} href={waLink(n.whatsapp, msg)} className="btn-wa w-full">
          💬 Escribir por WhatsApp
        </BotonWhatsApp>
      </div>
    </div>
  );
}
