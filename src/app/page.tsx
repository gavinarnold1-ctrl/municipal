import { AddressSearch } from "@/components/AddressSearch";
import { Stat } from "@/components/ui";
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
        <h1
          className="font-serif font-bold text-paper leading-[1.04]"
          style={{
            fontSize: "var(--t-display)",
            letterSpacing: "-0.02em",
          }}
        >
          Look up any New Haven rental.
        </h1>
        <p className="mt-6 text-fog max-w-2xl" style={{ fontSize: 15, lineHeight: 1.7 }}>
          Search an address to see the landlord, complaint history, license status,
          and a risk score. Built from the city&rsquo;s own public records.
        </p>

        <div className="mt-10 max-w-2xl">
          <AddressSearch />
          <div className="mt-3 text-xs text-ash">
            Try <span className="text-fog font-mono">165 Church St</span>,{" "}
            <span className="text-fog font-mono">222 Hallock Ave</span>, or any New Haven address.
          </div>
        </div>
      </section>

      <section className="border-t border-steel pt-10 pb-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        <Stat
          number={stats ? formatNumber(stats.totalParcels) : "—"}
          label="Parcels indexed"
        />
        <Stat
          number={stats ? formatNumber(stats.totalComplaints) : "—"}
          label="Complaints on file"
          sublabel={stats ? `${formatNumber(stats.openComplaints)} unresolved` : undefined}
        />
        <Stat
          number={stats ? formatNumber(stats.expiredLicenses) : "—"}
          label="Expired licenses"
          sublabel={stats ? `of ${formatNumber(stats.totalLicenses)} total` : undefined}
          tone="orange"
        />
        <Stat
          number={stats ? formatNumber(stats.openBlight + stats.openViolations) : "—"}
          label="Open blight & code"
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
