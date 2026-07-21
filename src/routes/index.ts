/** Monta todas las rutas bajo el prefijo de API. */
import { Router } from "express";
import { vacanteRoutes } from "./vacanteRoutes";
import { catalogoController } from "../controllers/catalogoController";
import { candidatoController } from "../controllers/candidatoController";
import { poolController } from "../controllers/poolController";
import { formadorController, notificacionController } from "../controllers/lecturaControllers";
import { agentController } from "../controllers/agentController";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

// ── Agente IA (chat por SSE) ──
apiRouter.post("/agente/chat", agentController.chat);
apiRouter.get("/agente/diag", agentController.diag); // diagnóstico temporal
apiRouter.get("/catalogos", catalogoController.listar);

apiRouter.use("/vacantes", vacanteRoutes);

// ── Candidatos (CRUD) ──
apiRouter.get("/candidatos", candidatoController.listar);
apiRouter.post("/candidatos", candidatoController.crear);
apiRouter.get("/candidatos/:id", candidatoController.obtener);
apiRouter.put("/candidatos/:id", candidatoController.guardar);
apiRouter.delete("/candidatos/:id", candidatoController.eliminar);
apiRouter.post("/candidatos/:id/psicometrico", candidatoController.completarPsicometrico);
apiRouter.post("/candidatos/:id/favoritos/:vacId", candidatoController.toggleFavVacante);

// ── Formadores (CRUD + pool global: favoritos y categorías) ──
apiRouter.get("/formadores", formadorController.listar);
apiRouter.post("/formadores", formadorController.crear);
apiRouter.get("/formadores/:id", formadorController.obtener);
apiRouter.put("/formadores/:id", formadorController.actualizar);
apiRouter.delete("/formadores/:id", formadorController.eliminar);
apiRouter.post("/formadores/:id/favoritos/:cid", poolController.toggleFavCand);
apiRouter.post("/formadores/:id/categorias", poolController.crearCategoria);
apiRouter.post("/formadores/:id/categorias/:nombre/:cid", poolController.toggleCategoria);
apiRouter.delete("/formadores/:id/categorias/:nombre", poolController.eliminarCategoria);

// ── Notificaciones (CRUD) ──
apiRouter.get("/notificaciones", notificacionController.listar);
apiRouter.post("/notificaciones", notificacionController.crear);
apiRouter.post("/notificaciones/:id/leida", notificacionController.marcarLeida);
apiRouter.delete("/notificaciones/:id", notificacionController.eliminar);
