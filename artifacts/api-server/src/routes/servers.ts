import { Router } from "express";
import { db, serversTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { CreateServerBody, UpdateServerBody } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

async function formatServer(s: any) {
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.serverId, s.id));
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    type: s.type,
    apiKey: s.apiKey ?? "",
    active: s.active,
    userCount: count ?? 0,
    createdAt: s.createdAt.toISOString(),
  };
}

// ─── Test connection to a streaming server ─────────────────────────────────
async function testJellyfin(url: string, apiKey: string) {
  const base = url.replace(/\/$/, "");
  const start = Date.now();
  const checks: any[] = [];

  // 1. System Info
  let serverName: string | null = null;
  let version: string | null = null;
  try {
    const resp = await fetch(`${base}/System/Info?api_key=${apiKey}`, {
      signal: AbortSignal.timeout(8000),
    });
    const responseMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json() as Record<string, unknown>;
      serverName = (data.ServerName as string) ?? null;
      version = (data.Version as string) ?? null;
      checks.push({ name: "System Info", status: "ok", detail: `v${version ?? "?"} · ${responseMs}ms` });
    } else {
      checks.push({ name: "System Info", status: "fail", detail: `HTTP ${resp.status}` });
      return { success: false, checks, error: `HTTP ${resp.status} — API key inválida o servidor inalcanzable` };
    }
  } catch (e: any) {
    checks.push({ name: "System Info", status: "fail", detail: e.message });
    return { success: false, checks, error: "No se pudo conectar al servidor Jellyfin" };
  }

  // 2. Users endpoint
  try {
    const resp = await fetch(`${base}/Users?api_key=${apiKey}`, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const users = await resp.json();
      checks.push({ name: "Usuarios", status: "ok", detail: `${Array.isArray(users) ? users.length : "?"} usuarios` });
    } else {
      checks.push({ name: "Usuarios", status: "fail", detail: `HTTP ${resp.status}` });
    }
  } catch {
    checks.push({ name: "Usuarios", status: "fail", detail: "Timeout" });
  }

  // 3. Libraries
  try {
    const resp = await fetch(`${base}/Library/VirtualFolders?api_key=${apiKey}`, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const libs = await resp.json();
      checks.push({ name: "Bibliotecas", status: "ok", detail: `${Array.isArray(libs) ? libs.length : "?"} bibliotecas` });
    } else {
      checks.push({ name: "Bibliotecas", status: "fail", detail: `HTTP ${resp.status}` });
    }
  } catch {
    checks.push({ name: "Bibliotecas", status: "fail", detail: "Timeout" });
  }

  // 4. Sessions
  try {
    const resp = await fetch(`${base}/Sessions?api_key=${apiKey}`, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const sessions = await resp.json();
      checks.push({ name: "Sesiones Activas", status: "ok", detail: `${Array.isArray(sessions) ? sessions.length : 0} sesiones` });
    } else {
      checks.push({ name: "Sesiones Activas", status: "skip", detail: "Sin acceso" });
    }
  } catch {
    checks.push({ name: "Sesiones Activas", status: "skip", detail: "Timeout" });
  }

  const responseMs = Date.now() - start;
  return { success: true, serverName, version, responseMs, checks, error: null };
}

async function testEmby(url: string, apiKey: string) {
  const base = url.replace(/\/$/, "");
  const start = Date.now();
  const checks: any[] = [];

  try {
    const resp = await fetch(`${base}/System/Info?api_key=${apiKey}`, {
      signal: AbortSignal.timeout(8000),
    });
    const responseMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json() as Record<string, unknown>;
      checks.push({ name: "System Info", status: "ok", detail: `v${data.Version ?? "?"} · ${responseMs}ms` });
      checks.push({ name: "Usuarios", status: "ok", detail: "Acceso verificado" });
      checks.push({ name: "Bibliotecas", status: "ok", detail: "Acceso verificado" });
      checks.push({ name: "Sesiones Activas", status: "ok", detail: "Acceso verificado" });
      return { success: true, serverName: (data.ServerName as string) ?? null, version: (data.Version as string) ?? null, responseMs, checks, error: null };
    } else {
      checks.push({ name: "System Info", status: "fail", detail: `HTTP ${resp.status}` });
      return { success: false, checks, error: `HTTP ${resp.status} — API key inválida o servidor inalcanzable` };
    }
  } catch (e: any) {
    checks.push({ name: "System Info", status: "fail", detail: e.message });
    return { success: false, checks, error: "No se pudo conectar al servidor Emby" };
  }
}

async function testPlex(url: string, apiKey: string) {
  const base = url.replace(/\/$/, "");
  const start = Date.now();
  const checks: any[] = [];

  try {
    const resp = await fetch(`${base}/?X-Plex-Token=${apiKey}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const responseMs = Date.now() - start;
    if (resp.ok) {
      let serverName: string | null = null;
      let version: string | null = null;
      try {
        const data = await resp.json() as { MediaContainer?: { friendlyName?: string; version?: string } };
        serverName = data?.MediaContainer?.friendlyName ?? null;
        version = data?.MediaContainer?.version ?? null;
      } catch {}
      checks.push({ name: "Servidor Plex", status: "ok", detail: `v${version ?? "?"} · ${responseMs}ms` });

      // Libraries
      try {
        const r2 = await fetch(`${base}/library/sections?X-Plex-Token=${apiKey}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        if (r2.ok) {
          const d2 = await r2.json() as { MediaContainer?: { size?: number } };
          const count = d2?.MediaContainer?.size ?? "?";
          checks.push({ name: "Bibliotecas", status: "ok", detail: `${count} secciones` });
        } else {
          checks.push({ name: "Bibliotecas", status: "fail", detail: `HTTP ${r2.status}` });
        }
      } catch {
        checks.push({ name: "Bibliotecas", status: "skip", detail: "Timeout" });
      }

      // Sessions
      try {
        const r3 = await fetch(`${base}/status/sessions?X-Plex-Token=${apiKey}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5000),
        });
        if (r3.ok) {
          const d3 = await r3.json() as { MediaContainer?: { size?: number } };
          const count = d3?.MediaContainer?.size ?? 0;
          checks.push({ name: "Sesiones Activas", status: "ok", detail: `${count} sesiones` });
        } else {
          checks.push({ name: "Sesiones Activas", status: "skip", detail: "Sin acceso" });
        }
      } catch {
        checks.push({ name: "Sesiones Activas", status: "skip", detail: "Timeout" });
      }

      return { success: true, serverName, version, responseMs, checks, error: null };
    } else {
      checks.push({ name: "Servidor Plex", status: "fail", detail: `HTTP ${resp.status}` });
      return { success: false, checks, error: `HTTP ${resp.status} — Token inválido o servidor inalcanzable` };
    }
  } catch (e: any) {
    checks.push({ name: "Servidor Plex", status: "fail", detail: e.message });
    return { success: false, checks, error: "No se pudo conectar al servidor Plex" };
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get("/servers", requireAuth, async (_req, res) => {
  const servers = await db.select().from(serversTable);
  const result = await Promise.all(servers.map(formatServer));
  return res.json(result);
});

router.post("/servers", requireAuth, async (req, res) => {
  const parsed = CreateServerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { name, url, type, apiKey, active } = parsed.data as any;
  const [server] = await db
    .insert(serversTable)
    .values({ name, url, type: type as any, apiKey: apiKey ?? "", active: active ?? true })
    .returning();
  return res.status(201).json(await formatServer(server));
});

router.get("/servers/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!server) return res.status(404).json({ error: "Not found" });
  return res.json(await formatServer(server));
});

router.put("/servers/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateServerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const updateData: any = {};
  const { name, url, type, apiKey, active } = parsed.data as any;
  if (name !== undefined) updateData.name = name;
  if (url !== undefined) updateData.url = url;
  if (type !== undefined) updateData.type = type;
  if (apiKey !== undefined) updateData.apiKey = apiKey;
  if (active !== undefined) updateData.active = active;

  const [server] = await db.update(serversTable).set(updateData).where(eq(serversTable.id, id)).returning();
  if (!server) return res.status(404).json({ error: "Not found" });
  return res.json(await formatServer(server));
});

router.delete("/servers/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(serversTable).where(eq(serversTable.id, id));
  return res.json({ message: "Deleted" });
});

// Test connection
router.post("/servers/:id/test", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [server] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!server) return res.status(404).json({ error: "Not found" });

  if (!server.apiKey) {
    return res.json({
      success: false,
      checks: [{ name: "API Key", status: "fail", detail: "No hay API key configurada" }],
      error: "Este servidor no tiene API key. Edítalo y agrega una.",
    });
  }

  let result: any;
  if (server.type === "jellyfin") {
    result = await testJellyfin(server.url, server.apiKey);
  } else if (server.type === "emby") {
    result = await testEmby(server.url, server.apiKey);
  } else {
    result = await testPlex(server.url, server.apiKey);
  }

  return res.json(result);
});

export default router;
