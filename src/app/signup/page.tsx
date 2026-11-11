import { AuthForm } from "@/components/auth-form";
import { RequestTime } from "@/components/request-time";

export const metadata = { title: "Sign up — Stratbook" };

export default function SignupPage() {
  return (
    <RequestTime>
      <AuthForm mode="signup" />
    </RequestTime>
  );
}
