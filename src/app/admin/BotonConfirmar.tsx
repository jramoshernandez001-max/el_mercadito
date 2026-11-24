"use client";

export function BotonConfirmar({ mensaje, className, children }: { mensaje: string; className: string; children: React.ReactNode }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(mensaje)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
