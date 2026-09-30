"use client";

import { exchangeCode, oauthStorage } from "@poc/oauth-client";
import { use, useEffect, useRef, useState } from "react";
import { FlowShell } from "@/components/flow-shell";

type CallbackPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type User = { phoneNumber: string };

export default function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = use(searchParams);
  const code = typeof params.code === "string" ? params.code : "";
  const state = typeof params.state === "string" ? params.state : "";
  const started = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const expectedState = sessionStorage.getItem(oauthStorage.state);
    if (!code || !state || state !== expectedState) {
      setError("คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาเริ่มใหม่");
      return;
    }

    async function finishLogin() {
      const accessToken = await exchangeCode(code);

      const response = await fetch("/api/backend/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("ไม่สามารถยืนยันการเข้าสู่ระบบได้");
      setUser(await response.json());
    }

    finishLogin().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "ไม่สามารถเข้าสู่ระบบได้"),
    );
  }, [code, state]);

  return (
    <FlowShell
      title={
        error ? "เข้าสู่ระบบไม่สำเร็จ" : user ? "เข้าสู่ระบบสำเร็จ" : "กำลังเข้าสู่ระบบ"
      }
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {!error && !user ? (
        <p className="loading" role="status">
          กรุณารอสักครู่…
        </p>
      ) : null}
      {user ? (
        <div className="form-stack">
          <div className="summary">
            <span>เบอร์โทร</span>
            <strong>{user.phoneNumber}</strong>
          </div>
          <a className="secondary-button" href="/">
            กลับหน้าหลัก
          </a>
        </div>
      ) : null}
    </FlowShell>
  );
}
