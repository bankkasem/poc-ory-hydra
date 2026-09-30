import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Main App",
  description: "แอปพลิเคชันหลัก",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
