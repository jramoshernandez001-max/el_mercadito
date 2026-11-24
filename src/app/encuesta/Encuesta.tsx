"use client";
import Link from "next/link";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Tipo = "comprador" | "emprendedor";
type Pregunta =
  | { id: string; tipo: "opciones"; texto: string; opciones: string[]; multiple?: boolean }
  | { id: string; tipo: "escala"; texto: string; min: number; max: number; etiquetas: [string, string] }
  | { id: string; tipo: "texto"; texto: string; opcional?: boolean };

const CANALES = ["Grupos de WhatsApp", "Facebook / Marketplace", "Instagram", "Recomendación de conocidos", "Recorriendo el pueblo"];

const PREGUNTAS: Record<Tipo, Pregunta[]> = {
  comprador: [
    { id: "canales", tipo: "opciones", texto: "¿Cómo buscas hoy productos o servicios en Lorica?", opciones: CANALES, multiple: true },
    { id: "dificultad_actual", tipo: "escala", texto: "¿Qué tan difícil es hoy encontrar lo que buscas en Lorica?", min: 1, max: 5, etiquetas: ["Muy fácil", "Muy difícil"] },
    { id: "facilidad", tipo: "escala", texto: "En El Mercadito, ¿qué tan fácil fue encontrar un negocio?", min: 1, max: 5, etiquetas: ["Muy difícil", "Muy fácil"] },
    { id: "whatsapp", tipo: "escala", texto: "¿Qué tan útil es escribirle al negocio por WhatsApp desde su perfil?", min: 1, max: 5, etiquetas: ["Nada útil", "Muy útil"] },
    { id: "usaria", tipo: "opciones", texto: "¿Usarías El Mercadito en vez de buscar en grupos y redes?", opciones: ["Sí", "Tal vez", "No"] },
    { id: "nps", tipo: "escala", texto: "Del 0 al 10, ¿qué tanto recomendarías El Mercadito a un amigo?", min: 0, max: 10, etiquetas: ["Nada", "Totalmente"] },
    { id: "mejora", tipo: "texto", texto: "¿Qué le agregarías o mejorarías?", opcional: true },
  ],
  emprendedor: [
    { id: "canales", tipo: "opciones", texto: "¿Dónde vendes o te das a conocer hoy?", opciones: [...CANALES.slice(0, 4), "Local físico"], multiple: true },
    { id: "dificultad_actual", tipo: "escala", texto: "¿Qué tan difícil es hoy que nuevos clientes te encuentren?", min: 1, max: 5, etiquetas: ["Muy fácil", "Muy difícil"] },
    { id: "facilidad", tipo: "escala", texto: "¿Qué tan fácil fue (o crees que sería) crear tu perfil en El Mercadito?", min: 1, max: 5, etiquetas: ["Muy difícil", "Muy fácil"] },
    { id: "ayuda", tipo: "escala", texto: "¿Qué tanto crees que El Mercadito te ayudaría a vender más?", min: 1, max: 5, etiquetas: ["Nada", "Mucho"] },
    { id: "premium", tipo: "opciones", texto: "¿Pagarías $30.000 al mes por Premium (chatbot que atiende tus pedidos, 15 productos, insignia)?", opciones: ["Sí", "Tal vez", "No"] },
    { id: "anuncio", tipo: "opciones", texto: "¿Pagarías $20.000 por una semana de anuncio en la portada?", opciones: ["Sí", "Tal vez", "No"] },
    { id: "nps", tipo: "escala", texto: "Del 0 al 10, ¿qué tanto recomendarías El Mercadito a otro emprendedor?", min: 0, max: 10, etiquetas: ["Nada", "Totalmente"] },
    { id: "mejora", tipo: "texto", texto: "¿Qué le agregarías o mejorarías?", opcional: true },
  ],
};

export function Encuesta() {
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [r, setR] = useState<Record<string, string | number | string[]>>({});
  const [estado, setEstado] = useState<"" | "enviando" | "listo" | "error">("");

  if (estado === "listo")
    return (
      <div className="py-20 text-center">
        <div className="text-6xl">🙌</div>
        <h1 className="mt-4 text-2xl font-bold">¡Gracias!</h1>
        <p className="mt-2 text-gris">Tu respuesta nos ayuda a mejorar El Mercadito para todo Lorica.</p>
        <Link href="/" className="btn-verde mt-8">Ir a El Mercadito</Link>
      </div>
    );

  if (!tipo)
    return (
      <div className="pt-10 text-center">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">Ayúdanos a mejorar <span className="text-verde">El Mercadito</span></h1>
        <p className="mt-2 text-gris">Son 2 minutos. ¿Tú eres…?</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => setTipo("comprador")} className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-tarjeta hover:ring-2 hover:ring-verde">
            <span className="text-4xl">🛍️</span>
            <span><b className="block text-lg">Comprador</b><span className="text-sm text-gris">Busco productos o servicios en Lorica</span></span>
          </button>
          <button onClick={() => setTipo("emprendedor")} className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-tarjeta hover:ring-2 hover:ring-verde">
            <span className="text-4xl">🏪</span>
            <span><b className="block text-lg">Emprendedor</b><span className="text-sm text-gris">Vendo productos o servicios</span></span>
          </button>
        </div>
      </div>
    );

  const preguntas = PREGUNTAS[tipo];
  const faltan = preguntas.filter((p) => !(p.tipo === "texto" && p.opcional) && (r[p.id] === undefined || (Array.isArray(r[p.id]) && (r[p.id] as string[]).length === 0)));
  const set = (id: string, v: string | number | string[]) => setR((x) => ({ ...x, [id]: v }));

  async function enviar() {
    setEstado("enviando");
    const { error } = await crearClienteNavegador().from("encuestas").insert({ tipo, respuestas: r });
    setEstado(error ? "error" : "listo");
  }

  return (
    <div className="pt-6 pb-10">
      <button onClick={() => { setTipo(null); setR({}); }} className="text-sm text-gris">← Cambiar</button>
      <h1 className="mt-2 text-2xl font-bold">{tipo === "comprador" ? "🛍️ Comprador" : "🏪 Emprendedor"}</h1>
      <p className="mt-1 text-sm text-gris">
        Si aún no conoces la plataforma, échale un vistazo en{" "}
        <a href="/" target="_blank" className="font-semibold text-verde">el-mercadito-seven.vercel.app</a>.
      </p>

      <div className="mt-6 grid gap-4">
        {preguntas.map((p, i) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-tarjeta">
            <p className="font-semibold"><span className="text-verde">{i + 1}.</span> {p.texto}</p>
            {p.tipo === "opciones" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.opciones.map((o) => {
                  const actual = r[p.id];
                  const on = p.multiple ? Array.isArray(actual) && actual.includes(o) : actual === o;
                  return (
                    <button
                      key={o}
                      onClick={() => {
                        if (!p.multiple) return set(p.id, o);
                        const lista = Array.isArray(actual) ? actual : [];
                        set(p.id, on ? lista.filter((x) => x !== o) : [...lista, o]);
                      }}
                      className={on ? "chip-on" : "chip"}
                    >
                      {o}
                    </button>
                  );
                })}
                {p.multiple && <span className="w-full text-xs text-gris">Puedes marcar varias</span>}
              </div>
            )}
            {p.tipo === "escala" && (
              <>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: p.max - p.min + 1 }, (_, k) => p.min + k).map((v) => (
                    <button
                      key={v}
                      onClick={() => set(p.id, v)}
                      className={`h-10 flex-1 rounded-lg text-sm font-bold ${r[p.id] === v ? "bg-navy text-white" : "bg-fondo text-tinta"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-gris"><span>{p.etiquetas[0]}</span><span>{p.etiquetas[1]}</span></div>
              </>
            )}
            {p.tipo === "texto" && (
              <textarea
                className="campo mt-3"
                rows={2}
                maxLength={400}
                value={(r[p.id] as string) ?? ""}
                onChange={(e) => set(p.id, e.target.value)}
                placeholder="Opcional"
              />
            )}
          </div>
        ))}
      </div>

      <button onClick={enviar} disabled={faltan.length > 0 || estado === "enviando"} className="btn-verde mt-6 w-full py-4! text-base!">
        {estado === "enviando" ? "Enviando…" : faltan.length ? `Faltan ${faltan.length} respuestas` : "Enviar respuestas"}
      </button>
      {estado === "error" && <p className="mt-3 text-center text-sm text-red-600">No se pudo enviar. Intenta de nuevo.</p>}
    </div>
  );
}
