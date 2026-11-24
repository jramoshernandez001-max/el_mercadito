import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const visitante = request.cookies.get("mv")?.value;
  let body: { negocio?: string; tipo?: string } = {};
  try {
    body = await request.json();
  } catch {}
  if (!visitante || !body.negocio || !UUID.test(body.negocio) || !["vista", "whatsapp"].includes(body.tipo ?? "")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const supabase = await crearClienteServidor();
  await supabase.rpc("registrar_evento", { p_negocio: body.negocio, p_tipo: body.tipo, p_visitante: visitante });
  return NextResponse.json({ ok: true });
}
