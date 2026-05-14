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
import {
  computeRiskScore,
  detectLlcNetwork,
  riskBucket,
} from "@/lib/normalize";
import { Card, SectionHeading, Badge, DataTable, StatusBadge } from "@/components/ui";

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

  const score = computeRiskScore({
    openComplaints: openComplaintsN,
    expiredLicenses: expiredLicensesN,
    unresolvedBlight: unresolvedBlightN,
    pendingViolations: pendingViolationsN,
    totalComplaints: complaintRows.length,
  });
  const bucket = riskBucket(score);

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
      <div className="text-sm text-fog mb-3">
        <Link href="/" className="text-fog no-underline hover:text-paper hover:no-underline">
          ← Back to search
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold text-paper tracking-tight">
        {parcel.legalAddress}
      </h1>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-fog">
        {parcel.propertyClass && <Badge>{parcel.propertyClass}</Badge>}
        {parcel.parcelZone && <Badge>Zone {parcel.parcelZone}</Badge>}
        {parcel.taxesOwed && <Badge tone="red">Taxes owed</Badge>}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <div className="text-xs text-ash uppercase tracking-wider mb-2">Owner of record</div>
          {parcel.ownerName ? (
            ownerRow ? (
              <Link
                href={`/landlord/${ownerRow.id}`}
                className="font-serif text-2xl font-bold text-paper no-underline hover:text-copper hover:no-underline"
              >
                {parcel.ownerName}
              </Link>
            ) : (
              <div className="font-serif text-2xl font-bold text-paper">{parcel.ownerName}</div>
            )
          ) : (
            <div className="text-ash italic">Unknown</div>
          )}
          {ownerRow?.propertyCount != null && ownerRow.propertyCount > 1 && (
            <div className="mt-1 text-sm text-fog">
              Owns {ownerRow.propertyCount} properties in New Haven.
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
        </Card>

        <Card>
          <div className="text-xs text-ash uppercase tracking-wider mb-2">Risk score</div>
          <div
            className={`font-serif text-5xl font-bold tabular-nums leading-none ${
              bucket.tone === "red"
                ? "text-risk-red"
                : bucket.tone === "orange"
                  ? "text-risk-orange"
                  : bucket.tone === "yellow"
                    ? "text-risk-yellow"
                    : "text-risk-green"
            }`}
          >
            {score}
          </div>
          <div className="mt-2">
            <Badge tone={bucket.tone}>{bucket.label}</Badge>
          </div>
          <div className="mt-3 text-xs text-ash leading-relaxed">
            Composite of open complaints (×3), expired licenses, unresolved blight,
            pending violations, plus total complaint history.
          </div>
        </Card>
      </div>

      <SectionHeading>Complaints ({complaintRows.length})</SectionHeading>
      <DataTable
        headers={["Complaint #", "Filed", "Type", "Status", "Inspector"]}
        rows={complaintRows.map((r) => [
          <span key="n" className="font-mono text-xs">{r.complaintNumber}</span>,
          r.filedYear ? (
            <span key="y" className="tabular-nums">{r.filedYear}</span>
          ) : (
            <span key="y" className="text-ash">—</span>
          ),
          r.type ?? "—",
          <StatusBadge key="s" status={r.status} />,
          r.inspectorCode ?? "—",
        ])}
        empty="No complaints on file."
      />

      <SectionHeading>Rental licenses ({licenseRows.length})</SectionHeading>
      <DataTable
        headers={["License #", "Type", "Expiration", "Status"]}
        rows={licenseRows.map((r) => [
          <span key="n" className="font-mono text-xs">{r.licenseNumber}</span>,
          r.licenseType ?? "—",
          r.isExpired ? (
            <span className="text-risk-orange">{r.expirationDate}</span>
          ) : (
            r.expirationDate ?? "—"
          ),
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No rental licenses on file."
      />

      <SectionHeading>Anti-blight cases ({blightRows.length})</SectionHeading>
      <DataTable
        headers={["Case #", "Status"]}
        rows={blightRows.map((r) => [
          <span key="n" className="font-mono text-xs">{r.caseNumber}</span>,
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No anti-blight cases on file."
      />

      <SectionHeading>Housing code violations ({violationRows.length})</SectionHeading>
      <DataTable
        headers={["Case #", "Status"]}
        rows={violationRows.map((r) => [
          <span key="n" className="font-mono text-xs">{r.caseNumber}</span>,
          <StatusBadge key="s" status={r.status} />,
        ])}
        empty="No code violations on file."
      />
    </div>
  );
}
