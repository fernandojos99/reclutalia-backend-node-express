/**
 * Helpers deterministas (mismos datos → mismo resultado) — portados de `App.jsx`.
 * No usar aleatoriedad real: preserva la reproducibilidad de la demo.
 */
import type { Formador, Psicometrico, Vacante } from "../types/domain";
import { DIRECCION_CORP } from "../constants/catalogs";

export const numEmpleado = (cid: number): string =>
  String(1_000_000 + (cid * 73_573) % 9_000_000).slice(0, 7);

const sinAcentos = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const correoFormador = (f: Formador): string => {
  const p = sinAcentos(f.nombre).toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter(Boolean);
  return `${p[0] ?? "formador"}.${p[1] ?? "equipo"}@elektra.com.mx`;
};

export const telFormador = (f: Formador): string => {
  const n = Number(String(f.id).replace(/\D/g, "")) || 1;
  const d = String(41_000_000 + (n * 137_137) % 9_000_000).slice(0, 8);
  return `+52 55 ${d.slice(0, 4)} ${d.slice(4)}`;
};

export const mapsUrl = (dir?: string): string =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(dir || DIRECCION_CORP);

/** Vigencia del examen psicométrico: válido 6 meses desde su realización. */
const SEIS_MESES_MS = 1000 * 60 * 60 * 24 * 182;

export const psicoVigente = (p: Psicometrico | null | undefined): boolean =>
  !!(p && p.ts && Date.now() - p.ts < SEIS_MESES_MS);

export function psicoVigenteHasta(p: Psicometrico | null | undefined): string {
  if (!p || !p.ts) return "";
  return new Date(p.ts + SEIS_MESES_MS).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** ¿El horario `slot` ya fue confirmado por otro candidato de esta vacante? (exclusividad de horarios). */
export const slotTomado = (v: Vacante, slot: string, cid: number): boolean =>
  Object.entries(v.pipeline).some(
    ([ocid, op]) =>
      Number(ocid) !== Number(cid) &&
      op.slotElegido === slot &&
      !["descartado", "filtrado"].includes(op.estado),
  );
