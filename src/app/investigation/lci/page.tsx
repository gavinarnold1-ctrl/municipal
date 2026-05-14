import { Finding, H2, InvestigationPage, P } from "@/components/InvestigationLayout";

export const metadata = { title: "LCI — Municipal" };

export default function LciPage() {
  return (
    <InvestigationPage
      eyebrow="Investigation · Code enforcement"
      title="Complaints sit open for years."
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
        label="Oldest dateable open complaint"
        number="2012"
        source="Derived from complaint number year segment (e.g. C-12-…)"
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

      <P>
        About 47% of complaints in the dataset can be dated from their ID (Veoci adopted the
        <span className="text-paper"> C-YY-NNNNN</span> format around 2010). The rest use a
        legacy <span className="text-paper">C-NNNNN</span> format with no year segment —
        meaning the true oldest open complaint may pre-date 2012.
      </P>
    </InvestigationPage>
  );
}
