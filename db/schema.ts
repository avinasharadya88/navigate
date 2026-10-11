// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
export {};
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const roadReports = sqliteTable("road_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  severity: text("severity", {
    enum: ["rough", "bumpy", "not_drivable"],
  }).notNull(),
  roadLabel: text("road_label").notNull().default("Pinned road location"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bumpEvents = sqliteTable("bump_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  intensity: real("intensity").notNull(),
  speedKph: real("speed_kph"),
  accuracyM: real("accuracy_m"),
  sessionId: text("session_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
