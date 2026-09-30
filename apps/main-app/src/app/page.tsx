import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";

type User = { phoneNumber: string };

async function getUser() {
  const config = authConfig();
  const sessionId = (await cookies()).get(config.cookies.session)?.value;
  if (!sessionId) redirect("/login");

  const response = await fetch(`${config.backendUrl}/auth/oauth/session`, {
    headers: { Authorization: `Session ${sessionId}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (!response.ok) throw new Error("Unable to load session");
  return (await response.json()) as User;
}

export default async function Home() {
  const user = await getUser();

  return (
    <main>
      <header>
        <span className="brand">Main</span>
        <a href={process.env.MEMBER_APP_URL}>จัดการสมาชิก</a>
      </header>
      <section>
        <h1>หน้าหลัก</h1>
        <dl>
          <div>
            <dt>ผู้ใช้งาน</dt>
            <dd>{user.phoneNumber}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
