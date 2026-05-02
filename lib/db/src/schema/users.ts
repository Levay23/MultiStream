import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "reseller", "client"] }).notNull().default("client"),
  service: text("service", { enum: ["plex", "jellyfin", "emby"] }),
  serverId: integer("server_id"),
  packageId: integer("package_id"),
  externalId: text("external_id"),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  resellerId: integer("reseller_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
