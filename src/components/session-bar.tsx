"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { esAdminPlataforma } from "@/lib/admin";
import { Button } from "@/components/ui";

// Cabecera global con el estado de sesión del dueño (modo real).
// En modo local no hay login, así que solo muestra la marca.
export function SessionBar() {
  const auth = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur dark:border-ink-800/70 dark:bg-ink-950/80">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-extrabold tracking-tight">
          Compás
        </Link>

        {auth.enabled && auth.ready && (
          <div className="flex items-center gap-3">
            {auth.user ? (
              <>
                {esAdminPlataforma(auth.user.email) && (
                  <Link
                    href="/admin"
                    className="text-sm font-semibold text-brand-600 hover:underline"
                  >
                    🛡️ Plataforma
                  </Link>
                )}
                <span className="max-w-[40vw] truncate text-sm text-ink-600 dark:text-ink-300">
                  Hola, <span className="font-medium">{auth.user.email}</span>
                </span>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5"
                  onClick={() => auth.signOut()}
                >
                  Salir
                </Button>
              </>
            ) : (
              <Link
                href="/entrar"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
