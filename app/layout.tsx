import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedSuture — Autonomous offense. Instant closure.",
  description: "AI-powered penetration testing for web apps, mobile apps, and APIs. Find and fix vulnerabilities before attackers do. A NextAI Studios product.",
  keywords: "penetration testing, security, vulnerability scanner, AI pentest, web security",
  openGraph: {
    title: "RedSuture — Autonomous offense. Instant closure.",
    description: "AI-powered penetration testing platform for developers and enterprises.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
