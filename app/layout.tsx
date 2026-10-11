import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namma Smooth Roads — Bengaluru road comfort",
  description:
    "Compare smoother two-wheeler routes, report rough roads, and contribute anonymous ride signals across Bengaluru Urban and Rural districts.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
