"use client";

import { useState } from "react";
import { FlowShell } from "@/components/flow-shell";
import { beginAuthorization } from "@/lib/oauth";

export default function Home() {
  const [starting, setStarting] = useState(false);

  async function startLogin() {
    setStarting(true);
    await beginAuthorization();
  }

  return (
    <FlowShell title="เข้าสู่ระบบ">
      <button
        type="button"
        className="primary-button"
        onClick={startLogin}
        disabled={starting}
      >
        {starting ? "กำลังดำเนินการ…" : "เข้าสู่ระบบ"}
      </button>
    </FlowShell>
  );
}
