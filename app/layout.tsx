import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gabay — Philippine Worker Benefits Assistant",
  description:
    "Ask about your Philippine statutory worker benefits — 13th-month pay, leave, SSS, " +
    "PhilHealth, and Pag-IBIG — answered from official DOLE handbooks, with sources.",
  openGraph: {
    title: "Gabay — Philippine Worker Benefits Assistant",
    description:
      "Grounded answers about Filipino workers' statutory benefits, with cited sources.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
