/**
 * Catálogos de dominio — portados 1:1 desde `reclutalia/src/App.jsx` (banner "CATÁLOGOS").
 * NO cambiar valores: el motor de match y la semilla dependen de ellos.
 */

export const AREAS = [
  "Tecnología", "Datos y Analítica", "Ventas", "Marketing", "Finanzas",
  "Recursos Humanos", "Operaciones", "Atención a Clientes", "Legal", "Producto",
] as const;

export const NIVELES = [
  "Practicante", "Junior", "Semi-Senior", "Senior", "Gerente", "Directivo",
] as const;

export const EDUCACION = [
  "Bachillerato", "Técnico Superior", "Licenciatura trunca",
  "Licenciatura titulado", "Maestría", "Doctorado",
] as const;

export const CIUDADES = [
  "CDMX", "Monterrey", "Guadalajara", "Puebla", "Querétaro",
  "Tijuana", "Mérida", "Toluca", "León",
] as const;

export const MODALIDADES = ["Presencial", "Híbrido", "Remoto"] as const;

export const TIPOS_SEDE = ["Corporativo", "Sucursal"] as const;

export const SEDES: Record<string, string[]> = {
  Corporativo: [
    "Corporativo Insurgentes Sur (CDMX)", "Corporativo Reforma 222 (CDMX)",
    "Corporativo Santa Fe (CDMX)", "Corporativo Valle Oriente (MTY)",
    "Corporativo Providencia (GDL)",
  ],
  Sucursal: [
    "Sucursal Centro Histórico (CDMX)", "Sucursal Coapa (CDMX)",
    "Sucursal Cumbres (MTY)", "Sucursal Chapultepec (GDL)",
    "Sucursal Angelópolis (PUE)",
  ],
};

export const TIPOS_VACANTE = ["Estándar", "Preventiva", "Proactiva", "Confidencial"] as const;

/** Campos del descriptivo anotables en la solicitud de cambios por campo (clave → etiqueta visible). */
export const CAMPOS_DESC: Record<string, string> = {
  titulo: "Título del puesto", descripcion: "Descripción", area: "Área",
  nivelPuesto: "Nivel del puesto", numVacantes: "Número de posiciones",
  ubicacionTrabajo: "Ubicación del trabajo", sede: "Sede", unidadNegocio: "Unidad de Negocio",
  tipoVacante: "Tipo de vacante", anosExp: "Años de experiencia", educacion: "Nivel de estudios",
  radio: "Radio de búsqueda", espRequeridas: "Especialidades requeridas",
  espOpcionales: "Especialidades opcionales", hardSkills: "Habilidades técnicas",
  softSkills: "Habilidades blandas", aptitudes: "Aptitudes", edad: "Rango de edad",
  killer: "Preguntas filtro", modalidad: "Modalidad", dias: "Días de trabajo",
  horario: "Horario", salario: "Rango salarial", examenMedico: "Examen médico",
};

export const ESPECIALIDADES = [
  "Ventas B2C", "Ventas B2B", "Desarrollo Frontend", "Desarrollo Backend", "Ciencia de Datos",
  "Business Intelligence", "Marketing Digital", "CRM y Fidelización", "Contabilidad",
  "Planeación Financiera", "Atracción de Talento", "Capacitación", "Logística",
  "Cadena de Suministro", "Servicio al Cliente", "Cobranza", "Derecho Corporativo",
  "Cumplimiento (Compliance)", "Gestión de Producto", "UX/UI", "Ciberseguridad",
  "Infraestructura TI",
] as const;

export const HARD_SKILLS = [
  "Excel avanzado", "SQL", "Python", "Power BI", "Tableau", "React", "Node.js", "SAP",
  "Salesforce", "CRM", "Google Ads", "Meta Ads", "SEO", "Contabilidad NIF",
  "Modelado financiero", "Nómina", "LMS", "Zendesk", "AutoCAD", "Scrum", "Figma",
  "Redes Cisco", "Inglés avanzado", "Negociación comercial", "Prospección en frío",
] as const;

export const SOFT_SKILLS = [
  "Comunicación efectiva", "Liderazgo", "Trabajo en equipo", "Orientación a resultados",
  "Adaptabilidad", "Pensamiento analítico", "Empatía", "Negociación", "Atención al detalle",
  "Gestión del tiempo", "Resolución de conflictos", "Proactividad",
] as const;

export const APTITUDES = [
  "Razonamiento numérico", "Razonamiento verbal", "Razonamiento lógico", "Atención al detalle",
  "Orientación al servicio", "Liderazgo de equipos", "Tolerancia a la presión", "Creatividad",
] as const;

export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Proceso de la vacante en 3 fases con sub-pasos. */
export const FASES = [
  { nombre: "Búsqueda", subs: ["Descriptivo", "Pool de talento"] },
  { nombre: "Selección", subs: ["Ranking y terna", "Entrevistas", "Selección y documentos"] },
  { nombre: "Contratación", subs: ["Carta oferta", "Contratación"] },
] as const;

/** Etiquetas del pipeline del candidato dentro de una vacante. */
export const PIPE = [
  "Invitado", "Postulado", "Filtros OK", "Video-IA", "Ranqueado", "Entrevista agendada",
  "Entrevistado", "Seleccionado", "Documentación", "Oferta", "Contratado",
] as const;

/** Estado del pipeline → índice de avance (terminales = -1). */
export const PIPE_IDX: Record<string, number> = {
  invitado: 0, postulado: 1, filtros_ok: 2, video_ia: 3, evaluado: 4, slots_enviados: 5,
  agendado: 5, entrevistado: 6, seleccionado: 7, docs_completos: 8, oferta_enviada: 9,
  oferta_aceptada: 9, contratado: 10, descartado: -1, filtrado: -1, rechazado: -1,
};

/** Sucursales médicas simuladas (examen médico condicional). */
export const SUCURSALES_MEDICAS = [
  { nombre: "Clínica Salud Integral · Centro", dir: "Av. Juárez 120, Col. Centro" },
  { nombre: "Laboratorios BienestarMx · Sur", dir: "Calz. de Tlalpan 2100, Col. Country Club" },
  { nombre: "Centro Médico Empresarial · Norte", dir: "Av. Instituto Politécnico Nacional 1550, Col. Lindavista" },
  { nombre: "Unidad de Diagnóstico · Poniente", dir: "Av. Observatorio 340, Col. Daniel Garza" },
  { nombre: "Clínica Ejecutiva · Reforma", dir: "Paseo de la Reforma 450, Col. Juárez" },
] as const;

export const DIRECCION_CORP =
  "Av. Insurgentes Sur 3579, Tlalpan, 14000 Ciudad de México, CDMX";

/** Distancias simuladas entre ciudades (km) para el radio de búsqueda del match. */
export const KM: Record<string, Record<string, number>> = {
  CDMX: { CDMX: 0, Toluca: 65, Puebla: 130, Querétaro: 210, Guadalajara: 540, Monterrey: 900, León: 390, Mérida: 1300, Tijuana: 2800 },
  Monterrey: { Monterrey: 0, CDMX: 900, Querétaro: 700, Guadalajara: 770, León: 590, Toluca: 940, Puebla: 990, Mérida: 1900, Tijuana: 2300 },
  Guadalajara: { Guadalajara: 0, León: 220, CDMX: 540, Querétaro: 350, Toluca: 480, Monterrey: 770, Puebla: 660, Mérida: 1800, Tijuana: 2200 },
};
