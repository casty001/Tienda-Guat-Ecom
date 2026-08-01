import { headers } from "next/headers"
import { notFound } from "next/navigation"
import ProductoClient from "./ProductoClient"

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const headersList = await headers()
  const ua = headersList.get("user-agent") || ""
  const esMobileUA = /Android|iPhone|iPod|Mobile|webOS/i.test(ua)

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) notFound()

    const producto = await res.json()
    return <ProductoClient producto={producto} esMobileUA={esMobileUA} />

  } catch (error) {
    console.error(error)
    return <main className="p-10 text-white">Error cargando producto</main>
  }
}