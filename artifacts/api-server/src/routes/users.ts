import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, serversTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import { requireAuth } from "./auth";
import { CreateUserBody, UpdateUserBody, ListUsersQueryParams } from "@workspace/api-zod";

const router = Router();

function formatUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    service: u.service ?? null,
    serverId: u.serverId ?? null,
    packageId: u.packageId ?? null,
    externalId: u.externalId ?? null,
    active: u.active,
    expiresAt: u.expiresAt ? u.expiresAt.toISOString() : null,
    resellerId: u.resellerId ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

function isDuplicateEmail(err: unknown): boolean {
  const e = err as any;
  const msg: string = e?.message ?? "";
  const causeMsg: string = e?.cause?.message ?? "";
  return (
    e?.code === "23505" ||
    e?.cause?.code === "23505" ||
    msg.includes("duplicate key value") ||
    causeMsg.includes("duplicate key value") ||
    msg.includes("users_email_unique") ||
    causeMsg.includes("users_email_unique")
  );
}

async function createJellyfinUser(url: string, apiKey: string, name: string, password: string): Promise<string> {
  const base = url.replace(/\/$/, "");
  const createResp = await fetch(`${base}/Users/New`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Emby-Token": apiKey },
    body: JSON.stringify({ Name: name }),
    signal: AbortSignal.timeout(10000),
  });
  if (!createResp.ok) {
    throw new Error(`Jellyfin/Emby user creation failed: HTTP ${createResp.status}`);
  }
  const created = await createResp.json() as { Id: string };
  const userId = created.Id;

  if (password) {
    await fetch(`${base}/Users/${userId}/Password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Emby-Token": apiKey },
      body: JSON.stringify({ NewPw: password }),
      signal: AbortSignal.timeout(8000),
    });
  }
  return userId;
}

async function setJellyfinUserDisabled(url: string, apiKey: string, externalId: string, disabled: boolean): Promise<void> {
  const base = url.replace(/\/$/, "");

  const userResp = await fetch(`${base}/Users/${externalId}`, {
    headers: { "X-Emby-Token": apiKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!userResp.ok) {
    throw new Error(`Jellyfin/Emby user fetch failed: HTTP ${userResp.status}`);
  }
  const userData = await userResp.json() as { Policy?: Record<string, unknown> };
  const currentPolicy = userData.Policy ?? {};

  const updatedPolicy = { ...currentPolicy, IsDisabled: disabled };

  const policyResp = await fetch(`${base}/Users/${externalId}/Policy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Emby-Token": apiKey },
    body: JSON.stringify(updatedPolicy),
    signal: AbortSignal.timeout(10000),
  });
  if (!policyResp.ok) {
    const errText = await policyResp.text().catch(() => "");
    throw new Error(`Jellyfin/Emby policy update failed: HTTP ${policyResp.status} ${errText.slice(0, 100)}`);
  }
}

async function terminateJellyfinUserSessions(url: string, apiKey: string, externalId: string): Promise<number> {
  const base = url.replace(/\/$/, "");
  const sessionsResp = await fetch(`${base}/Sessions`, {
    headers: { "X-Emby-Token": apiKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!sessionsResp.ok) return 0;

  const sessions = await sessionsResp.json() as Array<{ Id: string; UserId: string }>;
  const userSessions = sessions.filter((s) => s.UserId === externalId);

  let terminated = 0;
  for (const session of userSessions) {
    await fetch(`${base}/Sessions/${session.Id}/Message`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Emby-Token": apiKey },
      body: JSON.stringify({ Header: "Acceso suspendido", Text: "Tu cuenta ha sido congelada por el administrador.", TimeoutMs: 8000 }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});

    const stop = await fetch(`${base}/Sessions/${session.Id}/Playing/Stop`, {
      method: "POST",
      headers: { "X-Emby-Token": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (stop.ok || stop.status === 204) terminated++;
  }
  return terminated;
}

async function findJellyfinUserIdByName(url: string, apiKey: string, name: string): Promise<string | null> {
  const base = url.replace(/\/$/, "");
  const resp = await fetch(`${base}/Users`, {
    headers: { "X-Emby-Token": apiKey },
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) return null;
  const users = await resp.json() as Array<{ Id: string; Name: string }>;
  const match = users.find((u) => u.Name.toLowerCase() === name.toLowerCase());
  return match?.Id ?? null;
}

router.get("/users", requireAuth, async (req: any, res) => {
  const params = ListUsersQueryParams.parse(req.query);

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

  const conditions: SQL[] = [];
  if (params.role) conditions.push(eq(usersTable.role, params.role as any));
  if (params.service) conditions.push(eq(usersTable.service, params.service as any));

  if (currentUser.role === "reseller") {
    conditions.push(eq(usersTable.resellerId, currentUser.id));
    conditions.push(eq(usersTable.role, "client"));
  } else if (params.resellerId) {
    conditions.push(eq(usersTable.resellerId, params.resellerId));
  }

  let users;
  if (conditions.length > 0) {
    users = await db.select().from(usersTable).where(and(...conditions));
  } else {
    users = await db.select().from(usersTable);
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    users = users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  return res.json(users.map(formatUser));
});

router.post("/users", requireAuth, async (req: any, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos: " + parsed.error.issues.map((i: any) => i.message).join(", ") });
  }
  const { name, email, password, role, service, serverId, packageId, expiresAt, resellerId } = parsed.data;

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

  if (currentUser.role === "reseller") {
    if (role !== "client") {
      return res.status(403).json({ error: "Los revendedores solo pueden crear clientes" });
    }
  }
  const passwordHash = await bcrypt.hash(password, 10);

  let externalId: string | null = null;
  let syncStatus: { synced: boolean; syncError?: string } = { synced: false };

  if (serverId) {
    try {
      const [server] = await db.select().from(serversTable).where(eq(serversTable.id, serverId));
      if (server && server.apiKey) {
        if (server.type === "jellyfin" || server.type === "emby") {
          externalId = await createJellyfinUser(server.url, server.apiKey, name, password);
          syncStatus = { synced: true };
        } else if (server.type === "plex") {
          syncStatus = { synced: false, syncError: "Plex no soporta creación directa de usuarios vía API" };
        }
      }
    } catch (syncErr: any) {
      req.log.warn({ syncErr: syncErr?.message }, "Server sync failed but user will be created locally");
      syncStatus = { synced: false, syncError: syncErr?.message ?? "Error al sincronizar con el servidor" };
    }
  }

  let user: any;
  try {
    const [inserted] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role: role as any,
        service: service as any ?? null,
        serverId: serverId ?? null,
        packageId: packageId ?? null,
        externalId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        resellerId: currentUser.role === "reseller" ? currentUser.id : (resellerId ?? null),
      })
      .returning();
    user = inserted;
  } catch (err: unknown) {
    if (isDuplicateEmail(err)) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email" });
    }
    req.log.error({ err }, "Error creating user");
    return res.status(500).json({ error: "Error interno al crear usuario" });
  }

  const formatted = formatUser(user);
  return res.status(201).json({ ...formatted, syncStatus });
});

router.get("/users/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json(formatUser(user));
});

router.put("/users/:id", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { name, email, password, role, service, serverId, packageId, active, expiresAt, resellerId } = parsed.data;

  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!currentUser) return res.status(404).json({ error: "Not found" });

  if (caller.role === "reseller") {
    if (currentUser.resellerId !== caller.id || currentUser.role !== "client") {
      return res.status(403).json({ error: "No tienes permiso para modificar este usuario" });
    }
    if (role && role !== "client") {
      return res.status(403).json({ error: "Los revendedores no pueden cambiar el rol de los clientes" });
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (password !== undefined) updateData.passwordHash = await bcrypt.hash(password, 10);
  if (role !== undefined) updateData.role = role;
  if (service !== undefined) updateData.service = service;
  if (serverId !== undefined) updateData.serverId = serverId;
  if (packageId !== undefined) updateData.packageId = packageId;
  if (active !== undefined) updateData.active = active;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (resellerId !== undefined) updateData.resellerId = resellerId;

  let syncStatus: { synced: boolean; syncError?: string } | undefined;

  if (active !== undefined && active !== currentUser.active) {
    const targetServerId = serverId ?? currentUser.serverId;
    if (targetServerId) {
      try {
        const [server] = await db.select().from(serversTable).where(eq(serversTable.id, targetServerId));
        if (server && server.apiKey) {
          if (server.type === "jellyfin" || server.type === "emby") {
            let extId = currentUser.externalId;

            if (!extId) {
              extId = await findJellyfinUserIdByName(server.url, server.apiKey, currentUser.name);
              if (extId) {
                updateData.externalId = extId;
              }
            }

            if (extId) {
              await setJellyfinUserDisabled(server.url, server.apiKey, extId, !active);
              if (!active) {
                await terminateJellyfinUserSessions(server.url, server.apiKey, extId).catch(() => {});
              }
              syncStatus = { synced: true };
            } else {
              syncStatus = { synced: false, syncError: "No se encontró el usuario en el servidor de streaming" };
            }
          } else if (server.type === "plex") {
            syncStatus = { synced: false, syncError: "Plex no soporta bloqueo directo vía API" };
          }
        }
      } catch (syncErr: any) {
        req.log.warn({ syncErr: syncErr?.message }, "Streaming server sync failed during freeze/unfreeze");
        syncStatus = { synced: false, syncError: syncErr?.message ?? "Error al contactar el servidor de streaming" };
      }
    }
  }

  try {
    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) return res.status(404).json({ error: "Not found" });
    const response: any = formatUser(user);
    if (syncStatus !== undefined) response.syncStatus = syncStatus;
    return res.json(response);
  } catch (err: unknown) {
    if (isDuplicateEmail(err)) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email" });
    }
    req.log.error({ err }, "Error updating user");
    return res.status(500).json({ error: "Error interno al actualizar usuario" });
  }
});

router.delete("/users/:id", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);

  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "Not found" });

  if (user.role === "admin") {
    return res.status(403).json({ error: "No se puede eliminar un administrador" });
  }

  if (caller.role === "reseller") {
    if (user.resellerId !== caller.id || user.role !== "client") {
      return res.status(403).json({ error: "No tienes permiso para eliminar este usuario" });
    }
  }

  if (user.serverId && user.externalId) {
    try {
      const [server] = await db.select().from(serversTable).where(eq(serversTable.id, user.serverId));
      if (server && server.apiKey && (server.type === "jellyfin" || server.type === "emby")) {
        const base = server.url.replace(/\/$/, "");
        await fetch(`${base}/Users/${user.externalId}`, {
          method: "DELETE",
          headers: { "X-Emby-Token": server.apiKey },
          signal: AbortSignal.timeout(10000),
        });
      }
    } catch (err: any) {
      req.log.warn({ err: err?.message }, "Failed to delete user from streaming server");
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ message: "Deleted" });
});

export default router;
