import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PostBlitz — LinkedIn-Posts in deinem Ton",
  description:
    "Aus einer Idee werden zwei fertige LinkedIn-Posts in deinem Ton — live gestreamt, als interaktive Feed-Vorschau.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
