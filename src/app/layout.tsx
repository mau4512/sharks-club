import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sharks Basketball - Club Faraday",
  description: "Club de baloncesto enfocado en formación, competencia y desarrollo integral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
