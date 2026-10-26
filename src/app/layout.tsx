import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const label = Inter({
  subsets: ["latin"],
  variable: "--font-label",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ComplaintPath — UK complaint path finder",
  description:
    "Paste a rejection or final response; get a gated route and an approved pack you can send. Not legal advice.",
  icons: {
    icon: [
      { url: "/brand-mark.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body
        className={`${display.variable} ${body.variable} ${label.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
