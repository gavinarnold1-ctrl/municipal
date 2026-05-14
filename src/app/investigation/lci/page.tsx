import { Finding, H2, InvestigationPage, P } from "@/components/InvestigationLayout";

export const metadata = { title: "LCI — Municipal" };

export default function LciPage() {
  return (
    <InvestigationPage
      eyebrow="Investigation · Code enforcement"
      title="952 complaints unresolved. Oldest: 2010."
    >
      <P>
        The Livable City Initiative receives thousands of tenant complaints each year, but
        the public-facing Veoci dashboard shows a large backlog of open and reassigned
        complaints — some more than a decade old.
      </P>

      <Finding
        label="Total complaints on file"
        number="3,590"
        source="LCI Veoci dashboard, snapshot 2026-04-24"
      />
      <Finding
        label="Open / unresolved"
        number="952"
        source="LCI Veoci dashboard, snapshot 2026-04-24"
        tone="red"
      />
      <Finding
        label="Closed with citation"
        number="~3.7%"
        source="Derived from Veoci dashboard status field"
        tone="orange"
      />

      <H2>What this means for renters</H2>
      <P>
        Filing a complaint with LCI is a slow path. Of complaints filed five years ago,
        nearly one in four is still showing an open status today.
      </P>
    </InvestigationPage>
  );
}
