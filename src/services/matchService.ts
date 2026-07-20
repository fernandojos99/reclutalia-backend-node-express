/**
 * Motor de match (simula al agente de IA de ranking). DETERMINÍSTICO: misma entrada → mismo score.
 * Portado carácter por carácter desde `App.jsx` (`matchScore` / `buildPool`). No introducir azar real.
 */
import type { Candidato, Requisito, PoolItem } from "../types/domain";
import { NIVELES, KM } from "../constants/catalogs";

const distKm = (a: string, b: string): number =>
  KM[a] && KM[a][b] != null ? KM[a][b] : a === b ? 0 : 600;

export function matchScore(c: Candidato, req: Requisito): number {
  let s = 0;
  const inter = (a: string[], b: string[]): number => a.filter((x) => b.includes(x)).length;

  const er = req.espRequeridas.length ? inter(c.esp, req.espRequeridas) / req.espRequeridas.length : 0.5;
  s += er * 34;
  if (req.espOpcionales.length) s += (inter(c.esp, req.espOpcionales) / req.espOpcionales.length) * 6;
  if (req.hardSkills.length) s += (inter(c.hard, req.hardSkills) / req.hardSkills.length) * 24;
  if (req.softSkills.length) s += (inter(c.soft, req.softSkills) / req.softSkills.length) * 8;

  const ni = NIVELES.indexOf(c.nivel as (typeof NIVELES)[number]);
  const nr = NIVELES.indexOf(req.nivelPuesto as (typeof NIVELES)[number]);
  s += ni === nr ? 12 : Math.abs(ni - nr) === 1 ? 7 : 1;

  s += c.exp >= req.anosExp ? 8 : (c.exp / Math.max(req.anosExp, 1)) * 5;

  const d = distKm(req.ubicacionCandidato, c.ciudad);
  s += req.ubicacionNoRelevante
    ? 7
    : req.modalidad === "Remoto" || c.modalidad === "Remoto"
      ? 7
      : d <= req.radioKm
        ? 7
        : d <= req.radioKm * 4
          ? 3
          : 0;

  if (c.modalidad === req.modalidad || req.modalidad === "Remoto") s += 3;
  s += ((c.id * 37) % 7) - 3; // variación determinística leve

  return Math.max(0, Math.min(98, Math.round(s)));
}

/** Candidatos compatibles (>= 28) ordenados por match desc. */
export function buildPool(cands: Candidato[], req: Requisito): PoolItem[] {
  return cands
    .map((c) => ({ cid: c.id, match: matchScore(c, req) }))
    .filter((x) => x.match >= 28)
    .sort((a, b) => b.match - a.match);
}
