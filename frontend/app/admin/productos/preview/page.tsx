"use client";

import { useEffect, useState } from "react";
import ProductoClient from "@/app/producto/[id]/ProductoClient";

export default function PreviewPage() {
  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "PREVIEW_UPDATE") {
        setProducto(e.data.producto);
      }
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "PREVIEW_READY" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!producto) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        Cargando vista previa...
      </div>
    );
  }

  return <ProductoClient producto={producto} previewMode editorMode />;
}