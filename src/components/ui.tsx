import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-slate border border-steel rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-2xl font-bold text-paper mb-4 mt-10 first:mt-0">{children}</h2>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "copper" | "red" | "orange" | "yellow" | "green";
}) {
  const toneClass =
    tone === "copper"
      ? "bg-copper/15 text-copper border-copper/30"
      : tone === "red"
        ? "bg-risk-red/15 text-risk-red border-risk-red/30"
        : tone === "orange"
          ? "bg-risk-orange/15 text-risk-orange border-risk-orange/30"
          : tone === "yellow"
            ? "bg-risk-yellow/15 text-risk-yellow border-risk-yellow/30"
            : tone === "green"
              ? "bg-risk-green/15 text-risk-green border-risk-green/30"
              : "bg-steel text-fog border-steel";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 border rounded-[var(--radius-badge)] ${toneClass}`}
    >
      {children}
    </span>
  );
}

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
      <table className="w-full text-sm">
        <thead className="bg-slate">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-medium text-ash uppercase tracking-wider text-xs px-4 py-3 border-b border-steel"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, idx) => (
            <tr key={idx} className="border-b border-steel last:border-b-0 hover:bg-slate/50">
              {cells.map((c, i) => (
                <td key={i} className="px-4 py-3 text-paper align-top">
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

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ash">—</span>;
  const lower = status.toLowerCase();
  if (lower.includes("closed") || lower.includes("resolved") || lower.includes("complete")) {
    return <Badge tone="green">{status}</Badge>;
  }
  if (lower.includes("hearing") || lower.includes("pending") || lower.includes("notice")) {
    return <Badge tone="orange">{status}</Badge>;
  }
  if (lower.includes("issued")) {
    return <Badge tone="green">{status}</Badge>;
  }
  return <Badge tone="yellow">{status}</Badge>;
}
