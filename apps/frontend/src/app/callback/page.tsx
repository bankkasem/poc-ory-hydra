"use client";

import { use, useEffect, useRef, useState } from "react";
import { FlowShell } from "@/components/flow-shell";
import { exchangeCode, oauthStorage } from "@/lib/oauth";

type CallbackPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = use(searchParams);
  const code = typeof params.code === "string" ? params.code : "";
  const state = typeof params.state === "string" ? params.state : "";
  const started = useRef(false);
  const [tokens, setTokens] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const expectedState = sessionStorage.getItem(oauthStorage.state);
    if (!code || !state || state !== expectedState) {
      setError("OAuth state ไม่ถูกต้อง กรุณาเริ่ม Login ใหม่");
      return;
    }

    exchangeCode(code)
      .then(setTokens)
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "ไม่สามารถแลก token ได้",
        ),
      );
  }, [code, state]);

  return (
    <FlowShell
      step="ขั้นที่ 3 · Callback"
      title="กลับมาจาก Hydra แล้ว"
      description="Frontend ตรวจ state และใช้ PKCE verifier แลก authorization code เป็น token"
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {!error && !tokens ? (
        <p className="loading" role="status">
          กำลังแลก token…
        </p>
      ) : null}
      {tokens ? (
        <div className="form-stack">
          <p className="success">
            OAuth flow สำเร็จและเก็บ access token ไว้ใน session นี้แล้ว
          </p>
          <details>
            <summary>ดู token response สำหรับ POC</summary>
            <pre>{JSON.stringify(tokens, null, 2)}</pre>
          </details>
          <a className="secondary-button" href="/">
            เริ่มใหม่
          </a>
        </div>
      ) : null}
    </FlowShell>
  );
}
