/**
 * Jerarquía simple de errores de aplicación.
 * El `errorHandler` global traduce estas clases a respuestas HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;
  constructor(message = "Datos de entrada inválidos", details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}

export class InternalError extends AppError {
  constructor(message = "Error interno del servidor") {
    super(message, 500);
  }
}
