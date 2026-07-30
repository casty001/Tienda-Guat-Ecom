"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GraciasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productoId = searchParams.get("producto");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productoId) {
        router.push(`/producto/${productoId}`);
      } else {
        router.push("/");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, productoId]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-[#121212]">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-4 text-black">¡Pedido enviado!</h1>
        <p className="text-gray-600">Nuestro equipo te contactará pronto.</p>
      </div>
    </main>
  );
}

export default function GraciasPage() {
  return (
    <Suspense fallback={null}>
      <GraciasContent />
    </Suspense>
  );
}