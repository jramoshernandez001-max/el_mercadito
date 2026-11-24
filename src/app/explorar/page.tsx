import type { Metadata } from "next";
import { negociosVisibles } from "@/lib/consultas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Explorador } from "./Explorador";

export const metadata: Metadata = { title: "Explorar", description: "Todos los emprendimientos de Lorica, organizados por categoría y zona." };

export default async function Explorar(props: PageProps<"/explorar">) {
  const sp = await props.searchParams;
  const val = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const supabase = await crearClienteServidor();
  const negocios = await negociosVisibles(supabase);
  return (
    <div className="mx-auto max-w-[1080px] px-4">
      <div className="pt-[22px] pb-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Explorar</h1>
        <p className="mt-1 text-sm text-gris">Todos los emprendimientos de Lorica, organizados.</p>
      </div>
      <Explorador negocios={negocios} inicial={{ q: val("q"), cat: val("cat"), zona: val("zona"), tipo: val("tipo") }} />
    </div>
  );
}
