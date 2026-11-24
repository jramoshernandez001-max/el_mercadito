import type { Metadata } from "next";
import Link from "next/link";
import { LIMITE, PRECIO_ANUNCIO, PRECIO_PREMIUM, WHATSAPP_EQUIPO, cop, waLink } from "@/lib/datos";
import { usuarioActual } from "@/lib/supabase/server";
import { solicitarPremium } from "./acciones";

export const metadata: Metadata = { title: "Planes", description: "Perfil básico gratis para siempre. Premium y anuncios locales para crecer." };

function Lista({ items }: { items: (string | [string, string])[] }) {
  return (
    <ul className="grid gap-2 text-sm">
      {items.map((t) => {
        const [texto, tag] = Array.isArray(t) ? t : [t, ""];
        return (
          <li key={texto} className="flex gap-2">
            <span className="font-bold text-verde">✓</span>
            <span>
              {texto}
              {tag && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-bold text-amber-800">{tag}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function Planes() {
  const { supabase, user } = await usuarioActual();
  let negocio: { id: string; plan: string } | null = null;
  let estado: string | null = null;
  if (user) {
    const { data } = await supabase.from("negocios").select("id,plan").eq("owner_id", user.id).maybeSingle();
    negocio = data;
    if (data) {
      const { data: s } = await supabase.from("solicitudes").select("estado").eq("negocio_id", data.id).maybeSingle();
      estado = s?.estado ?? null;
    }
  }

  let botonPremium: React.ReactNode;
  if (negocio?.plan === "premium") botonPremium = <button className="btn-borde w-full" disabled>Ya eres Premium</button>;
  else if (!user) botonPremium = <Link href="/ingresar?next=/planes" className="btn-navy w-full">Solicitar</Link>;
  else if (!negocio) botonPremium = <Link href="/mi-negocio" className="btn-navy w-full">Solicitar</Link>;
  else if (estado === "pendiente") botonPremium = <button className="btn-borde w-full" disabled>En revisión</button>;
  else
    botonPremium = (
      <form action={solicitarPremium}>
        <button className="btn-verde w-full">{estado === "rechazada" ? "Solicitar de nuevo" : "Solicitar"}</button>
      </form>
    );

  const tarjeta = "flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-tarjeta";
  return (
    <div className="mx-auto max-w-[1000px] px-4">
      <h1 className="pt-10 pb-8 text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-4xl">Planes</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className={tarjeta}>
          <h3 className="font-bold">Básico</h3>
          <p className="text-3xl font-extrabold tracking-tight">Gratis</p>
          <Lista items={["Perfil permanente", `Hasta ${LIMITE.basico} productos con foto`, "Contacto directo por WhatsApp", "Aparece en búsquedas y categorías", "Visitas y clics totales"]} />
          <Link href="/mi-negocio" className="btn-borde mt-auto w-full">{negocio ? "Mi negocio" : "Empezar"}</Link>
        </div>
        <div className={`${tarjeta} ring-2 ring-verde`}>
          <h3 className="font-bold">Premium</h3>
          <p className="text-3xl font-extrabold tracking-tight">{cop(PRECIO_PREMIUM)}<span className="text-sm font-semibold text-gris"> /mes</span></p>
          <Lista items={["Todo lo del plan Básico", `Hasta ${LIMITE.premium} productos con foto`, "Chatbot que atiende a tus clientes y te envía solo los pedidos cerrados a WhatsApp", "Insignia de verificado", "Estadísticas de visitas por día", "Prioridad para reservar anuncios"]} />
          <div className="mt-auto">{botonPremium}</div>
        </div>
        <div className={tarjeta}>
          <h3 className="font-bold">Anuncio</h3>
          <p className="text-3xl font-extrabold tracking-tight">{cop(PRECIO_ANUNCIO)}<span className="text-sm font-semibold text-gris"> /semana</span></p>
          <Lista items={["Banner en la página de inicio", "7 días de visibilidad", "Enlace directo a tu perfil", "Texto y color a tu gusto"]} />
          {WHATSAPP_EQUIPO ? (
            <a className="btn-borde mt-auto w-full" target="_blank" rel="noopener noreferrer" href={waLink(WHATSAPP_EQUIPO, "Hola, quiero reservar un anuncio en El Mercadito.")}>Reservar</a>
          ) : (
            <span className="mt-auto text-center text-sm text-gris">Pronto</span>
          )}
        </div>
      </div>
    </div>
  );
}
