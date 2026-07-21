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
import { refreshStore, snapshotStore, persistChanged } from "./db/persistence";
import { dbEnabled } from "./db/client";

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

  // Acceso "siempre fresco" a la BD (si está configurada):
  //   - En CADA request se re-hidrata el store desde la BD (datos actuales, sin caché stale
  //     ni clobbering entre instancias serverless).
  //   - En escrituras exitosas se persiste SOLO lo que cambió, ANTES de cerrar la respuesta
  //     (interceptamos res.end para que en serverless termine antes de que la función se congele).
  if (dbEnabled) {
    app.use((req, res, next) => {
      refreshStore()
        .then(() => {
          const esEscritura = req.method !== "GET" && req.method !== "HEAD";
          if (!esEscritura) return next();

          const snap = snapshotStore();
          const originalEnd = res.end.bind(res);
          let handled = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.end = ((...args: any[]) => {
            if (handled || res.statusCode < 200 || res.statusCode >= 400) {
              return originalEnd(...args);
            }
            handled = true;
            persistChanged(snap)
              .catch((e) => console.error("[db] Error al persistir:", e))
              .finally(() => originalEnd(...args));
            return res;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any;
          next();
        })
        .catch(next);
    });
  }

  app.use(API_PREFIX, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
