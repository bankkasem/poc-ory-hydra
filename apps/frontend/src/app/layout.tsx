import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hydra OAuth Lab",
  description: "OAuth 2.0 and OpenID Connect integration POC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
