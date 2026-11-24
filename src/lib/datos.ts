export type Categoria = { id: string; n: string; corto: string; e: string; c: string };

export const CATS: Categoria[] = [
  { id: "comida", corto: "Comida", n: "Comida y bebidas", e: "🍲", c: "#F59E0B" },
  { id: "moda", corto: "Moda", n: "Moda y accesorios", e: "👕", c: "#EC4899" },
  { id: "artesanias", corto: "Artesanías", n: "Artesanías", e: "🧺", c: "#B7791F" },
  { id: "belleza", corto: "Belleza", n: "Belleza y cuidado", e: "💅", c: "#C026D3" },
  { id: "tecnologia", corto: "Tecnología", n: "Tecnología y reparaciones", e: "📱", c: "#3B82F6" },
  { id: "hogar", corto: "Hogar", n: "Hogar y plantas", e: "🪴", c: "#10B981" },
  { id: "servicios", corto: "Servicios", n: "Servicios profesionales", e: "🛠️", c: "#6366F1" },
  { id: "clases", corto: "Clases", n: "Clases y tutorías", e: "📚", c: "#0EA5E9" },
  { id: "eventos", corto: "Eventos", n: "Eventos y fiestas", e: "🎉", c: "#EF4444" },
];

export const ZONAS = ["Centro", "Mercado Público", "Zona Norte", "Zona Sur", "Ribera del Sinú", "Corregimientos"] as const;

export const TIPOS: Record<string, string> = {
  producto: "Productos",
  servicio: "Servicios",
  ambos: "Productos y servicios",
};

export const LIMITE = { basico: 6, premium: 15 } as const;
export const PRECIO_PREMIUM = 12000;
export const PRECIO_ANUNCIO = 25000;
/** WhatsApp del equipo de El Mercadito para coordinar pagos (variable de entorno). */
export const WHATSAPP_EQUIPO = process.env.NEXT_PUBLIC_WHATSAPP_EQUIPO ?? "";

export type Producto = {
  id: string;
  negocio_id: string;
  nombre: string;
  precio: number | null;
  descripcion: string;
  foto_url: string;
  orden: number;
};

export type Negocio = {
  id: string;
  owner_id: string;
  slug: string;
  nombre: string;
  eslogan: string;
  descripcion: string;
  categoria: string;
  zona: string;
  tipo: "producto" | "servicio" | "ambos";
  whatsapp: string;
  instagram: string;
  horario: string;
  logo_url: string;
  plan: "basico" | "premium";
  oculto: boolean;
  creado: string;
  productos?: Producto[];
};

export const cat = (id: string): Categoria =>
  CATS.find((c) => c.id === id) ?? { id: "otros", n: "Otros", corto: "Otros", e: "🛍️", c: "#64748B" };

export const cop = (n: number | null | undefined) =>
  n == null ? "" : "$" + Number(n).toLocaleString("es-CO");

export function waNum(p: string) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) d = "57" + d;
  return d;
}

export const waLink = (numero: string, mensaje: string) =>
  `https://wa.me/${waNum(numero)}?text=${encodeURIComponent(mensaje)}`;

/** Fecha YYYY-MM-DD en hora de Colombia, con desplazamiento en días. */
export function diaCO(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
}

function hash(str: string) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Rotación equitativa: el orden cambia cada día y es igual para todos. Nadie paga por ir primero. */
export function rotar<T extends { id: string }>(lista: T[], dia = diaCO()) {
  return [...lista].sort((a, b) => hash(a.id + dia) - hash(b.id + dia));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const normalizar = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
