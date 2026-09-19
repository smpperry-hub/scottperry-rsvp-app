import { NextResponse } from "next/server";
import { requireHost } from "@/lib/require-host";
import { buildGuestsCsv, buildResponsesCsv } from "@/lib/export-csv";

export const dynamic = "force-dynamic";

const PAGE = 1000;

type Host = Awaited<ReturnType<typeof requireHost>>["supabase"];

// PostgREST caps a request at 1000 rows, so page until a short page comes
// back. An export that silently stopped at 1000 would be a bad backup.
async function fetchAll(supabase: Host, table: string, orderBy: string[]) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    // The sort must be unique, or a page boundary could skip or repeat a row.
    let query = supabase.from(table).select("*");
    for (const column of orderBy) query = query.order(column);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function GET(request: Request) {
  const { supabase, authorized } = await requireHost();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type");
  if (type !== "responses" && type !== "guests") {
    return NextResponse.json({ error: "Unknown export type." }, { status: 400 });
  }

  try {
    let csv: string;
    if (type === "guests") {
      const [guests, parties] = await Promise.all([
        fetchAll(supabase, "guests", ["name", "id"]),
        fetchAll(supabase, "parties", ["label", "id"]),
      ]);
      csv = buildGuestsCsv(guests as never, parties as never);
    } else {
      const [rsvps, rooming, guests] = await Promise.all([
        fetchAll(supabase, "rsvps", ["submitted_at", "id"]),
        fetchAll(supabase, "rooming_preferences", ["rsvp_id", "roommate_guest_id"]),
        fetchAll(supabase, "guests", ["name", "id"]),
      ]);
      csv = buildResponsesCsv(rsvps as never, rooming as never, guests as never);
    }

    const day = new Date().toISOString().slice(0, 10);
    const label = type === "guests" ? "guest-list" : "rsvp-responses";
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${label}-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not build the export." }, { status: 500 });
  }
}
