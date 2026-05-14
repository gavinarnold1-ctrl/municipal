import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { llcNetworks, owners } from "@/db/schema";
import { InvestigationPage, P } from "@/components/InvestigationLayout";
import { Badge, DataTable, Mono } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "LLC network mapping — Municipal" };

type NetworkRow = {
  name: string;
  description: string | null;
  entities: number;
  properties: number;
  openComplaints: number;
  expiredLicenses: number;
  unresolvedBlight: number;
  pendingViolations: number;
  totalComplaints: number;
  combinedRisk: number;
  largestEntityId: number | null;
  largestEntityName: string | null;
};

async function fetchNetworks(): Promise<NetworkRow[]> {
  // Rollup over owners grouped by llc_network. Joins llc_networks for description.
  const rollups = await db
    .select({
      name: owners.llcNetwork,
      entities: sql<number>`COUNT(*)::int`,
      properties: sql<number>`COALESCE(SUM(${owners.propertyCount}), 0)::int`,
      openComplaints: sql<number>`COALESCE(SUM(${owners.openComplaints}), 0)::int`,
      expiredLicenses: sql<number>`COALESCE(SUM(${owners.expiredLicenses}), 0)::int`,
      unresolvedBlight: sql<number>`COALESCE(SUM(${owners.unresolvedBlight}), 0)::int`,
      pendingViolations: sql<number>`COALESCE(SUM(${owners.pendingViolations}), 0)::int`,
      totalComplaints: sql<number>`COALESCE(SUM(${owners.totalComplaints}), 0)::int`,
      combinedRisk: sql<number>`COALESCE(SUM(${owners.riskScore}), 0)::int`,
    })
    .from(owners)
    .where(sql`${owners.llcNetwork} IS NOT NULL`)
    .groupBy(owners.llcNetwork);

  // Pull descriptions
  const descRows = await db
    .select({ name: llcNetworks.name, description: llcNetworks.description })
    .from(llcNetworks);
  const descByName = new Map<string, string | null>();
  for (const r of descRows) {
    if (r.name) descByName.set(r.name, r.description);
  }

  // For each network, find the largest member entity (most properties).
  const networks: NetworkRow[] = [];
  for (const r of rollups) {
    if (!r.name) continue;
    const [largest] = await db
      .select({ id: owners.id, name: owners.name })
      .from(owners)
      .where(eq(owners.llcNetwork, r.name))
      .orderBy(desc(owners.propertyCount))
      .limit(1);
    networks.push({
      name: r.name,
      description: descByName.get(r.name) ?? null,
      entities: r.entities,
      properties: r.properties,
      openComplaints: r.openComplaints,
      expiredLicenses: r.expiredLicenses,
      unresolvedBlight: r.unresolvedBlight,
      pendingViolations: r.pendingViolations,
      totalComplaints: r.totalComplaints,
      combinedRisk: r.combinedRisk,
      largestEntityId: largest?.id ?? null,
      largestEntityName: largest?.name ?? null,
    });
  }

  networks.sort((a, b) => b.combinedRisk - a.combinedRisk);
  return networks;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default async function NetworksPage() {
  let networks: NetworkRow[] = [];
  let totals = {
    networks: 0,
    entities: 0,
    properties: 0,
    openComplaints: 0,
    expiredLicenses: 0,
  };
  try {
    networks = await fetchNetworks();
    totals = networks.reduce(
      (acc, n) => ({
        networks: acc.networks + 1,
        entities: acc.entities + n.entities,
        properties: acc.properties + n.properties,
        openComplaints: acc.openComplaints + n.openComplaints,
        expiredLicenses: acc.expiredLicenses + n.expiredLicenses,
      }),
      totals,
    );
  } catch {
    // surface empty state below
  }

  return (
    <InvestigationPage
      eyebrow="Investigation · LLC mapping"
      title="Seven networks, hundreds of properties."
    >
      <P>
        New Haven&rsquo;s largest private landlords operate through clusters of affiliated
        LLCs — separate legal entities that share owners, mailing addresses, or registered
        agents. Detecting them requires looking past the owner-of-record on each individual
        deed. The seven networks below were identified by substring patterns on owner names
        ({" "}
        <span className="text-paper font-mono">NETZ*</span>,{" "}
        <span className="text-paper font-mono">SFR*</span>,{" "}
        <span className="text-paper font-mono">ABCD*</span>, etc.). Counts below roll up
        every member entity in each network.
      </P>

      <div className="bg-slate border border-steel rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] mt-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Summary label="Networks" value={fmt(totals.networks)} />
          <Summary label="Affiliated entities" value={fmt(totals.entities)} />
          <Summary label="Properties" value={fmt(totals.properties)} />
          <Summary
            label="Open complaints"
            value={fmt(totals.openComplaints)}
            tone={totals.openComplaints > 0 ? "red" : undefined}
          />
          <Summary
            label="Expired licenses"
            value={fmt(totals.expiredLicenses)}
            tone={totals.expiredLicenses > 0 ? "orange" : undefined}
          />
        </div>
      </div>

      <div className="mt-10">
        <DataTable
          headers={[
            "Network",
            "Entities",
            "Properties",
            "Open complaints",
            "Expired licenses",
            "Unresolved blight",
            "Combined risk",
          ]}
          rows={networks.map((n) => [
            <div key="n">
              {n.largestEntityId ? (
                <Link href={`/landlord/${n.largestEntityId}`} className="text-copper no-underline">
                  {n.name}
                </Link>
              ) : (
                <span className="text-paper">{n.name}</span>
              )}
              {n.largestEntityName && (
                <div className="text-xs text-ash mt-0.5">
                  Largest member: <span className="text-fog">{n.largestEntityName}</span>
                </div>
              )}
            </div>,
            <Mono key="ent">{n.entities}</Mono>,
            <Mono key="prop">{fmt(n.properties)}</Mono>,
            <Mono
              key="oc"
              className={n.openComplaints > 0 ? "text-risk-red" : "text-fog"}
            >
              {fmt(n.openComplaints)}
            </Mono>,
            <Mono
              key="exp"
              className={n.expiredLicenses > 0 ? "text-risk-orange" : "text-fog"}
            >
              {fmt(n.expiredLicenses)}
            </Mono>,
            <Mono
              key="bl"
              className={n.unresolvedBlight > 0 ? "text-risk-red" : "text-fog"}
            >
              {fmt(n.unresolvedBlight)}
            </Mono>,
            <RiskCell key="risk" score={n.combinedRisk} />,
          ])}
          empty="No LLC networks indexed yet."
        />
      </div>

      <div className="mt-10 space-y-4">
        {networks.map((n) => (
          <div
            key={n.name}
            className="bg-slate border border-steel rounded-[var(--radius-card)] p-5"
          >
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h3
                className="font-serif font-bold text-paper"
                style={{ fontSize: 22, letterSpacing: "-0.01em" }}
              >
                {n.name}
              </h3>
              <div className="flex gap-1.5">
                <Badge tone="copper">{n.entities} entities</Badge>
                <Badge>{fmt(n.properties)} properties</Badge>
              </div>
            </div>
            {n.description && (
              <div className="mt-3 text-fog" style={{ fontSize: 15, lineHeight: 1.7 }}>
                {n.description}
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm tabular-nums">
              <NumberCell
                label="Open complaints"
                value={fmt(n.openComplaints)}
                tone={n.openComplaints > 0 ? "red" : undefined}
              />
              <NumberCell
                label="Expired licenses"
                value={fmt(n.expiredLicenses)}
                tone={n.expiredLicenses > 0 ? "orange" : undefined}
              />
              <NumberCell
                label="Unresolved blight"
                value={fmt(n.unresolvedBlight)}
                tone={n.unresolvedBlight > 0 ? "red" : undefined}
              />
              <NumberCell
                label="Total complaints"
                value={fmt(n.totalComplaints)}
              />
              <NumberCell
                label="Combined risk"
                value={fmt(n.combinedRisk)}
                tone={n.combinedRisk >= 75 ? "red" : n.combinedRisk >= 30 ? "orange" : undefined}
              />
            </div>
            {n.largestEntityId && n.largestEntityName && (
              <div className="mt-4 text-xs text-ash">
                Open the portfolio for{" "}
                <Link href={`/landlord/${n.largestEntityId}`} className="text-copper">
                  {n.largestEntityName}
                </Link>{" "}
                to see every affiliated entity and every property.
              </div>
            )}
          </div>
        ))}
      </div>
    </InvestigationPage>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "orange";
}) {
  const toneClass = tone === "red" ? "text-risk-red" : tone === "orange" ? "text-risk-orange" : "text-paper";
  return (
    <div>
      <div
        className={`font-serif font-bold tabular-nums leading-none ${toneClass}`}
        style={{ fontSize: 32, letterSpacing: "-0.02em" }}
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

function NumberCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "red" | "orange";
}) {
  const toneClass = tone === "red" ? "text-risk-red" : tone === "orange" ? "text-risk-orange" : "text-paper";
  return (
    <div>
      <div className={`font-serif font-bold tabular-nums leading-none ${toneClass}`} style={{ fontSize: 22 }}>
        {value}
      </div>
      <div
        className="text-[11px] uppercase text-ash mt-1.5 font-semibold"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </div>
    </div>
  );
}

function RiskCell({ score }: { score: number }) {
  const toneClass =
    score >= 75 ? "text-risk-red" : score >= 30 ? "text-risk-orange" : score >= 15 ? "text-risk-yellow" : "text-paper";
  return <Mono className={toneClass}>{new Intl.NumberFormat("en-US").format(score)}</Mono>;
}
