import { redirect } from "next/navigation";
import { FlowShell } from "@/components/flow-shell";
import { ConsentForm } from "./consent-form";

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const challenge = params.consent_challenge;
  const consentChallenge = typeof challenge === "string" ? challenge : "";

  if (!consentChallenge) {
    return (
      <FlowShell title="อนุญาตการเข้าถึง">
        <p className="error" role="alert">
          คำขอไม่ถูกต้อง กรุณาเริ่มใหม่
        </p>
      </FlowShell>
    );
  }

  const response = await fetch(
    `${process.env.BACKEND_URL}/auth/consent?consentChallenge=${encodeURIComponent(consentChallenge)}`,
    { cache: "no-store" },
  );
  const consent = await response.json();
  if (!response.ok) {
    return (
      <FlowShell title="อนุญาตการเข้าถึง">
        <p className="error" role="alert">
          ไม่สามารถโหลดคำขอได้
        </p>
      </FlowShell>
    );
  }

  if (consent.skip) {
    const accepted = await fetch(`${process.env.BACKEND_URL}/auth/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentChallenge }),
      cache: "no-store",
    });
    const result = await accepted.json();
    if (accepted.ok && typeof result.redirectTo === "string") {
      redirect(result.redirectTo);
    }
  }

  return (
    <FlowShell title="อนุญาตการเข้าถึง">
      <ConsentForm consent={consent} consentChallenge={consentChallenge} />
    </FlowShell>
  );
}
