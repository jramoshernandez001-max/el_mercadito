import type { Metadata } from "next";
import { Pasos } from "./Pasos";

export const metadata: Metadata = { title: "Cómo funciona", description: "Cómo comprar y vender en El Mercadito, el mercado digital de Lorica." };

const FAQ = [
  ["¿Cuesta algo?", "Publicar es gratis para siempre. Premium es opcional."],
  ["¿Cobran comisión?", "No. Precio, entrega y pago se acuerdan directo por WhatsApp."],
  ["¿Quién aparece primero?", "Nadie paga por eso: el orden cambia cada día para todos."],
  ["¿Cómo ingreso?", "Con tu correo. Te llega un enlace; ábrelo en el mismo dispositivo."],
  ["¿Solo Lorica?", "Por ahora sí, para que todo te quede cerca."],
];

export default function ComoFunciona() {
  return (
    <div className="mx-auto max-w-[720px] px-4">
      <h1 className="pt-10 pb-8 text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-4xl">Así funciona</h1>
      <Pasos />
      <section className="mt-14">
        <h2 className="mb-3 text-lg font-bold">Preguntas</h2>
        <div className="divide-y divide-linea rounded-2xl bg-white px-4 shadow-tarjeta">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-xl leading-none text-verde transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-sm text-gris">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
