import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { SessionBar } from "@/components/session-bar";
import { AvisoGuardado } from "@/components/aviso-guardado";

export const metadata: Metadata = {
  title: "Compás — cuadra tus clases de baile",
  description:
    "La app para academias de baile en pareja que ve venir las clases descompensadas de leaders y followers, y te dice a quién avisar para cuadrarlas.",
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
        <AuthProvider>
          <StoreProvider>
            <SessionBar />
            <AvisoGuardado />
            {children}
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
