import ProductoClient from "./ProductoClient"

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>  // 👈 Tipo Promise
}) {
  const { id } = await params  // 👈 await

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`,
      { next: { revalidate: 300 } }
      //{ cache: "no-store" }
    )

    if (!res.ok) {
      return <main className="p-10 text-white">Producto no encontrado</main>
    }

    const producto = await res.json()
    return <ProductoClient producto={producto} />

  } catch (error) {
    console.error(error)
    return <main className="p-10 text-white">Error cargando producto</main>
  }
}