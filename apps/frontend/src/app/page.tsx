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
    <FlowShell
      step="เริ่มต้น"
      title="ทดลอง OAuth แบบเห็นทุกขั้น"
      description="Frontend จะสร้าง PKCE แล้วพาคุณผ่าน Hydra, ระบบยืนยันตัวตนเดิม และกลับมารับ token ที่หน้านี้"
    >
      <ol className="flow-list">
        <li>
          <strong>1</strong> สร้าง PKCE ใน browser
        </li>
        <li>
          <strong>2</strong> ยืนยันเบอร์โทรและรหัสหกหลัก
        </li>
        <li>
          <strong>3</strong> อนุญาต scopes ให้ OAuth client
        </li>
        <li>
          <strong>4</strong> แลก authorization code เป็น token
        </li>
      </ol>
      <button
        type="button"
        className="primary-button"
        onClick={startLogin}
        disabled={starting}
      >
        {starting ? "กำลังเริ่ม OAuth…" : "เริ่ม Login"}
      </button>
    </FlowShell>
  );
}
