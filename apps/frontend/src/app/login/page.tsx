"use client";

import { use, useEffect, useRef, useState } from "react";
import { FlowShell } from "@/components/flow-shell";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = use(searchParams);
  const challenge = params.login_challenge;
  const loginChallenge = typeof challenge === "string" ? challenge : "";
  const started = useRef(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!loginChallenge) {
      setCheckingSession(false);
      return;
    }

    fetch("/api/backend/auth/login/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginChallenge }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error("ไม่สามารถตรวจสอบการเข้าสู่ระบบได้");
        if (data.skip && typeof data.redirectTo === "string") {
          window.location.assign(data.redirectTo);
          return;
        }
        setCheckingSession(false);
      })
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "ไม่สามารถเชื่อมต่อ backend ได้",
        );
        setCheckingSession(false);
      });
  }, [loginChallenge]);

  async function login(formData: FormData) {
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginChallenge,
          phoneNumber: formData.get("phoneNumber"),
          verificationCode: formData.get("verificationCode"),
        }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error(
          response.status === 401
            ? "เบอร์โทรหรือรหัสยืนยันไม่ถูกต้อง"
            : "ไม่สามารถยืนยันตัวตนได้",
        );
      }
      window.location.assign(data.redirectTo);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ไม่สามารถเชื่อมต่อ backend ได้",
      );
      setSubmitting(false);
    }
  }

  return (
    <FlowShell title="ยืนยันตัวตน">
      {checkingSession ? (
        <p className="loading" role="status">
          กำลังตรวจสอบ…
        </p>
      ) : loginChallenge ? (
        <form action={login} className="form-stack">
          <label>
            เบอร์โทร
            <input
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue="0812345678"
              required
            />
          </label>
          <label>
            รหัสยืนยัน 6 หลัก
            <input
              name="verificationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              defaultValue="123456"
              required
            />
          </label>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? "กำลังตรวจสอบ…" : "ยืนยันตัวตน"}
          </button>
        </form>
      ) : (
        <p className="error" role="alert">
          คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาเริ่มใหม่
        </p>
      )}
    </FlowShell>
  );
}
