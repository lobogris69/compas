"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";

// Layout del área de cada academia: aplica su color de marca como barra
// superior en todas sus pantallas (branding ligero por tenant).
export default function AcademiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const color = academia?.color ?? "#7c4dff";

  return (
    <div>
      <div style={{ height: 4, background: color }} />
      {children}
    </div>
  );
}
