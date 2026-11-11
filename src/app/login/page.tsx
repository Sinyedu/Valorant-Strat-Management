import { AuthForm } from "@/components/auth-form";
import { RequestTime } from "@/components/request-time";

export const metadata = { title: "Log in — Stratbook" };

export default function LoginPage() {
  return (
    <RequestTime>
      <AuthForm mode="login" />
    </RequestTime>
  );
}
