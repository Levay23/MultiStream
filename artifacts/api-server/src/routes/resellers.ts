import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "./auth";
import { CreateResellerBody, UpdateResellerBody } from "@workspace/api-zod";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  db.select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .then(([user]) => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Solo los administradores pueden realizar esta acción" });
      }
      req.currentUser = user;
      next();
    })
    .catch(() => res.status(500).json({ error: "Error interno" }));
}

router.get("/resellers", requireAuth, async (req: any, res) => {
  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  if (caller.role !== "admin") {
    return res.status(403).json({ error: "Solo los administradores pueden ver los revendedores" });
  }

  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  let resellers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "reseller"));

  if (search) {
    const q = search.toLowerCase();
    resellers = resellers.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }

  const withStats = await Promise.all(
    resellers.map(async (r) => {
      const [{ value: clientCount }] = await db
        .select({ value: count() })
        .from(usersTable)
        .where(and(eq(usersTable.role, "client"), eq(usersTable.resellerId, r.id)));

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        clientCount: Number(clientCount),
      };
    })
  );

  return res.json(withStats);
});

router.post("/resellers", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = CreateResellerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos: " + parsed.error.issues.map((i: any) => i.message).join(", ") });
  }
  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: "reseller" })
      .returning();
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      service: null,
      serverId: null,
      packageId: null,
      expiresAt: null,
      resellerId: null,
    });
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    if (err?.code === "23505" || msg.includes("duplicate key")) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email" });
    }
    req.log.error({ err }, "Error creating reseller");
    return res.status(500).json({ error: "Error interno al crear revendedor" });
  }
});

router.put("/resellers/:id", requireAuth, requireAdmin, async (req: any, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateResellerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const [reseller] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!reseller || reseller.role !== "reseller") {
    return res.status(404).json({ error: "Revendedor no encontrado" });
  }

  const updateData: any = {};
  const { name, email, password, active } = parsed.data;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (password !== undefined) updateData.passwordHash = await bcrypt.hash(password, 10);
  if (active !== undefined) updateData.active = active;

  try {
    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      service: null,
      serverId: null,
      packageId: null,
      expiresAt: null,
      resellerId: null,
    });
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    if (err?.code === "23505" || msg.includes("duplicate key")) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email" });
    }
    req.log.error({ err }, "Error updating reseller");
    return res.status(500).json({ error: "Error interno al actualizar revendedor" });
  }
});

router.delete("/resellers/:id", requireAuth, requireAdmin, async (req: any, res) => {
  const id = Number(req.params.id);

  const [reseller] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!reseller || reseller.role !== "reseller") {
    return res.status(404).json({ error: "Revendedor no encontrado" });
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ message: "Revendedor eliminado" });
});

router.post("/resellers/:id/toggle", requireAuth, requireAdmin, async (req: any, res) => {
  const id = Number(req.params.id);

  const [reseller] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!reseller || reseller.role !== "reseller") {
    return res.status(404).json({ error: "Revendedor no encontrado" });
  }

  const [user] = await db
    .update(usersTable)
    .set({ active: !reseller.active })
    .where(eq(usersTable.id, id))
    .returning();

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    service: null,
    serverId: null,
    packageId: null,
    expiresAt: null,
    resellerId: null,
  });
});

export default router;
