"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input } from "@/components/ui";

// Acceso de dueños de academia (modo real). En modo local no hace falta.
export default function Entrar() {
  const router = useRouter();
  const auth = useAuth();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Pon tu email y contraseña.");
      return;
    }
    setCargando(true);
    const fn = modo === "entrar" ? auth.signIn : auth.signUp;
    const { error } = await fn(email.trim(), password);
    setCargando(false);
    if (error) {
      setError(error);
      return;
    }
    if (modo === "crear") {
      setInfo(
        "Cuenta creada. Si tu proyecto Supabase exige confirmar el email, revisa tu bandeja antes de entrar.",
      );
      setModo("entrar");
      return;
    }
    router.push("/");
  }

  if (!auth.enabled) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">💻</p>
          <p className="mt-2 font-semibold">Estás en modo local</p>
          <p className="mt-1 text-sm text-ink-500">
            No hace falta cuenta: la app funciona sin login. El acceso aparece
            cuando se conecta Supabase (modo real).
          </p>
          <Link href="/" className="mt-3 inline-block text-brand-600 underline">
            Volver al inicio
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
      <Card className="w-full">
        <h1 className="text-xl font-extrabold">
          {modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Acceso para academias (dueños).
        </p>
        <div className="mt-4 space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@academia.com"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {info}
            </p>
          )}
          <Button onClick={enviar} disabled={cargando} className="w-full py-3">
            {cargando
              ? "…"
              : modo === "entrar"
                ? "Entrar"
                : "Crear cuenta"}
          </Button>
        </div>
        <button
          onClick={() => {
            setModo(modo === "entrar" ? "crear" : "entrar");
            setError("");
            setInfo("");
          }}
          className="mt-4 w-full text-center text-sm text-brand-600"
        >
          {modo === "entrar"
            ? "¿No tienes cuenta? Crear una"
            : "Ya tengo cuenta · Entrar"}
        </button>
      </Card>
    </main>
  );
}
