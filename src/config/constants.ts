/** Constantes de infraestructura del servidor (no de dominio; esas están en constants/catalogs.ts). */
export const API_PREFIX = "/api";

/** Máximo de caracteres aceptados en un texto libre proveniente del cliente (mensajes, anotaciones). */
export const MAX_TEXT_LENGTH = 2_000;

/** Máximo de caracteres para un prompt destinado a un LLM (protección básica anti-abuso). */
export const MAX_PROMPT_LENGTH = 8_000;
