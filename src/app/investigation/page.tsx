import Link from "next/link";
import { Card } from "@/components/ui";

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
    href: "/investigation/budget",
    title: "Budget signals (FY24–FY25)",
    summary:
      "Nine numbers from the city's own budget documents — including OPEB, P&F pension, and police overtime growth.",
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
      <h1 className="font-serif text-4xl font-bold text-paper tracking-tight">Investigation</h1>
      <p className="mt-3 text-fog max-w-2xl">
        Findings drawn from New Haven&rsquo;s own budget documents, monthly financial reports,
        and Livable City Initiative dashboards. Every number cites its source.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="no-underline">
            <Card className="h-full hover:border-copper transition-colors">
              <div className="font-serif text-xl font-bold text-paper">{s.title}</div>
              <div className="mt-2 text-sm text-fog">{s.summary}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
