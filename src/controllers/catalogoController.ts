/** Expone los catálogos de dominio para poblar selects/formularios del frontend. */
import type { Request, Response } from "express";
import * as catalogs from "../constants/catalogs";

export const catalogoController = {
  listar(_req: Request, res: Response): void {
    res.json({
      areas: catalogs.AREAS,
      niveles: catalogs.NIVELES,
      educacion: catalogs.EDUCACION,
      ciudades: catalogs.CIUDADES,
      modalidades: catalogs.MODALIDADES,
      tiposSede: catalogs.TIPOS_SEDE,
      sedes: catalogs.SEDES,
      tiposVacante: catalogs.TIPOS_VACANTE,
      camposDesc: catalogs.CAMPOS_DESC,
      especialidades: catalogs.ESPECIALIDADES,
      hardSkills: catalogs.HARD_SKILLS,
      softSkills: catalogs.SOFT_SKILLS,
      aptitudes: catalogs.APTITUDES,
      dias: catalogs.DIAS,
      fases: catalogs.FASES,
      pipe: catalogs.PIPE,
      pipeIdx: catalogs.PIPE_IDX,
      sucursalesMedicas: catalogs.SUCURSALES_MEDICAS,
    });
  },
};
