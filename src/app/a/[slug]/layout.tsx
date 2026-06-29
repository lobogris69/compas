"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";

// Layout del área de cada academia:
// - branding: barra superior con el color de la academia.
// - modo nube: carga los datos de la academia desde Supabase bajo demanda.
export default function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const color = academia?.color ?? "#7c4dff";

  useEffect(() => {
    if (store.mode === "supabase" && store.ready) {
      store.cargarAcademia(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, store.mode, store.ready]);

  // En modo nube, mientras carga y aún no está en memoria, muestra spinner.
  const cargando =
    store.mode === "supabase" && !academia && store.cargandoAcademia(slug);

  return (
    <div>
      <div style={{ height: 4, background: color }} />
      {cargando ? (
        <div className="grid min-h-dvh place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
