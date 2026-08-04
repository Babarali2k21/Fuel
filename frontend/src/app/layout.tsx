import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { CookieNotice } from "@/components/CookieNotice";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SpritCheck – Intelligente Tankempfehlung für Österreich",
  description: "Finde die günstigste Tankstelle nach echten Gesamtkosten in Österreich.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpritCheck",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de-AT"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="app-shell">
          <Providers>
            <Header />
            <div className="page-container">{children}</div>
            <CookieNotice />
          </Providers>
        </div>
      </body>
    </html>
  );
}
