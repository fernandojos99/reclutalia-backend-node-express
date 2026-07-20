/**
 * Entidades de dominio de Reclutalia (portadas del modelo del `db` en `App.jsx`).
 * Los campos opcionales reflejan que se agregan durante el flujo (Batches 1–6).
 */

export type RolNotificacion = "formador" | "admin" | "candidato";

export interface DestinatarioNotificacion {
  tipo: RolNotificacion;
  id: string | number;
}

export interface Notificacion {
  id: string;
  para: DestinatarioNotificacion;
  titulo: string;
  msg: string;
  vacId: string;
  fecha: string;
  leida: boolean;
}

export interface ExperienciaItem {
  puesto: string;
  empresa: string;
  inicio: string;
  fin: string;
}

export interface EducacionItem {
  institucion: string;
  titulo: string;
  inicio: string;
  fin: string;
}

export interface DocsPerfil {
  ine: string | null;
  curp: string | null;
  rfc: string | null;
  domicilio: string | null;
  estudios: string | null;
  certificaciones: string[];
  cv: string | null;
}

export interface Psicometrico {
  fecha: string;
  ts: number;
}

export interface Candidato {
  id: number;
  nombre: string;
  tipo: "interno" | "externo";
  area: string;
  puesto: string;
  nivel: string;
  exp: number;
  edu: string;
  ciudad: string;
  modalidad: string;
  salario: number;
  /** Campos que lee el motor de match. Nunca deben quedar undefined. */
  esp: string[];
  hard: string[];
  soft: string[];
  resumen: string;
  email: string;
  tel: string;
  /** Perfil editable (Batch 2). */
  experiencia: ExperienciaItem[];
  educacion: EducacionItem[];
  intereses: string[];
  foto: string | null;
  favoritos: string[];
  /** Examen psicométrico a nivel candidato (Batch 4). */
  psicometrico: Psicometrico | null;
  docsPerfil: DocsPerfil;
}

/** Descriptivo de la vacante (lo que hoy produce `mkReq`). */
export interface Requisito {
  titulo: string;
  area: string;
  descripcion: string;
  nivelPuesto: string;
  anosExp: number;
  educacion: string;
  espRequeridas: string[];
  espOpcionales: string[];
  hardSkills: string[];
  softSkills: string[];
  aptitudes: string[];
  killer: { q: string }[];
  ubicacionTrabajo: string;
  modalidad: string;
  ubicacionCandidato: string;
  radioKm: number;
  salarioMin: number;
  salarioMax: number;
  horario: string;
  dias: string[];
  numVacantes: number;
  examenMedico: boolean;
  tipoSede: string;
  sede: string;
  unidadNegocio: string;
  tipoVacante: string;
  puedeSerSuperior: boolean;
  ubicacionNoRelevante: boolean;
  expNoRelevante: boolean;
  edadMin: number;
  edadMax: number;
  edadNoRelevante: boolean;
}

export interface Entrevista {
  resumen: string;
  feedback: string;
  externa: boolean;
  calificacion: number;
  fecha: string;
}

export interface Oferta {
  monto: number;
  fecha: string;
  ubicacion: string;
}

export interface Medico {
  estado?: string;
  ciudad?: string;
  municipio?: string;
  sucursal?: string;
  fecha?: string;
  validado: boolean;
}

/** Estado de un candidato dentro del pipeline de una vacante (`v.pipeline[cid]`). */
export interface PipelineEntry {
  estado: string;
  match: number;
  mensaje?: string;
  docsFiltro: { constancias?: string[] };
  docsContrato: Record<string, string>;
  historial: string[];
  autorizaFiltros?: boolean;
  matchIA?: number;
  matchFinal?: number;
  slots?: string[];
  slotElegido?: string;
  modalidadEnt?: string;
  teams?: string;
  entrevista?: Entrevista;
  oferta?: Oferta;
  medico?: Medico;
  cuentaBanco?: string;
  numEmpleado?: string;
  motivoRechazo?: string;
}

export interface PoolItem {
  cid: number;
  match: number;
}

/** cambios: string legado o mapa {campo: anotación} (Batch 6). */
export type Cambios = string | Record<string, string> | null;

export interface Vacante {
  id: string;
  estado: string;
  formadorId: string;
  creada: string;
  req: Requisito;
  pipeline: Record<string, PipelineEntry>;
  historial: string[];
  cambios: Cambios;
  archivados: number[];
  pool?: PoolItem[];
}

export interface CategoriaFormador {
  nombre: string;
  cids: number[];
}

export interface Formador {
  id: string;
  nombre: string;
  puesto: string;
  area: string;
  favoritosCands: number[];
  categorias: CategoriaFormador[];
}
