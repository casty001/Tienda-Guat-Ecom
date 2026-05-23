"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [landing1, setLanding1] = useState("");
  const [landing2, setLanding2] = useState("");
  const [landing3, setLanding3] = useState("");
  const [landing4, setLanding4] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error) {
      console.error(error);
      alert("Error cargando productos");
    }
  }

  async function subirImagen(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagenSubiendo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/imagen", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setter(res.data.url);
    } catch (error) {
      console.error(error);
      alert("Error subiendo imagen");
    } finally {
      setImagenSubiendo(false);
    }
  }

  function cargarParaEditar(producto: any) {
    setEditando(producto);
    setImagenPrincipal(producto.imagen || "");
    setLanding1(producto.imagenesLanding?.imagen1 || "");
    setLanding2(producto.imagenesLanding?.imagen2 || "");
    setLanding3(producto.imagenesLanding?.imagen3 || "");
    setLanding4(producto.imagenesLanding?.imagen4 || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function limpiarFormulario(form?: HTMLFormElement) {
    setEditando(null);
    setImagenPrincipal("");
    setLanding1("");
    setLanding2("");
    setLanding3("");
    setLanding4("");

    if (form) {
      form.reset();
    }
  }

  async function guardarProducto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const nombre = String(form.get("nombre") || "").trim();

    if (!nombre) {
      alert("Falta el nombre del producto");
      setLoading(false);
      return;
    }

    if (!imagenPrincipal) {
      alert("Falta la imagen principal");
      setLoading(false);
      return;
    }

    const data = {
  nombre,

  precio:
    Number(form.get("precio") || 0),

  precioAntes:
    Number(form.get("precioAntes") || 0),

  imagen: imagenPrincipal,

  imagenesLanding: {
    imagen1: landing1,
    imagen2: landing2,
    imagen3: landing3,
    imagen4: landing4,
  },

  mostrarContador:
    form.get("mostrarContador") === "on",

  minutosContador:
    Number(
      form.get("minutosContador") || 28
    ),

  mostrarEstrellas:
    form.get("mostrarEstrellas") === "on",

  textoEstrellas:
    String(
      form.get("textoEstrellas") || ""
    ),

  textoBoton:
    String(
      form.get("textoBoton") ||
      "COMPRAR AHORA Y PAGAR AL RECIBIR"
    ),

  mostrarInfoCompra:
    form.get("mostrarInfoCompra") === "on",

  textoDescuento:
    String(
      form.get("textoDescuento") ||
      "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
    ),

  queIncluye:
    String(
      form.get("queIncluye") || ""
    ),

  informacionEnvio:
    String(
      form.get("informacionEnvio") || ""
    ),

  devolucionesReembolsos:
    String(
      form.get("devolucionesReembolsos") || ""
    ),

  activo: true,
};

    try {
      if (editando) {
        await api.patch(`/productos/${editando.id}`, data);
        alert("Producto actualizado");
      } else {
        await api.post("/productos", data);
        alert("Producto creado");
      }

      limpiarFormulario(e.currentTarget);
      await cargarProductos();
    } catch (error) {
      console.error(error);
      alert("Error guardando producto");
    } finally {
      setLoading(false);
    }
  }

  async function eliminarProducto(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
      await api.delete(`/productos/${id}`);
      await cargarProductos();
    } catch (error) {
      console.error(error);
      alert("Error eliminando producto");
    }
  }

  return (
  <AdminGuard>
    <main className="max-w-5xl mx-auto p-10">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold">
          Productos
        </h1>

        <Link
          href="/admin/pedidos"
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Pedidos
        </Link>

      </div>

      <form
        onSubmit={guardarProducto}
        className="flex flex-col gap-4 mb-10"
      >

        <input
          name="nombre"
          placeholder="Nombre del producto"
          defaultValue={editando?.nombre || ""}
          className="border p-3 rounded-xl"
          required
        />

        <input
          name="precio"
          type="number"
          placeholder="Precio"
          defaultValue={editando?.precio || ""}
          className="border p-3 rounded-xl"
          required
        />

        <input
          name="precioAntes"
          type="number"
          placeholder="Precio antes"
          defaultValue={editando?.precioAntes || ""}
          className="border p-3 rounded-xl"
        />

        {/* CONFIG LANDING */}

        <div className="border rounded-xl p-5 flex flex-col gap-4">

          <h2 className="text-2xl font-bold">
            Configuración Landing
          </h2>
<div className="border rounded-xl p-5 flex flex-col gap-4">

  <h2 className="text-2xl font-bold">
    Contenedor precio / envío / reembolsos
  </h2>

  <label className="flex gap-2 items-center">

    <input
      type="checkbox"
      name="mostrarInfoCompra"
      defaultChecked={
        editando?.mostrarInfoCompra ?? true
      }
    />

    Mostrar contenedor compra

  </label>

  <input
    name="textoDescuento"
    placeholder="POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
    defaultValue={
      editando?.textoDescuento ||
      "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
    }
    className="border p-3 rounded-xl"
  />

  <textarea
    name="queIncluye"
    placeholder="¿Qué incluye?"
    defaultValue={
      editando?.queIncluye || ""
    }
    className="border p-3 rounded-xl min-h-24"
  />

  <textarea
    name="informacionEnvio"
    placeholder="Información de envío"
    defaultValue={
      editando?.informacionEnvio || ""
    }
    className="border p-3 rounded-xl min-h-24"
  />

  <textarea
    name="devolucionesReembolsos"
    placeholder="Devoluciones y reembolsos"
    defaultValue={
      editando?.devolucionesReembolsos || ""
    }
    className="border p-3 rounded-xl min-h-24"
  />

</div>
          <label className="flex gap-2 items-center">

            <input
              type="checkbox"
              name="mostrarContador"
              defaultChecked={
                editando?.mostrarContador ?? true
              }
            />

            Mostrar contador
          </label>

          <input
            name="minutosContador"
            type="number"
            placeholder="Minutos contador"
            defaultValue={
              editando?.minutosContador || 28
            }
            className="border p-3 rounded-xl"
          />

          <label className="flex gap-2 items-center">

            <input
              type="checkbox"
              name="mostrarEstrellas"
              defaultChecked={
                editando?.mostrarEstrellas ?? true
              }
            />

            Mostrar barra estrellas
          </label>

          <input
            name="textoEstrellas"
            placeholder="+100.000 Colombianos arreglaron sus uñas"
            defaultValue={
              editando?.textoEstrellas || ""
            }
            className="border p-3 rounded-xl"
          />

          <input
            name="textoBoton"
            placeholder="Texto botón"
            defaultValue={
              editando?.textoBoton ||
              "COMPRAR AHORA Y PAGAR AL RECIBIR"
            }
            className="border p-3 rounded-xl"
          />

        </div>

        {/* IMAGEN PRINCIPAL */}

        <div className="border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            Imagen principal
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              subirImagen(
                e,
                setImagenPrincipal
              )
            }
          />

          {imagenPrincipal && (
            <img
              src={imagenPrincipal}
              alt="Imagen principal"
              className="w-32 h-32 object-cover rounded-xl mt-3"
            />
          )}

        </div>

        {/* LANDING 1 */}

        <div className="border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            Imagen landing 1
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              subirImagen(e, setLanding1)
            }
          />

          {landing1 && (
            <img
              src={landing1}
              alt="Landing 1"
              className="w-32 h-32 object-cover rounded-xl mt-3"
            />
          )}

        </div>

        {/* LANDING 2 */}

        <div className="border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            Imagen landing 2
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              subirImagen(e, setLanding2)
            }
          />

          {landing2 && (
            <img
              src={landing2}
              alt="Landing 2"
              className="w-32 h-32 object-cover rounded-xl mt-3"
            />
          )}

        </div>

        {/* LANDING 3 */}

        <div className="border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            Imagen landing 3
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              subirImagen(e, setLanding3)
            }
          />

          {landing3 && (
            <img
              src={landing3}
              alt="Landing 3"
              className="w-32 h-32 object-cover rounded-xl mt-3"
            />
          )}

        </div>

        {/* LANDING 4 */}

        <div className="border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            Imagen landing 4
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              subirImagen(e, setLanding4)
            }
          />

          {landing4 && (
            <img
              src={landing4}
              alt="Landing 4"
              className="w-32 h-32 object-cover rounded-xl mt-3"
            />
          )}

        </div>

        {imagenSubiendo && (
          <p className="font-semibold text-blue-600">
            Subiendo imagen...
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading || imagenSubiendo
          }
          className="bg-black text-white p-4 rounded-xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Guardando..."
            : editando
            ? "Actualizar producto"
            : "Crear producto"}
        </button>

        {editando && (
          <button
            type="button"
            onClick={() =>
              limpiarFormulario()
            }
            className="border p-4 rounded-xl font-bold"
          >
            Cancelar edición
          </button>
        )}

      </form>

      <div className="grid grid-cols-1 gap-4">

        {productos.map((producto) => (

          <div
            key={producto.id}
            className="border rounded-xl p-4 flex gap-4 items-center justify-between"
          >

            <div className="flex gap-4 items-center">

              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-24 h-24 object-cover rounded-xl"
              />

              <div>

                <h2 className="text-xl font-bold">
                  {producto.nombre}
                </h2>

                <p>
                  Precio: $
                  {producto.precio}
                </p>

                <p>
                  Antes: $
                  {producto.precioAntes || 0}
                </p>

              </div>
            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  cargarParaEditar(
                    producto
                  )
                }
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              >
                Editar
              </button>

              <button
                onClick={() =>
                  eliminarProducto(
                    producto.id
                  )
                }
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Eliminar
              </button>

            </div>
          </div>
        ))}

      </div>
    </main>
  </AdminGuard>
);
}
