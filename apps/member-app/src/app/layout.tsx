import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Member App",
  description: "ระบบจัดการสมาชิก",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
