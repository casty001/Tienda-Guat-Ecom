"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login")
        return
      }

      setLoading(false)
    })

    return () => unsub()
  }, [router])

  if (loading) {
    return (
      <main className="p-10">
        Verificando acceso...
      </main>
    )
  }

  return <>{children}</>
}