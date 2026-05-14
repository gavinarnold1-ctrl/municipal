import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "./ui";

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
      {eyebrow && <Eyebrow tone="copper">{eyebrow}</Eyebrow>}
      <h1
        className="font-serif font-bold text-paper leading-[1.1] mt-3"
        style={{
          fontSize: "var(--t-h1)",
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h1>
      <article className="mt-8 text-paper">{children}</article>
    </div>
  );
}

export function Finding({
  section,
  label,
  number,
  source,
  tone = "neutral",
}: {
  section?: string;
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
    <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-[22px] my-4 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        {section && (
          <div
            className="font-serif font-semibold text-[12px] text-copper uppercase"
            style={{ letterSpacing: "0.16em" }}
          >
            {section}
          </div>
        )}
        <div
          className="font-sans text-[11px] font-semibold uppercase text-ash"
          style={{ letterSpacing: "0.14em" }}
        >
          {label}
        </div>
      </div>
      <div
        className={`font-serif font-bold leading-none tabular-nums mt-2.5 ${toneClass}`}
        style={{
          fontSize: 56,
          letterSpacing: "-0.02em",
        }}
      >
        {number}
      </div>
      <div className="font-serif italic text-[13px] text-ash mt-3">Source: {source}</div>
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-sans text-fog my-4"
      style={{ fontSize: 15, lineHeight: 1.7 }}
    >
      {children}
    </p>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif font-semibold text-[24px] text-paper mt-10 mb-3">{children}</h2>
  );
}
