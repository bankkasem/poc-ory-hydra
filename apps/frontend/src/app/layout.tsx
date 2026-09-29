import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ory Hydra POC",
  description: "OAuth 2.0 and OpenID Connect integration POC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
