import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Namma Smooth — South Bengaluru road comfort",
  description:
    "Compare smoother two-wheeler routes, report rough roads, and contribute anonymous ride signals across BBMP South Zone.",
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
