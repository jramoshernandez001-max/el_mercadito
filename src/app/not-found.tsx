import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="px-4 py-20 text-center">
      <div className="text-5xl">🧺</div>
      <h1 className="mt-3 text-xl font-bold">No encontramos esa página</h1>
      <p className="mt-1 text-gris">Puede que el emprendimiento ya no esté publicado.</p>
      <Link href="/explorar" className="btn-verde mt-5">Explorar El Mercadito</Link>
    </div>
  );
}
