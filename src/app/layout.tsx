import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Compás — cuadra tus clases de baile",
  description:
    "La app para academias de baile que equilibra leaders y followers en cada clase y llama a refuerzos automáticamente.",
};

export const viewport: Viewport = {
  themeColor: "#7c4dff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
