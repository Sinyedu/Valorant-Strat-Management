import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { loginAction, signupAction } from "@/app/auth-actions";

const input =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        {signup ? "Create your account" : "Log in"}
      </h1>
      <ActionForm
        action={signup ? signupAction : loginAction}
        className="mt-6 space-y-4"
      >
        {signup && (
          <label className="block text-sm">
            Name (optional)
            <input name="name" autoComplete="name" maxLength={80} className={input} />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={signup ? 8 : 1}
            maxLength={72}
            autoComplete={signup ? "new-password" : "current-password"}
            className={input}
          />
        </label>
        <button className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
          {signup ? "Sign up" : "Log in"}
        </button>
      </ActionForm>
      <p className="mt-4 text-sm text-muted">
        {signup ? "Already have an account? " : "No account yet? "}
        <Link href={signup ? "/login" : "/signup"} className="text-foreground underline">
          {signup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
