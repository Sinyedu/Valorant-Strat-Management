import { z } from "zod";

const serverEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Validates server env vars lazily so `next build` works without a database. */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${fields}`);
  }
  return parsed.data;
}
