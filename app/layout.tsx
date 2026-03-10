import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistemas Mezzavilla",
  description: "Sistema de Gestión de Áridos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
