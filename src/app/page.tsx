import Link from "next/link";
import { CATS, rotar } from "@/lib/datos";
import { anuncioActual, negociosVisibles } from "@/lib/consultas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Rejilla, TarjetaNegocio, Vacio } from "@/components/TarjetaNegocio";

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const [negocios, anuncio] = await Promise.all([negociosVisibles(supabase), anuncioActual(supabase)]);
  const destacados = rotar(negocios).slice(0, 8);
  const negAnuncio = anuncio?.negocio_id ? negocios.find((n) => n.id === anuncio.negocio_id) : undefined;
  const color = /^#[0-9a-fA-F]{6}$/.test(anuncio?.color ?? "") ? anuncio!.color : "#16A864";

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      {/* Buscador */}
      <section className="pt-10 pb-8 text-center md:pt-16 md:pb-12">
        <h1 className="mx-auto max-w-[560px] text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] md:text-[44px]">
          Lo que buscas, <span className="text-verde">hecho en Lorica.</span>
        </h1>
        <form action="/explorar" className="mx-auto mt-6 flex max-w-[520px] items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-tarjeta">
          <span aria-hidden>🔎</span>
          <input
            name="q"
            placeholder="¿Qué necesitas?"
            aria-label="Buscar"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none"
          />
          <button className="btn-verde rounded-full! px-5!">Buscar</button>
        </form>
        <Link href="/como-funciona" className="mt-4 inline-block text-sm text-gris hover:text-tinta">¿Primera vez? <span className="font-semibold text-verde">Así funciona</span></Link>
      </section>

      {/* Categorías */}
      <section className="scroll-oculto -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-9 md:px-0">
        {CATS.map((c) => (
          <Link key={c.id} href={`/explorar?cat=${c.id}`} className="flex min-w-[76px] flex-col items-center gap-2 rounded-2xl p-2 text-center hover:bg-white">
            <span className="grid h-14 w-14 place-items-center rounded-full text-[26px]" style={{ background: c.c + "1f" }}>{c.e}</span>
            <span className="text-[12.5px] font-semibold">{c.corto}</span>
          </Link>
        ))}
      </section>

      {/* Anuncio local */}
      {anuncio?.activo && anuncio.titulo && (
        <Link
          href={negAnuncio ? `/n/${negAnuncio.slug}` : "#"}
          className="mt-8 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white"
          style={{ background: `linear-gradient(120deg, ${color}, #0B1E3A)` }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-70">Anuncio</p>
            <p className="truncate text-base font-bold">{anuncio.titulo}</p>
            {anuncio.texto && <p className="truncate text-sm opacity-85">{anuncio.texto}</p>}
          </div>
          {negAnuncio && <span className="text-xl">→</span>}
        </Link>
      )}

      {/* Negocios */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight">Hoy en El Mercadito</h2>
          <Link href="/explorar" className="text-sm font-bold text-verde">Ver todos</Link>
        </div>
        {destacados.length ? (
          <Rejilla>{destacados.map((n) => <TarjetaNegocio key={n.id} n={n} />)}</Rejilla>
        ) : (
          <div className="rounded-2xl bg-white">
            <Vacio e="🏪" titulo="Aún no hay emprendimientos">
              <Link href="/mi-negocio" className="btn-verde mt-5">Publica el primero</Link>
            </Vacio>
          </div>
        )}
      </section>

      {/* Llamado a emprendedores */}
      {destacados.length > 0 && (
        <Link href="/mi-negocio" className="mt-10 flex items-center justify-between gap-4 rounded-2xl bg-navy px-5 py-5 text-white">
          <span>
            <span className="block font-bold">¿Tienes un emprendimiento?</span>
            <span className="text-sm text-white/70">Publícalo gratis</span>
          </span>
          <span className="btn-verde btn-sm">Empezar</span>
        </Link>
      )}
    </div>
  );
}
