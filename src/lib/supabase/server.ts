import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function crearClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: el proxy se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}

/** Usuario actual verificado contra Supabase Auth, o null. */
export async function usuarioActual() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function esAdmin() {
  const { supabase, user } = await usuarioActual();
  if (!user) return { supabase, user, admin: false };
  const { data } = await supabase.from("perfiles").select("es_admin").eq("id", user.id).maybeSingle();
  return { supabase, user, admin: !!data?.es_admin };
}
