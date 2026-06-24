"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GraciasPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.back();
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

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
