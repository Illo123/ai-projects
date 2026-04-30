import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PostBlitz — LinkedIn-Posts in deinem Ton",
  description:
    "Drei Post-Varianten in Sekunden — sofort einsatzbereit, in deinem Stil.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
