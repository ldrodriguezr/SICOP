import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "SICOP Copilot — Tu copiloto para licitaciones del Estado",
  description:
    "Analizá carteles con IA, monitoreá licitaciones del SICOP y tomá decisiones con datos históricos de precios. El Estado compra ₡3.2 billones al año. Ahora vos podés ganar tu parte.",
  keywords: ["SICOP", "licitaciones", "Costa Rica", "contratación pública", "PYME"],
  authors: [{ name: "SICOP Copilot" }],
  openGraph: {
    title: "SICOP Copilot",
    description: "Tu copiloto inteligente para contratar con el Estado costarricense",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
