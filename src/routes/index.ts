/** Monta todas las rutas bajo el prefijo de API. */
import { Router } from "express";
import { vacanteRoutes } from "./vacanteRoutes";
import { catalogoController } from "../controllers/catalogoController";
import { candidatoController } from "../controllers/candidatoController";
import { poolController } from "../controllers/poolController";
import { formadorController, notificacionController } from "../controllers/lecturaControllers";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));
apiRouter.get("/catalogos", catalogoController.listar);

apiRouter.use("/vacantes", vacanteRoutes);

// ── Candidatos ──
apiRouter.get("/candidatos", candidatoController.listar);
apiRouter.get("/candidatos/:id", candidatoController.obtener);
apiRouter.put("/candidatos/:id", candidatoController.guardar);
apiRouter.post("/candidatos/:id/psicometrico", candidatoController.completarPsicometrico);
apiRouter.post("/candidatos/:id/favoritos/:vacId", candidatoController.toggleFavVacante);

// ── Formadores (incluye pool global: favoritos y categorías) ──
apiRouter.get("/formadores", formadorController.listar);
apiRouter.post("/formadores/:id/favoritos/:cid", poolController.toggleFavCand);
apiRouter.post("/formadores/:id/categorias", poolController.crearCategoria);
apiRouter.post("/formadores/:id/categorias/:nombre/:cid", poolController.toggleCategoria);

// ── Notificaciones ──
apiRouter.get("/notificaciones", notificacionController.listar);
apiRouter.post("/notificaciones/:id/leida", notificacionController.marcarLeida);
