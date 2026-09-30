import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "บัญชีของฉัน",
  description: "ข้อมูลบัญชีสมาชิก",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
