"use client";
import { useEffect } from "react";

export function enviarEvento(negocio: string, tipo: "vista" | "whatsapp") {
  const body = JSON.stringify({ negocio, tipo });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/evento", new Blob([body], { type: "application/json" }));
  else fetch("/api/evento", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
}

export function RegistrarVista({ negocio }: { negocio: string }) {
  useEffect(() => {
    enviarEvento(negocio, "vista");
  }, [negocio]);
  return null;
}

export function BotonWhatsApp({ negocio, href, className, children }: { negocio: string; href: string; className: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => enviarEvento(negocio, "whatsapp")}>
      {children}
    </a>
  );
}

export function BotonCopiar({ texto }: { texto: string }) {
  return (
    <button
      className="btn-borde btn-sm ml-auto"
      onClick={async (e) => {
        const b = e.currentTarget;
        try {
          await navigator.clipboard.writeText(texto);
          b.textContent = "¡Copiado!";
        } catch {
          b.textContent = texto;
        }
        setTimeout(() => (b.textContent = "Copiar"), 2000);
      }}
    >
      Copiar
    </button>
  );
}
