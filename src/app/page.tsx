import { AddressSearch } from "@/components/AddressSearch";
import { getLandingStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

async function safeStats() {
  try {
    return await getLandingStats();
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await safeStats();

  return (
    <div className="mx-auto w-full max-w-[var(--container-content)] px-6">
      <section className="pt-20 pb-12">
        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-paper leading-[1.05]">
          Look up any New Haven rental.
        </h1>
        <p className="mt-6 text-lg text-fog max-w-2xl">
          Search an address to see the landlord, complaint history, license status,
          and a risk score. Built from the city&rsquo;s own public records.
        </p>

        <div className="mt-10 max-w-2xl">
          <AddressSearch />
          <div className="mt-3 text-xs text-ash">
            Try <span className="text-fog">165 Church St</span>,{" "}
            <span className="text-fog">222 Hallock Ave</span>, or any New Haven address.
          </div>
        </div>
      </section>

      <section className="border-t border-steel pt-10 pb-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat
          number={stats ? formatNumber(stats.totalParcels) : "—"}
          label="Parcels indexed"
        />
        <Stat
          number={stats ? formatNumber(stats.totalComplaints) : "—"}
          label="Complaints on file"
          sublabel={
            stats
              ? `${formatNumber(stats.openComplaints)} unresolved`
              : undefined
          }
        />
        <Stat
          number={stats ? formatNumber(stats.expiredLicenses) : "—"}
          label="Expired rental licenses"
          sublabel={stats ? `of ${formatNumber(stats.totalLicenses)} total` : undefined}
          tone="orange"
        />
        <Stat
          number={stats ? formatNumber(stats.openBlight + stats.openViolations) : "—"}
          label="Open blight & code cases"
          tone="red"
        />
      </section>

      <section className="border-t border-steel pt-8 pb-20 text-sm text-fog">
        <p>
          Municipal compiles records from the New Haven Livable City Initiative
          (Veoci) and CitySquared property data. It is a tool for tenants, journalists,
          and the public — not a substitute for legal advice.
        </p>
      </section>
    </div>
  );
}

function Stat({
  number,
  label,
  sublabel,
  tone,
}: {
  number: string;
  label: string;
  sublabel?: string;
  tone?: "red" | "orange" | "yellow" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "text-risk-red"
      : tone === "orange"
        ? "text-risk-orange"
        : tone === "yellow"
          ? "text-risk-yellow"
          : tone === "green"
            ? "text-risk-green"
            : "text-paper";
  return (
    <div>
      <div className={`font-serif text-3xl font-bold tabular-nums ${toneClass}`}>
        {number}
      </div>
      <div className="text-xs text-fog uppercase tracking-wider mt-1">{label}</div>
      {sublabel && <div className="text-xs text-ash mt-0.5">{sublabel}</div>}
    </div>
  );
}
