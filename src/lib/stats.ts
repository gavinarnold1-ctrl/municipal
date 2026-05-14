import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { complaints, licenses, antiBlight, housingCodeViolations, parcels } from "@/db/schema";

export type LandingStats = {
  totalParcels: number;
  totalComplaints: number;
  openComplaints: number;
  expiredLicenses: number;
  totalLicenses: number;
  openBlight: number;
  openViolations: number;
};

export async function getLandingStats(): Promise<LandingStats> {
  const [
    [parcelCount],
    [complaintCount],
    [openComplaintCount],
    [licenseCount],
    [expiredLicenseCount],
    [openBlightCount],
    [openViolationCount],
  ] = await Promise.all([
    db.select({ n: count() }).from(parcels),
    db.select({ n: count() }).from(complaints),
    db
      .select({ n: count() })
      .from(complaints)
      .where(
        sql`${complaints.status} IS NOT NULL
          AND LOWER(${complaints.status}) NOT LIKE '%closed%'
          AND LOWER(${complaints.status}) NOT LIKE '%resolved%'
          AND LOWER(${complaints.status}) NOT LIKE '%complete%'`,
      ),
    db.select({ n: count() }).from(licenses),
    db.select({ n: count() }).from(licenses).where(sql`${licenses.isExpired} = true`),
    db
      .select({ n: count() })
      .from(antiBlight)
      .where(
        sql`${antiBlight.status} IS NOT NULL
          AND LOWER(${antiBlight.status}) NOT LIKE '%closed%'
          AND LOWER(${antiBlight.status}) NOT LIKE '%resolved%'
          AND LOWER(${antiBlight.status}) NOT LIKE '%complete%'`,
      ),
    db
      .select({ n: count() })
      .from(housingCodeViolations)
      .where(
        sql`${housingCodeViolations.status} IS NOT NULL
          AND LOWER(${housingCodeViolations.status}) NOT LIKE '%closed%'
          AND LOWER(${housingCodeViolations.status}) NOT LIKE '%resolved%'
          AND LOWER(${housingCodeViolations.status}) NOT LIKE '%complete%'`,
      ),
  ]);

  return {
    totalParcels: parcelCount.n,
    totalComplaints: complaintCount.n,
    openComplaints: openComplaintCount.n,
    expiredLicenses: expiredLicenseCount.n,
    totalLicenses: licenseCount.n,
    openBlight: openBlightCount.n,
    openViolations: openViolationCount.n,
  };
}
