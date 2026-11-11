import { z } from "zod";
import { isValidObjectId } from "mongoose";

export const objectIdSchema = z
  .string()
  .refine((v) => isValidObjectId(v) && v.length === 24, "Invalid id");

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

// Empty string from a form means "root".
export const optionalParentSchema = z
  .string()
  .transform((v) => (v === "" ? null : v))
  .pipe(objectIdSchema.nullable());
