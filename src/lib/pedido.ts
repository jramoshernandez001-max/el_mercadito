import { cop } from "./datos";

export type ItemPedido = { nombre: string; cantidad: number; precio: number | null; subtotal: number | null };
export type Pedido = {
  items: ItemPedido[];
  total: number | null;
  nombre: string;
  entrega: "domicilio" | "recoger";
  direccion: string;
  notas: string;
};

/** Mensaje de WhatsApp con el pedido cerrado, listo para enviar a la tienda. */
export function mensajePedido(tienda: string, p: Pedido) {
  const lineas = [
    `Hola ${tienda} 👋 Quiero hacer este pedido (vía El Mercadito):`,
    "",
    ...p.items.map((i) => `• ${i.cantidad} × ${i.nombre}${i.subtotal != null ? ` — ${cop(i.subtotal)}` : ""}`),
    "",
    p.total != null ? `*Total: ${cop(p.total)}*` : "*Total: por confirmar*",
    `Nombre: ${p.nombre}`,
    p.entrega === "domicilio" ? `Entrega: Domicilio — ${p.direccion || "dirección por confirmar"}` : "Entrega: Paso a recoger",
  ];
  if (p.notas) lineas.push(`Notas: ${p.notas}`);
  return lineas.join("\n");
}
