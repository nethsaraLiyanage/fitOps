import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  nic: z
    .string()
    .trim()
    .min(1, "NIC is required")
    .regex(/^(\d{9}[VvXx]|\d{12})$/, "Use 9 digits + V/X or 12 digits"),
  email: z.string().trim().email("Invalid email address").max(255, "Max 255 characters"),
  phone: z.string().trim().min(5, "Phone is required").max(20, "Max 20 characters"),
  plan: z.enum(["Basic", "Premium"]),
  paymentMethod: z.enum(["Monthly", "Annual"]),
  status: z.enum(["active", "expired"]),
  joined: z.string().min(1, "Join date is required"),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updatePaymentSchema = z
  .object({
    status: z.enum(["paid", "pending", "overdue"]).optional(),
    verified: z.boolean().optional(),
    paidOn: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
