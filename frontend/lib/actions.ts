"use server";

import { revalidateTag } from "next/cache";

export async function revalidarProducto(id: string) {
  if (!id) return { ok: false, error: "Falta id" };
  revalidateTag(`producto-${id}`, "default");  // ✅ Segundo argumento
  return { ok: true };
}