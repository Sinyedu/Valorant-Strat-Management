import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    workspaceId?: string;
  }
  interface Session {
    user: { id: string; workspaceId: string } & DefaultSession["user"];
  }
}

