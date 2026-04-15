import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twibbon Diklat Senior — Pastemda × SMK Telkom Sidoarjo 2026",
  description: "Pasang twibbon Diklat Senior Paskibra SMK Telkom Sidoarjo 2026 — Shape the Vision for the Next Generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="noise">{children}</body>
    </html>
  );
}