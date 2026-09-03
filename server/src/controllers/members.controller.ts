import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { actorId } from "../utils/actor.js";
import * as membersService from "../services/members.service.js";
import { CreateMemberInput, UpdatePaymentInput } from "../schemas/member.schema.js";

export const listMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const members = await membersService.listMembers(search);
  res.json(members);
});

export const createMemberHandler = asyncHandler(async (req: Request, res: Response) => {
  const member = await membersService.createMember(req.body as CreateMemberInput, actorId(req));
  res.status(201).json(member);
});

export const updatePaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, period } = req.params;
  const member = await membersService.updatePayment(id, period, req.body as UpdatePaymentInput, actorId(req));
  res.json(member);
});

export const planFeesHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(membersService.getPlanFeesTable());
});
