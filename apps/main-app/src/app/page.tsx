"use client";

import { beginAuthorization, oauthStorage } from "@poc/oauth-client";
import { useEffect, useRef, useState } from "react";

type User = { phoneNumber: string };

export default function Home() {
  const started = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function loadUser() {
      const accessToken = sessionStorage.getItem(oauthStorage.accessToken);
      if (!accessToken) return beginAuthorization();

      const response = await fetch("/api/backend/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 401) {
        sessionStorage.removeItem(oauthStorage.accessToken);
        return beginAuthorization();
      }
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลบัญชีได้");
      setUser(await response.json());
    }

    loadUser().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "ไม่สามารถเข้าสู่ระบบได้"),
    );
  }, []);

  return (
    <main>
      <header>
        <span className="brand">Main</span>
        {user ? (
          <a href={process.env.NEXT_PUBLIC_MEMBER_APP_URL}>จัดการสมาชิก</a>
        ) : null}
      </header>
      <section>
        <h1>หน้าหลัก</h1>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : user ? (
          <dl>
            <div>
              <dt>ผู้ใช้งาน</dt>
              <dd>{user.phoneNumber}</dd>
            </div>
          </dl>
        ) : (
          <p className="loading" role="status">
            กำลังเข้าสู่ระบบ…
          </p>
        )}
      </section>
    </main>
  );
}
