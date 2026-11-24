import type { Metadata } from "next";
import { Encuesta } from "./Encuesta";

export const metadata: Metadata = {
  title: "Encuesta",
  description: "Ayúdanos a mejorar El Mercadito: responde en 2 minutos.",
  robots: { index: false },
};

export default function PaginaEncuesta() {
  return (
    <div className="mx-auto max-w-[560px] px-4">
      <Encuesta />
    </div>
  );
}
