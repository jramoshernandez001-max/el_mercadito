import Link from "next/link";
import { CATS, ZONAS, rotar } from "@/lib/datos";
import { anuncioActual, negociosVisibles } from "@/lib/consultas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Rejilla, TarjetaNegocio, Vacio } from "@/components/TarjetaNegocio";

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const [negocios, anuncio] = await Promise.all([negociosVisibles(supabase), anuncioActual(supabase)]);
  const nProd = negocios.reduce((s, n) => s + (n.productos?.length ?? 0), 0);
  const destacados = rotar(negocios).slice(0, 6);
  const negAnuncio = anuncio?.negocio_id ? negocios.find((n) => n.id === anuncio.negocio_id) : undefined;
  const color = /^#[0-9a-fA-F]{6}$/.test(anuncio?.color ?? "") ? anuncio!.color : "#16A864";

  return (
    <>
      <section className="bg-[linear-gradient(160deg,#0B1E3A_0%,#132B52_70%,#17406B_100%)] pt-[34px] pb-16 text-white">
        <div className="mx-auto max-w-[1080px] px-4">
          <h1 className="max-w-[640px] text-[clamp(26px,5.4vw,42px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
            Todo lo que Lorica produce y ofrece, <em className="text-verde-2 not-italic">a un clic de distancia.</em>
          </h1>
          <p className="mt-[10px] max-w-[520px] text-[15px] text-[#C7D3E5]">
            Encuentra emprendimientos locales por categoría o por zona y escríbeles directo por WhatsApp.{" "}
            <Link href="/como-funciona" className="font-bold text-verde-2">
              ¿Cómo funciona? →
            </Link>
          </p>
          <form action="/explorar" className="mt-5 flex max-w-[560px] gap-1.5 rounded-[14px] bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,.25)]">
            <input
              name="q"
              placeholder="Busca butifarras, uñas, clases…"
              aria-label="Buscar"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-[10px] py-[10px] text-base text-tinta outline-none"
            />
            <button className="btn-verde">Buscar</button>
          </form>
          <div className="mt-[18px] flex flex-wrap gap-[18px] text-[13px] text-[#C7D3E5]">
            <div><b className="block text-lg text-white">{negocios.length}</b>emprendimientos</div>
            <div><b className="block text-lg text-white">{nProd}</b>productos y servicios</div>
            <div><b className="block text-lg text-white">{new Set(negocios.map((n) => n.zona)).size}</b>zonas de Lorica</div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-10 max-w-[1080px] px-4">
        <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))] lg:grid-cols-9">
          {CATS.map((c) => (
            <Link
              key={c.id}
              href={`/explorar?cat=${c.id}`}
              className="flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-transparent bg-white px-[10px] py-[14px] text-center text-[12.5px] leading-tight font-semibold shadow-tarjeta hover:border-verde"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl text-[22px]" style={{ background: c.c + "22" }}>
                {c.e}
              </span>
              {c.n}
            </Link>
          ))}
        </div>

        {anuncio?.activo && anuncio.titulo && (
          <section className="mt-7">
            {(() => {
              const contenido = (
                <div className="relative flex items-center gap-[14px] overflow-hidden rounded-2xl p-[18px] text-white" style={{ background: `linear-gradient(120deg, ${color}, #0B1E3A)` }}>
                  <span className="absolute top-2 right-[10px] text-[10px] font-bold tracking-wider uppercase opacity-75">Anuncio local</span>
                  <div className="text-[34px]">📣</div>
                  <div>
                    <h3 className="text-[17px] font-bold">{anuncio.titulo}</h3>
                    <p className="mt-0.5 text-[13.5px] opacity-90">{anuncio.texto}</p>
                    {negAnuncio && <p className="mt-1.5 text-[13.5px] font-bold">Ver {negAnuncio.nombre} →</p>}
                  </div>
                </div>
              );
              return negAnuncio ? <Link href={`/n/${negAnuncio.slug}`}>{contenido}</Link> : contenido;
            })()}
          </section>
        )}

        <section className="mt-7">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[19px] font-bold tracking-tight">Descubre hoy</h2>
            <Link href="/explorar" className="text-sm font-bold text-verde">Ver todos →</Link>
          </div>
          {destacados.length ? (
            <Rejilla>{destacados.map((n) => <TarjetaNegocio key={n.id} n={n} />)}</Rejilla>
          ) : (
            <div className="panel">
              <Vacio e="🏪" titulo="Aún no hay emprendimientos" texto="Sé el primero en publicar el tuyo." />
            </div>
          )}
          <div className="equidad mt-3">
            <span>⚖️</span>
            <span><b>Visibilidad equitativa.</b> El orden rota cada día para todos por igual. Nadie paga por aparecer primero.</span>
          </div>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-[19px] font-bold tracking-tight">Por zonas</h2>
          <div className="scroll-oculto flex gap-2 overflow-x-auto pb-1">
            {ZONAS.map((z) => (
              <Link key={z} href={`/explorar?zona=${encodeURIComponent(z)}`} className="chip">
                📍 {z} <span className="text-gris">· {negocios.filter((n) => n.zona === z).length}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7 flex flex-wrap items-center gap-4 rounded-[20px] bg-navy p-[22px] text-white">
          <div className="min-w-[220px] flex-1">
            <h3 className="text-[19px] font-bold tracking-tight">¿Tienes un emprendimiento en Lorica?</h3>
            <p className="mt-1 text-sm text-[#C7D3E5]">Crea tu perfil permanente gratis, sube tus productos y recibe pedidos por WhatsApp.</p>
          </div>
          <Link href="/mi-negocio" className="btn-verde">Publicar gratis</Link>
        </section>
      </div>
    </>
  );
}
