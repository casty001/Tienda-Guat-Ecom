
export function generarMensajeGuia(
  transportadora: string,
  numeroGuia: string
): string {
  const empresa = transportadora.trim().toUpperCase();
  const guia = numeroGuia.trim();

  if (!empresa || !guia) {
    throw new Error(
      "La transportadora y el número de guía son obligatorios"
    );
  }

  return `¡Hola! 😊

Tu pedido ya fue despachado correctamente 🚚✨

📦 *Número de guía:* ${guia}
🚛 *Transportadora:* ${empresa}

Puedes hacer seguimiento directamente en la página de la transportadora 🔍

⏳ Tu pedido puede tardar entre 1 y 7 días hábiles dependiendo de la ciudad.

¡Gracias por tu compra y confianza! 💙`;
}
