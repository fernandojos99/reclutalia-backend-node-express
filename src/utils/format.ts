/** Utilidades de formato de fecha/dinero — portadas de `App.jsx` (banner "UTILIDADES"). */

let sequentialId = 100;
/** Genera ids incrementales con prefijo (equivalente al `uid` del front). */
export const uid = (prefix: string): string => prefix + ++sequentialId;

export const hoy = (): string =>
  new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

export const hora = (): string =>
  new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

export const money = (n: number): string => "$" + Number(n).toLocaleString("es-MX");

const MESES_ABR: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

/** Convierte "01 jul 2026" en un número ordenable. */
export function fechaVal(s: string): number {
  const m = String(s ?? "").toLowerCase().match(/(\d{1,2})\s+([a-zñ]{3})\.?\s+(\d{4})/);
  if (!m) return 0;
  return Number(m[3]) * 10_000 + (MESES_ABR[m[2]] ?? 0) * 100 + Number(m[1]);
}

/** Próximas fechas de ingreso en inicio de quincena (día 1 o 16). */
export function fechasQuincena(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 5 && out.length < 4; i++) {
    const base = new Date(d.getFullYear(), d.getMonth() + i, 1);
    [1, 16].forEach((day) => {
      const f = new Date(base.getFullYear(), base.getMonth(), day);
      if (f > d && out.length < 4) {
        out.push(f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      }
    });
  }
  return out;
}

/** Próximos n días (para agendar el examen médico dentro de la próxima semana). */
export function proximosDias(n = 7): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 1; i <= n; i++) {
    const f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    out.push(f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }));
  }
  return out;
}
