import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { owners, parcels, llcNetworks } from "@/db/schema";
import { riskBucket } from "@/lib/normalize";
import { Card, SectionHeading, Badge, DataTable } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LandlordPage(props: PageProps<"/landlord/[id]">) {
  const { id: idStr } = await props.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const [owner] = await db.select().from(owners).where(eq(owners.id, id)).limit(1);
  if (!owner) notFound();

  const ownedParcels = owner.name
    ? await db
        .select({
          id: parcels.id,
          legalAddress: parcels.legalAddress,
          propertyClass: parcels.propertyClass,
          parcelZone: parcels.parcelZone,
          unitNo: parcels.unitNo,
        })
        .from(parcels)
        .where(eq(parcels.ownerName, owner.name))
        .orderBy(parcels.legalAddress)
    : [];

  let networkInfo: { entityCount: number | null; propertyCount: number | null; description: string | null } | null =
    null;
  let networkPeers: Array<{ id: number; name: string | null; propertyCount: number | null; riskScore: number | null }> = [];
  if (owner.llcNetwork) {
    const [n] = await db
      .select({
        entityCount: llcNetworks.entityCount,
        propertyCount: llcNetworks.propertyCount,
        description: llcNetworks.description,
      })
      .from(llcNetworks)
      .where(eq(llcNetworks.name, owner.llcNetwork))
      .limit(1);
    networkInfo = n ?? null;

    networkPeers = await db
      .select({
        id: owners.id,
        name: owners.name,
        propertyCount: owners.propertyCount,
        riskScore: owners.riskScore,
      })
      .from(owners)
      .where(eq(owners.llcNetwork, owner.llcNetwork))
      .orderBy(desc(owners.propertyCount));
  }

  const score = owner.riskScore ?? 0;
  const bucket = riskBucket(score);

  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-10">
      <div className="text-sm text-fog mb-3">
        <Link href="/" className="text-fog no-underline hover:text-paper hover:no-underline">
          ← Back to search
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold text-paper tracking-tight">{owner.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge>{owner.propertyCount ?? 0} properties</Badge>
        {owner.llcNetwork && <Badge tone="copper">{owner.llcNetwork} network</Badge>}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <div className="text-sm text-fog leading-relaxed">
            <span className="text-paper font-medium">{owner.name}</span> owns{" "}
            <span className="text-paper font-medium">{owner.propertyCount ?? 0}</span> properties
            in New Haven with{" "}
            <span className="text-risk-red font-medium">{owner.openComplaints ?? 0}</span> open
            complaints,{" "}
            <span className="text-risk-orange font-medium">{owner.expiredLicenses ?? 0}</span>{" "}
            expired licenses,{" "}
            <span className="text-risk-red font-medium">{owner.unresolvedBlight ?? 0}</span>{" "}
            unresolved blight cases, and{" "}
            <span className="text-risk-orange font-medium">{owner.pendingViolations ?? 0}</span>{" "}
            pending code violations.
            Total of {owner.totalComplaints ?? 0} complaints across the portfolio.
          </div>
        </Card>

        <Card>
          <div className="text-xs text-ash uppercase tracking-wider mb-2">Portfolio risk</div>
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
        </Card>
      </div>

      {networkInfo && (
        <>
          <SectionHeading>{owner.llcNetwork} network</SectionHeading>
          <Card>
            <div className="text-sm text-fog leading-relaxed">{networkInfo.description}</div>
            <div className="mt-3 text-xs text-ash">
              {networkInfo.entityCount ?? "—"} affiliated entities ·{" "}
              {networkInfo.propertyCount ?? "—"} properties total
            </div>
          </Card>

          {networkPeers.length > 1 && (
            <>
              <SectionHeading>Affiliated entities</SectionHeading>
              <DataTable
                headers={["Entity", "Properties", "Risk score"]}
                rows={networkPeers.map((p) => [
                  p.id === owner.id ? (
                    <span key="n" className="text-paper">
                      {p.name} <span className="text-ash text-xs">(this owner)</span>
                    </span>
                  ) : (
                    <Link key="n" href={`/landlord/${p.id}`} className="text-copper">
                      {p.name}
                    </Link>
                  ),
                  <span key="c" className="tabular-nums">{p.propertyCount ?? 0}</span>,
                  <span key="r" className="tabular-nums">{p.riskScore ?? 0}</span>,
                ])}
              />
            </>
          )}
        </>
      )}

      <SectionHeading>Properties ({ownedParcels.length})</SectionHeading>
      <DataTable
        headers={["Address", "Class", "Zone"]}
        rows={ownedParcels.map((p) => [
          <Link key="a" href={`/address/${p.id}`} className="text-copper">
            {p.legalAddress}
            {p.unitNo ? <span className="text-ash"> · Unit {p.unitNo}</span> : null}
          </Link>,
          p.propertyClass ?? "—",
          p.parcelZone ?? "—",
        ])}
        empty="No properties found."
      />
    </div>
  );
}
