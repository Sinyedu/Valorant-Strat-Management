import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validation/auth";
import { verifyCredentials } from "@/server/services/auth";
import { clearFailures, isBlocked, recordFailure } from "@/server/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        if (isBlocked(email)) return null;
        const user = await verifyCredentials(email, password);
        if (!user) {
          recordFailure(email);
          return null;
        }
        clearFailures(email);
        return user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.workspaceId = user.workspaceId;
      }
      return token;
    },
    session({ session, token }) {
      // Narrow at runtime: token fields are untyped in this Auth.js beta.
      const { userId, workspaceId } = token;
      session.user.id = typeof userId === "string" ? userId : "";
      session.user.workspaceId = typeof workspaceId === "string" ? workspaceId : "";
      return session;
    },
  },
});
