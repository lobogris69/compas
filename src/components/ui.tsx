"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
    secondary:
      "bg-ink-100 text-ink-800 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700",
    ghost:
      "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  } as const;
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary:
      "bg-ink-100 text-ink-800 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-100",
    ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
  } as const;
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
          {label}
        </span>
      )}
      <input
        className={cn(
          "w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none ring-brand-500/30 focus:border-brand-500 focus:ring-2 dark:border-ink-700 dark:bg-ink-950",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
          {label}
        </span>
      )}
      <select
        className={cn(
          "w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pastilla de rol con color consistente (leader azul, follower rosa). */
export function RolBadge({ rol }: { rol: "leader" | "follower" | "ambos" }) {
  const map = {
    leader: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    follower: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    ambos:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  } as const;
  const label = { leader: "Leader", follower: "Follower", ambos: "Ambos" }[rol];
  return <Badge className={map[rol]}>{label}</Badge>;
}

/** Barra visual del balance leader vs follower. */
export function BalanceBar({
  leaders,
  followers,
}: {
  leaders: number;
  followers: number;
}) {
  const total = Math.max(leaders + followers, 1);
  const pl = (leaders / total) * 100;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
      <div className="bg-leader" style={{ width: `${pl}%` }} />
      <div className="bg-follower" style={{ width: `${100 - pl}%` }} />
    </div>
  );
}
