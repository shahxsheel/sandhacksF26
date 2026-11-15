import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FirstLink — The first minutes, connected", template: "%s · FirstLink" },
  description: "Turn witness reports into a shared incident brief and coordinate nearby support. An interactive, staged emergency-response demo.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
