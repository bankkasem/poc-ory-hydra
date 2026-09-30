"use client";

import { use, useEffect, useRef, useState } from "react";
import { FlowShell } from "@/components/flow-shell";

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Consent = {
  client: { name: string };
  requestedScopes: string[];
  skip: boolean;
};

const scopeLabels: Record<string, string> = {
  openid: "ยืนยันตัวตน",
  profile: "ข้อมูลโปรไฟล์",
};

async function acceptConsent(consentChallenge: string) {
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
}

export default function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = use(searchParams);
  const challenge = params.consent_challenge;
  const consentChallenge = typeof challenge === "string" ? challenge : "";
  const started = useRef(false);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!consentChallenge || started.current) return;
    started.current = true;

    fetch(
      `/api/backend/auth/consent?consentChallenge=${encodeURIComponent(consentChallenge)}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error("ไม่สามารถโหลดคำขอได้");
        if (data.skip) return acceptConsent(consentChallenge);
        setConsent(data);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "ไม่สามารถเชื่อมต่อ backend ได้",
        ),
      );
  }, [consentChallenge]);

  async function allowAccess() {
    setError("");
    setSubmitting(true);

    try {
      await acceptConsent(consentChallenge);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ไม่สามารถเชื่อมต่อ backend ได้",
      );
      setSubmitting(false);
    }
  }

  return (
    <FlowShell title="อนุญาตการเข้าถึง">
      {!consentChallenge ? (
        <p className="error" role="alert">
          คำขอไม่ถูกต้อง กรุณาเริ่มใหม่
        </p>
      ) : null}
      {consent ? (
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
      ) : consentChallenge && !error ? (
        <p className="loading" role="status">
          กำลังโหลด…
        </p>
      ) : null}
      {error && !consent ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </FlowShell>
  );
}
