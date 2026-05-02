import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serversTable = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type", { enum: ["plex", "jellyfin", "emby"] }).notNull(),
  apiKey: text("api_key").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerSchema = createInsertSchema(serversTable).omit({ id: true, createdAt: true });
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof serversTable.$inferSelect;
