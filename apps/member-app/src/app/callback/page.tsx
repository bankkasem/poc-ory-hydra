"use client";

import { exchangeCode, oauthStorage } from "@poc/oauth-client";
import { use, useEffect, useRef, useState } from "react";

type CallbackPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = use(searchParams);
  const code = typeof params.code === "string" ? params.code : "";
  const state = typeof params.state === "string" ? params.state : "";
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const expectedState = sessionStorage.getItem(oauthStorage.state);
    if (!code || !state || state !== expectedState) {
      setError("คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาเริ่มใหม่");
      return;
    }

    exchangeCode(code)
      .then((accessToken) => {
        sessionStorage.setItem(oauthStorage.accessToken, accessToken);
        window.location.replace("/");
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "ไม่สามารถเข้าสู่ระบบได้"),
      );
  }, [code, state]);

  return (
    <main className="centered">
      <p
        className={error ? "error" : "loading"}
        role={error ? "alert" : "status"}
      >
        {error || "กำลังเข้าสู่ระบบ…"}
      </p>
    </main>
  );
}
