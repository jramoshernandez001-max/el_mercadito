import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/supabase/server";
import { FormIngreso } from "./FormIngreso";

export const metadata: Metadata = { title: "Ingresar" };

export default async function Ingresar(props: PageProps<"/ingresar">) {
  const sp = await props.searchParams;
  const nextRaw = typeof sp.next === "string" ? sp.next : "/mi-negocio";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/mi-negocio";
  const { user } = await usuarioActual();
  if (user) redirect(next);
  return (
    <div className="mx-auto max-w-[440px] px-4 pt-10">
      <div className="panel p-6!">
        <div className="text-center text-[44px]">🏪</div>
        <h1 className="mt-2 text-center text-[22px] font-bold tracking-tight">Ingresa a El Mercadito</h1>
        <p className="mt-1 mb-5 text-center text-sm text-gris">Sin contraseñas: te enviamos un enlace a tu correo.</p>
        <FormIngreso next={next} error={sp.error === "enlace"} />
      </div>
    </div>
  );
}
