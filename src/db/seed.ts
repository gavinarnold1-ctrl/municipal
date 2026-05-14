import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Papa from "papaparse";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import {
  parcels,
  complaints,
  licenses,
  antiBlight,
  housingCodeViolations,
  owners,
  llcNetworks,
  foiaRequests,
} from "./schema";
import {
  computeRiskScore,
  detectLlcNetwork,
  normalizeAddress,
} from "../lib/normalize";

const LCI_DIR = join(homedir(), "lci-scraper", "lci_data");
const CITYSQUARED_DIR = join(homedir(), "lci-scraper", "citysquared_data");

const conn = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);
const db = drizzle(conn, { schema });

function readCsv<T>(path: string): T[] {
  if (!existsSync(path)) {
    console.warn(`  ⚠ ${path} not found, skipping`);
    return [];
  }
  const raw = readFileSync(path, "utf8");
  const parsed = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return parsed.data;
}

function parseExpiration(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  // "2019-Mar-31 00:00" → Date
  const match = raw.match(/^(\d{4})-([A-Za-z]+)-(\d{2})/);
  if (!match) return null;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const m = months[match[2]];
  if (m === undefined) return null;
  return new Date(Date.UTC(Number(match[1]), m, Number(match[3])));
}

type ParcelRow = {
  Parcel_ID: string;
  PrintKey: string;
  LegalAddress: string;
  Latitude: string;
  Longitude: string;
  PropertyClass: string;
  ParcelZone: string;
  TaxesOwed: string;
  LegalCity: string;
  LegalZip: string;
  Acreage: string;
  UnitNo: string;
  Fullname: string;
  ContactFirstName: string;
  ContactLastName: string;
};

type ComplaintRow = {
  "Complaint #"?: string;
  Status?: string;
  Type?: string;
  "Inspector Code"?: string;
  _source_search?: string;
};

type LicenseRow = {
  "License Number"?: string;
  Status?: string;
  "License Type"?: string;
  "Expiration Date"?: string;
  _source_search?: string;
};

type CaseRow = {
  "Case #"?: string;
  Status?: string;
  _source_search?: string;
};

async function truncateAll() {
  console.log("Clearing tables...");
  await db.execute(sql`TRUNCATE TABLE
    complaints,
    licenses,
    anti_blight,
    housing_code_violations,
    parcels,
    owners,
    llc_networks,
    foia_requests
    RESTART IDENTITY CASCADE`);
}

async function seedParcels() {
  console.log("Seeding parcels...");
  const rows = readCsv<ParcelRow>(join(CITYSQUARED_DIR, "all_parcels.csv"));
  console.log(`  ${rows.length} CitySquared parcels`);

  const records = rows
    .filter((r) => r.LegalAddress)
    .map((r) => ({
      parcelId: r.Parcel_ID ? Number(r.Parcel_ID) : null,
      legalAddress: r.LegalAddress,
      latitude: r.Latitude || null,
      longitude: r.Longitude || null,
      propertyClass: r.PropertyClass || null,
      parcelZone: r.ParcelZone || null,
      taxesOwed: r.TaxesOwed === "true",
      legalCity: r.LegalCity || null,
      legalZip: r.LegalZip || null,
      acreage: r.Acreage || null,
      unitNo: r.UnitNo || null,
      ownerName: r.Fullname || null,
      ownerFirstName: r.ContactFirstName || null,
      ownerLastName: r.ContactLastName || null,
      printKey: r.PrintKey || null,
      normalizedAddress: normalizeAddress(r.LegalAddress),
    }));

  // De-duplicate by parcelId — keep first
  const seen = new Set<number>();
  const deduped = records.filter((r) => {
    if (r.parcelId === null) return true;
    if (seen.has(r.parcelId)) return false;
    seen.add(r.parcelId);
    return true;
  });

  const batchSize = 500;
  for (let i = 0; i < deduped.length; i += batchSize) {
    const batch = deduped.slice(i, i + batchSize);
    await db.insert(parcels).values(batch);
    if ((i + batchSize) % 5000 < batchSize) {
      console.log(`  inserted ${Math.min(i + batchSize, deduped.length)} / ${deduped.length}`);
    }
  }
  console.log(`  ✓ inserted ${deduped.length} parcels`);
}

async function buildAddressIndex(): Promise<Map<string, number>> {
  const rows = await db
    .select({ id: parcels.id, normalizedAddress: parcels.normalizedAddress })
    .from(parcels);
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.normalizedAddress && !map.has(r.normalizedAddress)) {
      map.set(r.normalizedAddress, r.id);
    }
  }
  return map;
}

async function seedComplaints(addressIndex: Map<string, number>) {
  console.log("Seeding complaints...");
  const rows = readCsv<ComplaintRow>(join(LCI_DIR, "complaints.csv"));
  const records = rows
    .filter((r) => r["Complaint #"])
    .map((r) => {
      const norm = normalizeAddress(r._source_search);
      return {
        complaintNumber: r["Complaint #"]!,
        status: r.Status || null,
        type: r.Type || null,
        inspectorCode: r["Inspector Code"] || null,
        sourceSearch: r._source_search || null,
        parcelId: addressIndex.get(norm) ?? null,
      };
    });

  // De-dup by complaintNumber
  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    if (seen.has(r.complaintNumber)) return false;
    seen.add(r.complaintNumber);
    return true;
  });

  const batchSize = 500;
  for (let i = 0; i < deduped.length; i += batchSize) {
    await db.insert(complaints).values(deduped.slice(i, i + batchSize)).onConflictDoNothing();
  }
  console.log(`  ✓ inserted ${deduped.length} complaints`);
}

async function seedLicenses(addressIndex: Map<string, number>) {
  console.log("Seeding licenses...");
  const rows = readCsv<LicenseRow>(join(LCI_DIR, "licenses.csv"));
  const cutoff = new Date(Date.UTC(2025, 0, 1));
  const records = rows
    .filter((r) => r["License Number"])
    .map((r) => {
      const norm = normalizeAddress(r._source_search);
      const exp = parseExpiration(r["Expiration Date"]);
      const isExpired =
        exp !== null && exp < cutoff && (r.Status === "Issued" || r.Status === "Issued ");
      return {
        licenseNumber: r["License Number"]!,
        status: r.Status || null,
        licenseType: r["License Type"] || null,
        expirationDate: r["Expiration Date"] || null,
        sourceSearch: r._source_search || null,
        isExpired,
        parcelId: addressIndex.get(norm) ?? null,
      };
    });

  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    await db.insert(licenses).values(records.slice(i, i + batchSize));
  }
  console.log(`  ✓ inserted ${records.length} licenses`);
}

async function seedAntiBlight(addressIndex: Map<string, number>) {
  console.log("Seeding anti-blight cases...");
  const rows = readCsv<CaseRow>(join(LCI_DIR, "anti_blight.csv"));
  const records = rows
    .filter((r) => r["Case #"])
    .map((r) => {
      const norm = normalizeAddress(r._source_search);
      return {
        caseNumber: r["Case #"]!,
        status: r.Status || null,
        sourceSearch: r._source_search || null,
        parcelId: addressIndex.get(norm) ?? null,
      };
    });
  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    if (seen.has(r.caseNumber)) return false;
    seen.add(r.caseNumber);
    return true;
  });
  const batchSize = 500;
  for (let i = 0; i < deduped.length; i += batchSize) {
    await db.insert(antiBlight).values(deduped.slice(i, i + batchSize)).onConflictDoNothing();
  }
  console.log(`  ✓ inserted ${deduped.length} anti-blight cases`);
}

async function seedHousingCodeViolations(addressIndex: Map<string, number>) {
  console.log("Seeding housing code violations...");
  const rows = readCsv<CaseRow>(join(LCI_DIR, "housing_code_violations.csv"));
  const records = rows
    .filter((r) => r["Case #"])
    .map((r) => {
      const norm = normalizeAddress(r._source_search);
      return {
        caseNumber: r["Case #"]!,
        status: r.Status || null,
        sourceSearch: r._source_search || null,
        parcelId: addressIndex.get(norm) ?? null,
      };
    });
  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    if (seen.has(r.caseNumber)) return false;
    seen.add(r.caseNumber);
    return true;
  });
  const batchSize = 500;
  for (let i = 0; i < deduped.length; i += batchSize) {
    await db.insert(housingCodeViolations).values(deduped.slice(i, i + batchSize)).onConflictDoNothing();
  }
  console.log(`  ✓ inserted ${deduped.length} violations`);
}

function isOpenComplaintStatus(s: string | null): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return !(
    lower.includes("closed") ||
    lower.includes("resolved") ||
    lower.includes("complete")
  );
}

function isUnresolvedBlightStatus(s: string | null): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return !(lower.includes("closed") || lower.includes("resolved") || lower.includes("complete"));
}

function isPendingViolationStatus(s: string | null): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return !(lower.includes("closed") || lower.includes("resolved") || lower.includes("complete"));
}

async function seedOwners() {
  console.log("Building owners table...");
  // For each owner_name in parcels, aggregate stats across all parcels they own.
  // Joins: complaints/licenses/anti_blight/violations have parcel_id → parcels.id.

  const parcelRows = await db
    .select({
      id: parcels.id,
      ownerName: parcels.ownerName,
    })
    .from(parcels);

  type OwnerAcc = {
    name: string;
    propertyCount: number;
    parcelIds: number[];
  };
  const byOwner = new Map<string, OwnerAcc>();
  for (const p of parcelRows) {
    if (!p.ownerName) continue;
    const key = p.ownerName.trim();
    if (!key) continue;
    if (!byOwner.has(key)) {
      byOwner.set(key, { name: key, propertyCount: 0, parcelIds: [] });
    }
    const acc = byOwner.get(key)!;
    acc.propertyCount += 1;
    acc.parcelIds.push(p.id);
  }

  // Pull all complaints/licenses/blight/violations once, group by parcelId
  const [allComplaints, allLicenses, allBlight, allViolations] = await Promise.all([
    db.select({ parcelId: complaints.parcelId, status: complaints.status }).from(complaints),
    db
      .select({ parcelId: licenses.parcelId, status: licenses.status, isExpired: licenses.isExpired })
      .from(licenses),
    db.select({ parcelId: antiBlight.parcelId, status: antiBlight.status }).from(antiBlight),
    db
      .select({ parcelId: housingCodeViolations.parcelId, status: housingCodeViolations.status })
      .from(housingCodeViolations),
  ]);

  const complaintsByParcel = new Map<number, Array<{ status: string | null }>>();
  for (const c of allComplaints) {
    if (c.parcelId === null) continue;
    if (!complaintsByParcel.has(c.parcelId)) complaintsByParcel.set(c.parcelId, []);
    complaintsByParcel.get(c.parcelId)!.push({ status: c.status });
  }
  const licensesByParcel = new Map<number, Array<{ isExpired: boolean | null }>>();
  for (const l of allLicenses) {
    if (l.parcelId === null) continue;
    if (!licensesByParcel.has(l.parcelId)) licensesByParcel.set(l.parcelId, []);
    licensesByParcel.get(l.parcelId)!.push({ isExpired: l.isExpired });
  }
  const blightByParcel = new Map<number, Array<{ status: string | null }>>();
  for (const b of allBlight) {
    if (b.parcelId === null) continue;
    if (!blightByParcel.has(b.parcelId)) blightByParcel.set(b.parcelId, []);
    blightByParcel.get(b.parcelId)!.push({ status: b.status });
  }
  const violationsByParcel = new Map<number, Array<{ status: string | null }>>();
  for (const v of allViolations) {
    if (v.parcelId === null) continue;
    if (!violationsByParcel.has(v.parcelId)) violationsByParcel.set(v.parcelId, []);
    violationsByParcel.get(v.parcelId)!.push({ status: v.status });
  }

  const records = Array.from(byOwner.values()).map((o) => {
    let openComplaintsCount = 0;
    let totalComplaints = 0;
    let expiredLicensesCount = 0;
    let unresolvedBlightCount = 0;
    let pendingViolationsCount = 0;

    for (const pid of o.parcelIds) {
      const cs = complaintsByParcel.get(pid) ?? [];
      totalComplaints += cs.length;
      openComplaintsCount += cs.filter((x) => isOpenComplaintStatus(x.status)).length;

      const ls = licensesByParcel.get(pid) ?? [];
      expiredLicensesCount += ls.filter((x) => x.isExpired).length;

      const bs = blightByParcel.get(pid) ?? [];
      unresolvedBlightCount += bs.filter((x) => isUnresolvedBlightStatus(x.status)).length;

      const vs = violationsByParcel.get(pid) ?? [];
      pendingViolationsCount += vs.filter((x) => isPendingViolationStatus(x.status)).length;
    }

    const riskScore = computeRiskScore({
      openComplaints: openComplaintsCount,
      expiredLicenses: expiredLicensesCount,
      unresolvedBlight: unresolvedBlightCount,
      pendingViolations: pendingViolationsCount,
      totalComplaints,
    });

    return {
      name: o.name,
      propertyCount: o.propertyCount,
      llcNetwork: detectLlcNetwork(o.name),
      riskScore,
      openComplaints: openComplaintsCount,
      expiredLicenses: expiredLicensesCount,
      unresolvedBlight: unresolvedBlightCount,
      pendingViolations: pendingViolationsCount,
      totalComplaints,
    };
  });

  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    await db.insert(owners).values(records.slice(i, i + batchSize)).onConflictDoNothing();
  }
  console.log(`  ✓ inserted ${records.length} owners`);
}

async function seedLlcNetworks() {
  console.log("Seeding LLC networks...");
  const networks = [
    {
      name: "NETZ",
      entityCount: 24,
      propertyCount: 157,
      description:
        "Largest private landlord network in New Haven. 24 affiliated LLCs across 157 properties.",
    },
    {
      name: "SFR/RE FUND",
      entityCount: 4,
      propertyCount: 124,
      description:
        "Institutional investor — Delaware-registered LLCs operating as single-family rental fund.",
    },
    {
      name: "ABCD",
      entityCount: 7,
      propertyCount: 57,
      description: "7 entities, 57 properties.",
    },
    {
      name: "HEMINGWAY MANOR",
      entityCount: 4,
      propertyCount: 41,
      description: "4 entities, 41 properties.",
    },
    {
      name: "GUR",
      entityCount: 2,
      propertyCount: 40,
      description: "2 entities, 40 properties.",
    },
    {
      name: "MAGEN",
      entityCount: 3,
      propertyCount: 34,
      description: "3 entities, 34 properties.",
    },
    {
      name: "KATAN HOMES",
      entityCount: 1,
      propertyCount: 26,
      description: "1 entity, 26 properties.",
    },
  ];
  await db.insert(llcNetworks).values(networks).onConflictDoNothing();
  console.log(`  ✓ inserted ${networks.length} LLC networks`);
}

async function seedFoiaRequests() {
  console.log("Seeding FOIA requests...");
  const requests = [
    {
      requestNumber: "2026-PRR-0426",
      title: "Anthem ASO contract — self-insured healthcare plan",
      department: "Finance / Human Resources",
      dateFiled: "2026-01-15",
      deadline: "2026-02-15",
      status: "FOIC Complaint Filed",
      responseSummary:
        "No response within statutory deadline. FOIC complaint filed citing CT FOIA §1-200 et seq.",
      filedVia: "Email + city portal",
      contact: "Mayor's Office, Finance Department",
    },
    {
      requestNumber: "2026-PRR-0579",
      title: "Parking Authority $3M round-trip transaction documentation",
      department: "Parking Authority / Finance",
      dateFiled: "2026-02-20",
      deadline: "2026-03-22",
      status: "Pending",
      responseSummary: "Awaiting initial response.",
      filedVia: "City portal",
      contact: "City Clerk",
    },
    {
      requestNumber: "LCI-database-export",
      title: "LCI database export — complaints, licenses, blight, violations",
      department: "Livable City Initiative",
      dateFiled: "2026-03-01",
      deadline: "2026-04-01",
      status: "Response Received",
      responseSummary: "Responded with public Veoci dashboard link. Data scraped 2026-04-24.",
      filedVia: "Email",
      contact: "LCI Director",
    },
    {
      requestNumber: "Building-CitySquared-audit",
      title: "Building Department CitySquared audit log — FY24 vs FY25 permit revenue",
      department: "Building Department",
      dateFiled: null,
      deadline: null,
      status: "Filed",
      responseSummary: "Drafted, not yet filed.",
      filedVia: "Pending",
      contact: "Building Department",
    },
  ];
  for (const r of requests) {
    await db.insert(foiaRequests).values(r);
  }
  console.log(`  ✓ inserted ${requests.length} FOIA requests`);
}

async function main() {
  console.log("Municipal seed starting...");
  console.log(`  LCI:         ${LCI_DIR}`);
  console.log(`  CitySquared: ${CITYSQUARED_DIR}`);
  console.log("");

  await truncateAll();
  await seedParcels();
  const addressIndex = await buildAddressIndex();
  console.log(`  built address index with ${addressIndex.size} unique normalized addresses`);
  await seedComplaints(addressIndex);
  await seedLicenses(addressIndex);
  await seedAntiBlight(addressIndex);
  await seedHousingCodeViolations(addressIndex);
  await seedOwners();
  await seedLlcNetworks();
  await seedFoiaRequests();

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
