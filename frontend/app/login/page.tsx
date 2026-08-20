"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function login(e: React.FormEvent) {
  e.preventDefault()
  setError("")
  setLoading(true)

  try {
    const credencial = await signInWithEmailAndPassword(auth, email, password)
    const tokenResult = await credencial.user.getIdTokenResult()

    if (!tokenResult.claims.admin) {
      await auth.signOut()
      setError("❌ Esta cuenta no tiene permisos de administrador")
      setLoading(false)
      return
    }

    router.push("/admin/pedidos")
  } catch (error: any) {
    console.error(error)
    if (error.code === 'auth/invalid-credential') {
      setError("❌ Correo o contraseña incorrectos")
    } else if (error.code === 'auth/too-many-requests') {
      setError("⚠️ Demasiados intentos. Espera unos minutos")
    } else {
      setError("❌ Error al iniciar sesión")
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md mx-4">
        
        {/* Card simple sin efectos pesados */}
        <div className="bg-gray-800 rounded-xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛍️</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Lunio Store
            </h1>
            <p className="text-gray-400 text-sm">
              Panel de administración
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📧 Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="correo@correo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔒 Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">
              Sistema seguro 🔐
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}