import type { Metadata } from "next";
import Link from "next/link";
import { diaCO, rotar } from "@/lib/datos";
import { negociosVisibles } from "@/lib/consultas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Pasos } from "./Pasos";

export const metadata: Metadata = { title: "Cómo funciona", description: "Cómo comprar y vender en El Mercadito, el mercado digital hiperlocal de Lorica." };

const COMPARA = [
  ["Enfoque", "100% hiperlocal: solo Lorica", "Envíos y vendedores de todo el país"],
  ["Visibilidad", "Por equidad, rotación diaria", "Gana quien paga pauta o tiene más seguidores"],
  ["Organización", "Categorías, zonas y buscador", "Publicaciones sueltas en grupos y muros"],
  ["Servicios", "Incluye servicios (clases, belleza, reparaciones…)", "Casi solo productos"],
  ["Costo para emprendedores", "Perfil básico gratis para siempre", "Comisiones por venta o pauta paga"],
];

const FAQ = [
  ["¿Cuánto cuesta publicar?", "Nada. El perfil básico es gratis y permanente. Existe un plan Premium opcional con más productos, insignia de verificado y estadísticas por día."],
  ["¿El Mercadito cobra comisión por venta?", "No. No intervenimos en la venta: tú y el cliente acuerdan precio, entrega y pago directamente por WhatsApp."],
  ["¿Cómo se decide quién aparece primero?", "Con una rotación diaria automática. Cada día el orden cambia para todos, así que cualquier emprendimiento puede salir de primero. El plan Premium no cambia tu posición."],
  ["¿Cómo ingreso a mi cuenta?", "Solo con tu correo: te enviamos un enlace y al tocarlo quedas adentro. No necesitas contraseña. Abre el enlace en el mismo celular o computador donde lo pediste."],
  ["¿Qué puedo publicar?", "Productos y servicios legales hechos u ofrecidos en Lorica: comida, ropa, artesanías, belleza, reparaciones, clases, eventos y más. El equipo puede ocultar perfiles que no cumplan."],
  ["¿Quién ve mi número de WhatsApp?", "Cualquier persona que visite tu perfil, porque es la forma de que te contacten. Nunca compartas datos bancarios por la plataforma."],
  ["¿Funciona fuera de Lorica?", "Por ahora no. Empezamos 100% hiperlocal para que la oferta sea relevante y cercana."],
  ["¿Cómo me paso a Premium?", "Desde Planes tocas \"Solicitar Premium\". El equipo te escribe por WhatsApp para coordinar el pago y lo activa en tu perfil."],
];

export default async function ComoFunciona() {
  const supabase = await crearClienteServidor();
  const muestra = (await negociosVisibles(supabase)).slice(0, 5);
  const dias: [string, number][] = [["Hoy", 0], ["Mañana", 1], ["Pasado mañana", 2]];

  return (
    <>
      <section className="bg-[linear-gradient(160deg,#0B1E3A,#132B52)] pt-[30px] pb-14 text-white">
        <div className="mx-auto max-w-[1080px] px-4">
          <h1 className="text-[clamp(26px,5vw,38px)] leading-[1.1] font-extrabold tracking-[-0.03em]">Cómo funciona El Mercadito</h1>
          <p className="mt-2 max-w-[540px] text-[15px] text-[#C7D3E5]">Un solo lugar para todo lo que Lorica produce y ofrece. Sin algoritmos que escondan a nadie, sin comisiones.</p>
        </div>
      </section>
      <div className="relative mx-auto -mt-10 max-w-[1080px] px-4">
        <Pasos />

        <section className="mt-7">
          <h2 className="mb-3 text-[19px] font-bold tracking-tight">La rotación equitativa</h2>
          <p className="mb-3 text-[13px] text-gris">Cada día el orden de la portada y de los resultados se mezcla de nuevo para todos. Así se ve con emprendimientos de la plataforma:</p>
          {muestra.length > 1 ? (
            <div className="grid gap-[10px] sm:grid-cols-3">
              {dias.map(([l, o]) => (
                <div key={l} className="rounded-[14px] bg-white p-3 shadow-tarjeta">
                  <b className="mb-2 block text-xs tracking-wider text-gris uppercase">{l}</b>
                  <ol className="grid gap-1.5 text-[12.5px]">
                    {rotar(muestra, diaCO(o)).map((n, i) => (
                      <li key={n.id} className="flex items-center gap-1.5 leading-tight">
                        <i className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-full text-[10.5px] font-extrabold not-italic ${i === 0 ? "bg-verde text-white" : "bg-[#EEF1F5]"}`}>{i + 1}</i>
                        {n.nombre}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-gris">Cuando haya más emprendimientos publicados verás aquí cómo rota el orden.</p>
          )}
          <div className="equidad mt-3"><span>⚖️</span><span>Nadie puede comprar el primer puesto. Los planes pagos dan herramientas extra, nunca más visibilidad que los demás.</span></div>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-[19px] font-bold tracking-tight">¿Por qué no un grupo de WhatsApp?</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed overflow-hidden rounded-2xl bg-white text-[12.5px] shadow-tarjeta sm:text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide uppercase">
                  <th className="w-[27%] border-b border-linea p-2.5 sm:p-3"></th>
                  <th className="border-b border-linea bg-verde-suave p-2.5 text-[#0E7A47] sm:p-3">El Mercadito</th>
                  <th className="border-b border-linea p-2.5 sm:p-3">Alternativas actuales</th>
                </tr>
              </thead>
              <tbody>
                {COMPARA.map(([a, b, c]) => (
                  <tr key={a} className="align-top">
                    <td className="border-b border-linea p-2.5 font-bold sm:p-3">{a}</td>
                    <td className="border-b border-linea bg-[#F6FCF8] p-2.5 font-semibold sm:p-3">{b}</td>
                    <td className="border-b border-linea p-2.5 text-gris sm:p-3">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-[19px] font-bold tracking-tight">Preguntas frecuentes</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="group mb-2 rounded-[14px] bg-white px-4 shadow-tarjeta">
              <summary className="flex cursor-pointer list-none justify-between gap-[10px] py-[15px] text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-xl leading-none text-verde group-open:hidden">+</span>
                <span className="hidden text-xl leading-none text-verde group-open:inline">–</span>
              </summary>
              <p className="pb-[15px] text-sm leading-relaxed text-[#3A4A60]">{a}</p>
            </details>
          ))}
        </section>

        <section className="mt-7 flex flex-wrap items-center gap-4 rounded-[20px] bg-navy p-[22px] text-white">
          <div className="min-w-[220px] flex-1">
            <h3 className="text-[19px] font-bold">Conectando el futuro de Lorica</h3>
            <p className="mt-1 text-sm text-[#C7D3E5]">Encuentra lo que buscas o haz que te encuentren.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/explorar" className="btn-borde">Explorar</Link>
            <Link href="/mi-negocio" className="btn-verde">Publicar gratis</Link>
          </div>
        </section>
      </div>
    </>
  );
}
