// Address normalization — matches CitySquared format
// e.g. "165 Church Street" → "165 CHURCH ST"
export function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return "";
  return addr
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/,.*$/g, "") // drop city/state/zip after first comma
    .replace(/\b AVENUE\b/g, " AV")
    .replace(/\b AVE\b/g, " AV")
    .replace(/\b STREET\b/g, " ST")
    .replace(/\b DRIVE\b/g, " DR")
    .replace(/\b ROAD\b/g, " RD")
    .replace(/\b PLACE\b/g, " PL")
    .replace(/\b BOULEVARD\b/g, " BLVD")
    .replace(/\b LANE\b/g, " LN")
    .replace(/\b COURT\b/g, " CT")
    .replace(/\b TERRACE\b/g, " TER")
    .replace(/\b PARKWAY\b/g, " PKWY")
    .replace(/\b HIGHWAY\b/g, " HWY")
    .trim();
}

// LLC network detection — substring match on owner name
const NETWORK_PATTERNS: Array<{ network: string; patterns: RegExp[] }> = [
  { network: "NETZ", patterns: [/\bNETZ\b/] },
  { network: "SFR/RE FUND", patterns: [/\bSFR\b/, /\bRE FUND\b/, /\bAMH\b/, /\bAMERICAN HOMES\b/] },
  { network: "ABCD", patterns: [/\bABCD\b/] },
  { network: "HEMINGWAY MANOR", patterns: [/\bHEMINGWAY\b/] },
  { network: "GUR", patterns: [/\bGUR\b(?! [A-Z]+ INC)/] },
  { network: "MAGEN", patterns: [/\bMAGEN\b/] },
  { network: "KATAN HOMES", patterns: [/\bKATAN\b/] },
];

export function detectLlcNetwork(ownerName: string | null | undefined): string | null {
  if (!ownerName) return null;
  const upper = ownerName.toUpperCase();
  for (const entry of NETWORK_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(upper)) return entry.network;
    }
  }
  return null;
}

export function computeRiskScore(stats: {
  openComplaints: number;
  expiredLicenses: number;
  unresolvedBlight: number;
  pendingViolations: number;
  totalComplaints: number;
}): number {
  return (
    stats.openComplaints * 3 +
    stats.expiredLicenses * 2 +
    stats.unresolvedBlight * 2 +
    stats.pendingViolations * 2 +
    stats.totalComplaints
  );
}

// Risk score → label + color token
export function riskBucket(score: number): { label: string; tone: "green" | "yellow" | "orange" | "red" } {
  if (score >= 30) return { label: "High risk", tone: "red" };
  if (score >= 15) return { label: "Elevated risk", tone: "orange" };
  if (score >= 5) return { label: "Some flags", tone: "yellow" };
  return { label: "Clean record", tone: "green" };
}
