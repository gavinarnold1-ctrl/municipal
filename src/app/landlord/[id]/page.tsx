import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { owners, parcels, llcNetworks } from "@/db/schema";
import { Badge, BackLink, DataTable, Mono, SectionHeading } from "@/components/ui";
import { RiskScoreCard } from "@/components/RiskScoreCard";

export const dynamic = "force-dynamic";

function fmt(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

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

  // ── LLC network rollup (computed on-the-fly across all member entities) ──
  type NetworkInfo = {
    entityCount: number | null;
    propertyCount: number | null;
    description: string | null;
  };
  type NetworkTotals = {
    properties: number;
    openComplaints: number;
    expiredLicenses: number;
    unresolvedBlight: number;
    pendingViolations: number;
    totalComplaints: number;
    riskScore: number;
  };
  type NetworkPeer = {
    id: number;
    name: string | null;
    propertyCount: number | null;
    riskScore: number | null;
  };

  let networkInfo: NetworkInfo | null = null;
  let networkPeers: NetworkPeer[] = [];
  let networkTotals: NetworkTotals | null = null;
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

    const [rollup] = await db
      .select({
        properties: sql<number>`COALESCE(SUM(${owners.propertyCount}), 0)::int`,
        openComplaints: sql<number>`COALESCE(SUM(${owners.openComplaints}), 0)::int`,
        expiredLicenses: sql<number>`COALESCE(SUM(${owners.expiredLicenses}), 0)::int`,
        unresolvedBlight: sql<number>`COALESCE(SUM(${owners.unresolvedBlight}), 0)::int`,
        pendingViolations: sql<number>`COALESCE(SUM(${owners.pendingViolations}), 0)::int`,
        totalComplaints: sql<number>`COALESCE(SUM(${owners.totalComplaints}), 0)::int`,
        riskScore: sql<number>`COALESCE(SUM(${owners.riskScore}), 0)::int`,
      })
      .from(owners)
      .where(eq(owners.llcNetwork, owner.llcNetwork));
    networkTotals = rollup ?? null;
  }

  const score = owner.riskScore ?? 0;

  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6 py-10">
      <BackLink href="/">← Back to search</BackLink>

      <h1
        className="font-serif font-bold text-paper leading-[1.1]"
        style={{ fontSize: "var(--t-h1)", letterSpacing: "-0.015em" }}
      >
        {owner.name}
      </h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{owner.propertyCount ?? 0} properties</Badge>
        {owner.llcNetwork && <Badge tone="copper">{owner.llcNetwork} network</Badge>}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]">
          <div className="text-fog" style={{ fontSize: 15, lineHeight: 1.7 }}>
            <span className="text-paper font-medium">{owner.name}</span> owns{" "}
            <span className="text-paper font-medium tabular-nums">{fmt(owner.propertyCount)}</span> properties
            in New Haven with{" "}
            <span className="text-risk-red font-medium tabular-nums">{fmt(owner.openComplaints)}</span> open
            complaints,{" "}
            <span className="text-risk-orange font-medium tabular-nums">{fmt(owner.expiredLicenses)}</span>{" "}
            expired licenses,{" "}
            <span className="text-risk-red font-medium tabular-nums">{fmt(owner.unresolvedBlight)}</span>{" "}
            unresolved blight cases, and{" "}
            <span className="text-risk-orange font-medium tabular-nums">{fmt(owner.pendingViolations)}</span>{" "}
            pending code violations. Total of{" "}
            <span className="text-paper font-medium tabular-nums">{fmt(owner.totalComplaints)}</span>{" "}
            complaints across the portfolio.
          </div>
        </div>

        <RiskScoreCard score={score} label="Portfolio risk" />
      </div>

      {networkInfo && networkTotals && (
        <>
          <SectionHeading>{owner.llcNetwork} network · rolled up</SectionHeading>
          <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]">
            <div className="text-fog" style={{ fontSize: 15, lineHeight: 1.7 }}>
              {networkInfo.description}
            </div>
            <div className="text-xs text-ash mt-3 tabular-nums">
              {fmt(networkInfo.entityCount)} affiliated entities ·{" "}
              {fmt(networkInfo.propertyCount ?? networkTotals.properties)} properties total
            </div>

            <div className="mt-5 pt-5 border-t border-steel grid grid-cols-2 md:grid-cols-4 gap-4">
              <RollupCell
                label="Open complaints"
                value={fmt(networkTotals.openComplaints)}
                tone={networkTotals.openComplaints > 0 ? "red" : undefined}
              />
              <RollupCell
                label="Expired licenses"
                value={fmt(networkTotals.expiredLicenses)}
                tone={networkTotals.expiredLicenses > 0 ? "orange" : undefined}
              />
              <RollupCell
                label="Unresolved blight"
                value={fmt(networkTotals.unresolvedBlight)}
                tone={networkTotals.unresolvedBlight > 0 ? "red" : undefined}
              />
              <RollupCell
                label="Pending violations"
                value={fmt(networkTotals.pendingViolations)}
                tone={networkTotals.pendingViolations > 0 ? "orange" : undefined}
              />
              <RollupCell label="Total complaints" value={fmt(networkTotals.totalComplaints)} />
              <RollupCell label="Combined risk score" value={fmt(networkTotals.riskScore)} />
            </div>
          </div>

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
                  <span key="c" className="tabular-nums">{fmt(p.propertyCount)}</span>,
                  <span
                    key="r"
                    className={`tabular-nums ${
                      (p.riskScore ?? 0) >= 75
                        ? "text-risk-red"
                        : (p.riskScore ?? 0) >= 30
                          ? "text-risk-orange"
                          : "text-paper"
                    }`}
                  >
                    {fmt(p.riskScore)}
                  </span>,
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
          <Mono key="z" className="text-fog">{p.parcelZone ?? "—"}</Mono>,
        ])}
        empty="No properties found."
      />
    </div>
  );
}

function RollupCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "orange";
}) {
  const toneClass =
    tone === "red" ? "text-risk-red" : tone === "orange" ? "text-risk-orange" : "text-paper";
  return (
    <div>
      <div
        className={`font-serif font-bold tabular-nums leading-none ${toneClass}`}
        style={{ fontSize: 26, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div
        className="text-[11px] uppercase text-ash mt-2 font-semibold"
        style={{ letterSpacing: "0.14em" }}
      >
        {label}
      </div>
    </div>
  );
}
