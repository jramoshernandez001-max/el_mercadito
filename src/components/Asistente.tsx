"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cop, waLink } from "@/lib/datos";
import { mensajePedido, type Pedido } from "@/lib/pedido";
import { BotonWhatsApp } from "./Metrica";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  negocio: { id: string; nombre: string; whatsapp: string; emoji: string; logo: string };
  sugerencias: string[];
};

export function Asistente({ negocio, sugerencias }: Props) {
  const clave = `asistente:${negocio.id}`;
  const saludo: Msg = { role: "assistant", content: `¡Hola! 👋 Soy el asistente de ${negocio.nombre}. ¿Qué te provoca hoy?` };
  const [abierto, setAbierto] = useState(false);
  // Recupera la conversación si el cliente cerró y volvió a abrir (solo se muestra al abrir, sin desajuste de hidratación)
  const guardado = useState(() => {
    try {
      const g = typeof window !== "undefined" ? sessionStorage.getItem(clave) : null;
      return g ? (JSON.parse(g) as { msgs?: Msg[]; pedido?: Pedido | null }) : null;
    } catch {
      return null;
    }
  })[0];
  const [msgs, setMsgs] = useState<Msg[]>(guardado?.msgs?.length ? guardado.msgs : [saludo]);
  const [pedido, setPedido] = useState<Pedido | null>(guardado?.pedido ?? null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<"" | "no_configurado" | "limite" | "red">("");
  const fin = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(clave, JSON.stringify({ msgs, pedido }));
    } catch {}
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pedido, cargando, clave]);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    if (abierto) setTimeout(() => entrada.current?.focus(), 150);
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  async function enviar(contenido: string) {
    const t = contenido.trim();
    if (!t || cargando) return;
    const nuevos: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(nuevos);
    setTexto("");
    setError("");
    setPedido(null);
    setCargando(true);
    try {
      const r = await fetch("/api/asistente", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ negocio: negocio.id, mensajes: nuevos }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error === "no_configurado" ? "no_configurado" : d.error === "limite" ? "limite" : "red");
        return;
      }
      setMsgs((m) => [...m, { role: "assistant", content: d.texto }]);
      if (d.pedido) setPedido(d.pedido);
    } catch {
      setError("red");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setMsgs([saludo]);
    setPedido(null);
    setError("");
  }

  const soloSaludo = msgs.length === 1;

  return (
    <>
      <button onClick={() => setAbierto(true)} className="btn-verde w-full py-4! text-base! shadow-[0_8px_24px_rgba(22,168,100,.35)]">
        <span aria-hidden>🤖</span> Hacer pedido
      </button>

      {abierto && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 md:items-center md:p-6" onClick={(e) => e.target === e.currentTarget && setAbierto(false)}>
          <div role="dialog" aria-label={`Asistente de ${negocio.nombre}`} className="flex h-[92dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl bg-fondo md:h-[640px] md:rounded-3xl">
            {/* Encabezado */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
              <div className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-xl bg-fondo text-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {negocio.logo ? <img src={negocio.logo} alt="" className="h-full w-full object-cover" /> : negocio.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold leading-tight">{negocio.nombre}</p>
                <p className="text-xs text-verde">● Asistente de pedidos</p>
              </div>
              {!soloSaludo && <button onClick={reiniciar} className="px-2 text-xs font-semibold text-gris hover:text-tinta">Reiniciar</button>}
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full text-lg text-gris hover:bg-fondo">✕</button>
            </div>

            {/* Conversación */}
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-line ${m.role === "user" ? "rounded-br-md bg-verde text-white" : "rounded-bl-md bg-white shadow-sm"}`}>
                    {m.content}
                  </p>
                </div>
              ))}

              {cargando && (
                <div className="flex">
                  <p className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm">
                    {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-gris/50" style={{ animationDelay: `${i * 120}ms` }} />)}
                  </p>
                </div>
              )}

              {pedido && (
                <div className="mt-3 rounded-2xl bg-white p-4 shadow-tarjeta">
                  <p className="text-xs font-bold tracking-wider text-verde uppercase">Tu pedido</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {pedido.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>{it.cantidad} × {it.nombre}</span>
                        <span className="text-gris">{it.subtotal != null ? cop(it.subtotal) : "—"}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-linea pt-2 font-bold">
                    <span>Total</span>
                    <span>{pedido.total != null ? cop(pedido.total) : "Por confirmar"}</span>
                  </div>
                  <p className="mt-2 text-xs text-gris">
                    {pedido.nombre} · {pedido.entrega === "domicilio" ? `Domicilio: ${pedido.direccion}` : "Paso a recoger"}
                  </p>
                  <BotonWhatsApp negocio={negocio.id} href={waLink(negocio.whatsapp, mensajePedido(negocio.nombre, pedido))} className="btn-wa mt-3 w-full">
                    Enviar pedido por WhatsApp
                  </BotonWhatsApp>
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                  {error === "no_configurado" && "El asistente no está disponible en este momento."}
                  {error === "limite" && "Llegaste al límite de mensajes de hoy."}
                  {error === "red" && "No pude responder. Intenta de nuevo."}{" "}
                  {error !== "red" ? (
                    <BotonWhatsApp negocio={negocio.id} href={waLink(negocio.whatsapp, `Hola ${negocio.nombre}, te encontré en El Mercadito 🛒`)} className="font-bold underline">
                      Escribe directo por WhatsApp
                    </BotonWhatsApp>
                  ) : (
                    <button className="font-bold underline" onClick={() => { const u = [...msgs].reverse().find((m) => m.role === "user"); if (u) { setMsgs((m) => m.slice(0, -1)); enviar(u.content); } }}>
                      Reintentar
                    </button>
                  )}
                </div>
              )}
              <div ref={fin} />
            </div>

            {/* Sugerencias */}
            {soloSaludo && sugerencias.length > 0 && (
              <div className="scroll-oculto flex gap-2 overflow-x-auto px-4 pb-2">
                {sugerencias.map((s) => (
                  <button key={s} onClick={() => enviar(s)} className="chip flex-none">{s}</button>
                ))}
              </div>
            )}

            {/* Entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
              className="flex items-center gap-2 bg-white px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
            >
              <input
                ref={entrada}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={500}
                placeholder="Escribe tu mensaje…"
                className="min-w-0 flex-1 rounded-full bg-fondo px-4 py-3 text-base outline-none focus:ring-2 focus:ring-verde"
              />
              <button disabled={!texto.trim() || cargando} aria-label="Enviar" className="grid h-12 w-12 flex-none place-items-center rounded-full bg-verde text-lg text-white disabled:opacity-40">
                ➤
              </button>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
