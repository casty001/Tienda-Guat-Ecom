"use client";
import Image from "next/image";
import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import DesktopGenericLanding from "@/components/DesktopGenericLanding";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
const FloatingOrderModal = dynamic(
  () => import("@/components/FloatingOrderModal"),
  {
    ssr: false,
  },
);

export default function ProductoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  function irFormulario() {
    setModalOpen(true);
  }

  const [mostrarDesktop, setMostrarDesktop] = useState(false);
  useEffect(() => {
    function revisarPantalla() {
      setMostrarDesktop(window.innerWidth >= 768);
    }

    revisarPantalla();

    window.addEventListener("resize", revisarPantalla);

    return () => window.removeEventListener("resize", revisarPantalla);
  }, []);

  const params = useParams();

  const formRef = useRef<HTMLDivElement | null>(null);

  const [producto, setProducto] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [enviando, setEnviando] = useState(false);

  const [tiempo, setTiempo] = useState({
    horas: 0,
    minutos: 28,
    segundos: 59,
  });

  useEffect(() => {
    if (params.id) {
      cargarProducto();
    }
  }, [params.id]);

  useEffect(() => {
    if (!producto?.mostrarContador) return;

    setTiempo({
      horas: 0,
      minutos: Number(producto.minutosContador || 28),
      segundos: 59,
    });

    const interval = setInterval(() => {
      setTiempo((prev) => {
        let { horas, minutos, segundos } = prev;

        if (segundos > 0) {
          segundos--;
        } else {
          segundos = 59;

          if (minutos > 0) {
            minutos--;
          } else {
            minutos = 59;

            if (horas > 0) {
              horas--;
            } else {
              horas = 0;

              minutos = Number(producto.minutosContador || 28);

              segundos = 59;
            }
          }
        }

        return {
          horas,
          minutos,
          segundos,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [producto]);
  async function cargarProducto() {
    try {
      const res = await api.get(`/productos/${params.id}`);

      setProducto(res.data);
    } catch (error) {
      console.error(error);

      alert("Error cargando producto");
    } finally {
      setLoading(false);
    }
  }

  async function enviarPedido(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEnviando(true);

    const form = new FormData(e.currentTarget);

    const data = {
      nombre: String(form.get("nombre") || ""),

      telefono: String(form.get("telefono") || ""),

      departamento: String(form.get("departamento") || ""),

      ciudad: String(form.get("ciudad") || ""),

      direccion: String(form.get("direccion") || ""),

      referencia: String(form.get("referencia") || ""),

      productoId: producto.id,

      productoNombre: producto.nombre,

      precio: producto.precio,

      imagen: producto.imagen,
    };

    try {
      await api.post("/pedidos", data);

      window.location.href = "/gracias";
    } catch (error) {
      console.error(error);

      alert("Error creando pedido");
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return <main className="p-10">Cargando producto...</main>;
  }

  if (!producto) {
    return <main className="p-10">Producto no encontrado</main>;
  }

  const precio = Number(producto.precio || 0);

  const precioAntes = Number(producto.precioAntes || 0);

  const textoBoton = producto.textoBoton || "COMPRAR AHORA Y PAGAR AL RECIBIR";

  if (mostrarDesktop) {
    return <DesktopGenericLanding />;
  }
  return (
    <main className="bg-[#121212] min-h-screen">
      {/* CONTADOR */}

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

      {/* ESTRELLAS */}

      {producto.mostrarEstrellas && (
        <div className="bg-white text-black text-center text-sm md:text-base font-bold py-1">
          ⭐⭐⭐⭐⭐{" "}
          {producto.textoEstrellas || "+100.000 clientes satisfechos"}
        </div>
      )}

      {/* LANDING 1 */}

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
      {/* BOTON */}

      <button
        onClick={irFormulario}
        className="bg-red-600 w-[90%] mx-auto block py-5 my-6 text-white font-bold text-xl rounded-lg btn-wobble btn-hover"
      >
        COMPRAR AHORA Y PAGAR AL RECIBIR
      </button>

      {/* BOTON */}
      {producto.mostrarInfoCompra && (
        <section className="bg-[#121212] text-white p-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black leading-tight">
            {producto.textoDescuento ||
              "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"}
          </h2>

          <h3 className="text-2xl md:text-4xl font-black mt-3">
            PRECIO FINAL{" "}
            <span className="text-red-600">
              ${precio.toLocaleString("es-CO")}
            </span>
          </h3>

          <div className="mt-8 text-left max-w-3xl mx-auto divide-y divide-green-950 bg-[#071100]">
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>📦 ¿Qué incluye?</span>

                <span>▼</span>
              </summary>

              <p className="mt-4 text-gray-200">
                {producto.queIncluye || "Incluye el producto seleccionado."}
              </p>
            </details>

            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>🚚 Información de envío</span>

                <span>▼</span>
              </summary>

              <p className="mt-4 text-gray-200">
                {producto.informacionEnvio ||
                  "Enviamos a tu ciudad y pagas al recibir."}
              </p>
            </details>

            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>↩️ Devoluciones y reembolsos</span>

                <span>▼</span>
              </summary>

              <p className="mt-4 text-gray-200">
                {producto.devolucionesReembolsos ||
                  "Nuestro equipo te ayudará si tienes inconvenientes."}
              </p>
            </details>
          </div>
        </section>
      )}
      <button
        onClick={irFormulario}
        className="bg-red-600 w-[90%] mx-auto block py-5 my-6 text-white font-bold text-xl rounded-lg btn-wobble btn-hover"
      >
        COMPRAR AHORA Y PAGAR AL RECIBIR
      </button>

      {/* LANDING 2 */}

      {producto.imagenesLanding?.imagen2 && (
        <Image
          src={producto.imagenesLanding.imagen2}
          alt={producto.nombre}
          width={1200}
          height={1600}
          className="w-full h-auto"
        />
      )}

      {/* BOTON */}

      <button
        onClick={irFormulario}
        className="bg-red-600 w-[90%] mx-auto block py-5 my-6 text-white font-bold text-xl rounded-lg btn-wobble btn-hover"
      >
        COMPRAR AHORA Y PAGAR AL RECIBIR
      </button>

      {/* LANDING 3 */}

      {producto.imagenesLanding?.imagen3 && (
        <Image
          src={producto.imagenesLanding.imagen3}
          alt={producto.nombre}
          width={1200}
          height={1600}
          className="w-full h-auto"
        />
      )}

      {/* BOTON */}

      <button
        onClick={irFormulario}
        className="bg-red-600 w-[90%] mx-auto block py-5 my-6 text-white font-bold text-xl rounded-lg btn-wobble btn-hover"
      >
        COMPRAR AHORA Y PAGAR AL RECIBIR
      </button>

      {/* LANDING 4 */}

      {producto.imagenesLanding?.imagen4 && (
        <Image
          src={producto.imagenesLanding.imagen4}
          alt={producto.nombre}
          width={1200}
          height={1600}
          className="w-full h-auto"
        />
      )}
      {producto.mostrarResenas && producto.resenas?.length > 0 && (
        <section className="bg-white text-black p-6">
          <h2 className="text-3xl font-black text-center mb-6">
            Opiniones de clientes
          </h2>

          <div className="space-y-4">
            {producto.resenas.map((resena: any, index: number) => (
              <div key={index} className="border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">{resena.nombre}</h3>

                    <p className="text-sm text-gray-500">
                      {resena.ciudad} · {resena.fecha}
                    </p>
                  </div>

                  {resena.verificado && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                      Verificado
                    </span>
                  )}
                </div>

                <div className="text-yellow-500 mb-2">
                  {"⭐".repeat(Number(resena.puntuacion || 5))}
                </div>

                <p className="text-gray-700">{resena.resena}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}

      {producto.preguntasFrecuentes?.length > 0 && (
        <section className="bg-[#121212] p-6">
          <h2 className="text-white text-3xl font-bold text-center mb-6">
            Preguntas frecuentes
          </h2>

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

      <FloatingOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={producto}
        onSubmit={enviarPedido}
        enviando={enviando}
      />
    </main>
  );
}
