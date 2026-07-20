/**
 * Entrypoint para Vercel (funciones serverless).
 * Vercel NO ejecuta `app.listen`; espera un handler exportado por default. Aquí exportamos la app
 * de Express (que ES un handler `(req, res)`), sin abrir puerto. Para desarrollo local se sigue
 * usando `src/server.ts` (que sí hace listen).
 */
import { createApp } from "../src/app";

const app = createApp();

export default app;
