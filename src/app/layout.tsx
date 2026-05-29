import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clube do Café",
  description: "Clube do Café - Gestão de assinaturas de café",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
