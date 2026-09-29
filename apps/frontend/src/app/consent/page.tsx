"use client";

import { use, useEffect, useState } from "react";
import { FlowShell } from "@/components/flow-shell";

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Consent = {
  client: { id: string; name: string };
  requestedScopes: string[];
};

export default function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = use(searchParams);
  const challenge = params.consent_challenge;
  const consentChallenge = typeof challenge === "string" ? challenge : "";
  const [consent, setConsent] = useState<Consent | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!consentChallenge) return;

    fetch(
      `/api/backend/auth/consent?consentChallenge=${encodeURIComponent(consentChallenge)}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error("ไม่สามารถอ่าน consent request ได้");
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
      const response = await fetch("/api/backend/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentChallenge }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.redirectTo !== "string") {
        throw new Error("ไม่สามารถอนุญาต scopes ได้");
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
    <FlowShell
      step="ขั้นที่ 2 · Consent"
      title="อนุญาตการเข้าถึง"
      description="ตรวจสอบว่า OAuth client ขอสิทธิ์อะไร ก่อนอนุญาตให้ Hydra ออก authorization code"
    >
      {!consentChallenge ? (
        <p className="error" role="alert">
          ไม่พบ consent challenge กรุณาเริ่ม Login ใหม่
        </p>
      ) : null}
      {consent ? (
        <div className="form-stack">
          <div className="client-summary">
            <span>OAuth client</span>
            <strong>{consent.client.name}</strong>
            <small>{consent.client.id}</small>
          </div>
          <div>
            <p className="field-title">Scopes ที่ร้องขอ</p>
            <ul className="scope-list">
              {consent.requestedScopes.map((scope) => (
                <li key={scope}>{scope}</li>
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
            {submitting ? "กำลังอนุญาต…" : "อนุญาตและไปต่อ"}
          </button>
        </div>
      ) : consentChallenge && !error ? (
        <p className="loading" role="status">
          กำลังอ่าน consent request…
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
