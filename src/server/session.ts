import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

export type SessionInfo = {
  userId: string;
  workspaceId: string;
  email: string;
};

/** Returns the signed-in user or redirects to /login. Use in every protected page and action. */
export async function requireSession(): Promise<SessionInfo> {
  await connection();
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.workspaceId) redirect("/login");
  return { userId: u.id, workspaceId: u.workspaceId, email: u.email ?? "" };
}
