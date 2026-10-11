import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { bumpEvents } from "../../../db/schema";
import { isInsideSouthZone } from "../../../lib/south-zone";

export async function GET() {
  try {
    const bumps = await getDb()
      .select()
      .from(bumpEvents)
      .orderBy(desc(bumpEvents.createdAt))
      .limit(500);
    return Response.json({ bumps });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load ride signals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { events?: Array<Record<string, unknown>> };
    const events = Array.isArray(body.events) ? body.events.slice(0, 40) : [];
    const valid = events.flatMap((event) => {
      const latitude = Number(event.latitude);
      const longitude = Number(event.longitude);
      const intensity = Number(event.intensity);
      const sessionId = String(event.sessionId ?? "").slice(0, 64);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(intensity) ||
        !sessionId ||
        !isInsideSouthZone(latitude, longitude)
      ) {
        return [];
      }
      return [{
        latitude,
        longitude,
        intensity: Math.min(Math.abs(intensity), 30),
        speedKph: Number.isFinite(Number(event.speedKph)) ? Math.max(0, Math.min(Number(event.speedKph), 140)) : null,
        accuracyM: Number.isFinite(Number(event.accuracyM)) ? Math.max(0, Math.min(Number(event.accuracyM), 500)) : null,
        sessionId,
      }];
    });

    if (!valid.length) {
      return Response.json({ error: "No valid South Zone bump events were supplied" }, { status: 400 });
    }
    await getDb().insert(bumpEvents).values(valid);
    return Response.json({ accepted: valid.length }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save ride signals" },
      { status: 500 },
    );
  }
}
