import { Finding, H2, InvestigationPage, P } from "@/components/InvestigationLayout";

export const metadata = { title: "Budget signals — Municipal" };

export default function BudgetPage() {
  return (
    <InvestigationPage
      eyebrow="Investigation · Budget"
      title="Nine numbers from the city's own budget."
    >
      <P>
        These figures are drawn from the FY24–FY25 budget book, the monthly financial
        reports, the ACFR, and OPEB / pension actuarial reports. Each cites its source.
      </P>

      <H2>Healthcare</H2>
      <Finding
        label="Per-employee health benefits cost"
        number="~$33,000"
        source="FY25 budget book — Employee Benefits"
        tone="red"
      />

      <H2>Police overtime</H2>
      <Finding
        label="FY20 police overtime"
        number="$4.0M"
        source="ACFR FY20 — Public Safety expenditures"
      />
      <Finding
        label="FY25 police overtime"
        number="$14.0M"
        source="Monthly financial report, March 2026"
        tone="red"
      />

      <H2>Parking Authority</H2>
      <Finding
        label="Round-trip transaction"
        number="$3.0M"
        source="FY25 budget book — Parking Authority transfers"
        tone="orange"
      />

      <H2>Building permits</H2>
      <Finding
        label="FY24 revenue"
        number="$14.5M"
        source="Monthly financial report, June 2024"
      />
      <Finding
        label="FY25 revenue"
        number="$5.8M"
        source="Monthly financial report, June 2025"
        tone="red"
      />

      <H2>Long-term liabilities</H2>
      <Finding
        label="OPEB unfunded liability"
        number="$693M"
        source="FY24 ACFR — OPEB note"
        tone="red"
      />
      <Finding
        label="OPEB liability as % of general fund"
        number="94.5%"
        source="Derived from FY24 ACFR"
        tone="red"
      />
      <Finding
        label="P&F pension funded ratio"
        number="35.6%"
        source="P&F Pension Board actuarial report 2025"
        tone="red"
      />
      <Finding
        label="P&F unfunded pension liability"
        number="$682M"
        source="P&F Pension Board actuarial report 2025"
        tone="red"
      />
    </InvestigationPage>
  );
}
