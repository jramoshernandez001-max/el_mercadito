import type { Metadata } from "next";
import Link from "next/link";
import { LIMITE, PRECIO_ANUNCIO, PRECIO_PREMIUM, WHATSAPP_EQUIPO, cop, waLink } from "@/lib/datos";
import { usuarioActual } from "@/lib/supabase/server";
import { solicitarPremium } from "./acciones";

export const metadata: Metadata = { title: "Planes", description: "Perfil básico gratis para siempre. Premium y anuncios locales para crecer." };

function Lista({ si, no = [] }: { si: string[]; no?: string[] }) {
  return (
    <ul className="grid gap-2 text-sm">
      {si.map((t) => <li key={t} className="flex gap-2"><span className="font-extrabold text-verde">✓</span>{t}</li>)}
      {no.map((t) => <li key={t} className="flex gap-2 text-gris"><span className="text-[#A0AABA]">–</span>{t}</li>)}
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
  else if (!user) botonPremium = <Link href="/ingresar?next=/planes" className="btn-navy w-full">Ingresa para solicitarlo</Link>;
  else if (!negocio) botonPremium = <Link href="/mi-negocio" className="btn-navy w-full">Primero crea tu perfil</Link>;
  else if (estado === "pendiente") botonPremium = <button className="btn-borde w-full" disabled>Solicitud en revisión</button>;
  else
    botonPremium = (
      <form action={solicitarPremium}>
        <button className="btn-verde w-full">{estado === "rechazada" ? "Solicitar de nuevo" : "Solicitar Premium"}</button>
      </form>
    );

  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <div className="pt-[22px] pb-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Planes</h1>
        <p className="mt-1 text-sm text-gris">El perfil básico es gratis para siempre. Premium y la publicidad local sostienen la plataforma.</p>
      </div>
      <div className="mt-4 grid gap-[14px] md:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-[20px] border-2 border-transparent bg-white p-[22px] shadow-tarjeta">
          <span className="pill self-start">Para empezar</span>
          <h3 className="text-lg font-bold">Básico</h3>
          <div className="text-[30px] font-extrabold tracking-[-0.03em]">$0 <small className="text-sm font-semibold text-gris">para siempre</small></div>
          <Lista si={["Perfil permanente", `Hasta ${LIMITE.basico} productos o servicios con foto`, "Contacto directo por WhatsApp", "Aparece en búsquedas y en la rotación diaria", "Visitas y clics totales"]} no={["Insignia de verificado", "Estadísticas por día"]} />
          <Link href="/mi-negocio" className="btn-borde mt-auto w-full">{negocio ? "Ir a mi negocio" : "Empezar gratis"}</Link>
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] border-2 border-verde bg-white p-[22px] shadow-tarjeta">
          <span className="pill-verde self-start">Recomendado</span>
          <h3 className="text-lg font-bold">Premium</h3>
          <div className="text-[30px] font-extrabold tracking-[-0.03em]">{cop(PRECIO_PREMIUM)} <small className="text-sm font-semibold text-gris">/ mes</small></div>
          <Lista si={["Todo lo del plan Básico", `Hasta ${LIMITE.premium} productos o servicios`, "Insignia ✓ Verificado", "Estadísticas de visitas por día", "Prioridad para anunciar en la portada"]} />
          <div className="mt-auto">{botonPremium}</div>
          <p className="text-[13px] text-gris">El pago se coordina por WhatsApp con el equipo. Premium no te pone por encima de nadie en las búsquedas.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] border-2 border-transparent bg-white p-[22px] shadow-tarjeta">
          <span className="pill self-start bg-orange-50 text-orange-800">Negocios</span>
          <h3 className="text-lg font-bold">Anuncio local</h3>
          <div className="text-[30px] font-extrabold tracking-[-0.03em]">{cop(PRECIO_ANUNCIO)} <small className="text-sm font-semibold text-gris">/ semana</small></div>
          <Lista si={["Banner en la página de inicio", "Marcado claramente como “Anuncio”", "Enlace directo a tu perfil", "Ideal para promociones y fechas especiales"]} />
          {WHATSAPP_EQUIPO ? (
            <a className="btn-borde mt-auto w-full" target="_blank" rel="noopener noreferrer" href={waLink(WHATSAPP_EQUIPO, "Hola, quiero reservar un anuncio local en El Mercadito.")}>Reservar por WhatsApp</a>
          ) : (
            <p className="mt-auto text-[13px] text-gris">Escríbenos para reservar tu semana.</p>
          )}
        </div>
      </div>
      <div className="equidad mt-4"><span>⚖️</span><span><b>Nuestra promesa:</b> la visibilidad en El Mercadito es por equidad. Los planes pagos dan herramientas, no posiciones.</span></div>
    </div>
  );
}
