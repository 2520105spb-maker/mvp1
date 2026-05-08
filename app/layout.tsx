import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "НеоЛифт ERP — заказ-наряд",
  description: "Внутренний PWA экран создания заказ-наряда механика НеоЛифт.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07111f",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className="dark">
      <body>{children}</body>
    </html>
  );
}
