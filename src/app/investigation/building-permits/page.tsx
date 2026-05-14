import { Finding, H2, InvestigationPage, P } from "@/components/InvestigationLayout";

export const metadata = { title: "Building permits — Municipal" };

export default function BuildingPermitsPage() {
  return (
    <InvestigationPage
      eyebrow="Investigation · Building permits"
      title="Permit revenue dropped 60% in one fiscal year."
    >
      <P>
        Building Department fee revenue fell from <span className="text-paper font-mono">$14.5M</span>{" "}
        in FY24 to <span className="text-paper font-mono">$5.8M</span> in FY25. The proposed FY26
        budget does not explain the drop.
      </P>

      <Finding
        section="§01"
        label="FY24 building permit revenue"
        number="$14.5M"
        source="Monthly financial report, June 2024"
      />
      <Finding
        section="§02"
        label="FY25 building permit revenue"
        number="$5.8M"
        source="Monthly financial report, June 2025"
        tone="red"
      />
      <Finding
        section="§03"
        label="Year-over-year change"
        number="−60%"
        source="Derived"
        tone="red"
      />

      <H2>Open questions</H2>
      <P>
        Were permit volumes down, or was the city not collecting fees that were due? Either
        explanation has consequences. A FOIA request for the CitySquared audit log is
        drafted and pending submission.
      </P>
    </InvestigationPage>
  );
}
