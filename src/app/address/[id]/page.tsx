import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  parcels,
  complaints,
  licenses,
  antiBlight,
  housingCodeViolations,
  owners,
  llcNetworks,
} from "@/db/schema";
import { computeRiskScore, detectLlcNetwork } from "@/lib/normalize";
import { Badge, BackLink, DataTable, Mono, SectionHeading, StatusBadge } from "@/components/ui";
import { RiskScoreCard } from "@/components/RiskScoreCard";

export const dynamic = "force-dynamic";

function isOpen(s: string | null): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return !(lower.includes("closed") || lower.includes("resolved") || lower.includes("complete"));
}

export default async function AddressPage(props: PageProps<"/address/[id]">) {
  const { id: idStr } = await props.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id)).limit(1);
  if (!parcel) notFound();

  const [complaintRows, licenseRows, blightRows, violationRows] = await Promise.all([
    db
      .select()
      .from(complaints)
      .where(eq(complaints.parcelId, id))
      .orderBy(sql`${complaints.filedYear} DESC NULLS LAST`, desc(complaints.complaintNumber)),
    db.select().from(licenses).where(eq(licenses.parcelId, id)),
    db.select().from(antiBlight).where(eq(antiBlight.parcelId, id)),
    db.select().from(housingCodeViolations).where(eq(housingCodeViolations.parcelId, id)),
  ]);

  const openComplaintsN = complaintRows.filter((r) => isOpen(r.status)).length;
  const expiredLicensesN = licenseRows.filter((r) => r.isExpired).length;
  const unresolvedBlightN = blightRows.filter((r) => isOpen(r.status)).length;
  const pendingViolationsN = violationRows.filter((r) => isOpen(r.status)).length;
  const oldestOpenYear = complaintRows
    .filter((r) => isOpen(r.status) && r.filedYear !== null)
    .reduce<number | null>((min, r) => (min == null || (r.filedYear ?? 9999) < min ? r.filedYear : min), null);

  const score = computeRiskScore({
    openComplaints: openComplaintsN,
    expiredLicenses: expiredLicensesN,
    unresolvedBlight: unresolvedBlightN,
    pendingViolations: pendingViolationsN,
    totalComplaints: complaintRows.length,
  });

  const network = detectLlcNetwork(parcel.ownerName);
  let networkInfo: { entityCount: number | null; propertyCount: number | null } | null = null;
  if (network) {
    const [n] = await db
      .select({ entityCount: llcNetworks.entityCount, propertyCount: llcNetworks.propertyCount })
      .from(llcNetworks)
      .where(eq(llcNetworks.name, network))
      .limit(1);
    networkInfo = n ?? null;
  }

  let ownerRow: { id: number; propertyCount: number | null } | null = null;
  if (parcel.ownerName) {
    const [o] = await db
      .select({ id: owners.id, propertyCount: owners.propertyCount })
      .from(owners)
      .where(eq(owners.name, parcel.ownerName))
      .limit(1);
    ownerRow = o ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-10">
      <BackLink href="/">← Back to search</BackLink>

      <h1
        className="font-serif font-bold text-paper leading-[1.1]"
        style={{ fontSize: "var(--t-h1)", letterSpacing: "-0.015em" }}
      >
        {parcel.legalAddress}
      </h1>
      <div className="mt-3 flex flex-wrap gap-1.5 text-sm">
        {parcel.propertyClass && <Badge>{parcel.propertyClass}</Badge>}
        {parcel.parcelZone && <Badge>Zone {parcel.parcelZone}</Badge>}
        {parcel.taxesOwed && <Badge tone="red">Taxes owed</Badge>}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]">
          <div
            className="font-sans text-[11px] font-semibold uppercase text-ash"
            style={{ letterSpacing: "0.14em" }}
          >
            Owner of record
          </div>
          {parcel.ownerName ? (
            ownerRow ? (
              <Link
                href={`/landlord/${ownerRow.id}`}
                className="font-serif font-bold text-paper no-underline hover:text-copper hover:no-underline block mt-2"
                style={{ fontSize: 24, letterSpacing: "-0.01em" }}
              >
                {parcel.ownerName}
              </Link>
            ) : (
              <div
                className="font-serif font-bold text-paper mt-2"
                style={{ fontSize: 24, letterSpacing: "-0.01em" }}
              >
                {parcel.ownerName}
              </div>
            )
          ) : (
            <div className="text-ash italic mt-2">Unknown</div>
          )}
          {ownerRow?.propertyCount != null && ownerRow.propertyCount > 1 && (
            <div className="mt-2 text-sm text-fog">
              Owns <span className="tabular-nums text-paper">{ownerRow.propertyCount}</span> properties
              in New Haven.
            </div>
          )}
          {network && (
            <div className="mt-3">
              <Badge tone="copper">
                Part of {network} network
                {networkInfo?.propertyCount ? ` · ${networkInfo.propertyCount} properties` : ""}
              </Badge>
            </div>
          )}
        </div>

        <RiskScoreCard
          score={score}
          note={
            oldestOpenYear
              ? `Oldest open complaint at this address: ${oldestOpenYear}.`
              : "Composite of open complaints (×3), expired licenses, unresolved blight, pending violations, plus total complaint history."
          }
        />
      </div>

      <SectionHeading>Complaints ({complaintRows.length})</SectionHeading>
      <DataTable
        headers={["Complaint #", "Filed", "Type", "Status", "Inspector"]}
        rows={complaintRows.map((r) => [
          <Mono key="n">{r.complaintNumber}</Mono>,
          r.filedYear ? (
            <Mono key="y">{r.filedYear}</Mono>
          ) : (
            <span key="y" className="text-ash">—</span>
          ),
          r.type ?? "—",
          <StatusBadge key="s" status={r.status} />,
          <Mono key="i" className="text-fog">{r.inspectorCode ?? "—"}</Mono>,
        ])}
        empty="No complaints on file."
      />

      <SectionHeading>Rental licenses ({licenseRows.length})</SectionHeading>
      <DataTable
        headers={["License #", "Type", "Expiration", "Status"]}
        rows={licenseRows.map((r) => [
          <Mono key="n">{r.licenseNumber}</Mono>,
          r.licenseType ?? "—",
          r.isExpired ? (
            <Mono key="e" className="text-risk-orange">{r.expirationDate}</Mono>
          ) : (
            <Mono key="e">{r.expirationDate ?? "—"}</Mono>
          ),
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No rental licenses on file."
      />

      <SectionHeading>Anti-blight cases ({blightRows.length})</SectionHeading>
      <DataTable
        headers={["Case #", "Status"]}
        rows={blightRows.map((r) => [
          <Mono key="n">{r.caseNumber}</Mono>,
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No anti-blight cases on file."
      />

      <SectionHeading>Housing code violations ({violationRows.length})</SectionHeading>
      <DataTable
        headers={["Case #", "Status"]}
        rows={violationRows.map((r) => [
          <Mono key="n">{r.caseNumber}</Mono>,
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No code violations on file."
      />
    </div>
  );
}
