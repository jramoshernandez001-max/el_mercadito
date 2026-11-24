"use client";
import Link from "next/link";
import { useState } from "react";

const PASOS = {
  comprador: [
    ["🔎", "Busca", "Por nombre, categoría o zona."],
    ["🏪", "Elige", "Mira el catálogo y los precios."],
    ["💬", "Escribe", "Un toque y abres WhatsApp."],
  ],
  emprendedor: [
    ["📝", "Crea tu perfil", "Gratis, solo con tu correo."],
    ["📸", "Sube productos", "Con foto y precio."],
    ["💬", "Recibe pedidos", "Directo a tu WhatsApp."],
  ],
} as const;

export function Pasos() {
  const [modo, setModo] = useState<"comprador" | "emprendedor">("comprador");
  return (
    <>
      <div className="mx-auto flex max-w-[360px] rounded-full bg-white p-1 shadow-tarjeta" role="tablist">
        {(["comprador", "emprendedor"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${modo === m ? "bg-navy text-white" : "text-gris"}`}
          >
            {m === "comprador" ? "Comprar" : "Vender"}
          </button>
        ))}
      </div>
      <ol className="mt-8 grid gap-6 sm:grid-cols-3">
        {PASOS[modo].map(([e, t, d], i) => (
          <li key={t} className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-3xl shadow-tarjeta">{e}</div>
            <h3 className="mt-3 font-bold"><span className="text-verde">{i + 1}.</span> {t}</h3>
            <p className="mt-1 text-sm text-gris">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 text-center">
        <Link href={modo === "comprador" ? "/explorar" : "/mi-negocio"} className="btn-verde">
          {modo === "comprador" ? "Empezar a buscar" : "Crear mi perfil"}
        </Link>
      </div>
    </>
  );
}
