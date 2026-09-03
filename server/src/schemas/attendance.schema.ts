import { z } from "zod";

export const checkInSchema = z.object({
  memberId: z.string().regex(/^[0-9a-f]{24}$/i, "A valid member id is required"),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

/** How far back the peak-hour heatmap looks. Eight weeks is recent enough to reflect current habits. */
export const heatmapQuerySchema = z.object({
  days: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").max(365, "Max 365 days").default(56),
});

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
