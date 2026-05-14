import { Finding, H2, InvestigationPage, P } from "@/components/InvestigationLayout";

export const metadata = { title: "Healthcare — Municipal" };

export default function HealthcarePage() {
  return (
    <InvestigationPage
      eyebrow="Investigation · Healthcare"
      title="$33,000 per employee — about twice the peer-city average."
    >
      <P>
        New Haven is the only major Connecticut city still operating as a self-insured
        employer with Anthem as administrative services only (ASO). The per-employee cost
        of the city&rsquo;s health plan is substantially higher than comparable cities that
        moved to fully insured or pooled plans.
      </P>

      <Finding
        section="§01"
        label="Per-employee health benefit cost"
        number="~$33,000"
        source="FY25 budget book — Employee Benefits line"
        tone="red"
      />
      <Finding
        section="§02"
        label="Peer-city average (CT)"
        number="~$16,500"
        source="MPCC / CCM benchmarking"
      />

      <H2>What we&rsquo;ve asked the city</H2>
      <P>
        FOIA #2026-PRR-0426 requests the Anthem ASO contract and stop-loss reinsurance
        terms. No response within the statutory deadline. A FOIC complaint has been filed.
      </P>
    </InvestigationPage>
  );
}
