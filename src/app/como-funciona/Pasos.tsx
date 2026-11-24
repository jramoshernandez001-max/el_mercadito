"use client";
import Link from "next/link";
import { useState } from "react";

const PASOS = {
  comprador: [
    ["🔎", "Busca o explora", "Escribe lo que necesitas o entra por categoría o por tu zona de Lorica. Todo está ordenado, nada se pierde en un chat."],
    ["🏪", "Mira el perfil", "Cada emprendimiento tiene su perfil permanente con catálogo, precios, horario y zona."],
    ["💬", "Escribe por WhatsApp", "Un toque y se abre WhatsApp con el mensaje listo, incluso preguntando por un producto específico."],
    ["🤝", "Acuerda directo", "El precio, la entrega y el pago se acuerdan directo con el emprendedor. El Mercadito no cobra comisión."],
  ],
  emprendedor: [
    ["📝", "Crea tu perfil gratis", "Ingresa con tu correo, llena nombre, categoría, zona y WhatsApp. En minutos ya estás publicado."],
    ["📸", "Sube tu catálogo", "Agrega hasta 6 productos o servicios con foto y precio. Puedes editarlos cuando quieras."],
    ["⚖️", "Aparece por igual", "Sales en búsquedas, categorías y en la rotación diaria de la portada, en las mismas condiciones que todos."],
    ["📈", "Recibe clientes", "Te escriben directo a WhatsApp. En \"Mi negocio\" ves cuántas personas visitan tu perfil y te contactan."],
  ],
} as const;

export function Pasos() {
  const [modo, setModo] = useState<"comprador" | "emprendedor">("comprador");
  return (
    <>
      <div className="flex gap-1 rounded-[14px] bg-white p-[5px] shadow-tarjeta" role="tablist">
        {(["comprador", "emprendedor"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`flex-1 rounded-[10px] px-2 py-[11px] text-sm font-bold ${modo === m ? "bg-navy text-white" : "text-gris"}`}
          >
            {m === "comprador" ? "🛍️ Quiero comprar" : "🏪 Quiero vender"}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {PASOS[modo].map(([e, t, d], i) => (
          <div key={t} className="relative flex flex-col gap-1.5 rounded-2xl bg-white p-[18px] shadow-tarjeta">
            <span className="absolute top-[14px] right-4 text-[13px] font-extrabold text-[#C3CCD8]">0{i + 1}</span>
            <div className="mb-1 grid h-[46px] w-[46px] place-items-center rounded-[13px] bg-verde-suave text-[23px]">{e}</div>
            <h3 className="text-base font-bold tracking-tight">{t}</h3>
            <p className="text-[13.5px] leading-normal text-gris">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-[14px]">
        {modo === "comprador" ? (
          <Link href="/explorar" className="btn-verde">Explorar emprendimientos</Link>
        ) : (
          <Link href="/mi-negocio" className="btn-verde">Crear mi perfil gratis</Link>
        )}
      </div>
    </>
  );
}
