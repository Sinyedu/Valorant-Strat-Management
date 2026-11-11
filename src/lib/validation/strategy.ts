import { z } from "zod";

export const strategyTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title is too long");
