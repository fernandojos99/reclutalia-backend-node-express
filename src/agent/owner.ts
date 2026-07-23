/**
 * Dueño de una sesión de chat. No hay auth real (demo), así que el "usuario autenticado" es la
 * identidad que envía el front: rol + formadorId/candId. Aquí se normaliza a (tipo, id).
 */
export interface Owner {
  tipo: "formador" | "candidato" | "admin";
  id: string;
}

export function ownerDe(rol: string, formadorId?: string, candId?: number): Owner {
  if (rol === "formador") return { tipo: "formador", id: formadorId ?? "" };
  if (rol === "candidato") return { tipo: "candidato", id: String(candId ?? "") };
  return { tipo: "admin", id: "A1" };
}
