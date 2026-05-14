import { desc } from "drizzle-orm";
import { db } from "@/db";
import { foiaRequests } from "@/db/schema";
import { InvestigationPage, P } from "@/components/InvestigationLayout";
import { DataTable, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "FOIA tracker — Municipal" };

async function safeRequests() {
  try {
    return await db.select().from(foiaRequests).orderBy(desc(foiaRequests.dateFiled));
  } catch {
    return [];
  }
}

export default async function FoiaPage() {
  const requests = await safeRequests();

  return (
    <InvestigationPage
      eyebrow="Investigation · FOIA"
      title="Public-records requests on file."
    >
      <P>
        Every request below was filed under Connecticut FOIA (Conn. Gen. Stat. § 1-200 et
        seq.). Statutory deadline is 4 business days for acknowledgement; reasonable time
        thereafter for response.
      </P>

      <div className="mt-8">
        <DataTable
          headers={["Request #", "Title", "Department", "Filed", "Status"]}
          rows={requests.map((r) => [
            <span key="n" className="font-mono text-xs">{r.requestNumber}</span>,
            <div key="t">
              <div className="text-paper">{r.title}</div>
              {r.responseSummary && (
                <div className="text-xs text-ash mt-1">{r.responseSummary}</div>
              )}
            </div>,
            r.department ?? "—",
            r.dateFiled ?? "—",
            <StatusBadge key="s" status={r.status} />,
          ])}
          empty="No FOIA requests on file."
        />
      </div>
    </InvestigationPage>
  );
}
