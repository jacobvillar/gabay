import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gabay",
  description:
    "Gabay sa bawat tanong. Clear answers on Philippine laws and benefits from official sources, " +
    "with citations. Now covering DOLE, SSS, PhilHealth and Pag-IBIG.",
  openGraph: {
    title: "Gabay · Gabay sa bawat tanong",
    description: "Clear answers on Philippine laws and benefits, with cited official sources.",
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
