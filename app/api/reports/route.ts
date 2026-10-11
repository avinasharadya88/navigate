import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { roadReports } from "../../../db/schema";
import { isInsideSouthZone } from "../../../lib/south-zone";

export async function GET() {
  try {
    const reports = await getDb()
      .select()
      .from(roadReports)
      .orderBy(desc(roadReports.createdAt))
      .limit(300);
    return Response.json({ reports });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const severity = String(body.severity ?? "");
    const roadLabel = String(body.roadLabel ?? "Pinned road location")
      .trim()
      .slice(0, 100);
    const note = String(body.note ?? "").trim().slice(0, 240);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return Response.json({ error: "A valid map location is required" }, { status: 400 });
    }
    if (!isInsideSouthZone(latitude, longitude)) {
      return Response.json(
        { error: "The report must be inside Bangalore Urban or Bangalore Rural district" },
        { status: 400 },
      );
    }
    if (!new Set(["rough", "bumpy", "not_drivable"]).has(severity)) {
      return Response.json({ error: "Choose a valid road condition" }, { status: 400 });
    }

    const [report] = await getDb()
      .insert(roadReports)
      .values({ latitude, longitude, severity: severity as "rough" | "bumpy" | "not_drivable", roadLabel, note })
      .returning();
    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save report" },
      { status: 500 },
    );
  }
}
