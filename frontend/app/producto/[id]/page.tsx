import { notFound } from "next/navigation";
import ProductoClient from "./ProductoClient";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const productos = await res.json();
    return productos.map((p: { id: string }) => ({ id: p.id }));
  } catch (e) {
    console.error("⚠️ generateStaticParams falló, revisar Render:", e);
    return [];
  }
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`,
    {
      next: { revalidate: 3600, tags: [`producto-${id}`] },
      signal: AbortSignal.timeout(20000),
    },
  );

  if (!res.ok) {
    notFound();
  }

  const producto = await res.json();
  return <ProductoClient producto={producto} />;
}