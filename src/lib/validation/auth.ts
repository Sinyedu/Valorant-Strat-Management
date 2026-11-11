import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);

export const signupSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes; cap length so that is never silently truncated.
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  name: z.string().trim().max(80).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
