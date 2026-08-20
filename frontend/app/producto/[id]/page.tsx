import { notFound } from "next/navigation";
import ProductoClient from "./ProductoClient";
import ProductoClient2 from "./ProductoClient2";

export const revalidate = 1800;

export async function generateStaticParams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`);

  if (!res.ok) {
    return [];
  }

  const productos = await res.json();

  return productos.map((producto: { id: string }) => ({
    id: producto.id,
  }));
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`,
      {
        //  next: {
        // revalidate: 1800,
        //},
      },
    );

    if (!res.ok) {
      notFound();
    }

    const producto = await res.json();
    return producto.disenoLanding === "moderno" ? ( // 👈 CAMBIAR
      <ProductoClient2 producto={producto} />
    ) : (
      <ProductoClient producto={producto} />
    );
  } catch (error) {
    console.error(error);

    return <main className="p-10 text-white">Error cargando producto</main>;
  }
}
