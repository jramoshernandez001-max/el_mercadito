import Anthropic from "@anthropic-ai/sdk";

export type Msg = { role: "user" | "assistant"; content: string };
export type LlamadaPedido = {
  items?: { codigo?: string; cantidad?: number }[];
  nombre_cliente?: string;
  entrega?: string;
  direccion?: string;
  notas?: string;
};
export type RespuestaIA = { texto: string; pedido: LlamadaPedido | null };

export class IANoDisponible extends Error {}

const DESCRIPCION =
  "Cierra el pedido. Llámala solo cuando el cliente ya confirmó explícitamente el resumen y tienes productos, cantidades, nombre y forma de entrega (y dirección si es domicilio).";

/** Proveedor activo según las llaves configuradas: Gemini primero, Claude después. */
export function proveedorActivo(): "gemini" | "claude" | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

export async function preguntarIA(sistema: string, mensajes: Msg[]): Promise<RespuestaIA> {
  const p = proveedorActivo();
  if (p === "gemini") return gemini(sistema, mensajes);
  if (p === "claude") return claude(sistema, mensajes);
  throw new IANoDisponible("sin llave");
}

/* ---------------- Gemini (Google AI Studio) ---------------- */

// Alias que Google mantiene apuntando a su modelo más reciente; si uno no existe, se prueba el siguiente.
const MODELOS_GEMINI = (process.env.GEMINI_MODEL || "gemini-flash-lite-latest,gemini-flash-latest").split(",").map((m) => m.trim()).filter(Boolean);

async function gemini(sistema: string, mensajes: Msg[]): Promise<RespuestaIA> {
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const cuerpo = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: mensajes.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    tools: [
      {
        functionDeclarations: [
          {
            name: "confirmar_pedido",
            description: DESCRIPCION,
            parameters: {
              type: "OBJECT",
              properties: {
                items: {
                  type: "ARRAY",
                  description: "Productos del catálogo con su código (P1, P2…) y cantidad",
                  items: {
                    type: "OBJECT",
                    properties: { codigo: { type: "STRING" }, cantidad: { type: "INTEGER" } },
                    required: ["codigo", "cantidad"],
                  },
                },
                nombre_cliente: { type: "STRING" },
                entrega: { type: "STRING", enum: ["domicilio", "recoger"] },
                direccion: { type: "STRING", description: "Dirección o barrio, si es domicilio" },
                notas: { type: "STRING", description: "Indicaciones extra del cliente, si las hay" },
              },
              required: ["items", "nombre_cliente", "entrega"],
            },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  let ultimoError = "";
  for (const modelo of MODELOS_GEMINI) {
    const r = await fetch(`${base}/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify(cuerpo),
    });
    if (r.status === 404) {
      ultimoError = `modelo ${modelo} no encontrado`;
      continue;
    }
    if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const d = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean; functionCall?: { name: string; args?: LlamadaPedido } }[] } }[];
    };
    const partes = d.candidates?.[0]?.content?.parts ?? [];
    const texto = partes.filter((x) => x.text && !x.thought).map((x) => x.text).join("").trim();
    const llamada = partes.find((x) => x.functionCall?.name === "confirmar_pedido")?.functionCall?.args ?? null;
    return { texto, pedido: llamada };
  }
  throw new Error(ultimoError || "gemini sin modelo");
}

/* ---------------- Claude (Anthropic) ---------------- */

async function claude(sistema: string, mensajes: Msg[]): Promise<RespuestaIA> {
  const anthropic = new Anthropic();
  const r = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
    max_tokens: 600,
    system: sistema,
    messages: mensajes,
    tools: [
      {
        name: "confirmar_pedido",
        description: DESCRIPCION,
        input_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: { codigo: { type: "string" }, cantidad: { type: "integer", minimum: 1, maximum: 99 } },
                required: ["codigo", "cantidad"],
              },
            },
            nombre_cliente: { type: "string" },
            entrega: { type: "string", enum: ["domicilio", "recoger"] },
            direccion: { type: "string" },
            notas: { type: "string" },
          },
          required: ["items", "nombre_cliente", "entrega"],
        },
      },
    ],
  });
  const texto = r.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const uso = r.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "confirmar_pedido");
  return { texto, pedido: (uso?.input as LlamadaPedido) ?? null };
}
