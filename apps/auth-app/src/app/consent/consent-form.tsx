"use client";

import { useState } from "react";

type Consent = {
  client: { name: string };
  requestedScopes: string[];
};

const scopeLabels: Record<string, string> = {
  offline_access: "ใช้งานต่อโดยไม่ต้องเข้าสู่ระบบซ้ำ",
  openid: "ยืนยันตัวตน",
  profile: "ข้อมูลโปรไฟล์",
};

export function ConsentForm({
  consent,
  consentChallenge,
}: {
  consent: Consent;
  consentChallenge: string;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function allowAccess() {
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/backend/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentChallenge }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error("ไม่สามารถอนุญาตได้");
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
    <div className="form-stack">
      <div className="summary">
        <span>แอปพลิเคชัน</span>
        <strong>{consent.client.name}</strong>
      </div>
      <div>
        <p className="field-title">สิทธิ์ที่ขอ</p>
        <ul className="scope-list">
          {consent.requestedScopes.map((scope) => (
            <li key={scope}>{scopeLabels[scope] ?? scope}</li>
          ))}
        </ul>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="primary-button"
        onClick={allowAccess}
        disabled={submitting}
      >
        {submitting ? "กำลังดำเนินการ…" : "อนุญาต"}
      </button>
    </div>
  );
}
