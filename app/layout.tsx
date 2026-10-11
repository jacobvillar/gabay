import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gabay",
  description:
    "Ask about your Philippine statutory worker benefits — 13th-month pay, leave, SSS, " +
    "PhilHealth, and Pag-IBIG — answered from official DOLE handbooks, with sources.",
  openGraph: {
    title: "Gabay — Philippine Worker Benefits Assistant",
    description: "Grounded answers about Filipino workers' statutory benefits, with cited sources.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
