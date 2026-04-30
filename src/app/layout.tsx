import type { Metadata } from "next";
import "./globals.css";
import { AppToaster } from "@/components/ui/AppToaster";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { SiteFooter } from "@/components/SiteFooter";

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
      <body>
        {children}
        <SiteFooter />
        <AppToaster />
        <ConfirmDialogProvider />
      </body>
    </html>
  );
}
