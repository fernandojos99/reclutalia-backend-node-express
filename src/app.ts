/**
 * Construcción del app de Express: seguridad básica + rutas + manejo de errores.
 * Seguridad (del prompt del refactor): helmet, cors, rate limit, límite de body, y
 * validación/sanitización por-endpoint vía zod `.strict()` en los controllers.
 */
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { API_PREFIX } from "./config/constants";
import { apiRouter } from "./routes/index";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: env.bodyLimit }));
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(API_PREFIX, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
