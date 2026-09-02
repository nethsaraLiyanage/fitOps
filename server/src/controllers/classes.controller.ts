import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as classesService from "../services/classes.service.js";
import { CreateClassInput } from "../schemas/class.schema.js";

export const listClassesHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await classesService.listClasses());
});

export const createClassHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await classesService.createClass(req.body as CreateClassInput);
  res.status(201).json(created);
});

export const listSessionsHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await classesService.listSessions());
});

export const completeSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const session = await classesService.completeSession(req.params.id);
  res.json(session);
});
