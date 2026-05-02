import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const demosTable = pgTable("demos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  service: text("service", { enum: ["plex", "jellyfin", "emby"] }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDemoSchema = createInsertSchema(demosTable).omit({ id: true, createdAt: true });
export type InsertDemo = z.infer<typeof insertDemoSchema>;
export type Demo = typeof demosTable.$inferSelect;
