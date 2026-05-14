import type { ReactNode } from "react";
import { riskBucket } from "@/lib/normalize";

// ── Card ──────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-slate border border-steel rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] transition-[border-color] duration-150 ${
        hover ? "hover:border-copper" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Eyebrow ──────────────────────────────────────────────
export function Eyebrow({
  children,
  tone = "ash",
}: {
  children: ReactNode;
  tone?: "ash" | "copper";
}) {
  const color = tone === "copper" ? "text-copper" : "text-ash";
  return (
    <div
      className={`font-sans text-[11px] font-semibold uppercase ${color}`}
      style={{ letterSpacing: "0.14em" }}
    >
      {children}
    </div>
  );
}

// ── Section heading ──────────────────────────────────────
export function SectionHeading({
  children,
  first = false,
}: {
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <h2
      className={`font-serif font-semibold text-[24px] leading-tight text-paper ${
        first ? "mt-0 mb-4" : "mt-10 mb-4"
      }`}
    >
      {children}
    </h2>
  );
}

// ── Back link ────────────────────────────────────────────
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="font-sans text-[13px] text-fog no-underline inline-block mb-3 hover:text-paper hover:no-underline"
    >
      {children}
    </a>
  );
}

// ── Badge ────────────────────────────────────────────────
type BadgeTone = "neutral" | "copper" | "red" | "orange" | "yellow" | "green";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const styles = badgeToneStyle(tone);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] font-sans text-[11px] font-semibold uppercase rounded-[var(--radius-badge)] border whitespace-nowrap"
      style={{ ...styles, letterSpacing: "0.04em" }}
    >
      {children}
    </span>
  );
}

function badgeToneStyle(tone: BadgeTone): { background: string; color: string; borderColor: string } {
  switch (tone) {
    case "copper":
      return { background: "var(--copper-wash)", color: "var(--color-copper)", borderColor: "rgba(200,121,65,0.35)" };
    case "red":
      return { background: "var(--risk-red-wash)", color: "var(--color-risk-red)", borderColor: "rgba(214,69,69,0.35)" };
    case "orange":
      return { background: "var(--risk-orange-wash)", color: "var(--color-risk-orange)", borderColor: "rgba(224,138,62,0.35)" };
    case "yellow":
      return { background: "var(--risk-yellow-wash)", color: "var(--color-risk-yellow)", borderColor: "rgba(212,168,67,0.35)" };
    case "green":
      return { background: "var(--risk-green-wash)", color: "var(--color-risk-green)", borderColor: "rgba(74,154,91,0.35)" };
    case "neutral":
    default:
      return { background: "var(--color-slate)", color: "var(--color-fog)", borderColor: "var(--color-steel)" };
  }
}

// ── Status badge ─────────────────────────────────────────
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ash">—</span>;
  const lower = status.toLowerCase();
  let tone: BadgeTone = "yellow";
  if (lower.includes("closed") || lower.includes("resolved") || lower.includes("complete")) tone = "green";
  else if (lower.includes("issued")) tone = "green";
  else if (lower.includes("expired")) tone = "orange";
  else if (lower.includes("open") || lower.includes("unresolved") || lower.includes("assigned")) tone = "red";
  else if (
    lower.includes("hearing") ||
    lower.includes("pending") ||
    lower.includes("notice") ||
    lower.includes("reassigned") ||
    lower.includes("reinspection")
  )
    tone = "orange";
  return <Badge tone={tone}>{status}</Badge>;
}

// ── Data table ───────────────────────────────────────────
export function DataTable({
  headers,
  rows,
  empty = "No records.",
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <div className="text-sm text-ash italic">{empty}</div>;
  }
  return (
    <div className="border border-steel rounded-[var(--radius-card)] overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-semibold text-ash uppercase text-[11px] px-[14px] py-[10px] border-b border-steel"
                style={{ letterSpacing: "0.08em" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, idx) => (
            <tr
              key={idx}
              className={`transition-colors duration-150 hover:bg-slate-2 ${
                idx === rows.length - 1 ? "" : "border-b border-steel"
              }`}
            >
              {cells.map((c, i) => (
                <td key={i} className="px-[14px] py-[11px] text-paper align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stat (landing-grid) ─────────────────────────────────
export function Stat({
  number,
  label,
  sublabel,
  tone,
}: {
  number: string;
  label: string;
  sublabel?: string;
  tone?: "red" | "orange" | "yellow" | "green";
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
    <div>
      <div
        className={`font-serif font-bold text-[32px] leading-[1.05] tabular-nums ${toneClass}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        {number}
      </div>
      <div
        className="text-[11px] uppercase text-ash mt-2 font-semibold"
        style={{ letterSpacing: "0.14em" }}
      >
        {label}
      </div>
      {sublabel && <div className="text-xs text-ash mt-1">{sublabel}</div>}
    </div>
  );
}

// ── Mono ─────────────────────────────────────────────────
export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[13px] tabular-nums ${className}`} style={{ letterSpacing: "-0.01em" }}>
      {children}
    </span>
  );
}

// Re-export the bucket helper so consumers can grab it from the same module.
export { riskBucket };
