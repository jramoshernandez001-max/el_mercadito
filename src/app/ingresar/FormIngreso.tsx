"use client";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export function FormIngreso({ next, error }: { next: string; error: boolean }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const [msg, setMsg] = useState(error ? "Ese enlace expiró o ya se usó. Pide uno nuevo." : "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setMsg("");
    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setEstado("error");
      setMsg(error.status === 429 ? "Pediste muchos enlaces seguidos. Espera un minuto." : "No pudimos enviar el enlace. Revisa el correo e intenta de nuevo.");
    } else setEstado("enviado");
  }

  if (estado === "enviado")
    return (
      <div className="rounded-xl bg-verde-suave p-4 text-center text-sm text-[#0e5e39]">
        <div className="text-3xl">📬</div>
        <p className="mt-2 font-bold">Revisa tu correo: {email}</p>
        <p className="mt-1">Toca el enlace que te enviamos <b>desde este mismo dispositivo</b>. Si no llega en 2 minutos, mira en spam.</p>
        <button className="mt-3 font-bold underline" onClick={() => setEstado("idle")}>Usar otro correo</button>
      </div>
    );

  return (
    <form onSubmit={enviar} className="grid gap-3">
      <label className="etiqueta">
        Correo electrónico
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" className="campo" autoComplete="email" />
      </label>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button className="btn-verde" disabled={estado === "enviando"}>{estado === "enviando" ? "Enviando…" : "Enviarme el enlace"}</button>
    </form>
  );
}
