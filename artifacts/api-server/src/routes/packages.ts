import { Router } from "express";
import { db, packagesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import { CreatePackageBody, UpdatePackageBody } from "@workspace/api-zod";

const router = Router();

async function formatPackage(p: any) {
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.packageId, p.id));
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    durationDays: p.durationDays,
    services: p.services,
    description: p.description ?? null,
    active: p.active,
    userCount: count ?? 0,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/packages", requireAuth, async (_req, res) => {
  const packages = await db.select().from(packagesTable);
  const result = await Promise.all(packages.map(formatPackage));
  return res.json(result);
});

router.post("/packages", requireAuth, async (req, res) => {
  const parsed = CreatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { name, price, durationDays, services, description, active } = parsed.data;
  const [pkg] = await db
    .insert(packagesTable)
    .values({ name, price, durationDays, services: services as string[], description: description ?? null, active: active ?? true })
    .returning();
  return res.status(201).json(await formatPackage(pkg));
});

router.get("/packages/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, id));
  if (!pkg) return res.status(404).json({ error: "Not found" });
  return res.json(await formatPackage(pkg));
});

router.put("/packages/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { name, price, durationDays, services, description, active } = parsed.data;
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (durationDays !== undefined) updateData.durationDays = durationDays;
  if (services !== undefined) updateData.services = services;
  if (description !== undefined) updateData.description = description;
  if (active !== undefined) updateData.active = active;

  const [pkg] = await db.update(packagesTable).set(updateData).where(eq(packagesTable.id, id)).returning();
  if (!pkg) return res.status(404).json({ error: "Not found" });
  return res.json(await formatPackage(pkg));
});

router.delete("/packages/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(packagesTable).where(eq(packagesTable.id, id));
  return res.json({ message: "Deleted" });
});

export default router;
