"use client"

import { useState } from "react"

import {
  signInWithEmailAndPassword
} from "firebase/auth"

import { auth } from "@/lib/firebase"

import { useRouter } from "next/navigation"

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  async function login(
    e: React.FormEvent
  ) {

    e.preventDefault()

    setLoading(true)

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      router.push("/admin/pedidos")

    } catch (error) {

      console.error(error)

      alert("Credenciales inválidas")

    } finally {

      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={login}
        className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4"
      >

        <h1 className="text-4xl font-bold text-center mb-4">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border p-4 rounded-xl"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="border p-4 rounded-xl"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white p-4 rounded-xl font-bold"
        >
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </button>

      </form>
    </main>
  )
}