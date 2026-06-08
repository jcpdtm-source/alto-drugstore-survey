import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alto Drugstore · Encuestas",
  description: "Sistema de encuestas en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-gray-900">{children}</body>
    </html>
  );
}
