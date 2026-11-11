"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation/auth";
import { registerUser, SignupError } from "@/server/services/auth";
import type { ActionState } from "@/types/action";

async function signInWith(email: string, password: string): Promise<ActionState> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password" };
    throw e; // redirects are thrown and must propagate
  }
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid email or password" };
  return signInWith(parsed.data.email, parsed.data.password);
}

export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  try {
    await registerUser({ ...raw, name: raw.name || undefined });
  } catch (e) {
    if (e instanceof SignupError) return { error: e.message };
    console.error("Signup failed");
    return { error: "Could not create account. Try again later." };
  }
  return signInWith(String(raw.email).trim().toLowerCase(), String(raw.password));
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
