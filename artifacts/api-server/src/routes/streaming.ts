import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

const mockTitles = [
  "Breaking Bad S03E04",
  "The Crown S02E08",
  "Stranger Things S04E09",
  "Dune: Part Two",
  "Oppenheimer",
  "The Boys S03E06",
  "Succession S04E10",
  "House of the Dragon S01E03",
  "Wednesday S01E05",
  "The Last of Us S01E07",
];

const qualities = ["1080p", "4K HDR", "720p", "4K", "1080p HDR"];

function randomSession(userName: string) {
  return {
    user: userName,
    title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
    progress: Math.round(Math.random() * 100),
    quality: qualities[Math.floor(Math.random() * qualities.length)],
  };
}

router.get("/streaming/sessions", requireAuth, async (_req, res) => {
  const plexUsers = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.service, "plex")).limit(3);
  const jellyfinUsers = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.service, "jellyfin")).limit(2);
  const embyUsers = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.service, "emby")).limit(2);

  const plexSessions = plexUsers.map((u) => randomSession(u.name));
  const jellyfinSessions = jellyfinUsers.map((u) => randomSession(u.name));
  const embySessions = embyUsers.map((u) => randomSession(u.name));

  return res.json({
    plex: plexSessions.length,
    jellyfin: jellyfinSessions.length,
    emby: embySessions.length,
    plexSessions,
    jellyfinSessions,
    embySessions,
  });
});

export default router;
