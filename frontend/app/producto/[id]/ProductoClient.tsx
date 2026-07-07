"use client"
import Image from "next/image"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"
import DesktopGenericLanding from "@/components/DesktopGenericLanding"
import dynamic from "next/dynamic"

const FloatingOrderModal = dynamic(
  () => import("@/components/FloatingOrderModal"),
  { ssr: false }
)

export default function ProductoClient({ producto }: { producto: any }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [mostrarDesktop, setMostrarDesktop] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [tiempo, setTiempo] = useState({
    horas: 0,
    minutos: 28,
    segundos: 59,
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    
    function revisarPantalla() {
      setMostrarDesktop(window.innerWidth >= 768)
    }
    revisarPantalla()
    window.addEventListener("resize", revisarPantalla)
    return () => window.removeEventListener("resize", revisarPantalla)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ttq && producto) {
      (window as any).ttq.track("ViewContent", {
        content_id: producto.id,
        content_type: "product",
        content_name: producto.nombre,
        value: Number(producto.precio || 0),
        currency: "USD",
      })
    }
  }, [producto])

  useEffect(() => {
    if (!producto?.mostrarContador) return
    setTiempo({
      horas: 0,
      minutos: Number(producto.minutosContador || 28),
      segundos: 59,
    })
    const interval = setInterval(() => {
      setTiempo((prev) => {
        let { horas, minutos, segundos } = prev
        if (segundos > 0) {
          segundos--
        } else {
          segundos = 59
          if (minutos > 0) {
            minutos--
          } else {
            minutos = 59
            if (horas > 0) {
              horas--
            } else {
              horas = 0
              minutos = Number(producto.minutosContador || 28)
              segundos = 59
            }
          }
        }
        return { horas, minutos, segundos }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [producto])

  function irFormulario() {
    if (typeof window !== "undefined" && (window as any).ttq && producto) {
      (window as any).ttq.track("InitiateCheckout", {
        content_id: producto.id,
        content_type: "product",
        content_name: producto.nombre,
        value: Number(producto.precio || 0),
        currency: "USD",
      })
    }
    setModalOpen(true)
  }

  async function enviarPedido(e: React.FormEvent<HTMLFormElement>, datosEnvio?: any) {
    e.preventDefault()
    setEnviando(true)

    const form = new FormData(e.currentTarget)
    const precioTotal = datosEnvio?.precio || producto.precio
    const envioPrioritario = datosEnvio?.envioPrioritario || false
    const costoEnvio = datosEnvio?.costoEnvio || 0
    const precioBase = datosEnvio?.precioBase || producto.precio

    const data = {
      nombre: String(form.get("nombre") || ""),
      telefono: String(form.get("telefono") || ""),
      departamento: String(form.get("departamento") || ""),
      ciudad: String(form.get("ciudad") || ""),
      direccion: String(form.get("direccion") || ""),
      referencia: String(form.get("referencia") || ""),
      productoId: producto.id,
      productoNombre: producto.nombre,
      precio: precioTotal,
      precioBase: precioBase,
      costoEnvio: costoEnvio,
      envioPrioritario: envioPrioritario,
      imagen: producto.imagen,
    }

    try {
      const eventId = crypto.randomUUID()

      if (typeof window !== "undefined" && (window as any).ttq) {
        const telefonoLimpio = String(data.telefono || "").replace(/\D/g, "")
        const telefonoFinal = telefonoLimpio.startsWith("57")
          ? telefonoLimpio
          : `57${telefonoLimpio}`

        ;(window as any).ttq.identify({ phone_number: telefonoFinal })
        ;(window as any).ttq.track("CompletePayment", {
          content_id: producto.id,
          content_type: "product",
          content_name: producto.nombre,
          value: Number(precioTotal || 0),
          currency: "USD",
          event_id: eventId,
        })
      }

      await api.post("/pedidos", { ...data, event_id: eventId })
      window.location.href = "/gracias"

    } catch (error) {
      console.error(error)
      alert("Error creando pedido")
    } finally {
      setEnviando(false)
    }
  }

  const precio = Number(producto.precio || 0)

  if (mostrarDesktop === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">
          Cargando...
        </div>
      </div>
    )
  }
  if (mostrarDesktop) {
    return <DesktopGenericLanding />
  }

  return (
    <main className="bg-[#121212] min-h-screen">
      {producto.mostrarContador && (
        <section className="bg-red-800 text-white py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center font-black italic leading-tight text-sm md:text-xl">
              <p>DESCUENTO POR</p>
              <p>TIEMPO LIMITADO</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.horas).padStart(2, "0")}
              </div>
              <span className="text-white font-black text-xl">:</span>
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.minutos).padStart(2, "0")}
              </div>
              <span className="text-white font-black text-xl">:</span>
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.segundos).padStart(2, "0")}
              </div>
            </div>
          </div>
        </section>
      )}

      {producto.mostrarEstrellas && (
        <div className="bg-white text-black text-center text-sm md:text-base font-bold py-1">
          ⭐⭐⭐⭐⭐ {producto.textoEstrellas || "+100.000 clientes satisfechos"}
        </div>
      )}

      {producto.imagenesLanding?.imagen1 && (
        <Image
          src={producto.imagenesLanding.imagen1}
          alt={producto.nombre}
          width={1200}
          height={1600}
          className="w-full h-auto"
          priority 
        />
      )}

      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden animate-[shake_2.5s_ease-in-out_infinite] hover:scale-[1.01] transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0">
          <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">PEDIR AHORA Y PAGAR AL RECIBIR</span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">2.044 Vendidas - 14 Unidades disponibles</span>
        </div>
      </button>

      {producto.mostrarInfoCompra && (
        <section className="bg-[#121212] text-white p-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black leading-tight">
            {producto.textoDescuento || "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"}
          </h2>
          <h3 className="text-2xl md:text-4xl font-black mt-3">
            PRECIO FINAL <span className="text-red-600">${precio.toFixed(2)}</span>
          </h3>
          <div className="mt-8 text-left max-w-3xl mx-auto divide-y divide-[#2a2a2a] bg-inherit">
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>📦 ¿Qué incluye?</span><span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">{producto.queIncluye || "Incluye el producto seleccionado."}</p>
            </details>
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>🚚 Información de envío</span><span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">{producto.informacionEnvio || "Enviamos a tu ciudad y pagas al recibir."}</p>
            </details>
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>↩️ Devoluciones y reembolsos</span><span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">{producto.devolucionesReembolsos || "Nuestro equipo te ayudará si tienes inconvenientes."}</p>
            </details>
          </div>
        </section>
      )}

      <button onClick={irFormulario} className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden animate-[shake_2.5s_ease-in-out_infinite] hover:scale-[1.01] transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">PEDIR AHORA Y PAGAR AL RECIBIR</span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">2.044 Vendidas - 14 Unidades disponibles</span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen2 && <Image src={producto.imagenesLanding.imagen2} alt={producto.nombre} width={1200} height={1600} className="w-full h-auto" />}

      <button onClick={irFormulario} className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden animate-[shake_2.5s_ease-in-out_infinite] hover:scale-[1.01] transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">PEDIR AHORA Y PAGAR AL RECIBIR</span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">2.044 Vendidas - 14 Unidades disponibles</span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen3 && <Image src={producto.imagenesLanding.imagen3} alt={producto.nombre} width={1200} height={1600} className="w-full h-auto" />}

      <button onClick={irFormulario} className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden animate-[shake_2.5s_ease-in-out_infinite] hover:scale-[1.01] transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">PEDIR AHORA Y PAGAR AL RECIBIR</span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">2.044 Vendidas - 14 Unidades disponibles</span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen4 && <Image src={producto.imagenesLanding.imagen4} alt={producto.nombre} width={1200} height={1600} className="w-full h-auto" />}
      <button onClick={irFormulario} className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden animate-[shake_2.5s_ease-in-out_infinite] hover:scale-[1.01] transition">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">PEDIR AHORA Y PAGAR AL RECIBIR</span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">2.044 Vendidas - 14 Unidades disponibles</span>
        </div>
      </button>
      {producto.imagenesLanding?.imagen5 && <Image src={producto.imagenesLanding.imagen5} alt={producto.nombre} width={1200} height={1600} className="w-full h-auto" />}

      {producto.preguntasFrecuentes?.length > 0 && (
        <section className="bg-[#121212] p-6">
          <h2 className="text-white text-3xl font-bold text-center mb-6">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {producto.preguntasFrecuentes.map((faq: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-4">
                <h3 className="text-[#121212] font-bold">{faq.pregunta}</h3>
                <p className="text-[#121212]">{faq.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {producto.mostrarResenas && producto.resenas?.length > 0 && (
        <section className="bg-white text-black p-6">
          <h2 className="text-3xl font-black text-center mb-6">Opiniones de clientes</h2>
          <div className="space-y-4">
            {producto.resenas.map((resena: any, index: number) => (
              <div key={index} className="border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">{resena.nombre}</h3>
                    <p className="text-sm text-gray-500">{resena.ciudad} · {resena.fecha}</p>
                  </div>
                  {resena.verificado && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Verificado</span>
                  )}
                </div>
                <div className="text-yellow-500 mb-2">{"⭐".repeat(Number(resena.puntuacion || 5))}</div>
                <p className="text-gray-700">{resena.resena}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <FloatingOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={producto}
        onSubmit={(e: any, datos: any) => enviarPedido(e, datos)}
        enviando={enviando}
      />
    </main>
  )
}