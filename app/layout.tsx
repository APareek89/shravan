import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shravan — Care that keeps you close",
    template: "%s · Shravan",
  },
  description:
    "A warm daily companion for elders, and peace of mind for their families.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  );
}

