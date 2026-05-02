import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "streamsync-secret-key";

export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  let payload: { userId: number };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  db.select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .then(([user]) => {
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!user.active) {
        return res.status(401).json({ error: "Cuenta congelada" });
      }
      req.userId = payload.userId;
      next();
    })
    .catch(() => {
      return res.status(500).json({ error: "Internal server error" });
    });
}

function formatUser(u: any) {
  return {
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
  };
}

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.active) {
    return res.status(403).json({ error: "Cuenta congelada. Contacta al administrador." });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token, user: formatUser(user) });
});

router.get("/auth/me", requireAuth, async (req: any, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!user) return res.status(401).json({ error: "User not found" });
  if (!user.active) return res.status(401).json({ error: "Cuenta congelada" });
  return res.json(formatUser(user));
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ message: "Logged out" });
});

export default router;
