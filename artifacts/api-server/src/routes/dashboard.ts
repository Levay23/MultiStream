import { Router } from "express";
import { db, usersTable, serversTable, packagesTable, demosTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res) => {
  const [clientsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.role, "client"));

  const [resellersResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.role, "reseller"));

  const [totalServersResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(serversTable);

  const [activeServersResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(serversTable)
    .where(eq(serversTable.active, true));

  const [totalPackagesResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(packagesTable);

  const [activeDemosResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(demosTable)
    .where(eq(demosTable.active, true));

  const [plexClientsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.service, "plex"));

  const [jellyfinClientsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.service, "jellyfin"));

  const [embyClientsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.service, "emby"));

  const recentUsers = await db
    .select()
    .from(usersTable)
    .orderBy(sql`${usersTable.createdAt} desc`)
    .limit(5);

  return res.json({
    totalClients: clientsResult.count ?? 0,
    totalResellers: resellersResult.count ?? 0,
    totalServers: totalServersResult.count ?? 0,
    activeServers: activeServersResult.count ?? 0,
    totalPackages: totalPackagesResult.count ?? 0,
    activeDemos: activeDemosResult.count ?? 0,
    clientsByService: {
      plex: plexClientsResult.count ?? 0,
      jellyfin: jellyfinClientsResult.count ?? 0,
      emby: embyClientsResult.count ?? 0,
    },
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      service: u.service ?? null,
      serverId: u.serverId ?? null,
      packageId: u.packageId ?? null,
      active: u.active,
      expiresAt: u.expiresAt ? u.expiresAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    })),
  });
});

export default router;
