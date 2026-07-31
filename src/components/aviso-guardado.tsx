"use client";

import { useStore } from "@/lib/store";

// Aviso global cuando una escritura a la nube falla. En modo nube no cacheamos
// nada en localStorage, así que un fallo silencioso significaba perder el dato
// sin que el usuario se enterara: la pantalla decía "guardado" y al recargar no
// estaba. Esto lo hace visible y accionable.
export function AvisoGuardado() {
  const { errorGuardado, descartarError } = useStore();
  if (!errorGuardado) return null;

  return (
    <div
      role="alert"
      className="sticky top-12 z-50 border-b border-rose-300 bg-rose-100 px-4 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <span className="shrink-0">⚠️</span>
        <p className="min-w-0 flex-1">
          {errorGuardado}{" "}
          <span className="opacity-80">
            Vuelve a intentarlo; si insiste, recarga la página antes de seguir
            para no perder cambios.
          </span>
        </p>
        <button
          onClick={descartarError}
          className="shrink-0 rounded-lg px-2 py-1 font-semibold hover:bg-rose-200 dark:hover:bg-rose-900"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
