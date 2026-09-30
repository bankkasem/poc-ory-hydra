import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, decryptSession } from "@/lib/auth";

type User = { phoneNumber: string };

async function getUser() {
  const config = authConfig();
  const session = await decryptSession(
    (await cookies()).get(config.cookies.session)?.value,
    config.cookieSecret,
    config.clientId,
  );
  if (!session) redirect("/login");
  if (session.expiresAt <= Date.now() + 5_000) redirect("/refresh");

  const response = await fetch(`${config.backendUrl}/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (!response.ok) throw new Error("Unable to load user");
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
