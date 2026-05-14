import Link from "next/link";
import type { ReactNode } from "react";

export function InvestigationPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-10">
      <div className="text-sm text-fog mb-3">
        <Link
          href="/investigation"
          className="text-fog no-underline hover:text-paper hover:no-underline"
        >
          ← Investigation
        </Link>
      </div>
      {eyebrow && (
        <div className="text-xs text-copper uppercase tracking-wider font-medium mb-3">
          {eyebrow}
        </div>
      )}
      <h1 className="font-serif text-4xl font-bold text-paper tracking-tight leading-[1.1]">
        {title}
      </h1>
      <article className="mt-8 prose-municipal text-paper">{children}</article>
    </div>
  );
}

export function Finding({
  label,
  number,
  source,
  tone = "neutral",
}: {
  label: string;
  number: string;
  source: string;
  tone?: "red" | "orange" | "yellow" | "green" | "neutral";
}) {
  const toneClass =
    tone === "red"
      ? "text-risk-red"
      : tone === "orange"
        ? "text-risk-orange"
        : tone === "yellow"
          ? "text-risk-yellow"
          : tone === "green"
            ? "text-risk-green"
            : "text-paper";
  return (
    <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-6 my-4">
      <div className="text-xs text-ash uppercase tracking-wider">{label}</div>
      <div className={`font-serif text-4xl font-bold tabular-nums mt-1 ${toneClass}`}>
        {number}
      </div>
      <div className="text-xs text-ash mt-2">Source: {source}</div>
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-fog leading-relaxed my-4">{children}</p>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-2xl font-bold text-paper mt-10 mb-3">{children}</h2>
  );
}
