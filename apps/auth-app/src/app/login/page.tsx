import { redirect } from "next/navigation";
import { FlowShell } from "@/components/flow-shell";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const challenge = params.login_challenge;
  const loginChallenge = typeof challenge === "string" ? challenge : "";

  if (!loginChallenge) {
    return (
      <FlowShell title="ยืนยันตัวตน">
        <p className="error" role="alert">
          คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาเริ่มใหม่
        </p>
      </FlowShell>
    );
  }

  const response = await fetch(
    `${process.env.BACKEND_URL}/auth/login/session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginChallenge }),
      cache: "no-store",
    },
  );
  const session = await response.json();
  if (!response.ok) {
    return (
      <FlowShell title="ยืนยันตัวตน">
        <p className="error" role="alert">
          ไม่สามารถตรวจสอบการเข้าสู่ระบบได้
        </p>
      </FlowShell>
    );
  }
  if (session.skip && typeof session.redirectTo === "string") {
    redirect(session.redirectTo);
  }

  return (
    <FlowShell title="ยืนยันตัวตน">
      <LoginForm loginChallenge={loginChallenge} />
    </FlowShell>
  );
}
