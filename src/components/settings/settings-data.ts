import { z } from "zod";

/** The saved profile as the API returns it. */
export type GymProfile = {
  name: string;
  phone: string;
  address: string;
  hours: string;
  maxCapacity: number;
};

/**
 * Schemas live here so the page's forms and the request functions share one
 * definition — never hand-declare a parallel "form values" type for a zod schema.
 */
export const gymProfileSchema = z.object({
  name: z.string().trim().min(1, "Gym name is required").max(100, "Max 100 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(30, "Max 30 characters"),
  address: z.string().trim().min(1, "Address is required").max(200, "Max 200 characters"),
  hours: z.string().trim().min(1, "Operating hours are required").max(60, "Max 60 characters"),
  maxCapacity: z.coerce.number().int("Must be a whole number").min(1, "Must be at least 1").max(100000, "Too large"),
});

export type GymProfileValues = z.infer<typeof gymProfileSchema>;

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  email: z.string().trim().email("Enter a valid email address"),
});

export type AccountValues = z.infer<typeof accountSchema>;

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Use at least 8 characters").max(128, "Max 128 characters"),
});

export type PasswordValues = z.infer<typeof passwordSchema>;
