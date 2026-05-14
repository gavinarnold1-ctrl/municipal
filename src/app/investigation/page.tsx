import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";

export const metadata = {
  title: "Investigation — Municipal",
};

const sections = [
  {
    href: "/investigation/healthcare",
    title: "Healthcare: $33K per employee",
    summary:
      "New Haven spends roughly twice peer cities on health benefits per FTE. Only major CT city still self-insured with Anthem ASO.",
  },
  {
    href: "/investigation/lci",
    title: "LCI: 952 unresolved complaints",
    summary:
      "Of 3,590 complaints on file, 952 remain open. Oldest dateable: 2012. Code enforcement closes ~3.7% of complaints with a citation.",
  },
  {
    href: "/investigation/networks",
    title: "LLC network mapping",
    summary:
      "Seven networks. 459 properties. Detected by substring patterns on owner names. Per-network rollups for properties, open complaints, expired licenses, and combined risk.",
  },
  {
    href: "/investigation/budget",
    title: "Budget signals (FY24–FY25)",
    summary:
      "Ten numbers from the city's own budget documents — including OPEB, P&F pension, and police overtime growth.",
  },
  {
    href: "/investigation/foia",
    title: "FOIA tracker",
    summary:
      "Open public-records requests. One has a FOIC complaint pending for non-response.",
  },
  {
    href: "/investigation/building-permits",
    title: "Building permits: $14.5M → $5.8M",
    summary:
      "Building Department revenue dropped 60% from FY24 to FY25. The drop is not explained in the proposed budget.",
  },
];

export default function InvestigationIndex() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-12">
      <Eyebrow tone="copper">The investigation</Eyebrow>
      <h1
        className="font-serif font-bold text-paper tracking-tight leading-[1.1] mt-3"
        style={{ fontSize: "var(--t-h1)", letterSpacing: "-0.015em" }}
      >
        Investigation
      </h1>
      <p className="mt-3 text-fog max-w-2xl" style={{ fontSize: 15, lineHeight: 1.7 }}>
        Findings drawn from New Haven&rsquo;s own budget documents, monthly financial reports,
        and Livable City Initiative dashboards. Every number cites its source.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="no-underline">
            <Card hover className="h-full">
              <div
                className="font-serif font-bold text-paper"
                style={{ fontSize: 20, letterSpacing: "-0.01em" }}
              >
                {s.title}
              </div>
              <div className="mt-2 text-sm text-fog leading-relaxed">{s.summary}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
