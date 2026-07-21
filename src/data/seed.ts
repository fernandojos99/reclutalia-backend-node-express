/**
 * Datos semilla — portados de `App.jsx` (banner "DATOS SEMILLA").
 * 32 candidatos, 3 vacantes, 2 formadores, 1 admin. Reproduce la demo actual.
 */
import type { Candidato, Formador, Requisito, Vacante, Notificacion } from "../types/domain";
import { AREAS } from "../constants/catalogs";

/** Factory de candidato (equivale a `Cd(...)` del front). */
function crearCandidato(
  id: number, nombre: string, tipo: "interno" | "externo", area: string, puesto: string,
  nivel: string, exp: number, edu: string, ciudad: string, modalidad: string, salario: number,
  esp: string[], hard: string[], soft: string[], resumen: string,
): Candidato {
  return {
    id, nombre, tipo, area, puesto, nivel, exp, edu, ciudad, modalidad, salario, esp, hard, soft, resumen,
    email: nombre.toLowerCase().replace(/[^a-z ]/g, "").split(" ").slice(0, 2).join(".") + "@mail.com",
    tel: "55" + String(30_000_000 + id * 137_137).slice(0, 8),
    experiencia: [], educacion: [], intereses: [], foto: null, favoritos: [],
    psicometrico: null,
    docsPerfil: { ine: null, curp: null, rfc: null, domicilio: null, estudios: null, certificaciones: [], cv: null },
  };
}

/** Factory del descriptivo (equivale a `mkReq(o)` del front). */
export function crearRequisito(overrides: Partial<Requisito>): Requisito {
  return {
    titulo: "", area: AREAS[0], descripcion: "", nivelPuesto: "Junior", anosExp: 1,
    educacion: "Licenciatura titulado", espRequeridas: [], espOpcionales: [], hardSkills: [],
    softSkills: [], aptitudes: [], killer: [], ubicacionTrabajo: "CDMX", modalidad: "Presencial",
    ubicacionCandidato: "CDMX", radioKm: 25, salarioMin: 10_000, salarioMax: 20_000,
    horario: "9:00 – 18:00", dias: ["Lun", "Mar", "Mié", "Jue", "Vie"], numVacantes: 1,
    examenMedico: false, tipoSede: "Corporativo", sede: "", unidadNegocio: "", tipoVacante: "Estándar",
    puedeSerSuperior: false, ubicacionNoRelevante: false, expNoRelevante: false,
    edadMin: 18, edadMax: 65, edadNoRelevante: false, ...overrides,
  };
}

const C = crearCandidato;

export const SEED_CANDIDATOS: Candidato[] = [
  C(1, "Valeria Ortiz Camacho", "externo", "Ventas", "Ejecutiva de ventas retail", "Semi-Senior", 5, "Licenciatura titulado", "CDMX", "Presencial", 16000, ["Ventas B2C", "Servicio al Cliente"], ["CRM", "Negociación comercial", "Prospección en frío", "Excel avanzado"], ["Comunicación efectiva", "Orientación a resultados", "Empatía"], "5 años en piso de venta y telemarketing; top performer 2024 en cadena retail."),
  C(2, "Jorge Luis Peña Ríos", "interno", "Ventas", "Asesor comercial", "Junior", 2, "Licenciatura trunca", "CDMX", "Híbrido", 13000, ["Ventas B2C"], ["CRM", "Prospección en frío"], ["Proactividad", "Trabajo en equipo"], "Asesor interno con 2 años en sucursal; busca crecer a ventas digitales."),
  C(3, "Mariana Gutiérrez Solís", "externo", "Ventas", "Key Account Manager", "Senior", 8, "Licenciatura titulado", "Monterrey", "Híbrido", 32000, ["Ventas B2B", "CRM y Fidelización"], ["Salesforce", "Negociación comercial", "Inglés avanzado", "Excel avanzado"], ["Negociación", "Liderazgo", "Comunicación efectiva"], "Manejo de cuentas clave corporativas en el norte del país; cartera de $40M anuales."),
  C(4, "Ricardo Anaya Torres", "externo", "Ventas", "Vendedor de campo", "Junior", 3, "Bachillerato", "Puebla", "Presencial", 11000, ["Ventas B2C"], ["Prospección en frío"], ["Adaptabilidad", "Orientación a resultados"], "Ventas puerta a puerta de servicios financieros; excede cuota trimestral consistentemente."),
  C(5, "Ana Sofía Lira Medina", "externo", "Datos y Analítica", "Analista de datos Sr", "Senior", 6, "Maestría", "CDMX", "Híbrido", 42000, ["Ciencia de Datos", "Business Intelligence"], ["Python", "SQL", "Power BI", "Excel avanzado"], ["Pensamiento analítico", "Atención al detalle", "Comunicación efectiva"], "Modelos de propensión y tableros ejecutivos para banca de consumo."),
  C(6, "Diego Ramírez Cline", "interno", "Datos y Analítica", "Analista de BI", "Semi-Senior", 4, "Licenciatura titulado", "CDMX", "Híbrido", 28000, ["Business Intelligence"], ["SQL", "Power BI", "Tableau", "Excel avanzado"], ["Pensamiento analítico", "Gestión del tiempo"], "Colaborador interno del área de riesgos; automatizó el reporteo semanal de cartera."),
  C(7, "Fernanda Cabrera Núñez", "externo", "Datos y Analítica", "Científica de datos", "Semi-Senior", 4, "Maestría", "Guadalajara", "Remoto", 38000, ["Ciencia de Datos"], ["Python", "SQL", "Tableau"], ["Pensamiento analítico", "Proactividad", "Adaptabilidad"], "NLP y modelos de churn en fintech; publicaciones en meetups de datos GDL."),
  C(8, "Héctor Salgado Ponce", "externo", "Datos y Analítica", "Ingeniero de datos", "Senior", 7, "Licenciatura titulado", "Querétaro", "Remoto", 45000, ["Ciencia de Datos", "Infraestructura TI"], ["Python", "SQL", "SAP"], ["Atención al detalle", "Trabajo en equipo"], "Pipelines de datos sobre SAP BW y nube; migración de DWH bancario."),
  C(9, "Lucía Herrera Bautista", "externo", "Tecnología", "Desarrolladora Frontend", "Semi-Senior", 4, "Licenciatura titulado", "CDMX", "Híbrido", 34000, ["Desarrollo Frontend", "UX/UI"], ["React", "Figma", "Node.js"], ["Trabajo en equipo", "Atención al detalle", "Proactividad"], "SPAs bancarias con React; obsesionada con accesibilidad y design systems."),
  C(10, "Emilio Castañeda Vela", "externo", "Tecnología", "Desarrollador Backend", "Senior", 7, "Licenciatura titulado", "Monterrey", "Remoto", 48000, ["Desarrollo Backend"], ["Node.js", "Python", "SQL", "Scrum"], ["Pensamiento analítico", "Gestión del tiempo", "Liderazgo"], "APIs de alta concurrencia para pagos; lideró célula de 5 devs."),
  C(11, "Paola Reyes Ibarra", "interno", "Tecnología", "Ingeniera de soporte", "Junior", 2, "Técnico Superior", "CDMX", "Presencial", 15000, ["Infraestructura TI"], ["Redes Cisco", "Excel avanzado"], ["Orientación al servicio", "Resolución de conflictos", "Empatía"], "Soporte N2 interno; certificación CCNA en curso."),
  C(12, "Andrés Molina Farías", "externo", "Tecnología", "Especialista en ciberseguridad", "Senior", 8, "Maestría", "CDMX", "Híbrido", 55000, ["Ciberseguridad", "Infraestructura TI"], ["Python", "Redes Cisco", "Inglés avanzado"], ["Atención al detalle", "Pensamiento analítico"], "Pentesting y respuesta a incidentes en sector financiero; CISSP."),
  C(13, "Gabriela Fuentes Roldán", "externo", "Marketing", "Especialista en marketing digital", "Semi-Senior", 5, "Licenciatura titulado", "CDMX", "Híbrido", 26000, ["Marketing Digital", "CRM y Fidelización"], ["Google Ads", "Meta Ads", "SEO", "CRM"], ["Creatividad", "Orientación a resultados", "Comunicación efectiva"], "Campañas performance con ROAS 6x en e-commerce; certificada Google."),
  C(14, "Tomás Aguilar Prieto", "externo", "Marketing", "Coordinador de contenido", "Junior", 3, "Licenciatura titulado", "Mérida", "Remoto", 18000, ["Marketing Digital"], ["SEO", "Meta Ads"], ["Creatividad", "Proactividad"], "Contenido orgánico y paid para marcas regionales del sureste."),
  C(15, "Renata Villaseñor Ochoa", "interno", "Marketing", "Analista de CRM", "Semi-Senior", 4, "Licenciatura titulado", "CDMX", "Híbrido", 24000, ["CRM y Fidelización"], ["CRM", "SQL", "Excel avanzado"], ["Pensamiento analítico", "Atención al detalle"], "Journeys de retención y segmentación de clientes en el área de lealtad del grupo."),
  C(16, "Sebastián Cordero Lima", "externo", "Finanzas", "Analista financiero", "Semi-Senior", 5, "Licenciatura titulado", "CDMX", "Presencial", 27000, ["Planeación Financiera"], ["Modelado financiero", "Excel avanzado", "SAP"], ["Pensamiento analítico", "Atención al detalle", "Gestión del tiempo"], "Presupuestos y forecast para grupo industrial; usuario avanzado de SAP FI."),
  C(17, "Isabela Franco Duarte", "externo", "Finanzas", "Contadora Sr", "Senior", 9, "Licenciatura titulado", "Toluca", "Híbrido", 35000, ["Contabilidad"], ["Contabilidad NIF", "SAP", "Excel avanzado", "Nómina"], ["Atención al detalle", "Gestión del tiempo"], "Cierres contables y auditorías en corporativo retail; NIF y fiscal."),
  C(18, "Óscar Beltrán Nava", "interno", "Finanzas", "Auxiliar contable", "Junior", 2, "Licenciatura trunca", "CDMX", "Presencial", 12500, ["Contabilidad", "Cobranza"], ["Excel avanzado", "Contabilidad NIF"], ["Proactividad", "Atención al detalle"], "Auxiliar interno en cuentas por pagar; estudia los fines de semana."),
  C(19, "Camila Estrada Peralta", "externo", "Recursos Humanos", "Reclutadora IT", "Semi-Senior", 4, "Licenciatura titulado", "Guadalajara", "Remoto", 22000, ["Atracción de Talento"], ["CRM", "Inglés avanzado"], ["Empatía", "Comunicación efectiva", "Negociación"], "Headhunting de perfiles tech; 90+ contrataciones cerradas en 2 años."),
  C(20, "Rodrigo Zamora Field", "externo", "Recursos Humanos", "Especialista en capacitación", "Senior", 7, "Maestría", "CDMX", "Híbrido", 30000, ["Capacitación"], ["LMS", "Excel avanzado"], ["Liderazgo", "Comunicación efectiva", "Empatía"], "Diseño instruccional y universidades corporativas; implementó LMS para 8,000 usuarios."),
  C(21, "Ximena Rosales Vidal", "interno", "Recursos Humanos", "Generalista de RRHH", "Semi-Senior", 5, "Licenciatura titulado", "Monterrey", "Presencial", 21000, ["Atracción de Talento", "Capacitación"], ["Nómina", "Excel avanzado", "LMS"], ["Empatía", "Resolución de conflictos", "Trabajo en equipo"], "Generalista de planta con foco en clima laboral y onboarding."),
  C(22, "Bruno Cervantes Haro", "externo", "Operaciones", "Supervisor de logística", "Semi-Senior", 6, "Licenciatura titulado", "León", "Presencial", 23000, ["Logística", "Cadena de Suministro"], ["SAP", "Excel avanzado"], ["Liderazgo", "Tolerancia a la presión", "Gestión del tiempo"], "CEDIS de 120 personas; redujo mermas 18% en un año."),
  C(23, "Daniela Paredes Luna", "externo", "Operaciones", "Analista de cadena de suministro", "Junior", 2, "Licenciatura titulado", "Querétaro", "Híbrido", 16000, ["Cadena de Suministro"], ["Excel avanzado", "SQL"], ["Pensamiento analítico", "Atención al detalle"], "Planeación de demanda en manufactura; egresada con honores del ITQ."),
  C(24, "Marcos Ibáñez Cruz", "interno", "Operaciones", "Jefe de piso", "Senior", 9, "Bachillerato", "CDMX", "Presencial", 19000, ["Logística", "Servicio al Cliente"], ["Excel avanzado"], ["Liderazgo", "Resolución de conflictos", "Tolerancia a la presión"], "12 años en tiendas del grupo; conoce la operación de punta a punta."),
  C(25, "Sofía Nieto Arellano", "externo", "Atención a Clientes", "Ejecutiva de servicio", "Junior", 2, "Técnico Superior", "CDMX", "Presencial", 11500, ["Servicio al Cliente"], ["Zendesk", "CRM"], ["Empatía", "Comunicación efectiva", "Orientación al servicio"], "Atención omnicanal en telecom; NPS personal de 92."),
  C(26, "Iván Quintero Mora", "externo", "Atención a Clientes", "Coordinador de call center", "Semi-Senior", 6, "Licenciatura titulado", "Tijuana", "Presencial", 20000, ["Servicio al Cliente", "Cobranza"], ["Zendesk", "CRM", "Excel avanzado"], ["Liderazgo", "Tolerancia a la presión", "Resolución de conflictos"], "Coordinó célula de 35 agentes bilingües; mejoró AHT 22%."),
  C(27, "Regina Salas Montaño", "interno", "Atención a Clientes", "Agente senior", "Semi-Senior", 4, "Bachillerato", "CDMX", "Presencial", 13500, ["Servicio al Cliente", "Cobranza"], ["Zendesk", "CRM"], ["Empatía", "Orientación al servicio", "Adaptabilidad"], "Agente interna con mejores métricas de retención de clientes 2025."),
  C(28, "Federico Lozano Gil", "externo", "Legal", "Abogado corporativo", "Senior", 8, "Maestría", "CDMX", "Híbrido", 46000, ["Derecho Corporativo", "Cumplimiento (Compliance)"], ["Inglés avanzado"], ["Atención al detalle", "Negociación", "Pensamiento analítico"], "Contratos mercantiles, gobierno corporativo y PLD en sector financiero."),
  C(29, "Carolina Vega Serrano", "externo", "Legal", "Analista de cumplimiento", "Junior", 3, "Licenciatura titulado", "CDMX", "Presencial", 17000, ["Cumplimiento (Compliance)"], ["Excel avanzado"], ["Atención al detalle", "Proactividad"], "Monitoreo PLD y listas restrictivas en SOFOM; certificación CNBV en curso."),
  C(30, "Mateo Arriaga Solano", "externo", "Producto", "Product Manager", "Senior", 7, "Maestría", "CDMX", "Híbrido", 52000, ["Gestión de Producto", "UX/UI"], ["Scrum", "Figma", "SQL", "Inglés avanzado"], ["Liderazgo", "Comunicación efectiva", "Pensamiento analítico"], "PM de apps financieras con 2M MAU; discovery continuo y OKRs."),
  C(31, "Julieta Márquez Ferrer", "externo", "Producto", "UX Designer", "Semi-Senior", 5, "Licenciatura titulado", "Guadalajara", "Remoto", 30000, ["UX/UI"], ["Figma", "Scrum"], ["Creatividad", "Empatía", "Atención al detalle"], "Research y diseño de flujos transaccionales; sistema de diseño multi-marca."),
  C(32, "Pablo Serna Cantú", "interno", "Ventas", "Promotor financiero", "Junior", 1, "Bachillerato", "Monterrey", "Presencial", 10500, ["Ventas B2C", "Cobranza"], ["Prospección en frío"], ["Proactividad", "Adaptabilidad", "Orientación a resultados"], "Promotor interno de crédito; primer año con 110% de cuota."),
];

// Perfiles de ejemplo enriquecidos (ids 1, 2, 5) para que el editor no luzca vacío.
Object.assign(SEED_CANDIDATOS.find((c) => c.id === 1)!, {
  experiencia: [
    { puesto: "Ejecutiva de ventas retail", empresa: "Cadena Retail del Grupo", inicio: "2021-03", fin: "" },
    { puesto: "Asesora telefónica", empresa: "Contact Center Norte", inicio: "2019-01", fin: "2021-02" },
  ],
  educacion: [{ institucion: "Universidad del Valle de México", titulo: "Lic. en Administración", inicio: "2014-08", fin: "2018-12" }],
  intereses: ["Emplearme", "Crecer mi puesto"],
});
Object.assign(SEED_CANDIDATOS.find((c) => c.id === 5)!, {
  experiencia: [
    { puesto: "Analista de datos Sr", empresa: "Banca de Consumo", inicio: "2020-06", fin: "" },
    { puesto: "Analista de BI", empresa: "Fintech MX", inicio: "2017-09", fin: "2020-05" },
  ],
  intereses: ["Crecer mi puesto"],
});
Object.assign(SEED_CANDIDATOS.find((c) => c.id === 2)!, {
  experiencia: [
    { puesto: "Asesor comercial", empresa: "Sucursal Centro · Grupo", inicio: "2024-02", fin: "" },
    { puesto: "Promotor de piso", empresa: "Tienda departamental", inicio: "2022-06", fin: "2024-01" },
  ],
  educacion: [
    { institucion: "Universidad Tecnológica de México", titulo: "Lic. en Mercadotecnia (trunca)", inicio: "2019-08", fin: "" },
    { institucion: "CBTIS No. 12", titulo: "Bachillerato técnico en Administración", inicio: "2016-08", fin: "2019-06" },
  ],
  intereses: ["Crecer mi puesto", "Cambiar de área"],
});

export const SEED_VACANTES: Vacante[] = [
  {
    id: "V-1042", estado: "asignada", formadorId: "F1", creada: "01 jul 2026", creadaTs: new Date("2026-07-01").getTime(), pipeline: {}, historial: [], cambios: null, archivados: [],
    req: crearRequisito({
      titulo: "Ejecutivo de Ventas Digitales", area: "Ventas",
      descripcion: "Responsable de la venta consultiva de productos financieros por canales digitales: prospección, seguimiento en CRM y cierre remoto. Trabajará de la mano del equipo de marketing para convertir leads calificados.",
      nivelPuesto: "Semi-Senior", anosExp: 3, espRequeridas: ["Ventas B2C"], espOpcionales: ["CRM y Fidelización", "Servicio al Cliente"],
      hardSkills: ["CRM", "Negociación comercial", "Prospección en frío"], softSkills: ["Comunicación efectiva", "Orientación a resultados", "Empatía"],
      aptitudes: ["Orientación al servicio", "Tolerancia a la presión"],
      killer: [{ q: "¿Cuentas con disponibilidad para laborar sábados medio día?" }, { q: "¿Tienes al menos 2 años de experiencia en venta de productos financieros o intangibles?" }],
      ubicacionTrabajo: "CDMX", modalidad: "Híbrido", ubicacionCandidato: "CDMX", radioKm: 30,
      salarioMin: 14000, salarioMax: 19000, horario: "9:00 – 18:00", numVacantes: 2,
      tipoSede: "Corporativo", sede: "Corporativo Insurgentes Sur (CDMX)", unidadNegocio: "Ventas Digitales · Banca de Consumo", edadMin: 22, edadMax: 45,
    }),
  },
  {
    id: "V-1038", estado: "abierta", formadorId: "F1", creada: "24 jun 2026", creadaTs: new Date("2026-06-24").getTime(), pipeline: {}, historial: ["Aprobada por el formador el 26 jun 2026"], cambios: null, archivados: [],
    req: crearRequisito({
      titulo: "Coordinador de Atención a Clientes", area: "Atención a Clientes",
      descripcion: "Liderar una célula de 20 agentes de atención omnicanal, asegurando niveles de servicio, calidad y coaching continuo al equipo.",
      nivelPuesto: "Semi-Senior", anosExp: 4, espRequeridas: ["Servicio al Cliente"], espOpcionales: ["Cobranza"],
      hardSkills: ["Zendesk", "CRM", "Excel avanzado"], softSkills: ["Liderazgo", "Tolerancia a la presión", "Empatía"],
      aptitudes: ["Orientación al servicio", "Liderazgo de equipos"],
      killer: [{ q: "¿Has liderado equipos de 10 o más personas?" }],
      ubicacionTrabajo: "CDMX", modalidad: "Presencial", ubicacionCandidato: "CDMX", radioKm: 40,
      salarioMin: 17000, salarioMax: 22000, horario: "8:00 – 17:00", numVacantes: 1, examenMedico: true,
      tipoSede: "Sucursal", sede: "Sucursal Centro Histórico (CDMX)", unidadNegocio: "Atención Omnicanal", edadMin: 25, edadMax: 50,
    }),
  },
  {
    id: "V-1035", estado: "abierta", formadorId: "F2", creada: "18 jun 2026", creadaTs: new Date("2026-06-18").getTime(), pipeline: {}, historial: ["Aprobada por el formador el 19 jun 2026"], cambios: null, archivados: [],
    req: crearRequisito({
      titulo: "Analista de Datos Sr", area: "Datos y Analítica",
      descripcion: "Construcción de modelos analíticos y tableros para la dirección de crédito. Trabajo cercano con negocio para traducir preguntas en datos.",
      nivelPuesto: "Senior", anosExp: 5, espRequeridas: ["Ciencia de Datos", "Business Intelligence"], espOpcionales: ["Infraestructura TI"],
      hardSkills: ["Python", "SQL", "Power BI"], softSkills: ["Pensamiento analítico", "Comunicación efectiva"],
      aptitudes: ["Razonamiento numérico", "Razonamiento lógico"],
      killer: [{ q: "¿Dominas SQL a nivel avanzado (ventanas, CTEs, optimización)?" }],
      ubicacionTrabajo: "CDMX", modalidad: "Híbrido", ubicacionCandidato: "CDMX", radioKm: 50,
      salarioMin: 35000, salarioMax: 45000, horario: "9:00 – 18:00", numVacantes: 1,
      tipoSede: "Corporativo", sede: "Corporativo Santa Fe (CDMX)", unidadNegocio: "Dirección de Crédito", edadNoRelevante: true,
    }),
  },
];

export const SEED_FORMADORES: Formador[] = [
  { id: "F1", nombre: "Laura Mendoza Prieto", puesto: "Gerente de Ventas Digitales", area: "Ventas", favoritosCands: [], categorias: [] },
  { id: "F2", nombre: "Arturo Castillo Vega", puesto: "Director de Datos", area: "Datos y Analítica", favoritosCands: [], categorias: [] },
];

export const ADMIN = { id: "A1", nombre: "Carlos Ruiz Delgado", puesto: "Administrador · Talento GS" } as const;

export const SEED_NOTIFICACIONES: Notificacion[] = [
  {
    id: "N1", para: { tipo: "formador", id: "F1" }, titulo: "Se te liberó una nueva vacante",
    msg: 'La vacante V-1042 · "Ejecutivo de Ventas Digitales" fue asignada a ti. Revisa el descriptivo, solicita cambios o apruébala para iniciar la búsqueda.',
    vacId: "V-1042", fecha: "01 jul 2026 · 09:12", leida: false,
  },
];
