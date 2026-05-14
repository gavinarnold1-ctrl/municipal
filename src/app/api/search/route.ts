import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { parcels } from "@/db/schema";
import { normalizeAddress } from "@/lib/normalize";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ results: [] });

  const normalized = normalizeAddress(q);
  const pattern = `%${normalized}%`;

  const rows = await db
    .select({
      id: parcels.id,
      legalAddress: parcels.legalAddress,
      ownerName: parcels.ownerName,
      propertyClass: parcels.propertyClass,
    })
    .from(parcels)
    .where(sql`${parcels.normalizedAddress} ILIKE ${pattern}`)
    .limit(20);

  return Response.json({ results: rows });
}
